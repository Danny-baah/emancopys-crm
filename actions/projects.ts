"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import {
  projectUpdateSchema,
  type ProjectUpdateFormValues,
} from "@/lib/validations/projects";
import { Prisma } from "@/lib/generated/prisma/client";
import { ProjectStatus, Role } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetProjectsParams {
  search?: string;
  status?: string;
  stageFilter?: "ALL" | "MATERIALS" | "PRODUCTION" | "REVISIONS" | "HANDOVER" | "COMPLETED";
  page?: number;
  limit?: number;
}

export async function getProjects(
  {
    search = "",
    status = "",
    stageFilter = "ALL",
    page = 1,
    limit = 10,
  }: GetProjectsParams = {},
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.ProjectWhereInput = {};

  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
      { customer: { assignedToId: user.id } },
    ];
  }

  // Exact status filter
  if (
    status &&
    status !== "ALL" &&
    Object.values(ProjectStatus).includes(status as ProjectStatus)
  ) {
    whereClause.status = status as ProjectStatus;
  }

  // Stage categories for quick workflow identification
  if (stageFilter && stageFilter !== "ALL") {
    if (stageFilter === "MATERIALS") {
      whereClause.status = {
        in: [
          ProjectStatus.WAITING_FOR_CUSTOMER_MATERIALS,
          ProjectStatus.MATERIALS_COMPLETE,
        ],
      };
    } else if (stageFilter === "PRODUCTION") {
      whereClause.status = {
        in: [
          ProjectStatus.IN_PRODUCTION,
          ProjectStatus.INTERNAL_QUALITY_CONTROL,
        ],
      };
    } else if (stageFilter === "REVISIONS") {
      whereClause.status = {
        in: [
          ProjectStatus.CUSTOMER_REVISIONS,
          ProjectStatus.CUSTOMER_APPROVAL,
        ],
      };
    } else if (stageFilter === "HANDOVER") {
      whereClause.status = {
        in: [
          ProjectStatus.READY_FOR_HANDOVER,
          ProjectStatus.WEBSITE_TRANSFERRED,
        ],
      };
    } else if (stageFilter === "COMPLETED") {
      whereClause.status = ProjectStatus.PROJECT_COMPLETED;
    }
  }

  if (search.trim()) {
    const term = search.trim();
    const searchConditions: Prisma.ProjectWhereInput[] = [
      { projectNumber: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
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

  const [totalCount, projects] = await Promise.all([
    prisma.project.count({ where: whereClause }),
    prisma.project.findMany({
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
        order: {
          select: {
            id: true,
            orderNumber: true,
            serviceSold: true,
            totalAmount: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            statusHistory: true,
          },
        },
      },
    }),
  ]);

  return {
    projects,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getProjectById(id: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      order: {
        include: {
          quotation: true,
          sale: true,
          responsibleEmployee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      statusHistory: {
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
    },
  });

  if (!project) return null;

  if (
    user.role !== Role.ADMIN &&
    project.assignedToId !== user.id &&
    project.createdById !== user.id &&
    project.customer.assignedToId !== user.id
  ) {
    throw new Error("Unauthorized to access this project.");
  }

  return project;
}

export async function updateProjectStatus(
  id: string,
  data: ProjectUpdateFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { id: true, status: true, assignedToId: true, createdById: true },
  });

  if (!existing) throw new Error("Project not found.");

  if (
    user.role !== Role.ADMIN &&
    existing.assignedToId !== user.id &&
    existing.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update project status.");
  }

  const validated = projectUpdateSchema.parse(data);
  const statusChanged = validated.status !== existing.status;

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        status: validated.status,
        targetHandoverDate: validated.targetHandoverDate
          ? new Date(validated.targetHandoverDate)
          : undefined,
        handoverDate:
          validated.status === ProjectStatus.PROJECT_COMPLETED ||
          validated.status === ProjectStatus.WEBSITE_TRANSFERRED
            ? validated.handoverDate
              ? new Date(validated.handoverDate)
              : new Date()
            : undefined,
        websiteUrl: validated.websiteUrl || undefined,
        stagingUrl: validated.stagingUrl || undefined,
        materialsNotes: validated.materialsNotes || undefined,
        revisionsNotes: validated.revisionsNotes || undefined,
        notes: validated.notes || undefined,
      },
    });

    if (statusChanged || validated.statusChangeNote) {
      await tx.projectStatusHistory.create({
        data: {
          projectId: id,
          userId: user.id,
          fromStatus: existing.status,
          toStatus: validated.status,
          notes:
            validated.statusChangeNote ||
            `Project status updated from ${existing.status} to ${validated.status}.`,
        },
      });
    }
  });

  safeRevalidate(`/projects/${id}`);
  safeRevalidate("/projects");
  safeRevalidate("/dashboard");

  return { success: true };
}

export async function createProjectForOrder(
  orderId: string,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, project: true },
  });

  if (!order) throw new Error("Order not found.");
  if (order.project) {
    return { projectId: order.project.id, alreadyExisted: true };
  }

  const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
  const count = await prisma.project.count();
  const sequence = String(count + 1).padStart(4, "0");
  const projectNumber = `PRJ-${datePrefix}-${sequence}`;

  const project = await prisma.project.create({
    data: {
      projectNumber,
      title: `${order.customer.companyName} - ${order.serviceSold}`,
      customerId: order.customerId,
      orderId: order.id,
      status: ProjectStatus.ORDER_WON,
      assignedToId: order.responsibleEmployeeId || user.id,
      createdById: user.id,
      notes: `Project initiated manually from Order ${order.orderNumber}.`,
      statusHistory: {
        create: {
          userId: user.id,
          fromStatus: null,
          toStatus: ProjectStatus.ORDER_WON,
          notes: "Project initiated from confirmed order.",
        },
      },
    },
  });

  safeRevalidate(`/orders/${orderId}`);
  safeRevalidate("/orders");
  safeRevalidate("/projects");
  safeRevalidate("/dashboard");

  return { projectId: project.id, alreadyExisted: false };
}
