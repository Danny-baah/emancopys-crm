import { z } from "zod";
import { PaymentType, PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/enums";

export const paymentRecordSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  amount: z.number().positive("Payment amount must be greater than zero"),
  paymentType: z.nativeEnum(PaymentType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: z.string().min(1, "Payment date is required"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PaymentRecordFormValues = z.infer<typeof paymentRecordSchema>;

export const paymentUpdateSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PaymentUpdateFormValues = z.infer<typeof paymentUpdateSchema>;

export const orderInvoiceDatesSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  invoiceDate: z.string().optional().nullable(),
  paymentDueDate: z.string().optional().nullable(),
  depositAmount: z.number().min(0, "Deposit cannot be negative").optional().nullable(),
});

export type OrderInvoiceDatesFormValues = z.infer<typeof orderInvoiceDatesSchema>;

/**
 * Currency round to two decimal places
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate payment breakdown for an order
 */
export function computeOrderPaymentMetrics(order: {
  totalAmount: number;
  paymentDueDate?: Date | null;
  payments?: { amount: number }[];
}) {
  const totalAmount = roundCurrency(order.totalAmount || 0);
  const totalPaid = roundCurrency(
    (order.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
  );
  const outstandingBalance = roundCurrency(Math.max(0, totalAmount - totalPaid));
  const remainingPayment = outstandingBalance;

  let calculatedStatus: PaymentStatus = PaymentStatus.UNPAID;
  if (totalPaid >= totalAmount && totalAmount > 0) {
    calculatedStatus = PaymentStatus.FULLY_PAID;
  } else if (totalPaid > 0) {
    // Check if overdue
    if (order.paymentDueDate && new Date(order.paymentDueDate) < new Date()) {
      calculatedStatus = PaymentStatus.OVERDUE;
    } else {
      calculatedStatus = PaymentStatus.PARTIALLY_PAID;
    }
  } else {
    // Unpaid, check overdue
    if (order.paymentDueDate && new Date(order.paymentDueDate) < new Date()) {
      calculatedStatus = PaymentStatus.OVERDUE;
    } else {
      calculatedStatus = PaymentStatus.UNPAID;
    }
  }

  return {
    totalAmount,
    totalPaid,
    outstandingBalance,
    remainingPayment,
    status: calculatedStatus,
  };
}
