import { auth } from "@/lib/auth";
import { Role } from "@/lib/generated/prisma/enums";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user.role as Role) || Role.EMPLOYEE,
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
  // Employees can access and manage customers assigned to them or created by them
  return customer.assignedToId === user.id || customer.createdById === user.id;
}
