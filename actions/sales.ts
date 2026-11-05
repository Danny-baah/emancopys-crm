"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import {
  saleSchema,
  saleCommunicationSchema,
  saleTaskSchema,
  type SaleFormValues,
  type SaleCommunicationFormValues,
  type SaleTaskFormValues,
} from "@/lib/validations/sales";
import { Prisma } from "@/lib/generated/prisma/client";
import { SalesStatus, Role } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetSalesParams {
  search?: string;
  status?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}

export async function getSales(
  {
    search = "",
    status = "",
    assignedToId = "",
    page = 1,
    limit = 10,
  }: GetSalesParams = {},
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.SaleWhereInput = {};

  // Role-based visibility
  if (user.role !== Role.ADMIN) {
    whereClause.OR = [{ assignedToId: user.id }, { createdById: user.id }];
  } else if (assignedToId) {
    whereClause.assignedToId = assignedToId;
  }

  // Status filter
  if (status && status !== "ALL" && Object.values(SalesStatus).includes(status as SalesStatus)) {
    whereClause.status = status as SalesStatus;
  }

  // Search filter
  if (search.trim()) {
    const term = search.trim();
    const searchConditions: Prisma.SaleWhereInput[] = [
      { title: { contains: term, mode: "insensitive" } },
      { customer: { companyName: { contains: term, mode: "insensitive" } } },
      { customer: { contactPerson: { contains: term, mode: "insensitive" } } },
      { lead: { companyName: { contains: term, mode: "insensitive" } } },
      { lead: { contactPerson: { contains: term, mode: "insensitive" } } },
      { serviceType: { contains: term, mode: "insensitive" } },
    ];

    if (whereClause.OR) {
      whereClause.AND = [{ OR: whereClause.OR }, { OR: searchConditions }];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchConditions;
    }
  }

  const [totalCount, sales] = await Promise.all([
    prisma.sale.count({ where: whereClause }),
    prisma.sale.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        lead: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            communications: true,
            tasks: true,
            quotations: true,
            orders: true,
          },
        },
      },
    }),
  ]);

  return {
    sales,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getSaleById(id: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      lead: true,
      assignedTo: {
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
      communications: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      tasks: {
        orderBy: [{ isCompleted: "asc" }, { dueDate: "asc" }],
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      quotations: {
        orderBy: { createdAt: "desc" },
        include: {
          responsibleEmployee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
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

  if (!sale) return null;

  if (
    user.role !== Role.ADMIN &&
    sale.assignedToId !== user.id &&
    sale.createdById !== user.id
  ) {
    throw new Error("Unauthorized to access this sales record.");
  }

  return sale;
}

export async function createSale(data: SaleFormValues, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());
  const validated = saleSchema.parse(data);

  const assignedToId =
    user.role === Role.ADMIN
      ? validated.assignedToId?.trim() || user.id
      : user.id;

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        title: validated.title,
        customerId: validated.customerId || null,
        leadId: validated.leadId || null,
        assignedToId,
        createdById: user.id,
        status: validated.status || SalesStatus.NEW_LEAD,
        estimatedValue: validated.estimatedValue ?? null,
        serviceType: validated.serviceType || null,
        interests: validated.interests || null,
        objections: validated.objections || null,
        nextContactDate: validated.nextContactDate
          ? new Date(validated.nextContactDate)
          : null,
        notes: validated.notes || null,
      },
    });

    await tx.saleStatusHistory.create({
      data: {
        saleId: s.id,
        userId: user.id,
        fromStatus: null,
        toStatus: s.status,
        notes: "Sales record created in workspace.",
      },
    });

    return s;
  });

  safeRevalidate("/sales");
  safeRevalidate("/dashboard");
  return { saleId: sale.id };
}

export async function updateSale(
  id: string,
  data: SaleFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const existing = await prisma.sale.findUnique({
    where: { id },
    select: { id: true, status: true, assignedToId: true, createdById: true },
  });

  if (!existing) {
    throw new Error("Sales record not found.");
  }

  if (
    user.role !== Role.ADMIN &&
    existing.assignedToId !== user.id &&
    existing.createdById !== user.id
  ) {
    throw new Error("Unauthorized to modify this sales record.");
  }

  const validated = saleSchema.parse(data);
  const statusChanged = validated.status && validated.status !== existing.status;

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: {
        title: validated.title,
        customerId: validated.customerId || null,
        leadId: validated.leadId || null,
        assignedToId:
          user.role === Role.ADMIN
            ? validated.assignedToId?.trim() || null
            : existing.assignedToId,
        status: validated.status,
        estimatedValue: validated.estimatedValue ?? null,
        serviceType: validated.serviceType || null,
        interests: validated.interests || null,
        objections: validated.objections || null,
        nextContactDate: validated.nextContactDate
          ? new Date(validated.nextContactDate)
          : null,
        notes: validated.notes || null,
        wonAt: validated.status === SalesStatus.DEAL_WON ? new Date() : undefined,
        lostAt: validated.status === SalesStatus.DEAL_LOST ? new Date() : undefined,
      },
    });

    if (statusChanged) {
      await tx.saleStatusHistory.create({
        data: {
          saleId: id,
          userId: user.id,
          fromStatus: existing.status,
          toStatus: validated.status,
          notes: `Sales status updated to ${validated.status}.`,
        },
      });
    }
  });

  safeRevalidate(`/sales/${id}`);
  safeRevalidate("/sales");
  safeRevalidate("/dashboard");
  return { success: true };
}

export async function updateSaleStatus(
  id: string,
  newStatus: SalesStatus,
  notes?: string,
  lostReason?: string,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const existing = await prisma.sale.findUnique({
    where: { id },
    select: { id: true, status: true, assignedToId: true, createdById: true },
  });

  if (!existing) {
    throw new Error("Sales record not found.");
  }

  if (
    user.role !== Role.ADMIN &&
    existing.assignedToId !== user.id &&
    existing.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update sales status.");
  }

  if (existing.status === newStatus) return { success: true };

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id },
      data: {
        status: newStatus,
        wonAt: newStatus === SalesStatus.DEAL_WON ? new Date() : undefined,
        lostAt: newStatus === SalesStatus.DEAL_LOST ? new Date() : undefined,
        lostReason: newStatus === SalesStatus.DEAL_LOST ? lostReason || null : null,
      },
    });

    await tx.saleStatusHistory.create({
      data: {
        saleId: id,
        userId: user.id,
        fromStatus: existing.status,
        toStatus: newStatus,
        notes: notes || `Sales status transitioned to ${newStatus}.`,
      },
    });
  });

  safeRevalidate(`/sales/${id}`);
  safeRevalidate("/sales");
  safeRevalidate("/dashboard");
  return { success: true };
}

export async function logSaleCommunication(
  saleId: string,
  data: SaleCommunicationFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: { id: true, assignedToId: true, createdById: true },
  });

  if (!sale) throw new Error("Sale record not found.");

  if (
    user.role !== Role.ADMIN &&
    sale.assignedToId !== user.id &&
    sale.createdById !== user.id
  ) {
    throw new Error("Unauthorized to log communication.");
  }

  const validated = saleCommunicationSchema.parse(data);

  await prisma.$transaction(async (tx) => {
    await tx.saleCommunication.create({
      data: {
        saleId,
        userId: user.id,
        activityType: validated.activityType,
        subject: validated.subject,
        notes: validated.notes,
        customerInterests: validated.customerInterests || null,
        customerObjections: validated.customerObjections || null,
        nextFollowUpDate: validated.nextFollowUpDate
          ? new Date(validated.nextFollowUpDate)
          : null,
      },
    });

    // Update sale quick notes if provided
    const saleUpdate: Prisma.SaleUpdateInput = {};
    if (validated.customerInterests?.trim()) {
      saleUpdate.interests = validated.customerInterests.trim();
    }
    if (validated.customerObjections?.trim()) {
      saleUpdate.objections = validated.customerObjections.trim();
    }
    if (validated.nextFollowUpDate) {
      saleUpdate.nextContactDate = new Date(validated.nextFollowUpDate);
    }

    if (Object.keys(saleUpdate).length > 0) {
      await tx.sale.update({
        where: { id: saleId },
        data: saleUpdate,
      });
    }
  });

  safeRevalidate(`/sales/${saleId}`);
  return { success: true };
}

export async function createSaleTask(
  saleId: string,
  data: SaleTaskFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: { id: true, assignedToId: true, createdById: true },
  });

  if (!sale) throw new Error("Sale record not found.");

  if (
    user.role !== Role.ADMIN &&
    sale.assignedToId !== user.id &&
    sale.createdById !== user.id
  ) {
    throw new Error("Unauthorized to create task.");
  }

  const validated = saleTaskSchema.parse(data);

  const assignedToId =
    user.role === Role.ADMIN && validated.assignedToId?.trim()
      ? validated.assignedToId.trim()
      : user.id;

  await prisma.saleTask.create({
    data: {
      saleId,
      assignedToId,
      createdById: user.id,
      title: validated.title,
      description: validated.description || null,
      dueDate: new Date(validated.dueDate),
      reminderDate: validated.reminderDate
        ? new Date(validated.reminderDate)
        : null,
    },
  });

  safeRevalidate(`/sales/${saleId}`);
  return { success: true };
}

export async function toggleSaleTaskCompletion(
  taskId: string,
  saleId: string,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const task = await prisma.saleTask.findUnique({
    where: { id: taskId },
    select: { id: true, isCompleted: true, assignedToId: true, createdById: true },
  });

  if (!task) throw new Error("Task not found.");

  if (
    user.role !== Role.ADMIN &&
    task.assignedToId !== user.id &&
    task.createdById !== user.id
  ) {
    throw new Error("Unauthorized to modify task.");
  }

  const nextState = !task.isCompleted;

  await prisma.saleTask.update({
    where: { id: taskId },
    data: {
      isCompleted: nextState,
      completedAt: nextState ? new Date() : null,
    },
  });

  safeRevalidate(`/sales/${saleId}`);
  return { success: true, isCompleted: nextState };
}

export async function promoteLeadToSale(leadId: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) throw new Error("Lead not found.");

  // Check if an open sale already exists for this lead
  const existingSale = await prisma.sale.findFirst({
    where: { leadId, status: { notIn: [SalesStatus.DEAL_WON, SalesStatus.DEAL_LOST] } },
  });

  if (existingSale) {
    return { saleId: existingSale.id, alreadyExisted: true };
  }

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        title: `${lead.companyName} - Deal Pipeline`,
        leadId: lead.id,
        assignedToId: lead.assignedToId || user.id,
        createdById: user.id,
        status: SalesStatus.FIRST_CONTACT_MADE,
        estimatedValue: lead.estimatedValue,
        serviceType: "Corporate Website & Custom Printing",
        notes: lead.notes,
      },
    });

    await tx.saleStatusHistory.create({
      data: {
        saleId: s.id,
        userId: user.id,
        fromStatus: null,
        toStatus: SalesStatus.FIRST_CONTACT_MADE,
        notes: `Promoted from Lead directory: ${lead.companyName}.`,
      },
    });

    return s;
  });

  safeRevalidate(`/leads/${leadId}`);
  safeRevalidate("/sales");
  return { saleId: sale.id, alreadyExisted: false };
}
