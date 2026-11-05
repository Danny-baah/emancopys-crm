"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import { orderSchema, type OrderFormValues } from "@/lib/validations/orders";
import { Prisma } from "@/lib/generated/prisma/client";
import { OrderStatus, ProjectStatus, SalesStatus, Role } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetOrdersParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getOrders(
  {
    search = "",
    status = "",
    page = 1,
    limit = 10,
  }: GetOrdersParams = {},
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.OrderWhereInput = {};

  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { responsibleEmployeeId: user.id },
      { createdById: user.id },
      { customer: { assignedToId: user.id } },
    ];
  }

  if (
    status &&
    status !== "ALL" &&
    Object.values(OrderStatus).includes(status as OrderStatus)
  ) {
    whereClause.status = status as OrderStatus;
  }

  if (search.trim()) {
    const term = search.trim();
    const searchConditions: Prisma.OrderWhereInput[] = [
      { orderNumber: { contains: term, mode: "insensitive" } },
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

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    prisma.order.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { orderDate: "desc" },
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
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            quotationPrice: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            status: true,
          },
        },
      },
    }),
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getOrderById(id: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      quotation: true,
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
      project: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      },
    },
  });

  if (!order) return null;

  if (
    user.role !== Role.ADMIN &&
    order.responsibleEmployeeId !== user.id &&
    order.createdById !== user.id &&
    order.customer.assignedToId !== user.id
  ) {
    throw new Error("Unauthorized to access this order.");
  }

  return order;
}

export async function createOrder(
  data: OrderFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const validated = orderSchema.parse(data);

  // Check duplicate prevention if quotationId is specified
  if (validated.quotationId) {
    const existingOrder = await prisma.order.findFirst({
      where: { quotationId: validated.quotationId },
    });
    if (existingOrder) {
      throw new Error(`An order already exists for quotation (${existingOrder.orderNumber}).`);
    }
  }

  const responsibleEmployeeId =
    user.role === Role.ADMIN && validated.responsibleEmployeeId?.trim()
      ? validated.responsibleEmployeeId.trim()
      : user.id;

  // Generate unique order number ORD-YYYYMM-XXXX
  const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
  const count = await prisma.order.count();
  const sequence = String(count + 1).padStart(4, "0");
  const orderNumber = `ORD-${datePrefix}-${sequence}`;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: validated.customerId,
        quotationId: validated.quotationId || null,
        saleId: validated.saleId || null,
        serviceSold: validated.serviceSold,
        totalAmount: validated.totalAmount,
        agreedCommission: validated.agreedCommission,
        orderDate: validated.orderDate ? new Date(validated.orderDate) : new Date(),
        responsibleEmployeeId,
        createdById: user.id,
        status: validated.status,
        notes: validated.notes || null,
      },
      include: {
        customer: true,
      },
    });

    // 2. If a Sale was linked, ensure its status is marked DEAL_WON
    if (validated.saleId) {
      const sale = await tx.sale.findUnique({
        where: { id: validated.saleId },
      });
      if (sale && sale.status !== SalesStatus.DEAL_WON) {
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: SalesStatus.DEAL_WON,
            wonAt: new Date(),
          },
        });
        await tx.saleStatusHistory.create({
          data: {
            saleId: sale.id,
            userId: user.id,
            fromStatus: sale.status,
            toStatus: SalesStatus.DEAL_WON,
            notes: `Deal won! Order ${orderNumber} created with agreed commission of GHS ${validated.agreedCommission.toLocaleString()}.`,
          },
        });
      }
    }

    // 3. Automatically create associated Project if requested
    let createdProject = null;
    if (validated.autoCreateProject !== false) {
      const prjCount = await tx.project.count();
      const prjSeq = String(prjCount + 1).padStart(4, "0");
      const projectNumber = `PRJ-${datePrefix}-${prjSeq}`;

      createdProject = await tx.project.create({
        data: {
          projectNumber,
          title: `${order.customer.companyName} - ${validated.serviceSold}`,
          customerId: validated.customerId,
          orderId: order.id,
          status: ProjectStatus.ORDER_WON,
          assignedToId: responsibleEmployeeId,
          createdById: user.id,
          notes: `Project generated automatically from Order ${orderNumber}.`,
          statusHistory: {
            create: {
              userId: user.id,
              fromStatus: null,
              toStatus: ProjectStatus.ORDER_WON,
              notes: `Project production initialized on order won (${orderNumber}).`,
            },
          },
        },
      });
    }

    return { order, project: createdProject };
  });

  safeRevalidate("/orders");
  safeRevalidate("/projects");
  safeRevalidate("/quotations");
  safeRevalidate("/sales");
  safeRevalidate("/dashboard");

  return {
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    projectId: result.project?.id,
    projectNumber: result.project?.projectNumber,
  };
}
