import { prisma } from "../lib/prisma";
import {
  createLead,
  updateLead,
  updateLeadStatus,
  getLeadById,
} from "../actions/leads";
import {
  createSale,
  updateSale,
  updateSaleStatus,
  logSaleCommunication,
  createSaleTask,
  toggleSaleTaskCompletion,
  getSaleById,
} from "../actions/sales";
import {
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  getQuotationById,
} from "../actions/quotations";
import {
  createOrder,
  updateOrder,
  updateOrderStatus,
  getOrderById,
} from "../actions/orders";
import {
  createProjectForOrder,
  updateProjectStatus,
  getProjectById,
} from "../actions/projects";
import {
  SalesStatus,
  QuotationStatus,
  OrderStatus,
  ProjectStatus,
  Role,
  ActivityType,
} from "../lib/generated/prisma/enums";
import { ORDERED_SALES_STATUSES } from "../lib/constants/sales";
import { ORDERED_PROJECT_STATUSES } from "../lib/constants/projects";

let passedCount = 0;
let failedCount = 0;

function assert(condition: unknown, message: string) {
  if (Boolean(condition)) {
    console.log(`✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runWednesdayVerification() {
  console.log("=".repeat(80));
  console.log("       EMANCOPYS CRM - WEDNESDAY FULL VERIFICATION TEST SUITE           ");
  console.log("=".repeat(80));

  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!admin) {
    throw new Error("Admin account missing from database.");
  }

  const userContext = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    isActive: admin.isActive,
  };

  const testSuffix = Date.now().toString();

  // Test Customer
  const testCustomer = await prisma.customer.create({
    data: {
      companyName: `Wednesday Acceptance Corp ${testSuffix}`,
      contactPerson: "Kwame Mensah",
      phone: "+233 24 111 9999",
      email: `kwame.${testSuffix}@acceptance.com`,
      industry: "Manufacturing",
      location: "Kumasi, Ghana",
      createdById: admin.id,
    },
  });

  try {
    // -------------------------------------------------------------------------
    // 1. LEAD STATUS PIPELINE & TRANSITIONS (10 STATUSES)
    // -------------------------------------------------------------------------
    console.log("\n--- [1] Lead Sales Pipeline - All 10 Statuses ---");

    const createdLead = await prisma.lead.create({
      data: {
        companyName: `Pipeline Prospect ${testSuffix}`,
        contactPerson: "Nana Akoto",
        phone: "+233 24 888 7777",
        email: `nana.${testSuffix}@prospect.com`,
        status: SalesStatus.NEW_LEAD,
        estimatedValue: 12000,
        source: "Inbound Referral",
        createdById: admin.id,
      },
    });

    assert(createdLead.status === SalesStatus.NEW_LEAD, "Lead created with initial stage NEW_LEAD (Step 1)");

    // Iterate through all 10 statuses and verify persistence
    for (const targetStatus of ORDERED_SALES_STATUSES) {
      await updateLeadStatus(createdLead.id, targetStatus, userContext);
      const fetched = await prisma.lead.findUnique({
        where: { id: createdLead.id },
        select: { status: true },
      });
      assert(fetched?.status === targetStatus, `Lead transitioned to stage: ${targetStatus}`);
    }

    // -------------------------------------------------------------------------
    // 2. SALES ACTIVITY MANAGEMENT (Deal Discovery, Notes, Tasks)
    // -------------------------------------------------------------------------
    console.log("\n--- [2] Sales Management & Commercial Activities ---");

    const saleRes = await createSale(
      {
        title: `Enterprise Portal Solution ${testSuffix}`,
        customerId: testCustomer.id,
        leadId: createdLead.id,
        status: SalesStatus.NEW_LEAD,
        estimatedValue: 25000,
        serviceType: "Full-Stack Portal & Print Identity",
        interests: "Mobile ordering, responsive catalog, branded letterheads",
        objections: "Delivery timeline must be within 6 weeks",
        nextContactDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Executive committee demo scheduled.",
      },
      userContext
    );

    assert(Boolean(saleRes.saleId), "Created Sale record connected to Customer and Lead");

    // Advance sale to FIRST_CONTACT_MADE
    await updateSaleStatus(saleRes.saleId, SalesStatus.FIRST_CONTACT_MADE, "Introductory meeting completed", undefined, userContext);
    let currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.status === SalesStatus.FIRST_CONTACT_MADE, "Sale status updated to FIRST_CONTACT_MADE");

    // Document Conversation
    await logSaleCommunication(
      saleRes.saleId,
      {
        activityType: ActivityType.MEETING,
        subject: "Executive Scope Alignment",
        notes: "Stakeholders aligned on 50% deposit requirement.",
        customerInterests: "Needs invoice in EUR or GHS",
        customerObjections: "Concerned about maintenance SLA",
        nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      userContext
    );

    currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.communications.length === 1, "Documented 1 conversation in sales communication history");
    assert(currentSale?.communications[0].subject === "Executive Scope Alignment", "Conversation subject matches recorded entry");
    assert(currentSale?.interests === "Needs invoice in EUR or GHS", "Customer interests updated on Sale record");
    assert(currentSale?.objections === "Concerned about maintenance SLA", "Customer objections updated on Sale record");

    // Create Sale Task
    await createSaleTask(
      saleRes.saleId,
      {
        title: "Submit formal proposal and timeline",
        description: "Include breakdown of hosting and maintenance packages.",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        assignedToId: admin.id,
      },
      userContext
    );

    currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.tasks.length === 1, "Sale task created with meaningful due date");
    assert(currentSale?.tasks[0].isCompleted === false, "Sale task initially incomplete");

    // Toggle Task completion
    await toggleSaleTaskCompletion(currentSale!.tasks[0].id, saleRes.saleId, userContext);
    currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.tasks[0].isCompleted === true, "Sale task successfully toggled to completed");

    // -------------------------------------------------------------------------
    // 3. QUOTATION MANAGEMENT & AUTOMATIC SALES PIPELINE UPDATES
    // -------------------------------------------------------------------------
    console.log("\n--- [3] Quotation Management & Pipeline Synchronisation ---");

    const quoteRes = await createQuotation(
      {
        customerId: testCustomer.id,
        saleId: saleRes.saleId,
        serviceSold: "Corporate Web Architecture & Print Collateral",
        quotationPrice: 24000,
        quotationDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        responsibleEmployeeId: admin.id,
        status: QuotationStatus.DRAFT,
        notes: "Includes full responsive build, CMS training, and print package.",
      },
      userContext
    );

    assert(Boolean(quoteRes.quotationId), "Quotation drafted with unique number");
    assert(quoteRes.quotationNumber.startsWith("QT-"), `Quotation number format verified (${quoteRes.quotationNumber})`);

    // Verify Sale auto-advanced to QUOTATION_CREATED
    currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.status === SalesStatus.QUOTATION_CREATED, "Sale automatically advanced to QUOTATION_CREATED upon quotation generation");

    // Edit Quotation Details
    await updateQuotation(
      quoteRes.quotationId,
      {
        customerId: testCustomer.id,
        saleId: saleRes.saleId,
        serviceSold: "Corporate Web Architecture & Premium Print Collateral",
        quotationPrice: 26000,
        quotationDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        responsibleEmployeeId: admin.id,
        status: QuotationStatus.DRAFT,
        notes: "Updated quotation to include premium foil-stamped business cards.",
      },
      userContext
    );

    let fetchedQuote = await getQuotationById(quoteRes.quotationId, userContext);
    assert(fetchedQuote?.quotationPrice === 26000, "Quotation price successfully edited to €26,000");
    assert(fetchedQuote?.serviceSold.includes("Premium"), "Service description updated in quotation");

    // Send Quotation -> verify Sale advances to QUOTATION_SENT
    await updateQuotationStatus(quoteRes.quotationId, QuotationStatus.SENT, userContext);
    currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.status === SalesStatus.QUOTATION_SENT, "Sending quotation automatically transitioned Sale to QUOTATION_SENT");

    // Accept Quotation -> verify Sale advances to DEAL_WON
    await updateQuotationStatus(quoteRes.quotationId, QuotationStatus.ACCEPTED, userContext);
    currentSale = await getSaleById(saleRes.saleId, userContext);
    assert(currentSale?.status === SalesStatus.DEAL_WON, "Accepting quotation automatically transitioned Sale to DEAL_WON");

    // -------------------------------------------------------------------------
    // 4. ORDER MANAGEMENT & COMMISSION VALUE
    // -------------------------------------------------------------------------
    console.log("\n--- [4] Order Management & Commission Stored Values ---");

    const orderRes = await createOrder(
      {
        customerId: testCustomer.id,
        quotationId: quoteRes.quotationId,
        saleId: saleRes.saleId,
        serviceSold: fetchedQuote!.serviceSold,
        totalAmount: 26000,
        agreedCommission: 2600, // 10% stored value
        orderDate: new Date().toISOString(),
        responsibleEmployeeId: admin.id,
        status: OrderStatus.CONFIRMED,
        notes: "Order confirmed after quotation acceptance. 10% commission approved.",
        autoCreateProject: false, // We will test manual project creation next
      },
      userContext
    );

    assert(Boolean(orderRes.orderId), "Confirmed Order created from accepted quotation");
    assert(orderRes.orderNumber.startsWith("ORD-"), `Order number format verified (${orderRes.orderNumber})`);

    let fetchedOrder = await getOrderById(orderRes.orderId, userContext);
    assert(fetchedOrder?.agreedCommission === 2600, "Agreed sales commission stored as explicit value (€2,600.00)");
    assert(fetchedOrder?.quotationId === quoteRes.quotationId, "Order retains relation to originating Quotation");
    assert(fetchedOrder?.customerId === testCustomer.id, "Order retains relation to Customer");

    // Duplicate Prevention Check: attempting to create duplicate order for same quote must throw
    let duplicatePrevented = false;
    try {
      await createOrder(
        {
          customerId: testCustomer.id,
          quotationId: quoteRes.quotationId,
          serviceSold: "Duplicate attempt",
          totalAmount: 26000,
          agreedCommission: 2600,
          orderDate: new Date().toISOString(),
          status: OrderStatus.CONFIRMED,
        },
        userContext
      );
    } catch {
      duplicatePrevented = true;
    }
    assert(duplicatePrevented, "Duplicate order prevention successfully blocked second order for same quotation");

    // Update Order Status
    await updateOrderStatus(orderRes.orderId, OrderStatus.IN_PRODUCTION, "Production queue commenced", userContext);
    fetchedOrder = await getOrderById(orderRes.orderId, userContext);
    assert(fetchedOrder?.status === OrderStatus.IN_PRODUCTION, "Order status transitioned to IN_PRODUCTION");

    // -------------------------------------------------------------------------
    // 5. PROJECT MANAGEMENT (14 EXACT STATUSES)
    // -------------------------------------------------------------------------
    console.log("\n--- [5] Project Management - All 14 Exact Statuses ---");

    // Initialize Project for Order
    const projRes = await createProjectForOrder(orderRes.orderId, userContext);
    assert(Boolean(projRes.projectId), "Project successfully created from won order");
    assert(!projRes.alreadyExisted, "Project newly created");

    // Duplicate Project Prevention
    const duplicateProj = await createProjectForOrder(orderRes.orderId, userContext);
    assert(duplicateProj.alreadyExisted, "Duplicate project creation prevented for existing order");
    assert(duplicateProj.projectId === projRes.projectId, "Returned existing project ID");

    let currentProject = await getProjectById(projRes.projectId, userContext);
    assert(currentProject?.status === ProjectStatus.ORDER_WON, "Project initialized with initial status ORDER_WON (Step 1)");

    // Test transition across ALL 14 project statuses
    for (const targetStatus of ORDERED_PROJECT_STATUSES) {
      await updateProjectStatus(
        projRes.projectId,
        {
          status: targetStatus,
          statusChangeNote: `Transitioned to ${targetStatus} during audit verification.`,
        },
        userContext
      );

      const p = await prisma.project.findUnique({
        where: { id: projRes.projectId },
        select: { status: true },
      });
      assert(p?.status === targetStatus, `Project transitioned to status: ${targetStatus}`);
    }

    // Verify Project Status History Log
    const statusHistories = await prisma.projectStatusHistory.findMany({
      where: { projectId: projRes.projectId },
      orderBy: { createdAt: "asc" },
    });
    assert(statusHistories.length >= 14, `Project status audit history recorded ${statusHistories.length} state transitions`);

    // -------------------------------------------------------------------------
    // 6. INDEPENDENCE OF PROJECT STATUS AND PAYMENT STATUS
    // -------------------------------------------------------------------------
    console.log("\n--- [6] Independence of Project Status & Payment Status ---");

    // Set Project to IN_PRODUCTION
    await updateProjectStatus(projRes.projectId, { status: ProjectStatus.IN_PRODUCTION }, userContext);
    currentProject = await getProjectById(projRes.projectId, userContext);
    assert(currentProject?.status === ProjectStatus.IN_PRODUCTION, "Project set to IN_PRODUCTION");

    // Verify Order payment status is initially UNPAID
    fetchedOrder = await getOrderById(orderRes.orderId, userContext);
    assert(fetchedOrder?.paymentStatus === "UNPAID", "Order payment status is UNPAID while Project is IN_PRODUCTION");

    // Record partial deposit payment
    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-TEST-${testSuffix}`,
        orderId: orderRes.orderId,
        customerId: testCustomer.id,
        amount: 10000,
        receivedById: admin.id,
      },
    });

    await prisma.order.update({
      where: { id: orderRes.orderId },
      data: { paymentStatus: "PARTIALLY_PAID" },
    });

    // Check project status remained unchanged
    currentProject = await getProjectById(projRes.projectId, userContext);
    assert(currentProject?.status === ProjectStatus.IN_PRODUCTION, "Project status remains IN_PRODUCTION after payment status changed to PARTIALLY_PAID");

    // Complete project
    await updateProjectStatus(projRes.projectId, { status: ProjectStatus.PROJECT_COMPLETED }, userContext);
    fetchedOrder = await getOrderById(orderRes.orderId, userContext);
    assert(fetchedOrder?.paymentStatus === "PARTIALLY_PAID", "Order payment status remains PARTIALLY_PAID after Project is marked PROJECT_COMPLETED (Complete separation)");

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP TEST FIXTURES
    // -------------------------------------------------------------------------
    console.log("\n--- [7] Clean Up Test Fixtures ---");
    // Clean up created entities in reverse dependency order
    await prisma.payment.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.projectStatusHistory.deleteMany({ where: { project: { customerId: testCustomer.id } } });
    await prisma.project.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.quotation.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.saleCommunication.deleteMany({ where: { sale: { customerId: testCustomer.id } } });
    await prisma.saleTask.deleteMany({ where: { sale: { customerId: testCustomer.id } } });
    await prisma.saleStatusHistory.deleteMany({ where: { sale: { customerId: testCustomer.id } } });
    await prisma.sale.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.leadActivity.deleteMany({ where: { lead: { companyName: `Pipeline Prospect ${testSuffix}` } } });
    await prisma.lead.deleteMany({ where: { companyName: `Pipeline Prospect ${testSuffix}` } });
    await prisma.auditLog.deleteMany({ where: { entityName: { contains: testSuffix } } });
    await prisma.customer.deleteMany({ where: { id: testCustomer.id } });

    console.log("✅ [CLEANUP] All test fixtures cleanly removed from database.");
  }

  console.log("\n" + "=".repeat(80));
  console.log(`🎉 WEDNESDAY TESTS COMPLETED: ${passedCount}/${passedCount + failedCount} PASSED (${failedCount} FAILURES)`);
  console.log("=".repeat(80));
}

runWednesdayVerification()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
