import { z } from "zod";
import { OrderStatus } from "@/lib/generated/prisma/enums";

export const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  quotationId: z.string().optional().nullable(),
  saleId: z.string().optional().nullable(),
  serviceSold: z.string().min(2, "Service description is required."),
  totalAmount: z.number().min(0.01, "Order total amount must be greater than zero."),
  agreedCommission: z.number().min(0, "Agreed sales commission cannot be negative."),
  orderDate: z.string().optional().nullable(),
  responsibleEmployeeId: z.string().optional().nullable(),
  status: z.nativeEnum(OrderStatus),
  notes: z.string().optional().nullable(),
  autoCreateProject: z.boolean().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;
