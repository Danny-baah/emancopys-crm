"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import { LeadStatus } from "@/lib/generated/prisma/enums";

export interface MappedLeadRow {
  companyName: string;
  contactPerson: string;
  phone?: string;
  email?: string;
  jobTitle?: string;
  industry?: string;
  location?: string;
  status?: string;
  estimatedValue?: number;
  notes?: string;
}

export interface PreviewRowResult {
  rowNumber: number;
  data: MappedLeadRow;
  isValid: boolean;
  errors: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  duplicateExistingId?: string;
}

export interface ImportPreviewResponse {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  rows: PreviewRowResult[];
}

export async function validateAndPreviewImport(
  rows: MappedLeadRow[],
  userContext?: AuthenticatedUser
): Promise<ImportPreviewResponse> {
  if (!userContext) {
    await requireAuth();
  }

  // Retrieve existing emails, phones, and company names for duplicate matching
  const [existingLeads, existingCustomers] = await Promise.all([
    prisma.lead.findMany({
      select: { id: true, companyName: true, contactPerson: true, email: true, phone: true },
    }),
    prisma.customer.findMany({
      select: { id: true, companyName: true, contactPerson: true, email: true, phone: true },
    }),
  ]);

  const existingEmails = new Map<string, string>();
  const existingPhones = new Map<string, string>();
  const existingCompanyContacts = new Map<string, string>();

  // Populate maps from existing leads
  for (const l of existingLeads) {
    if (l.email) existingEmails.set(l.email.toLowerCase().trim(), `Existing Lead: ${l.companyName}`);
    if (l.phone) existingPhones.set(l.phone.replace(/\D/g, ""), `Existing Lead: ${l.companyName}`);
    const key = `${l.companyName.toLowerCase().trim()}::${l.contactPerson.toLowerCase().trim()}`;
    existingCompanyContacts.set(key, `Existing Lead: ${l.companyName}`);
  }

  // Populate maps from existing customers to prevent cross-module duplicates
  for (const c of existingCustomers) {
    if (c.email) existingEmails.set(c.email.toLowerCase().trim(), `Existing Customer: ${c.companyName}`);
    if (c.phone) existingPhones.set(c.phone.replace(/\D/g, ""), `Existing Customer: ${c.companyName}`);
    const key = `${c.companyName.toLowerCase().trim()}::${c.contactPerson.toLowerCase().trim()}`;
    existingCompanyContacts.set(key, `Existing Customer: ${c.companyName}`);
  }

  // Track in-file duplicates
  const seenInFileEmails = new Set<string>();
  const seenInFileCompanyContacts = new Set<string>();

  const results: PreviewRowResult[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const errors: string[] = [];

    const companyName = (raw.companyName || "").trim();
    const contactPerson = (raw.contactPerson || "").trim();
    const email = (raw.email || "").trim().toLowerCase();
    const phone = (raw.phone || "").trim();

    if (!companyName) {
      errors.push("Company Name is required.");
    }
    if (!contactPerson) {
      errors.push("Contact Person is required.");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format.");
    }

    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;

    // Check duplicate email
    if (email) {
      if (existingEmails.has(email)) {
        isDuplicate = true;
        duplicateReason = `Matches ${existingEmails.get(email)} (Email: ${email})`;
      } else if (seenInFileEmails.has(email)) {
        isDuplicate = true;
        duplicateReason = `Duplicate email within imported file (${email})`;
      } else {
        seenInFileEmails.add(email);
      }
    }

    // Check duplicate company + contact
    if (!isDuplicate && companyName && contactPerson) {
      const compKey = `${companyName.toLowerCase()}::${contactPerson.toLowerCase()}`;
      if (existingCompanyContacts.has(compKey)) {
        isDuplicate = true;
        duplicateReason = `Matches ${existingCompanyContacts.get(compKey)}`;
      } else if (seenInFileCompanyContacts.has(compKey)) {
        isDuplicate = true;
        duplicateReason = "Duplicate company & contact within imported file";
      } else {
        seenInFileCompanyContacts.add(compKey);
      }
    }

    // Check duplicate phone
    if (!isDuplicate && phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length >= 7 && existingPhones.has(cleanPhone)) {
        isDuplicate = true;
        duplicateReason = `Matches ${existingPhones.get(cleanPhone)} (Phone: ${phone})`;
      }
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      invalidCount++;
    } else if (isDuplicate) {
      duplicateCount++;
    } else {
      validCount++;
    }

    results.push({
      rowNumber: i + 1,
      data: {
        companyName,
        contactPerson,
        email: email || undefined,
        phone: phone || undefined,
        jobTitle: raw.jobTitle?.trim() || undefined,
        industry: raw.industry?.trim() || undefined,
        location: raw.location?.trim() || undefined,
        status: raw.status?.trim() || undefined,
        estimatedValue: raw.estimatedValue ? Number(raw.estimatedValue) : undefined,
        notes: raw.notes?.trim() || undefined,
      },
      isValid,
      errors,
      isDuplicate,
      duplicateReason,
    });
  }

  return {
    totalRows: rows.length,
    validCount,
    invalidCount,
    duplicateCount,
    rows: results,
  };
}

export interface ExecuteImportParams {
  fileName: string;
  fileType: string;
  targetModule?: string;
  rows: MappedLeadRow[];
  skipDuplicates: boolean;
  defaultAssignedToId?: string;
}

export async function executeImport(
  {
    fileName,
    fileType,
    targetModule = "LEADS",
    rows,
    skipDuplicates,
    defaultAssignedToId,
  }: ExecuteImportParams,
  userContext?: AuthenticatedUser
) {
  const user = userContext || (await requireAuth());

  // Validate and detect duplicates before final write
  const preview = await validateAndPreviewImport(rows, user);

  const eligibleRows = preview.rows.filter((r) => {
    if (!r.isValid) return false;
    if (r.isDuplicate && skipDuplicates) return false;
    return true;
  });

  const totalRows = rows.length;
  const skippedCount = preview.rows.filter((r) => r.isDuplicate && skipDuplicates).length;
  const failedCount = preview.rows.filter((r) => !r.isValid).length;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Import Batch Record
    const batch = await tx.importBatch.create({
      data: {
        fileName,
        fileType,
        source: `Spreadsheet Import (${fileType.toUpperCase()})`,
        targetModule,
        totalRows,
        successfulRows: 0,
        skippedRows: skippedCount,
        failedRows: failedCount,
        userId: user.id,
      },
    });

    let successCount = 0;

    // 2. Insert valid rows
    for (const r of eligibleRows) {
      const data = r.data;

      // Status mapping helper
      let statusEnum: LeadStatus = LeadStatus.NEW;
      if (data.status) {
        const s = data.status.toUpperCase().replace(/\s+/g, "_");
        if (s in LeadStatus) {
          statusEnum = s as LeadStatus;
        }
      }

      await tx.lead.create({
        data: {
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          email: data.email || null,
          phone: data.phone || null,
          jobTitle: data.jobTitle || null,
          industry: data.industry || null,
          location: data.location || null,
          status: statusEnum,
          source: `Import: ${fileName}`,
          estimatedValue: data.estimatedValue ?? null,
          notes: data.notes || null,
          assignedToId: defaultAssignedToId || (user.role === "ADMIN" ? null : user.id),
          createdById: user.id,
          importBatchId: batch.id,
          activities: {
            create: {
              userId: user.id,
              activityType: "OTHER",
              title: "Imported Record",
              description: `Imported from file ${fileName} into CRM leads.`,
            },
          },
        },
      });

      successCount++;
    }

    // 3. Update final batch counters
    await tx.importBatch.update({
      where: { id: batch.id },
      data: {
        successfulRows: successCount,
      },
    });

    return {
      batchId: batch.id,
      totalRows,
      successfulRows: successCount,
      skippedRows: skippedCount,
      failedRows: failedCount,
    };
  });

  try {
    revalidatePath("/leads");
    revalidatePath("/leads/import/history");
    revalidatePath("/dashboard");
  } catch {
    // Gracefully handle execution outside Next.js request context (CLI/tests)
  }

  return result;
}

export async function getImportBatches(userContext?: AuthenticatedUser) {
  if (!userContext) {
    await requireAuth();
  }

  return prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          leads: true,
        },
      },
    },
  });
}
