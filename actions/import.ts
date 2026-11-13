"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, type AuthenticatedUser } from "@/lib/auth-utils";
import { SalesStatus } from "@/lib/generated/prisma/enums";

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

// --- Duplicate Normalization Helpers ---

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeCompanyName(name: string): string {
  return normalizeText(name)
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalCompanyName(name: string): string {
  return normalizeCompanyName(name)
    .replace(/\b(ltd|limited|corp|corporation|inc|incorporated|llc|gmbh|co|company|plc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeContactName(name: string): string {
  return normalizeText(name)
    .replace(/\b(mr|mrs|ms|miss|dr|prof|ing|rev)\.?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(s1: string, s2: string): number {
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[s1.length][s2.length];
}

function areContactsEquivalent(a: string, b: string): boolean {
  const na = normalizeContactName(a);
  const nb = normalizeContactName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Phonetic variant in West African / Akan transcription: 'v' and 'w' (e.g. Servaa / Serwaa)
  if (na.replace(/v/g, "w") === nb.replace(/v/g, "w")) return true;
  // Levenshtein edit distance <= 2 for minor typos
  if (levenshteinDistance(na, nb) <= 2) return true;
  return false;
}

function normalizeEmail(email: string): string {
  return normalizeText(email).replace(/\s+/g, "");
}

function normalizePhone(phone: string): { cleanPhone: string; suffix: string } {
  const cleanPhone = phone.replace(/\D/g, "");
  // National significant suffix (last 7 to 9 digits)
  const suffix = cleanPhone.length >= 7 ? cleanPhone.slice(-9) : cleanPhone;
  return { cleanPhone, suffix };
}

interface ExistingEntity {
  id: string;
  type: "Customer" | "Lead";
  companyName: string;
  contactPerson: string;
  normCompany: string;
  canonCompany: string;
  normContact: string;
  phoneticContact: string;
  normEmail?: string;
  cleanPhone?: string;
  phoneSuffix?: string;
}

export async function validateAndPreviewImport(
  rows: MappedLeadRow[],
  userContext?: AuthenticatedUser
): Promise<ImportPreviewResponse> {
  if (!userContext) {
    await requireAuth();
  }

  // Retrieve existing emails, phones, and company names from BOTH customers and leads
  const [existingCustomers, existingLeads] = await Promise.all([
    prisma.customer.findMany({
      select: { id: true, companyName: true, contactPerson: true, email: true, phone: true },
    }),
    prisma.lead.findMany({
      select: { id: true, companyName: true, contactPerson: true, email: true, phone: true },
    }),
  ]);

  const emailMap = new Map<string, ExistingEntity>();
  const phoneMap = new Map<string, ExistingEntity>();
  const phoneSuffixMap = new Map<string, ExistingEntity>();
  const companyExactMap = new Map<string, ExistingEntity>();
  const companyCanonMap = new Map<string, ExistingEntity>();
  const companyContactMap = new Map<string, ExistingEntity>();

  function registerEntity(
    id: string,
    type: "Customer" | "Lead",
    rawCompany: string,
    rawContact: string,
    rawEmail?: string | null,
    rawPhone?: string | null
  ) {
    const normCompany = normalizeCompanyName(rawCompany);
    const canonCompany = canonicalCompanyName(rawCompany);
    const normContact = normalizeContactName(rawContact);
    const phoneticContact = normContact.replace(/v/g, "w");
    const normEmail = rawEmail ? normalizeEmail(rawEmail) : undefined;
    const phoneData = rawPhone ? normalizePhone(rawPhone) : undefined;

    const entity: ExistingEntity = {
      id,
      type,
      companyName: rawCompany,
      contactPerson: rawContact,
      normCompany,
      canonCompany,
      normContact,
      phoneticContact,
      normEmail,
      cleanPhone: phoneData?.cleanPhone,
      phoneSuffix: phoneData?.suffix,
    };

    if (normCompany && !companyExactMap.has(normCompany)) {
      companyExactMap.set(normCompany, entity);
    }
    if (canonCompany && !companyCanonMap.has(canonCompany)) {
      companyCanonMap.set(canonCompany, entity);
    }
    if (normCompany && normContact) {
      companyContactMap.set(`${normCompany}::${normContact}`, entity);
      companyContactMap.set(`${normCompany}::${phoneticContact}`, entity);
    }
    if (canonCompany && normContact) {
      companyContactMap.set(`${canonCompany}::${normContact}`, entity);
      companyContactMap.set(`${canonCompany}::${phoneticContact}`, entity);
    }
    if (normEmail && !emailMap.has(normEmail)) {
      emailMap.set(normEmail, entity);
    }
    if (phoneData && phoneData.cleanPhone.length >= 7 && !phoneMap.has(phoneData.cleanPhone)) {
      phoneMap.set(phoneData.cleanPhone, entity);
    }
    if (phoneData && phoneData.suffix.length >= 7 && !phoneSuffixMap.has(phoneData.suffix)) {
      phoneSuffixMap.set(phoneData.suffix, entity);
    }
  }

  // Register customers first (so existing customer matches take precedence in reporting)
  for (const c of existingCustomers) {
    registerEntity(c.id, "Customer", c.companyName, c.contactPerson, c.email, c.phone);
  }

  // Register leads
  for (const l of existingLeads) {
    registerEntity(l.id, "Lead", l.companyName, l.contactPerson, l.email, l.phone);
  }

  // Track in-file duplicates
  const seenInFileEmails = new Set<string>();
  const seenInFilePhones = new Set<string>();
  const seenInFileCompanies = new Set<string>();
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
    const email = (raw.email || "").trim();
    const phone = (raw.phone || "").trim();

    if (!companyName) {
      errors.push("Company Name is required.");
    }
    if (!contactPerson) {
      errors.push("Contact Person is required.");
    }

    const normEmail = email ? normalizeEmail(email) : "";
    if (normEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      errors.push("Invalid email format.");
    }

    const normCompany = normalizeCompanyName(companyName);
    const canonCompany = canonicalCompanyName(companyName);
    const normContact = normalizeContactName(contactPerson);
    const phoneticContact = normContact.replace(/v/g, "w");
    const phoneData = phone ? normalizePhone(phone) : null;

    let isDuplicate = false;
    let duplicateReason: string | undefined = undefined;
    let duplicateExistingId: string | undefined = undefined;

    // 1. Check duplicate Email
    if (normEmail) {
      const matched = emailMap.get(normEmail);
      if (matched) {
        isDuplicate = true;
        duplicateExistingId = matched.id;
        duplicateReason = `Matches Existing ${matched.type}: ${matched.companyName} (Email: ${email})`;
      } else if (seenInFileEmails.has(normEmail)) {
        isDuplicate = true;
        duplicateReason = `Duplicate email within imported file (${email})`;
      } else {
        seenInFileEmails.add(normEmail);
      }
    }

    // 2. Check duplicate Company + Contact (Exact, Phonetic or Typo distance <= 2)
    if (!isDuplicate && normCompany && normContact) {
      const compContactKey = `${normCompany}::${normContact}`;
      const phoneticKey = `${normCompany}::${phoneticContact}`;
      const canonContactKey = canonCompany ? `${canonCompany}::${normContact}` : "";

      const matched =
        companyContactMap.get(compContactKey) ||
        companyContactMap.get(phoneticKey) ||
        (canonContactKey ? companyContactMap.get(canonContactKey) : undefined);

      if (matched) {
        isDuplicate = true;
        duplicateExistingId = matched.id;
        duplicateReason = `Matches Existing ${matched.type}: ${matched.companyName} (Company & Contact Person)`;
      } else if (
        seenInFileCompanyContacts.has(compContactKey) ||
        seenInFileCompanyContacts.has(phoneticKey)
      ) {
        isDuplicate = true;
        duplicateReason = "Duplicate company & contact within imported file";
      } else {
        seenInFileCompanyContacts.add(compContactKey);
        seenInFileCompanyContacts.add(phoneticKey);
      }
    }

    // 3. Check duplicate Company Name (Account Level)
    if (!isDuplicate && normCompany) {
      const matched =
        companyExactMap.get(normCompany) ||
        (canonCompany ? companyCanonMap.get(canonCompany) : undefined);

      if (matched) {
        isDuplicate = true;
        duplicateExistingId = matched.id;

        if (normContact && areContactsEquivalent(normContact, matched.normContact)) {
          duplicateReason = `Matches Existing ${matched.type}: ${matched.companyName} (Company & Contact Person)`;
        } else {
          duplicateReason = `Matches Existing ${matched.type}: ${matched.companyName} (Existing Account)`;
        }
      } else if (
        seenInFileCompanies.has(normCompany) ||
        (canonCompany && seenInFileCompanies.has(canonCompany))
      ) {
        isDuplicate = true;
        duplicateReason = `Duplicate company within imported file (${companyName})`;
      } else {
        seenInFileCompanies.add(normCompany);
        if (canonCompany) seenInFileCompanies.add(canonCompany);
      }
    }

    // 4. Check duplicate Phone Number
    if (!isDuplicate && phoneData && phoneData.cleanPhone.length >= 7) {
      const matched =
        phoneMap.get(phoneData.cleanPhone) ||
        (phoneData.suffix.length >= 7 ? phoneSuffixMap.get(phoneData.suffix) : undefined);

      if (matched) {
        isDuplicate = true;
        duplicateExistingId = matched.id;
        duplicateReason = `Matches Existing ${matched.type}: ${matched.companyName} (Phone: ${phone})`;
      } else if (
        seenInFilePhones.has(phoneData.cleanPhone) ||
        (phoneData.suffix.length >= 7 && seenInFilePhones.has(phoneData.suffix))
      ) {
        isDuplicate = true;
        duplicateReason = `Duplicate phone within imported file (${phone})`;
      } else {
        seenInFilePhones.add(phoneData.cleanPhone);
        if (phoneData.suffix.length >= 7) {
          seenInFilePhones.add(phoneData.suffix);
        }
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
      duplicateExistingId,
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
      let statusEnum: SalesStatus = SalesStatus.NEW_LEAD;
      if (data.status) {
        const s = data.status.toUpperCase().replace(/\s+/g, "_");
        if (s in SalesStatus) {
          statusEnum = s as SalesStatus;
        } else if (s === "NEW") {
          statusEnum = SalesStatus.NEW_LEAD;
        } else if (s === "CONTACTED") {
          statusEnum = SalesStatus.FIRST_CONTACT_MADE;
        } else if (s === "QUALIFIED") {
          statusEnum = SalesStatus.DECISION_MAKER_REACHED;
        } else if (s === "PROPOSAL_SENT") {
          statusEnum = SalesStatus.QUOTATION_SENT;
        } else if (s === "CONVERTED") {
          statusEnum = SalesStatus.DEAL_WON;
        } else if (s === "LOST") {
          statusEnum = SalesStatus.DEAL_LOST;
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
