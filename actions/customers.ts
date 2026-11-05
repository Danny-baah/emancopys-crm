"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, canManageCustomer } from "@/lib/auth-utils";
import { customerSchema, type CustomerFormValues } from "@/lib/validations/customer";
import { Prisma } from "@/lib/generated/prisma/client";
import { ActivityType, Role } from "@/lib/generated/prisma/enums";

export interface GetCustomersParams {
  search?: string;
  page?: number;
  limit?: number;
  archived?: boolean;
}

export async function getCustomers({
  search = "",
  page = 1,
  limit = 10,
  archived = false,
}: GetCustomersParams) {
  const user = await requireAuth();

  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.CustomerWhereInput = {
    archivedAt: archived ? { not: null } : null,
  };

  // Role-based visibility: employees only see their assigned customers or customers they created
  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
    ];
  }

  // Search filter across companyName, contactPerson, email, phone
  if (search.trim()) {
    const searchFilter = {
      contains: search.trim(),
      mode: "insensitive" as const,
    };

    const searchConditions = [
      { companyName: searchFilter },
      { contactPerson: searchFilter },
      { email: searchFilter },
      { phone: searchFilter },
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

  const [totalCount, customers] = await Promise.all([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.findMany({
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
    customers,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getCustomerById(id: string) {
  const user = await requireAuth();

  const customer = await prisma.customer.findUnique({
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

  if (!customer) {
    return null;
  }

  // Enforce access authorization
  if (!canManageCustomer(user, customer)) {
    throw new Error("FORBIDDEN_CUSTOMER_ACCESS");
  }

  return customer;
}

export async function createCustomer(formData: CustomerFormValues) {
  const user = await requireAuth();

  const validated = customerSchema.parse(formData);

  // Assignment handling: only admins can assign to other employees.
  // If employee creates customer and didn't specify or is employee, default assignedToId to creator or chosen value
  let assignedToId = validated.assignedToId || null;
  if (user.role !== Role.ADMIN) {
    assignedToId = user.id;
  }

  const firstContactDate = validated.firstContactDate
    ? new Date(validated.firstContactDate)
    : null;

  const customer = await prisma.customer.create({
    data: {
      companyName: validated.companyName,
      contactPerson: validated.contactPerson,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      industry: validated.industry || null,
      location: validated.location || null,
      firstContactDate,
      notes: validated.notes || null,
      assignedToId,
      createdById: user.id,
      activities: {
        create: {
          userId: user.id,
          activityType: ActivityType.NOTE,
          title: "Customer Account Created",
          description: `Initial customer profile established by ${user.name || user.email}.`,
        },
      },
    },
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  return { success: true, customerId: customer.id };
}

export async function updateCustomer(id: string, formData: CustomerFormValues) {
  const user = await requireAuth();

  const existing = await prisma.customer.findUnique({
    where: { id },
    include: { assignedTo: true },
  });

  if (!existing) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  if (!canManageCustomer(user, existing)) {
    throw new Error("FORBIDDEN_CUSTOMER_MODIFICATION");
  }

  const validated = customerSchema.parse(formData);

  // Only admins can reassign customers to other users
  let assignedToId = existing.assignedToId;
  if (user.role === Role.ADMIN) {
    assignedToId = validated.assignedToId || null;
  }

  const firstContactDate = validated.firstContactDate
    ? new Date(validated.firstContactDate)
    : null;

  // Track important changes for activity log
  const changes: string[] = [];
  if (existing.companyName !== validated.companyName) {
    changes.push(`Company name updated from "${existing.companyName}" to "${validated.companyName}"`);
  }
  if (existing.contactPerson !== validated.contactPerson) {
    changes.push(`Contact person updated to "${validated.contactPerson}"`);
  }
  if (existing.assignedToId !== assignedToId) {
    changes.push(`Employee assignment changed`);
  }

  await prisma.customer.update({
    where: { id },
    data: {
      companyName: validated.companyName,
      contactPerson: validated.contactPerson,
      phone: validated.phone || null,
      email: validated.email || null,
      website: validated.website || null,
      industry: validated.industry || null,
      location: validated.location || null,
      firstContactDate,
      notes: validated.notes || null,
      assignedToId,
      activities: changes.length > 0
        ? {
            create: {
              userId: user.id,
              activityType: ActivityType.NOTE,
              title: "Customer Details Updated",
              description: changes.join(". ") + ".",
            },
          }
        : undefined,
    },
  });

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function archiveCustomer(id: string) {
  const user = await requireAuth();

  const existing = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  if (!canManageCustomer(user, existing)) {
    throw new Error("FORBIDDEN_CUSTOMER_MODIFICATION");
  }

  await prisma.customer.update({
    where: { id },
    data: {
      archivedAt: new Date(),
      activities: {
        create: {
          userId: user.id,
          activityType: ActivityType.NOTE,
          title: "Customer Soft-Archived",
          description: `Customer was moved to archive by ${user.name || user.email}. Record preserved.`,
        },
      },
    },
  });

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function restoreCustomer(id: string) {
  const user = await requireAuth();

  const existing = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  if (!canManageCustomer(user, existing)) {
    throw new Error("FORBIDDEN_CUSTOMER_MODIFICATION");
  }

  await prisma.customer.update({
    where: { id },
    data: {
      archivedAt: null,
      activities: {
        create: {
          userId: user.id,
          activityType: ActivityType.NOTE,
          title: "Customer Restored from Archive",
          description: `Customer record restored to active status by ${user.name || user.email}.`,
        },
      },
    },
  });

  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function getAssignableUsers() {
  await requireAuth();

  // Any authenticated user can view users for display, but filtering active ones
  return prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });
}
