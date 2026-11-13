import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  isActive: boolean;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    // Direct database validation to immediately reject deactivated accounts
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      isActive: dbUser.isActive,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN_ADMIN_REQUIRED");
  }
  return user;
}

export function canManageCustomer(
  user: AuthenticatedUser,
  customer: { assignedToId?: string | null; createdById?: string | null }
): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  return customer.assignedToId === user.id || customer.createdById === user.id;
}

export function canManageLead(
  user: AuthenticatedUser,
  lead: { assignedToId?: string | null; createdById?: string | null }
): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  return lead.assignedToId === user.id || lead.createdById === user.id;
}

export function canManageSale(
  user: AuthenticatedUser,
  sale: { assignedToId?: string | null; createdById?: string | null }
): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  return sale.assignedToId === user.id || sale.createdById === user.id;
}

export function canManageOrder(
  user: AuthenticatedUser,
  order: { responsibleEmployeeId?: string | null; createdById?: string | null }
): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  return order.responsibleEmployeeId === user.id || order.createdById === user.id;
}

export function canManageProject(
  user: AuthenticatedUser,
  project: { assignedToId?: string | null; createdById?: string | null }
): boolean {
  if (user.role === Role.ADMIN) {
    return true;
  }
  return project.assignedToId === user.id || project.createdById === user.id;
}
