"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import { leadSchema, leadActivitySchema, type LeadFormValues, type LeadActivityFormValues } from "@/lib/validations/lead";
import { Prisma } from "@/lib/generated/prisma/client";
import { SalesStatus, Role, AuditAction } from "@/lib/generated/prisma/enums";
import { logAudit } from "@/lib/audit";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetLeadsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  assignedToId?: string;
}

export async function getLeads(
  {
    search = "",
    status = "",
    page = 1,
    limit = 10,
    assignedToId = "",
  }: GetLeadsParams = {},
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());

  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.LeadWhereInput = {};

  // Role-based visibility: employees only see their assigned leads or leads they created
  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
    ];
  } else if (assignedToId) {
    whereClause.assignedToId = assignedToId;
  }

  // Status filter
  if (status && status !== "ALL" && Object.values(SalesStatus).includes(status as SalesStatus)) {
    whereClause.status = status as SalesStatus;
  }

  // Search filter across companyName, contactPerson, email, phone
  if (search.trim()) {
    const searchFilter = {
      contains: search.trim(),
      mode: "insensitive" as const,
    };

    const searchConditions: Prisma.LeadWhereInput[] = [
      { companyName: searchFilter },
      { contactPerson: searchFilter },
      { email: searchFilter },
      { phone: searchFilter },
      { industry: searchFilter },
    ];

    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        { OR: searchConditions },
      ];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchConditions;
    }
  }

  const [totalCount, leads] = await Promise.all([
    prisma.lead.count({ where: whereClause }),
    prisma.lead.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
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
        _count: {
          select: {
            activities: true,
          },
        },
        activities: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            activityType: true,
            title: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return {
    leads,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getLeadById(id: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
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
      importBatch: {
        select: {
          id: true,
          fileName: true,
          createdAt: true,
        },
      },
      activities: {
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

  if (!lead) {
    return null;
  }

  // Authorization check
  if (
    user.role !== Role.ADMIN &&
    lead.assignedToId !== user.id &&
    lead.createdById !== user.id
  ) {
    throw new Error("Unauthorized to access this lead profile.");
  }

  return lead;
}

export async function createLead(data: LeadFormValues, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());
  const validated = leadSchema.parse(data);

  let assignedToId: string | null = null;
  if (user.role === Role.ADMIN) {
    assignedToId = validated.assignedToId?.trim() || null;
  } else {
    assignedToId = user.id;
  }

  const lead = await prisma.lead.create({
    data: {
      companyName: validated.companyName,
      contactPerson: validated.contactPerson,
      phone: validated.phone || null,
      email: validated.email || null,
      jobTitle: validated.jobTitle || null,
      industry: validated.industry || null,
      location: validated.location || null,
      status: validated.status || SalesStatus.NEW_LEAD,
      source: validated.source || "Manual Entry",
      estimatedValue: validated.estimatedValue ?? null,
      notes: validated.notes || null,
      assignedToId,
      createdById: user.id,
      activities: {
        create: {
          userId: user.id,
          activityType: "OTHER",
          title: "Lead Created",
          description: `Lead profile created with status: ${validated.status || "NEW"}.`,
        },
      },
    },
  });

  await logAudit({
    userId: user.id,
    action: AuditAction.CREATE,
    entityType: "LEAD",
    entityId: lead.id,
    entityName: lead.companyName,
    details: `Created lead "${lead.companyName}" (Status: ${lead.status}).`,
  });

  safeRevalidate("/leads");
  safeRevalidate("/dashboard");

  return { leadId: lead.id };
}

export async function updateLead(
  id: string,
  data: LeadFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const existing = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, assignedToId: true, createdById: true, status: true },
  });

  if (!existing) {
    throw new Error("Lead record not found.");
  }

  // Authorization check
  if (
    user.role !== Role.ADMIN &&
    existing.assignedToId !== user.id &&
    existing.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update this lead record.");
  }

  const validated = leadSchema.parse(data);

  let assignedToId = existing.assignedToId;
  if (user.role === Role.ADMIN) {
    assignedToId = validated.assignedToId?.trim() || null;
  }

  const statusChanged = validated.status && validated.status !== existing.status;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id },
      data: {
        companyName: validated.companyName,
        contactPerson: validated.contactPerson,
        phone: validated.phone || null,
        email: validated.email || null,
        jobTitle: validated.jobTitle || null,
        industry: validated.industry || null,
        location: validated.location || null,
        status: validated.status,
        source: validated.source || null,
        estimatedValue: validated.estimatedValue ?? null,
        notes: validated.notes || null,
        assignedToId,
      },
    });

    if (statusChanged) {
      await tx.leadActivity.create({
        data: {
          leadId: id,
          userId: user.id,
          activityType: "OTHER",
          title: "Status Updated",
          description: `Status changed from ${existing.status} to ${validated.status}.`,
        },
      });
    }
  });

  await logAudit({
    userId: user.id,
    action: statusChanged ? AuditAction.STATUS_CHANGE : AuditAction.UPDATE,
    entityType: "LEAD",
    entityId: id,
    entityName: validated.companyName,
    details: statusChanged
      ? `Lead status changed from ${existing.status} to ${validated.status}.`
      : `Updated lead details for "${validated.companyName}".`,
  });

  safeRevalidate(`/leads/${id}`);
  safeRevalidate("/leads");
  safeRevalidate("/dashboard");

  return { success: true };
}

export async function deleteLead(id: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const existing = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, companyName: true, assignedToId: true, createdById: true },
  });

  if (!existing) {
    throw new Error("Lead record not found.");
  }

  // Deletion is permitted for Admin or creator
  if (user.role !== Role.ADMIN && existing.createdById !== user.id) {
    throw new Error("Only an administrator or the creator may delete this lead.");
  }

  await prisma.lead.delete({
    where: { id },
  });

  await logAudit({
    userId: user.id,
    action: AuditAction.DELETE,
    entityType: "LEAD",
    entityId: id,
    entityName: existing.companyName,
    details: `Deleted lead record "${existing.companyName}".`,
  });

  safeRevalidate("/leads");
  safeRevalidate("/dashboard");

  return { success: true };
}

export async function logLeadActivity(
  leadId: string,
  data: LeadActivityFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, assignedToId: true, createdById: true },
  });

  if (!lead) {
    throw new Error("Lead record not found.");
  }

  if (
    user.role !== Role.ADMIN &&
    lead.assignedToId !== user.id &&
    lead.createdById !== user.id
  ) {
    throw new Error("Unauthorized to log activity on this lead.");
  }

  const validated = leadActivitySchema.parse(data);

  await prisma.leadActivity.create({
    data: {
      leadId,
      userId: user.id,
      activityType: validated.activityType,
      title: validated.title,
      description: validated.description || "",
    },
  });

  safeRevalidate(`/leads/${leadId}`);
  safeRevalidate("/leads");

  return { success: true };
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: SalesStatus,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true, assignedToId: true, createdById: true },
  });

  if (!lead) {
    throw new Error("Lead not found.");
  }

  if (
    user.role !== Role.ADMIN &&
    lead.assignedToId !== user.id &&
    lead.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update status.");
  }

  if (lead.status === newStatus) return { success: true };

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { status: newStatus },
    });

    await tx.leadActivity.create({
      data: {
        leadId,
        userId: user.id,
        activityType: "OTHER",
        title: "Status Changed",
        description: `Lead status updated to ${newStatus}.`,
      },
    });
  });

  safeRevalidate(`/leads/${leadId}`);
  safeRevalidate("/leads");

  return { success: true };
}
