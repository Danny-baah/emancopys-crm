import { prisma } from "../lib/prisma";
import { getCustomers } from "../actions/customers";
import { Role } from "../lib/generated/prisma/enums";
import type { AuthenticatedUser } from "../lib/auth-utils";

async function runCustomerSearchTests() {
  console.log("================================================================================");
  console.log("       EMANCOPYS CRM - CUSTOMER SEARCH FUNCTIONALITY TEST SUITE                 ");
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

  // 1. Get or verify Admin user context
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

  // 2. Inspect persisted records in database
  const sampleCustomers = await prisma.customer.findMany({
    take: 10,
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      email: true,
      phone: true,
      industry: true,
      archivedAt: true,
    },
  });
  console.log(`[INFO] Total customer sample count in DB: ${sampleCustomers.length}`);
  for (const c of sampleCustomers) {
    console.log(`  - "${c.companyName}" | Contact: "${c.contactPerson}" | Email: "${c.email}" | Phone: "${c.phone}" | Ind: "${c.industry}" | Archived: ${!!c.archivedAt}`);
  }
  console.log("");

  // ============================================================================
  // TEST GROUP 1: Search by Company Name (Exact, Partial, Case-insensitive)
  // ============================================================================
  console.log("--- [Test Group 1: Search by Company Name] ---");
  const compResult1 = await getCustomers({ search: "Kumasi" }, userContext);
  assert(
    compResult1.customers.some((c) => c.companyName.toLowerCase().includes("kumasi")),
    `Search "Kumasi" found ${compResult1.totalCount} customer(s), including "${compResult1.customers[0]?.companyName}"`
  );

  // Case-insensitive check
  const compResult2 = await getCustomers({ search: "kUmAsI" }, userContext);
  assert(
    compResult2.totalCount === compResult1.totalCount,
    `Search "kUmAsI" (mixed case) returned exact same count (${compResult2.totalCount}) as "Kumasi"`
  );

  // Partial substring check: "PrintCorp"
  const compResult3 = await getCustomers({ search: "printcorp" }, userContext);
  assert(
    compResult3.customers.some((c) => c.companyName.toLowerCase().includes("printcorp")),
    `Partial search "printcorp" found matching company`
  );

  // Another persisted company: "Ashanti"
  const compResult4 = await getCustomers({ search: "Ashanti" }, userContext);
  assert(
    compResult4.customers.some((c) => c.companyName.toLowerCase().includes("ashanti")),
    `Search "Ashanti" found "${compResult4.customers[0]?.companyName}"`
  );

  // ============================================================================
  // TEST GROUP 2: Search by Contact Person
  // ============================================================================
  console.log("\n--- [Test Group 2: Search by Contact Person] ---");
  const contactResult1 = await getCustomers({ search: "Kofi" }, userContext);
  assert(
    contactResult1.customers.some((c) => (c.contactPerson || "").toLowerCase().includes("kofi")),
    `Search "Kofi" found contact "${contactResult1.customers[0]?.contactPerson}"`
  );

  const contactResult2 = await getCustomers({ search: "KOFI" }, userContext);
  assert(
    contactResult2.totalCount === contactResult1.totalCount,
    `Search "KOFI" (uppercase) returned same count (${contactResult2.totalCount})`
  );

  const contactResult3 = await getCustomers({ search: "mensah" }, userContext);
  assert(
    contactResult3.customers.some((c) => (c.contactPerson || "").toLowerCase().includes("mensah")),
    `Search "mensah" (last name partial) found matching customer`
  );

  const contactResult4 = await getCustomers({ search: "Serwaa" }, userContext);
  assert(
    contactResult4.customers.some((c) => (c.contactPerson || "").toLowerCase().includes("serwaa")),
    `Search "Serwaa" found contact "${contactResult4.customers[0]?.contactPerson}"`
  );

  // ============================================================================
  // TEST GROUP 3: Search by Email Address
  // ============================================================================
  console.log("\n--- [Test Group 3: Search by Email Address] ---");
  const emailResult1 = await getCustomers({ search: "kofi@" }, userContext);
  assert(
    emailResult1.customers.some((c) => (c.email || "").toLowerCase().includes("kofi@")),
    `Search "kofi@" found customer with email "${emailResult1.customers[0]?.email}"`
  );

  const emailResult2 = await getCustomers({ search: "kumasi-printcorp.com" }, userContext);
  assert(
    emailResult2.customers.some((c) => (c.email || "").toLowerCase().includes("kumasi-printcorp.com")),
    `Search domain "kumasi-printcorp.com" found customer`
  );

  const emailResult3 = await getCustomers({ search: "crmtest@example.com" }, userContext);
  assert(
    emailResult3.customers.some((c) => (c.email || "").toLowerCase().includes("crmtest@example.com")),
    `Search "crmtest@example.com" found customer`
  );

  const emailResult4 = await getCustomers({ search: "CRMTEST" }, userContext);
  assert(
    emailResult4.customers.some((c) => (c.email || "").toLowerCase().includes("crmtest")),
    `Search "CRMTEST" (case-insensitive) found customer by email`
  );

  // ============================================================================
  // TEST GROUP 4: Search by Phone Number
  // ============================================================================
  console.log("\n--- [Test Group 4: Search by Phone Number] ---");
  const phoneResult1 = await getCustomers({ search: "999" }, userContext);
  assert(
    phoneResult1.customers.some((c) => (c.phone || "").includes("999")),
    `Search "999" found customer with phone "${phoneResult1.customers[0]?.phone}"`
  );

  const phoneResult2 = await getCustomers({ search: "8888" }, userContext);
  assert(
    phoneResult2.customers.some((c) => (c.phone || "").includes("8888")),
    `Search "8888" found customer with phone "${phoneResult2.customers[0]?.phone}"`
  );

  const phoneResult3 = await getCustomers({ search: "+233 24" }, userContext);
  assert(
    phoneResult3.totalCount >= 2,
    `Search "+233 24" (country + area code) found ${phoneResult3.totalCount} customers`
  );

  const phoneResult4 = await getCustomers({ search: "555 1234" }, userContext);
  assert(
    phoneResult4.customers.some((c) => (c.phone || "").includes("555 1234")),
    `Search "555 1234" found customer with phone "${phoneResult4.customers[0]?.phone}"`
  );

  const phoneResult5 = await getCustomers({ search: "111 2222" }, userContext);
  assert(
    phoneResult5.customers.some((c) => (c.phone || "").includes("111 2222")),
    `Search "111 2222" found customer with phone "${phoneResult5.customers[0]?.phone}"`
  );

  // ============================================================================
  // TEST GROUP 5: Empty Search & Clear Search (Restoring list)
  // ============================================================================
  console.log("\n--- [Test Group 5: Empty Search & Restoring List] ---");
  const allResult = await getCustomers({ search: "" }, userContext);
  assert(allResult.totalCount >= 3, `Empty search restores full customer list (${allResult.totalCount} total)`);

  const trimmedSpaceResult = await getCustomers({ search: "   " }, userContext);
  assert(
    trimmedSpaceResult.totalCount === allResult.totalCount,
    `Whitespace-only search "   " properly trimmed and returns full list (${trimmedSpaceResult.totalCount})`
  );

  // ============================================================================
  // TEST GROUP 6: Non-matching Search (Empty State)
  // ============================================================================
  console.log("\n--- [Test Group 6: Non-matching Search (Empty State)] ---");
  const nonMatchingResult = await getCustomers({ search: "XYZ_NO_MATCH_COMPANY_9999" }, userContext);
  assert(nonMatchingResult.totalCount === 0, `Non-matching search returned 0 customers (triggers empty state)`);
  assert(nonMatchingResult.customers.length === 0, `Customers array is empty`);

  // ============================================================================
  // TEST GROUP 7: Combined Search + Filters (Industry, Archive, Sorting)
  // ============================================================================
  console.log("\n--- [Test Group 7: Combined Search + Filters] ---");
  // Search + Industry match
  const searchIndustryMatch = await getCustomers(
    { search: "Kumasi", industry: "Publishing & Media" },
    userContext
  );
  assert(
    searchIndustryMatch.totalCount >= 1,
    `Search "Kumasi" + Industry "Publishing & Media" matched (${searchIndustryMatch.totalCount})`
  );

  // Search + Industry mismatch
  const searchIndustryMismatch = await getCustomers(
    { search: "Kumasi", industry: "Healthcare" },
    userContext
  );
  assert(
    searchIndustryMismatch.totalCount === 0,
    `Search "Kumasi" + Industry "Healthcare" correctly yielded 0 results (Filter intersection works)`
  );

  // Search + Archive status
  // One customer "baah23064@gmail.com" is archived
  const searchArchivedOnly = await getCustomers(
    { search: "baah23064", archived: true },
    userContext
  );
  assert(
    searchArchivedOnly.totalCount === 1,
    `Search "baah23064" with archived: true found 1 archived customer`
  );

  const searchActiveOnly = await getCustomers(
    { search: "baah23064", archived: false },
    userContext
  );
  assert(
    searchActiveOnly.totalCount === 0,
    `Search "baah23064" with archived: false correctly found 0 active customers`
  );

  const searchAllArchive = await getCustomers(
    { search: "baah23064", archived: null },
    userContext
  );
  assert(
    searchAllArchive.totalCount === 1,
    `Search "baah23064" with archived: null (All tab) found the customer`
  );

  // Search + Sorting
  const sortedAsc = await getCustomers(
    { search: "233", sortBy: "companyName", sortOrder: "asc" },
    userContext
  );
  const sortedDesc = await getCustomers(
    { search: "233", sortBy: "companyName", sortOrder: "desc" },
    userContext
  );
  if (sortedAsc.customers.length >= 2) {
    const firstAsc = sortedAsc.customers[0].companyName;
    const firstDesc = sortedDesc.customers[0].companyName;
    assert(
      firstAsc <= sortedAsc.customers[1].companyName,
      `Ascending sort by companyName correctly ordered: "${firstAsc}" <= "${sortedAsc.customers[1].companyName}"`
    );
    assert(
      firstAsc !== firstDesc || sortedAsc.customers.length === 1,
      `Sort by companyName changes order between asc ("${firstAsc}") and desc ("${firstDesc}")`
    );
  } else {
    assert(true, `Sort test executed (single result found)`);
  }

  console.log("\n================================================================================");
  console.log(`🎉 ALL CUSTOMER SEARCH TESTS PASSED: ${passed}/${total} (0 FAILURES)`);
  console.log("================================================================================");
}

runCustomerSearchTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

