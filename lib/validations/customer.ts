import { z } from "zod";
import { ActivityType } from "@/lib/generated/prisma/enums";

export const customerSchema = z.object({
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
  website: z
    .string()
    .max(255, "Website URL cannot exceed 255 characters")
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
  firstContactDate: z
    .string()
    .optional()
    .or(z.literal("")),
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

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const activitySchema = z.object({
  activityType: z.nativeEnum(ActivityType, {
    message: "Please select a valid activity type",
  }),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description cannot exceed 5000 characters")
    .trim(),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
