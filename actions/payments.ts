"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, type AuthenticatedUser } from "@/lib/auth-utils";
import {
  paymentRecordSchema,
  paymentUpdateSchema,
  orderInvoiceDatesSchema,
  roundCurrency,
  computeOrderPaymentMetrics,
  type PaymentRecordFormValues,
  type PaymentUpdateFormValues,
  type OrderInvoiceDatesFormValues,
} from "@/lib/validations/payments";
import { logAudit } from "@/lib/audit";
import { Prisma } from "@/lib/generated/prisma/client";
import { PaymentStatus, AuditAction, Role } from "@/lib/generated/prisma/enums";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside active request
  }
}

export interface GetPaymentsParams {
  search?: string;
  status?: string;
  orderId?: string;
  page?: number;
  limit?: number;
}

export async function getPayments(
  {
    search = "",
    status = "",
    orderId = "",
    page = 1,
    limit = 10,
  }: GetPaymentsParams = {},
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.PaymentWhereInput = {};

  const orderWhere: Prisma.OrderWhereInput = {};

  // Role visibility: employees see payments on orders they are responsible for or created
  if (user.role !== Role.ADMIN) {
    orderWhere.OR = [
      { responsibleEmployeeId: user.id },
      { createdById: user.id },
      { customer: { assignedToId: user.id } },
    ];
  }

  if (orderId) {
    whereClause.orderId = orderId;
  }

  if (
    status &&
    status !== "ALL" &&
    Object.values(PaymentStatus).includes(status as PaymentStatus)
  ) {
    orderWhere.paymentStatus = status as PaymentStatus;
  }

  if (Object.keys(orderWhere).length > 0) {
    whereClause.order = orderWhere;
  }

  if (search.trim()) {
    const term = search.trim();
    const searchConditions: Prisma.PaymentWhereInput[] = [
      { paymentNumber: { contains: term, mode: "insensitive" } },
      { reference: { contains: term, mode: "insensitive" } },
      { customer: { companyName: { contains: term, mode: "insensitive" } } },
      { order: { orderNumber: { contains: term, mode: "insensitive" } } },
    ];

    if (whereClause.OR) {
      whereClause.AND = [{ OR: whereClause.OR }, { OR: searchConditions }];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchConditions;
    }
  }

  const [totalCount, payments] = await Promise.all([
    prisma.payment.count({ where: whereClause }),
    prisma.payment.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { paymentDate: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentStatus: true,
            paymentDueDate: true,
            invoiceDate: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    payments,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

export async function getOrderPaymentDetails(orderId: string, userContext?: AuthenticatedUser) {
  const user = userContext || (await requireAuth());

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      payments: {
        orderBy: { paymentDate: "asc" },
        include: {
          receivedBy: {
            select: { id: true, name: true, email: true },
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
    throw new Error("Unauthorized to access payment records for this order.");
  }

  const metrics = computeOrderPaymentMetrics({
    totalAmount: order.totalAmount,
    paymentDueDate: order.paymentDueDate,
    payments: order.payments,
  });

  return {
    order,
    metrics,
  };
}

export async function recordPayment(
  data: PaymentRecordFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const validated = paymentRecordSchema.parse(data);

  const order = await prisma.order.findUnique({
    where: { id: validated.orderId },
    include: {
      payments: true,
      customer: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  // Permission check
  if (
    user.role !== Role.ADMIN &&
    order.responsibleEmployeeId !== user.id &&
    order.createdById !== user.id &&
    order.customer.assignedToId !== user.id
  ) {
    throw new Error("Unauthorized to record payments for this order.");
  }

  const currentTotalPaid = roundCurrency(
    order.payments.reduce((sum, p) => sum + p.amount, 0)
  );
  const remainingBalance = roundCurrency(
    Math.max(0, order.totalAmount - currentTotalPaid)
  );

  // Financial safety check: prevent payments exceeding order balance
  const paymentAmount = roundCurrency(validated.amount);
  if (paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  // Allow a tiny 0.01 tolerance for rounding differences
  if (paymentAmount > remainingBalance + 0.01) {
    throw new Error(
      `Payment amount (€${paymentAmount.toFixed(2)}) exceeds outstanding balance (€${remainingBalance.toFixed(2)}).`
    );
  }

  // Generate unique payment reference PAY-YYYYMM-XXXX
  const datePrefix = new Date().toISOString().slice(0, 7).replace("-", "");
  const paymentCount = await prisma.payment.count();
  const sequence = String(paymentCount + 1).padStart(4, "0");
  const paymentNumber = `PAY-${datePrefix}-${sequence}`;

  const paymentDate = new Date(validated.paymentDate);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Payment record
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        orderId: order.id,
        customerId: order.customerId,
        amount: paymentAmount,
        paymentType: validated.paymentType,
        paymentMethod: validated.paymentMethod,
        paymentDate,
        reference: validated.reference?.trim() || null,
        notes: validated.notes?.trim() || null,
        receivedById: user.id,
      },
    });

    // 2. Compute updated status
    const newTotalPaid = roundCurrency(currentTotalPaid + paymentAmount);
    let newStatus: PaymentStatus = PaymentStatus.PARTIALLY_PAID;

    if (newTotalPaid >= roundCurrency(order.totalAmount)) {
      newStatus = PaymentStatus.FULLY_PAID;
    } else if (order.paymentDueDate && new Date(order.paymentDueDate) < new Date()) {
      newStatus = PaymentStatus.OVERDUE;
    }

    // 3. Update Order payment status and deposit amount if initial deposit
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: newStatus,
        depositAmount:
          validated.paymentType === "DEPOSIT" && (!order.depositAmount || order.depositAmount === 0)
            ? paymentAmount
            : undefined,
      },
    });

    return { payment, newStatus, newTotalPaid };
  });

  // 4. Audit Log
  await logAudit({
    userId: user.id,
    action: AuditAction.PAYMENT_RECORDED,
    entityType: "PAYMENT",
    entityId: result.payment.id,
    entityName: result.payment.paymentNumber,
    details: `Recorded €${paymentAmount.toFixed(2)} (${validated.paymentType}) on Order ${order.orderNumber}. New payment status: ${result.newStatus}.`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: paymentAmount,
      type: validated.paymentType,
      method: validated.paymentMethod,
      newTotalPaid: result.newTotalPaid,
    },
  });

  safeRevalidate(`/orders/${order.id}`);
  safeRevalidate("/orders");
  safeRevalidate("/payments");
  safeRevalidate("/dashboard");

  return {
    success: true,
    paymentId: result.payment.id,
    paymentNumber: result.payment.paymentNumber,
    newStatus: result.newStatus,
    outstandingBalance: roundCurrency(
      Math.max(0, order.totalAmount - result.newTotalPaid)
    ),
  };
}

export async function updatePayment(
  id: string,
  data: PaymentUpdateFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAdmin());
  const validated = paymentUpdateSchema.parse(data);

  const existing = await prisma.payment.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!existing) {
    throw new Error("Payment not found.");
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      paymentMethod: validated.paymentMethod,
      reference: validated.reference !== undefined ? validated.reference?.trim() || null : undefined,
      notes: validated.notes !== undefined ? validated.notes?.trim() || null : undefined,
    },
  });

  await logAudit({
    userId: user.id,
    action: AuditAction.UPDATE,
    entityType: "PAYMENT",
    entityId: id,
    entityName: existing.paymentNumber,
    details: `Updated metadata for payment ${existing.paymentNumber} on order ${existing.order.orderNumber}.`,
  });

  safeRevalidate(`/orders/${existing.orderId}`);
  safeRevalidate("/payments");

  return { success: true, payment: updated };
}

export async function updateOrderPaymentDates(
  data: OrderInvoiceDatesFormValues,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());
  const validated = orderInvoiceDatesSchema.parse(data);

  const order = await prisma.order.findUnique({
    where: { id: validated.orderId },
    include: { payments: true, customer: true },
  });

  if (!order) throw new Error("Order not found.");

  if (
    user.role !== Role.ADMIN &&
    order.responsibleEmployeeId !== user.id &&
    order.createdById !== user.id
  ) {
    throw new Error("Unauthorized to update order payment details.");
  }

  const invoiceDate = validated.invoiceDate ? new Date(validated.invoiceDate) : null;
  const paymentDueDate = validated.paymentDueDate ? new Date(validated.paymentDueDate) : null;

  // Recompute status in case due date changed
  const metrics = computeOrderPaymentMetrics({
    totalAmount: order.totalAmount,
    paymentDueDate,
    payments: order.payments,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      invoiceDate,
      paymentDueDate,
      depositAmount:
        validated.depositAmount !== undefined && validated.depositAmount !== null
          ? roundCurrency(validated.depositAmount)
          : undefined,
      paymentStatus: metrics.status,
    },
  });

  await logAudit({
    userId: user.id,
    action: AuditAction.UPDATE,
    entityType: "ORDER",
    entityId: order.id,
    entityName: order.orderNumber,
    details: `Updated invoice and payment due dates for Order ${order.orderNumber}.`,
  });

  safeRevalidate(`/orders/${order.id}`);
  safeRevalidate("/orders");
  safeRevalidate("/payments");
  safeRevalidate("/dashboard");

  return { success: true };
}

export async function getPaymentOverviewStats() {
  await requireAuth();

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      totalAmount: true,
      paymentStatus: true,
      paymentDueDate: true,
      payments: {
        select: {
          amount: true,
        },
      },
    },
  });

  let totalBookedOrderValue = 0;
  let totalCashReceived = 0;
  let totalOutstanding = 0;
  let fullyPaidOrdersCount = 0;
  let partiallyPaidOrdersCount = 0;
  let unpaidOrdersCount = 0;
  let overdueOrdersCount = 0;

  for (const o of orders) {
    const totalAmount = roundCurrency(o.totalAmount || 0);
    const paid = roundCurrency(o.payments.reduce((sum, p) => sum + p.amount, 0));
    const outstanding = roundCurrency(Math.max(0, totalAmount - paid));

    totalBookedOrderValue += totalAmount;
    totalCashReceived += paid;
    totalOutstanding += outstanding;

    if (paid >= totalAmount && totalAmount > 0) {
      fullyPaidOrdersCount++;
    } else if (paid > 0) {
      if (o.paymentDueDate && new Date(o.paymentDueDate) < new Date()) {
        overdueOrdersCount++;
      } else {
        partiallyPaidOrdersCount++;
      }
    } else {
      if (o.paymentDueDate && new Date(o.paymentDueDate) < new Date()) {
        overdueOrdersCount++;
      } else {
        unpaidOrdersCount++;
      }
    }
  }

  return {
    totalBookedOrderValue: roundCurrency(totalBookedOrderValue),
    totalCashReceived: roundCurrency(totalCashReceived),
    totalOutstanding: roundCurrency(totalOutstanding),
    fullyPaidOrdersCount,
    partiallyPaidOrdersCount,
    unpaidOrdersCount,
    overdueOrdersCount,
    totalOrdersCount: orders.length,
  };
}
