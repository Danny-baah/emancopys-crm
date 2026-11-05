import { z } from "zod";
import { QuotationStatus } from "@/lib/generated/prisma/enums";

export const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  saleId: z.string().optional().nullable(),
  serviceSold: z.string().min(2, "Service description is required."),
  quotationPrice: z.number().min(0.01, "Price must be greater than zero."),
  quotationDate: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  responsibleEmployeeId: z.string().optional().nullable(),
  status: z.nativeEnum(QuotationStatus),
  notes: z.string().optional().nullable(),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;
