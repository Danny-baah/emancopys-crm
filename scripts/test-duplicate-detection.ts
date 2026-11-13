import { prisma } from "../lib/prisma";
import { validateAndPreviewImport, type MappedLeadRow } from "../actions/import";
import { Role } from "../lib/generated/prisma/enums";
import type { AuthenticatedUser } from "../lib/auth-utils";

async function runDuplicateDetectionTests() {
  console.log("================================================================================");
  console.log("       EMANCOPYS CRM - DUPLICATE DETECTION VERIFICATION TEST SUITE              ");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passed++;
    console.log(`✅ [PASS] ${message}`);
  }

  // 1. Authenticated Admin Context
  const adminUser = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!adminUser) {
    throw new Error("No admin user found in database");
  }

  const userContext: AuthenticatedUser = {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
    isActive: adminUser.isActive,
  };
  console.log(`[INFO] Authenticated context: ${adminUser.name} (${adminUser.email})\n`);

  // 2. Verify existing database records for Ashanti and Kumasi
  const ashantiCustomer = await prisma.customer.findFirst({
    where: { companyName: { contains: "Ashanti", mode: "insensitive" } },
  });
  const kumasiCustomer = await prisma.customer.findFirst({
    where: { companyName: { contains: "Kumasi", mode: "insensitive" } },
  });

  assert(!!ashantiCustomer, `Existing Customer "Ashanti Precision Manufacturing" found in DB (ID: ${ashantiCustomer?.id}, Contact: "${ashantiCustomer?.contactPerson}")`);
  assert(!!kumasiCustomer, `Existing Customer "Kumasi PrintCorp Ltd" found in DB (ID: ${kumasiCustomer?.id}, Contact: "${kumasiCustomer?.contactPerson}")`);

  const initialLeadCount = await prisma.lead.count();
  const initialCustomerCount = await prisma.customer.count();
  console.log(`[INFO] Initial database counts: ${initialCustomerCount} Customers, ${initialLeadCount} Leads\n`);

  // ============================================================================
  // TEST SCENARIO 1: The Sample Excel Import (User Acceptance Case)
  // ============================================================================
  console.log("--- [Test Scenario 1: Acceptance Test Sample Excel Dataset] ---");
  const sampleImportRows: MappedLeadRow[] = [
    {
      companyName: "Ashanti Precision Manufacturing",
      contactPerson: "Akua Servaa", // Phonetic / Anglicized variant with 'v'
      email: "akua@ashantimanufacturing.com",
      phone: "+233 24 123 4567",
      jobTitle: "Procurement Manager",
      industry: "Manufacturing",
      location: "Kumasi, Ghana",
      status: "NEW",
      estimatedValue: 15000,
      notes: "Met at Ghana Industrial Expo. Looking for bulk corporate packaging.",
    },
    {
      companyName: "Kumasi PrintCorp Ltd",
      contactPerson: "Kofi Mensah",
      email: "kofi@kumasiprintcorp.com",
      phone: "+233 50 987 6543",
      jobTitle: "Managing Director",
      industry: "Publishing",
      location: "Kumasi, Ghana",
      status: "CONTACTED",
      estimatedValue: 8500,
      notes: "Annual educational catalog printing quotation requested.",
    },
    {
      companyName: "GoldenTech Solutions",
      contactPerson: "Emmanuel Boateng",
      email: "emmanuel@goldentech.com",
      phone: "+233 27 321 0987",
      jobTitle: "IT Director",
      industry: "IT Services",
      location: "Accra, Ghana",
      status: "QUALIFIED",
      estimatedValue: 22000,
      notes: "Corporate identity cards and custom brochures required.",
    },
  ];

  const previewResult = await validateAndPreviewImport(sampleImportRows, userContext);

  console.log(`[PREVIEW SUMMARY] Total: ${previewResult.totalRows} | Valid: ${previewResult.validCount} | Duplicates: ${previewResult.duplicateCount} | Errors: ${previewResult.invalidCount}`);
  for (const r of previewResult.rows) {
    console.log(`  Row #${r.rowNumber}: "${r.data.companyName}" (${r.data.contactPerson}) -> Duplicate: ${r.isDuplicate} | Reason: "${r.duplicateReason || "None"}"`);
  }
  console.log("");

  // Assertion 1: Total counts
  assert(previewResult.totalRows === 3, "Total preview rows is 3");
  assert(previewResult.duplicateCount === 2, `Duplicate count is 2 (expected Ashanti and Kumasi to both be duplicates, got ${previewResult.duplicateCount})`);
  assert(previewResult.validCount === 1, `Valid ready-to-import count is 1 (GoldenTech Solutions, got ${previewResult.validCount})`);
  assert(previewResult.invalidCount === 0, "Invalid rows count is 0");

  // Assertion 2: Ashanti Precision Manufacturing
  const ashantiRow = previewResult.rows[0];
  assert(ashantiRow.data.companyName === "Ashanti Precision Manufacturing", "Row 1 is Ashanti Precision Manufacturing");
  assert(ashantiRow.isDuplicate === true, "Row 1 (Ashanti Precision Manufacturing) is correctly detected as DUPLICATE");
  assert(
    !!ashantiRow.duplicateReason && ashantiRow.duplicateReason.includes("Ashanti Precision Manufacturing"),
    `Row 1 duplicate reason correctly references existing record: "${ashantiRow.duplicateReason}"`
  );

  // Assertion 3: Kumasi PrintCorp Ltd
  const kumasiRow = previewResult.rows[1];
  assert(kumasiRow.data.companyName === "Kumasi PrintCorp Ltd", "Row 2 is Kumasi PrintCorp Ltd");
  assert(kumasiRow.isDuplicate === true, "Row 2 (Kumasi PrintCorp Ltd) is correctly detected as DUPLICATE");
  assert(
    !!kumasiRow.duplicateReason && kumasiRow.duplicateReason.includes("Kumasi PrintCorp Ltd"),
    `Row 2 duplicate reason correctly references existing record: "${kumasiRow.duplicateReason}"`
  );

  // Assertion 4: GoldenTech Solutions
  const goldenTechRow = previewResult.rows[2];
  assert(goldenTechRow.data.companyName === "GoldenTech Solutions", "Row 3 is GoldenTech Solutions");
  assert(goldenTechRow.isValid === true, "Row 3 (GoldenTech Solutions) is valid");
  assert(goldenTechRow.isDuplicate === false, "Row 3 (GoldenTech Solutions) is NOT a duplicate and remains ELIGIBLE for import");

  // ============================================================================
  // TEST SCENARIO 2: Whitespace, Punctuation and Case-Insensitivity Variations
  // ============================================================================
  console.log("\n--- [Test Scenario 2: Case, Whitespace, Punctuation Variations] ---");
  const variationRows: MappedLeadRow[] = [
    {
      companyName: "   ashanti   precision   manufacturing   ", // lower + irregular spaces
      contactPerson: "  AKUA   SERWAA  ", // upper + irregular spaces
      email: "akua.new@different-domain.com",
      phone: "+233 99 999 9999",
    },
    {
      companyName: "KUMASI PRINTCORP LTD.", // uppercase + trailing dot
      contactPerson: "kofi mensah",
      email: "newemail@test.com",
    },
    {
      companyName: "Ashanti Precision Manufacturing",
      contactPerson: "Kwame Asare", // Different contact at same existing customer company
      email: "kwame@ashantimanufacturing.com",
    },
  ];

  const variationPreview = await validateAndPreviewImport(variationRows, userContext);
  assert(variationPreview.rows[0].isDuplicate === true, "Ashanti with lowercase and irregular whitespace detected as duplicate");
  assert(variationPreview.rows[1].isDuplicate === true, "Kumasi with uppercase, trailing dot and irregular case detected as duplicate");
  assert(variationPreview.rows[2].isDuplicate === true, "Ashanti with different contact person detected as existing company account duplicate");

  // ============================================================================
  // TEST SCENARIO 3: Phone Number Normalization Matches
  // ============================================================================
  console.log("\n--- [Test Scenario 3: Normalized Phone Number Matching] ---");
  // Database customer "Kumasi PrintCorp Ltd" has phone "+233 24 999 8888"
  const phoneVariationRows: MappedLeadRow[] = [
    {
      companyName: "Brand New Company Ltd",
      contactPerson: "Different Person",
      phone: "024 999 8888", // Local format matching +233 24 999 8888
    },
    {
      companyName: "Another New Company",
      contactPerson: "Another Person",
      phone: "233249998888", // Raw digits format
    },
  ];

  const phonePreview = await validateAndPreviewImport(phoneVariationRows, userContext);
  assert(phonePreview.rows[0].isDuplicate === true, "Local phone 024 999 8888 matches +233 24 999 8888 by suffix");
  assert(phonePreview.rows[1].isDuplicate === true, "Raw digit phone 233249998888 matches existing record");

  // ============================================================================
  // TEST SCENARIO 4: In-File Duplicate Detection
  // ============================================================================
  console.log("\n--- [Test Scenario 4: In-File Duplicate Detection] ---");
  const inFileDuplicateRows: MappedLeadRow[] = [
    {
      companyName: "Fresh Innovative Corp",
      contactPerson: "Alice Brown",
      email: "alice@freshinnovative.com",
    },
    {
      companyName: "Fresh Innovative Corp", // Same company in same file
      contactPerson: "Bob Brown",
      email: "bob@freshinnovative.com",
    },
    {
      companyName: "Third Novel Corp",
      contactPerson: "Charlie Green",
      email: "alice@freshinnovative.com", // Duplicate email within file
    },
  ];

  const inFilePreview = await validateAndPreviewImport(inFileDuplicateRows, userContext);
  assert(inFilePreview.rows[0].isDuplicate === false, "First instance of Fresh Innovative Corp is Ready for import");
  assert(inFilePreview.rows[1].isDuplicate === true, "Second instance of Fresh Innovative Corp in file detected as in-file duplicate");
  assert(inFilePreview.rows[2].isDuplicate === true, "Row with duplicate email within file detected as duplicate");

  // ============================================================================
  // TEST SCENARIO 5: Verification of Database Preservation
  // ============================================================================
  console.log("\n--- [Test Scenario 5: Database Preservation (No Mutations Occurred)] ---");
  const finalLeadCount = await prisma.lead.count();
  const finalCustomerCount = await prisma.customer.count();

  assert(finalCustomerCount === initialCustomerCount, `Customer count unchanged: ${initialCustomerCount} === ${finalCustomerCount}`);
  assert(finalLeadCount === initialLeadCount, `Lead count unchanged: ${initialLeadCount} === ${finalLeadCount}`);

  console.log("\n================================================================================");
  console.log(`🎉 ALL DUPLICATE DETECTION TESTS PASSED: ${passed}/${total} (0 FAILURES)`);
  console.log("================================================================================");
}

runDuplicateDetectionTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

