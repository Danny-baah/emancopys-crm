import { z } from "zod";
import { Role } from "@/lib/generated/prisma/enums";

export const employeeCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long"),
  role: z.nativeEnum(Role),
  isActive: z.boolean().default(true),
});

export type EmployeeCreateFormValues = z.infer<typeof employeeCreateSchema>;

export const employeeUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").toLowerCase().trim(),
  role: z.nativeEnum(Role),
  isActive: z.boolean(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long")
    .optional()
    .or(z.literal("")),
});

export type EmployeeUpdateFormValues = z.infer<typeof employeeUpdateSchema>;
