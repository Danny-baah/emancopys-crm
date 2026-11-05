"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import {
  quotationSchema,
  type QuotationFormValues,
} from "@/lib/validations/quotations";
import { Prisma } from "@/lib/generated/prisma/client";
import { QuotationStatus, SalesStatus, Role } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetQuotationsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getQuotations(
  {
    search = "",
    status = "",
    page = 1,
    limit = 10,
  }: GetQuotationsParams = {},
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.QuotationWhereInput = {};

  // Role-based visibility
  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { responsibleEmployeeId: user.id },
      { createdById: user.id },
      { customer: { assignedToId: user.id } },
    ];
  }

  // Status filter
  if (
    status &&
    status !== "ALL" &&
    Object.values(QuotationStatus).includes(status as QuotationStatus)
  ) {
    whereClause.status = status as QuotationStatus;
  }

  // Search filter
  if (search.trim()) {
    const term = search.trim();
    const searchConditions: Prisma.QuotationWhereInput[] = [
      { quotationNumber: { contains: term, mode: "insensitive" } },
      { serviceSold: { contains: term, mode: "insensitive" } },
      { customer: { companyName: { contains: term, mode: "insensitive" } } },
      { customer: { contactPerson: { contains: term, mode: "insensitive" } } },
    ];

    if (whereClause.OR) {
      whereClause.AND = [{ OR: whereClause.OR }, { OR: searchConditions }];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchConditions;
    }
  }

  const [totalCount, quotations] = await Promise.all([
    prisma.quotation.count({ where: whereClause }),
    prisma.quotation.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
          },
        },
        responsibleEmployee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sale: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
  ]);

  return {
    quotations,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getQuotationById(id: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      sale: true,
      responsibleEmployee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      orders: {
        include: {
          project: {
            select: {
              id: true,
              projectNumber: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!quotation) return null;

  if (
    user.role !== Role.ADMIN &&
    quotation.responsibleEmployeeId !== user.id &&
    quotation.createdById !== user.id &&
    quotation.customer.assignedToId !== user.id
  ) {
    throw new Error("Unauthorized to access this quotation.");
  }

  return quotation;
}

export async function createQuotation(
  data: QuotationFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const validated = quotationSchema.parse(data);

  // Generate unique quotation number QT-YYYYMM-XXXX
  const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
  const count = await prisma.quotation.count();
  const sequence = String(count + 1).padStart(4, "0");
  const quotationNumber = `QT-${datePrefix}-${sequence}`;

  const responsibleEmployeeId =
    user.role === Role.ADMIN && validated.responsibleEmployeeId?.trim()
      ? validated.responsibleEmployeeId.trim()
      : user.id;

  const result = await prisma.$transaction(async (tx) => {
    const q = await tx.quotation.create({
      data: {
        quotationNumber,
        customerId: validated.customerId,
        saleId: validated.saleId || null,
        serviceSold: validated.serviceSold,
        quotationPrice: validated.quotationPrice,
        quotationDate: validated.quotationDate
          ? new Date(validated.quotationDate)
          : new Date(),
        validUntil: validated.validUntil
          ? new Date(validated.validUntil)
          : null,
        responsibleEmployeeId,
        createdById: user.id,
        status: validated.status,
        notes: validated.notes || null,
      },
    });

    // If attached to a sale, automatically advance status if appropriate
    if (validated.saleId) {
      const sale = await tx.sale.findUnique({
        where: { id: validated.saleId },
        select: { id: true, status: true },
      });

      if (sale) {
        let newStatus: SalesStatus | null = null;
        if (validated.status === QuotationStatus.SENT) {
          newStatus = SalesStatus.QUOTATION_SENT;
        } else if (
          sale.status === SalesStatus.NEW_LEAD ||
          sale.status === SalesStatus.RESEARCHED ||
          sale.status === SalesStatus.FIRST_CONTACT_MADE ||
          sale.status === SalesStatus.DECISION_MAKER_REACHED ||
          sale.status === SalesStatus.INTERESTED
        ) {
          newStatus = SalesStatus.QUOTATION_CREATED;
        }

        if (newStatus && newStatus !== sale.status) {
          await tx.sale.update({
            where: { id: sale.id },
            data: { status: newStatus },
          });

          await tx.saleStatusHistory.create({
            data: {
              saleId: sale.id,
              userId: user.id,
              fromStatus: sale.status,
              toStatus: newStatus,
              notes: `Quotation ${quotationNumber} generated (${validated.status}).`,
            },
          });
        }
      }
    }

    return q;
  });

  safeRevalidate("/quotations");
  safeRevalidate("/sales");
  if (validated.saleId) safeRevalidate(`/sales/${validated.saleId}`);
  safeRevalidate("/dashboard");

  return { quotationId: result.id, quotationNumber: result.quotationNumber };
}

export async function updateQuotationStatus(
  id: string,
  newStatus: QuotationStatus,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: { sale: true },
  });

  if (!quotation) throw new Error("Quotation not found.");

  if (
    user.role !== Role.ADMIN &&
    quotation.responsibleEmployeeId !== user.id &&
    quotation.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update quotation.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id },
      data: { status: newStatus },
    });

    // If sale attached and quotation marked SENT or ACCEPTED, update sale status
    if (quotation.sale) {
      let targetSaleStatus: SalesStatus | null = null;
      if (newStatus === QuotationStatus.SENT) {
        targetSaleStatus = SalesStatus.QUOTATION_SENT;
      } else if (newStatus === QuotationStatus.ACCEPTED) {
        targetSaleStatus = SalesStatus.DEAL_WON;
      }

      if (targetSaleStatus && quotation.sale.status !== targetSaleStatus) {
        await tx.sale.update({
          where: { id: quotation.sale.id },
          data: {
            status: targetSaleStatus,
            wonAt: targetSaleStatus === SalesStatus.DEAL_WON ? new Date() : undefined,
          },
        });

        await tx.saleStatusHistory.create({
          data: {
            saleId: quotation.sale.id,
            userId: user.id,
            fromStatus: quotation.sale.status,
            toStatus: targetSaleStatus,
            notes: `Quotation ${quotation.quotationNumber} status updated to ${newStatus}.`,
          },
        });
      }
    }
  });

  safeRevalidate(`/quotations/${id}`);
  safeRevalidate("/quotations");
  if (quotation.saleId) safeRevalidate(`/sales/${quotation.saleId}`);
  safeRevalidate("/sales");
  safeRevalidate("/dashboard");

  return { success: true };
}
