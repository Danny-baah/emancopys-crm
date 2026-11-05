import { z } from "zod";
import { LeadStatus, ActivityType } from "@/lib/generated/prisma/enums";

export const leadSchema = z.object({
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name cannot exceed 200 characters")
    .trim(),
  contactPerson: z
    .string()
    .min(1, "Contact person is required")
    .max(150, "Contact person cannot exceed 150 characters")
    .trim(),
  phone: z
    .string()
    .max(50, "Phone number cannot exceed 50 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Invalid email address")
    .max(150, "Email cannot exceed 150 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  jobTitle: z
    .string()
    .max(100, "Job title cannot exceed 100 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  industry: z
    .string()
    .max(100, "Industry cannot exceed 100 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(200, "Location cannot exceed 200 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  status: z.nativeEnum(LeadStatus),
  source: z
    .string()
    .max(100, "Source cannot exceed 100 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  estimatedValue: z
    .number()
    .min(0, "Value cannot be negative")
    .optional(),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  assignedToId: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

export const leadActivitySchema = z.object({
  activityType: z.nativeEnum(ActivityType),
  title: z
    .string()
    .min(1, "Summary is required")
    .max(200, "Summary cannot exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(3000, "Description cannot exceed 3000 characters")
    .optional()
    .or(z.literal("")),
});

export type LeadActivityFormValues = z.infer<typeof leadActivitySchema>;
