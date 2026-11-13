"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, type AuthenticatedUser } from "@/lib/auth-utils";
import {
  additionalServiceSchema,
  customerServiceAssignmentSchema,
  customerServiceStatusUpdateSchema,
  type AdditionalServiceFormValues,
  type CustomerServiceAssignmentFormValues,
  type CustomerServiceStatusUpdateFormValues,
} from "@/lib/validations/services";
import { logAudit } from "@/lib/audit";
import { ServiceStatus, AuditAction, Role } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export async function getCatalogueServices() {
  await requireAuth();

  return prisma.additionalService.findMany({
    orderBy: { price: "asc" },
    include: {
      _count: {
        select: {
          customerServices: true,
        },
      },
    },
  });
}

export async function createCustomService(
  data: AdditionalServiceFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAdmin());
  const validated = additionalServiceSchema.parse(data);

  const existing = await prisma.additionalService.findUnique({
    where: { name: validated.name },
  });

  if (existing) {
    throw new Error(`A service with the name "${validated.name}" already exists.`);
  }

  const service = await prisma.additionalService.create({
    data: {
      name: validated.name,
      description: validated.description?.trim() || null,
      price: validated.price,
      isRecurring: validated.isRecurring,
      isActive: validated.isActive,
    },
  });

  await logAudit({
    userId: user.id,
    action: AuditAction.CREATE,
    entityType: "SERVICE",
    entityId: service.id,
    entityName: service.name,
    details: `Added new service "${service.name}" at €${service.price.toFixed(2)}${service.isRecurring ? "/month" : " (one-time)"}.`,
  });

  safeRevalidate("/services");
  safeRevalidate("/dashboard");

  return { success: true, serviceId: service.id };
}

export async function updateService(
  id: string,
  data: AdditionalServiceFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAdmin());
  const validated = additionalServiceSchema.parse(data);

  const existing = await prisma.additionalService.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Service not found.");
  }

  if (validated.name !== existing.name) {
    const nameInUse = await prisma.additionalService.findUnique({
      where: { name: validated.name },
    });
    if (nameInUse && nameInUse.id !== id) {
      throw new Error(`A service with the name "${validated.name}" already exists.`);
    }
  }

  const updated = await prisma.additionalService.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description?.trim() || null,
      price: validated.price,
      isRecurring: validated.isRecurring,
      isActive: validated.isActive,
    },
  });

  await logAudit({
    userId: user.id,
    action: AuditAction.UPDATE,
    entityType: "SERVICE",
    entityId: id,
    entityName: updated.name,
    details: `Updated service catalogue item "${updated.name}". Historical customer agreements are preserved.`,
  });

  safeRevalidate("/services");

  return { success: true, service: updated };
}

export async function getCustomerServices(customerId: string) {
  await requireAuth();

  return prisma.customerService.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: {
      service: true,
      responsibleEmployee: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function assignCustomerService(
  data: CustomerServiceAssignmentFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const validated = customerServiceAssignmentSchema.parse(data);

  const [customer, service] = await Promise.all([
    prisma.customer.findUnique({ where: { id: validated.customerId } }),
    prisma.additionalService.findUnique({ where: { id: validated.serviceId } }),
  ]);

  if (!customer) throw new Error("Customer not found.");
  if (!service) throw new Error("Service not found.");

  // Check if employee is permitted
  if (
    user.role !== Role.ADMIN &&
    customer.assignedToId !== user.id &&
    customer.createdById !== user.id
  ) {
    throw new Error("Unauthorized to manage services for this customer.");
  }

  const responsibleEmployeeId =
    validated.responsibleEmployeeId || customer.assignedToId || user.id;

  const now = new Date();
  const soldDate = validated.status === ServiceStatus.SOLD ? now : null;
  const declinedDate = validated.status === ServiceStatus.DECLINED ? now : null;

  const customerService = await prisma.customerService.create({
    data: {
      customerId: customer.id,
      serviceId: service.id,
      status: validated.status,
      agreedPrice: validated.agreedPrice,
      isRecurring: validated.isRecurring,
      offeredDate: now,
      soldDate,
      declinedDate,
      responsibleEmployeeId,
      notes: validated.notes?.trim() || null,
    },
    include: {
      service: true,
      customer: true,
    },
  });

  let auditAction: AuditAction = AuditAction.OFFERED;
  if (validated.status === ServiceStatus.SOLD) auditAction = AuditAction.SOLD;
  if (validated.status === ServiceStatus.DECLINED) auditAction = AuditAction.DECLINED;

  await logAudit({
    userId: user.id,
    action: auditAction,
    entityType: "CUSTOMER_SERVICE",
    entityId: customerService.id,
    entityName: `${customer.companyName} - ${service.name}`,
    details: `${validated.status.toLowerCase()} "${service.name}" for ${customer.companyName} at snapshot price €${validated.agreedPrice.toFixed(2)}${validated.isRecurring ? "/mo" : ""}.`,
  });

  safeRevalidate(`/customers/${customer.id}`);
  safeRevalidate("/services");
  safeRevalidate("/dashboard");

  return { success: true, customerServiceId: customerService.id };
}

export async function updateCustomerServiceStatus(
  id: string,
  data: CustomerServiceStatusUpdateFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const validated = customerServiceStatusUpdateSchema.parse(data);

  const existing = await prisma.customerService.findUnique({
    where: { id },
    include: {
      customer: true,
      service: true,
    },
  });

  if (!existing) throw new Error("Customer service record not found.");

  if (
    user.role !== Role.ADMIN &&
    existing.customer.assignedToId !== user.id &&
    existing.customer.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update service status for this customer.");
  }

  const now = new Date();
  const soldDate =
    validated.status === ServiceStatus.SOLD
      ? existing.soldDate || now
      : existing.soldDate;
  const declinedDate =
    validated.status === ServiceStatus.DECLINED
      ? existing.declinedDate || now
      : existing.declinedDate;

  const updated = await prisma.customerService.update({
    where: { id },
    data: {
      status: validated.status,
      soldDate,
      declinedDate,
      notes: validated.notes !== undefined ? validated.notes?.trim() || null : undefined,
    },
  });

  let auditAction: AuditAction = AuditAction.STATUS_CHANGE;
  if (validated.status === ServiceStatus.SOLD) auditAction = AuditAction.SOLD;
  if (validated.status === ServiceStatus.DECLINED) auditAction = AuditAction.DECLINED;

  await logAudit({
    userId: user.id,
    action: auditAction,
    entityType: "CUSTOMER_SERVICE",
    entityId: id,
    entityName: `${existing.customer.companyName} - ${existing.service.name}`,
    details: `Updated status of "${existing.service.name}" for ${existing.customer.companyName} to ${validated.status}.`,
  });

  safeRevalidate(`/customers/${existing.customerId}`);
  safeRevalidate("/services");
  safeRevalidate("/dashboard");

  return { success: true, customerService: updated };
}

export async function getRecurringMonthlyRevenue() {
  await requireAuth();

  // Sum of agreedPrice of all SOLD recurring customer services
  const soldRecurring = await prisma.customerService.findMany({
    where: {
      status: ServiceStatus.SOLD,
      isRecurring: true,
    },
    select: {
      agreedPrice: true,
    },
  });

  const mrr = Math.round(
    soldRecurring.reduce((sum, item) => sum + (item.agreedPrice || 0), 0) * 100
  ) / 100;

  return {
    mrr,
    activeAgreementsCount: soldRecurring.length,
  };
}
