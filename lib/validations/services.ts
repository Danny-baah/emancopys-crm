import { z } from "zod";
import { ServiceStatus } from "@/lib/generated/prisma/enums";

export const additionalServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters"),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative"),
  isRecurring: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export type AdditionalServiceFormValues = z.infer<typeof additionalServiceSchema>;

export const customerServiceAssignmentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  serviceId: z.string().min(1, "Service is required"),
  status: z.nativeEnum(ServiceStatus),
  agreedPrice: z.number().min(0, "Agreed price must be non-negative"),
  isRecurring: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  responsibleEmployeeId: z.string().optional().nullable(),
});

export type CustomerServiceAssignmentFormValues = z.infer<
  typeof customerServiceAssignmentSchema
>;

export const customerServiceStatusUpdateSchema = z.object({
  status: z.nativeEnum(ServiceStatus),
  notes: z.string().optional().nullable(),
});

export type CustomerServiceStatusUpdateFormValues = z.infer<
  typeof customerServiceStatusUpdateSchema
>;
