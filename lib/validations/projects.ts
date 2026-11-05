import { z } from "zod";
import { ProjectStatus } from "@/lib/generated/prisma/enums";

export const projectUpdateSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
  targetHandoverDate: z.string().optional().nullable(),
  handoverDate: z.string().optional().nullable(),
  websiteUrl: z.string().url("Please provide a valid URL.").optional().or(z.literal("")).nullable(),
  stagingUrl: z.string().url("Please provide a valid URL.").optional().or(z.literal("")).nullable(),
  materialsNotes: z.string().optional().nullable(),
  revisionsNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  statusChangeNote: z.string().optional().nullable(),
});

export type ProjectUpdateFormValues = z.infer<typeof projectUpdateSchema>;
