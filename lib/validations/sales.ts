import { z } from "zod";
import { SalesStatus, ActivityType } from "@/lib/generated/prisma/enums";

export const saleSchema = z.object({
  title: z.string().min(2, "Deal title must be at least 2 characters."),
  customerId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.nativeEnum(SalesStatus),
  estimatedValue: z.number().min(0, "Estimated value cannot be negative.").optional().nullable(),
  serviceType: z.string().optional().nullable(),
  interests: z.string().optional().nullable(),
  objections: z.string().optional().nullable(),
  nextContactDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type SaleFormValues = z.infer<typeof saleSchema>;

export const saleCommunicationSchema = z.object({
  activityType: z.nativeEnum(ActivityType),
  subject: z.string().min(2, "Subject is required."),
  notes: z.string().min(2, "Conversation notes are required."),
  customerInterests: z.string().optional().nullable(),
  customerObjections: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
});

export type SaleCommunicationFormValues = z.infer<typeof saleCommunicationSchema>;

export const saleTaskSchema = z.object({
  title: z.string().min(2, "Task title is required."),
  description: z.string().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required."),
  reminderDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export type SaleTaskFormValues = z.infer<typeof saleTaskSchema>;

export const saleStatusUpdateSchema = z.object({
  status: z.nativeEnum(SalesStatus),
  notes: z.string().optional().nullable(),
  lostReason: z.string().optional().nullable(),
});

export type SaleStatusUpdateValues = z.infer<typeof saleStatusUpdateSchema>;
