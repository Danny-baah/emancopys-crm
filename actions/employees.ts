"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin, type AuthenticatedUser } from "@/lib/auth-utils";
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  type EmployeeCreateFormValues,
  type EmployeeUpdateFormValues,
} from "@/lib/validations/employees";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@/lib/generated/prisma/client";
import { Role, AuditAction, SalesStatus } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetEmployeesParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getEmployees(
  {
    search = "",
    role = "",
    isActive,
    page = 1,
    limit = 20,
  }: GetEmployeesParams = {},
  userContext?: AuthenticatedUser
) {
  await (userContext ? Promise.resolve() : requireAdmin());

  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.UserWhereInput = {};

  if (isActive !== undefined) {
    whereClause.isActive = isActive;
  }

  if (role && role !== "ALL" && Object.values(Role).includes(role as Role)) {
    whereClause.role = role as Role;
  }

  if (search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedLeads: true,
            assignedCustomers: true,
            responsibleOrders: true,
            assignedSaleTasks: {
              where: { isCompleted: false },
            },
          },
        },
      },
    }),
  ]);

  return {
    employees: users,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getEmployeePerformance(employeeId: string) {
  await requireAdmin();

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!employee) return null;

  // 1. Leads assigned
  const leadsAssignedCount = await prisma.lead.count({
    where: { assignedToId: employeeId },
  });

  // 2. Leads processed (leads assigned to employee where either status != NEW or employee logged an activity)
  const leadsProcessedCount = await prisma.lead.count({
    where: {
      OR: [
        { assignedToId: employeeId, status: { not: SalesStatus.NEW_LEAD } },
        { activities: { some: { userId: employeeId } } },
      ],
    },
  });

  // 3. Customers contacted (unique customers where this employee logged customer activity or sale communications)
  const [customerActivities, saleComms] = await Promise.all([
    prisma.customerActivity.findMany({
      where: { userId: employeeId },
      select: { customerId: true },
      distinct: ["customerId"],
    }),
    prisma.saleCommunication.findMany({
      where: { userId: employeeId, sale: { customerId: { not: null } } },
      select: { sale: { select: { customerId: true } } },
    }),
  ]);

  const uniqueCustomerIds = new Set<string>();
  customerActivities.forEach((ca) => uniqueCustomerIds.add(ca.customerId));
  saleComms.forEach((sc) => {
    if (sc.sale?.customerId) uniqueCustomerIds.add(sc.sale.customerId);
  });
  const customersContactedCount = uniqueCustomerIds.size;

  // 4. Conversations documented: total communications logged across sales, leads & customers
  const [commsCount, leadActsCount, custActsCount] = await Promise.all([
    prisma.saleCommunication.count({ where: { userId: employeeId } }),
    prisma.leadActivity.count({ where: { userId: employeeId } }),
    prisma.customerActivity.count({ where: { userId: employeeId } }),
  ]);
  const conversationsDocumentedCount = commsCount + leadActsCount + custActsCount;

  // 5. Quotations created
  const quotationsCreatedCount = await prisma.quotation.count({
    where: {
      OR: [{ createdById: employeeId }, { responsibleEmployeeId: employeeId }],
    },
  });

  // 6. Orders won & 7. Revenue generated
  const wonOrders = await prisma.order.findMany({
    where: {
      OR: [{ responsibleEmployeeId: employeeId }, { createdById: employeeId }],
      status: { in: ["CONFIRMED", "COMPLETED", "IN_PRODUCTION"] },
    },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      serviceSold: true,
      orderDate: true,
      status: true,
      customer: {
        select: { id: true, companyName: true },
      },
    },
    orderBy: { orderDate: "desc" },
  });

  const ordersWonCount = wonOrders.length;
  const revenueGenerated = Math.round(
    wonOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) * 100
  ) / 100;

  // 8. Outstanding tasks
  const outstandingTasks = await prisma.saleTask.findMany({
    where: {
      assignedToId: employeeId,
      isCompleted: false,
    },
    include: {
      sale: {
        select: {
          id: true,
          title: true,
          customer: { select: { companyName: true } },
          lead: { select: { companyName: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Recent activity log for this employee
  const recentAuditLogs = await prisma.auditLog.findMany({
    where: { userId: employeeId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  return {
    employee,
    metrics: {
      leadsAssigned: leadsAssignedCount,
      leadsProcessed: leadsProcessedCount,
      customersContacted: customersContactedCount,
      conversationsDocumented: conversationsDocumentedCount,
      quotationsCreated: quotationsCreatedCount,
      ordersWon: ordersWonCount,
      revenueGenerated,
      outstandingTasksCount: outstandingTasks.length,
    },
    wonOrders: wonOrders.slice(0, 5),
    outstandingTasks,
    recentAuditLogs,
  };
}

export async function createEmployee(data: EmployeeCreateFormValues) {
  const admin = await requireAdmin();
  const validated = employeeCreateSchema.parse(data);

  // Check unique email
  const existing = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existing) {
    throw new Error(`An account with email ${validated.email} already exists.`);
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(validated.password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      passwordHash,
      role: validated.role,
      isActive: validated.isActive,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logAudit({
    userId: admin.id,
    action: AuditAction.CREATE,
    entityType: "EMPLOYEE",
    entityId: newUser.id,
    entityName: newUser.name,
    details: `Created new ${newUser.role.toLowerCase()} account for ${newUser.name} (${newUser.email}).`,
    metadata: {
      role: newUser.role,
      email: newUser.email,
    },
  });

  safeRevalidate("/employees");
  safeRevalidate("/dashboard");

  return { success: true, employeeId: newUser.id };
}

export async function updateEmployee(id: string, data: EmployeeUpdateFormValues) {
  const admin = await requireAdmin();
  const validated = employeeUpdateSchema.parse(data);

  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Employee account not found.");
  }

  // Prevent admin from deactivating or demoting themselves
  if (existing.id === admin.id) {
    if (!validated.isActive) {
      throw new Error("You cannot deactivate your own administrator account.");
    }
    if (validated.role !== Role.ADMIN) {
      throw new Error("You cannot remove administrator privileges from your own account.");
    }
  }

  // Check email uniqueness if email changed
  if (validated.email !== existing.email) {
    const emailInUse = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (emailInUse && emailInUse.id !== id) {
      throw new Error(`Email address ${validated.email} is already in use by another user.`);
    }
  }

  let newPasswordHash: string | undefined = undefined;
  if (validated.password && validated.password.trim().length >= 8) {
    newPasswordHash = await bcrypt.hash(validated.password.trim(), 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: validated.name,
      email: validated.email,
      role: validated.role,
      isActive: validated.isActive,
      passwordHash: newPasswordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const changes: string[] = [];
  if (existing.role !== updated.role) {
    changes.push(`Role changed from ${existing.role} to ${updated.role}`);
  }
  if (existing.isActive !== updated.isActive) {
    changes.push(`Account ${updated.isActive ? "activated" : "deactivated"}`);
  }
  if (newPasswordHash) {
    changes.push("Password reset");
  }

  await logAudit({
    userId: admin.id,
    action: AuditAction.UPDATE,
    entityType: "EMPLOYEE",
    entityId: id,
    entityName: updated.name,
    details: `Updated employee profile for ${updated.name}. ${changes.join(", ")}.`,
  });

  safeRevalidate(`/employees/${id}`);
  safeRevalidate("/employees");
  safeRevalidate("/dashboard");

  return { success: true, employee: updated };
}

export async function toggleEmployeeStatus(id: string, isActive: boolean) {
  const admin = await requireAdmin();

  if (id === admin.id) {
    throw new Error("You cannot change the active status of your own administrator account.");
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, isActive: true },
  });

  if (!existing) {
    throw new Error("Employee account not found.");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });

  await logAudit({
    userId: admin.id,
    action: isActive ? AuditAction.ACTIVATED : AuditAction.DEACTIVATED,
    entityType: "EMPLOYEE",
    entityId: id,
    entityName: updated.name,
    details: `${isActive ? "Activated" : "Deactivated"} employee account for ${updated.name} (${updated.email}). Historical records preserved.`,
  });

  safeRevalidate(`/employees/${id}`);
  safeRevalidate("/employees");
  safeRevalidate("/dashboard");

  return { success: true, isActive: updated.isActive };
}

