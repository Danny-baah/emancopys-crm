import { prisma } from "../lib/prisma";
import {
  createLead,
  updateLeadStatus,
  getLeadById,
} from "../actions/leads";
import {
  createCustomer,
  getCustomerById,
} from "../actions/customers";
import {
  createSale,
  updateSaleStatus,
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
  updateOrderStatus,
  getOrderById,
} from "../actions/orders";
import {
  createProjectForOrder,
  updateProjectStatus,
  getProjectById,
} from "../actions/projects";
import {
  recordPayment,
  getPaymentsByOrder,
} from "../actions/payments";
import {
  assignServiceToCustomer,
  getPredefinedServices,
} from "../actions/services";
import {
  getEmployeePerformanceMetrics,
} from "../actions/employees";
import {
  SalesStatus,
  QuotationStatus,
  OrderStatus,
  ProjectStatus,
  PaymentStatus,
  Role,
} from "../lib/generated/prisma/enums";
import { ORDERED_PROJECT_STATUSES } from "../lib/constants/projects";
import { AuthenticatedUser } from "../actions/types";

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

async function runFridayE2EAcceptance() {
  console.log("=".repeat(80));
  console.log("   EMANCOPYS CRM - FRIDAY FINAL E2E ACCEPTANCE & SYSTEM TEST SUITE      ");
  console.log("=".repeat(80));

  const runId = Date.now().toString();

  // 1. Database Connection & System Health
  console.log("\n--- [1] System Health & Database Connectivity ---");
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
  assert(!!admin, `Admin account exists in database (${admin?.email})`);

  const employee = await prisma.user.findFirst({ where: { role: Role.EMPLOYEE } });
  assert(!!employee, `Employee account exists in database (${employee?.email})`);

  const adminContext: AuthenticatedUser = {
    id: admin!.id,
    name: admin!.name,
    email: admin!.email,
    role: admin!.role as "ADMIN" | "EMPLOYEE",
  };

  const employeeContext: AuthenticatedUser = {
    id: employee!.id,
    name: employee!.name,
    email: employee!.email,
    role: employee!.role as "ADMIN" | "EMPLOYEE",
  };

  let testCustomerId: string | null = null;
  let testLeadId: string | null = null;
  let testSaleId: string | null = null;
  let testQuotationId: string | null = null;
  let testOrderId: string | null = null;
  let testProjectId: string | null = null;

  try {
    // 2. Lifecycle Step A: Lead Ingestion & Sales Progression
    console.log("\n--- [2] Step A: Lead Ingestion & Qualification ---");
    const leadRes = await createLead(
      {
        companyName: `Starlight Media Group ${runId}`,
        contactPerson: "Amara Mensah",
        email: `amara.${runId}@starlightmedia.com`,
        phone: "+49 30 99887766",
        notes: "High potential client requesting custom web portal & marketing.",
        assignedToId: employee!.id,
      },
      employeeContext
    );
    assert(leadRes.success && !!leadRes.leadId, "Created new Lead 'Starlight Media Group' with assigned employee");
    testLeadId = leadRes.leadId!;

    let lead = await getLeadById(testLeadId, employeeContext);
    assert(lead?.status === SalesStatus.NEW_LEAD, "Initial lead status is NEW_LEAD");

    await updateLeadStatus(testLeadId, SalesStatus.RESEARCHED, employeeContext);
    await updateLeadStatus(testLeadId, SalesStatus.FIRST_CONTACT_MADE, employeeContext);
    await updateLeadStatus(testLeadId, SalesStatus.DECISION_MAKER_REACHED, employeeContext);
    await updateLeadStatus(testLeadId, SalesStatus.INTERESTED, employeeContext);

    lead = await getLeadById(testLeadId, employeeContext);
    assert(lead?.status === SalesStatus.INTERESTED, "Lead successfully qualified through 5 pipeline stages to INTERESTED");

    // 3. Lifecycle Step B: Customer Conversion
    console.log("\n--- [3] Step B: Customer Record Creation ---");
    const custRes = await createCustomer(
      {
        companyName: `Starlight Media Group ${runId}`,
        contactPerson: "Amara Mensah",
        email: `amara.${runId}@starlightmedia.com`,
        phone: "+49 30 99887766",
        industry: "Media & Entertainment",
        address: "Friedrichstraße 42, 10117 Berlin",
        assignedToId: employee!.id,
      },
      employeeContext
    );
    assert(custRes.success && !!custRes.customerId, "Converted/created Customer record with complete profile details");
    testCustomerId = custRes.customerId!;

    // 4. Lifecycle Step C: Sales Deal & Quotation Auto-Sync
    console.log("\n--- [4] Step C: Sales Deal, Quotation Lifecycle & Auto-Sync ---");
    const saleRes = await createSale(
      {
        customerId: testCustomerId,
        title: `Enterprise Web Portal ${runId}`,
        status: SalesStatus.INTERESTED,
        assignedToId: employee!.id,
        notes: "Bespoke digital platform with custom CMS.",
      },
      employeeContext
    );
    assert(saleRes.success && !!saleRes.saleId, "Created Sale deal linked to Customer and assigned Employee");
    testSaleId = saleRes.saleId!;

    const quoteRes = await createQuotation(
      {
        customerId: testCustomerId,
        saleId: testSaleId,
        quotationNumber: `QUO-F-${runId}`,
        quotationPrice: 15000,
        serviceSold: "Full Website Redesign & CMS Integration",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentTerms: "30% Deposit, 40% Milestone, 30% Final upon Launch",
      },
      employeeContext
    );
    assert(quoteRes.success && !!quoteRes.quotationId, "Created Quotation QUO-F for €15,000");
    testQuotationId = quoteRes.quotationId!;

    // Quotation Editing
    const quoteUpdateRes = await updateQuotation(
      testQuotationId,
      {
        quotationPrice: 16000,
        serviceSold: "Full Website Redesign, CMS Integration & Brand Identity",
      },
      employeeContext
    );
    assert(quoteUpdateRes.success, "Successfully updated Quotation price to €16,000 and enhanced service scope");

    // Transition Quotation to SENT -> Sale auto-syncs to QUOTATION_SENT
    await updateQuotationStatus(testQuotationId, QuotationStatus.SENT, employeeContext);
    let sale = await getSaleById(testSaleId, employeeContext);
    assert(sale?.status === SalesStatus.QUOTATION_SENT, "Sending quotation automatically transitioned Sale to QUOTATION_SENT");

    // Transition Quotation to ACCEPTED -> Sale auto-syncs to DEAL_WON
    await updateQuotationStatus(testQuotationId, QuotationStatus.ACCEPTED, employeeContext);
    sale = await getSaleById(testSaleId, employeeContext);
    assert(sale?.status === SalesStatus.DEAL_WON, "Accepting quotation automatically transitioned Sale to DEAL_WON");

    // 5. Lifecycle Step D: Order Management & Commission Calculation
    console.log("\n--- [5] Step D: Order Creation & 10% Commission Rule ---");
    const orderRes = await createOrder(
      {
        customerId: testCustomerId,
        quotationId: testQuotationId,
        orderNumber: `ORD-F-${runId}`,
        totalAmount: 16000,
        depositAmount: 4800, // 30% deposit
        commissionEligibleTotal: 16000,
        paymentTerms: "30% Deposit, 40% Milestone, 30% Final upon Launch",
        orderDate: new Date().toISOString(),
      },
      employeeContext
    );
    assert(orderRes.success && !!orderRes.orderId, "Created Order ORD-F for €16,000");
    testOrderId = orderRes.orderId!;

    let order = await getOrderById(testOrderId, employeeContext);
    assert(order?.commissionValue === 1600, "10% Commission value computed precisely: €1,600.00");
    assert(order?.paymentStatus === PaymentStatus.UNPAID, "Initial order payment status is UNPAID");

    await updateOrderStatus(testOrderId, OrderStatus.CONFIRMED, employeeContext);
    await updateOrderStatus(testOrderId, OrderStatus.IN_PROGRESS, employeeContext);
    order = await getOrderById(testOrderId, employeeContext);
    assert(order?.status === OrderStatus.IN_PROGRESS, "Order successfully progressed to IN_PROGRESS");

    // 6. Lifecycle Step E: Project Management & Payment Decoupling
    console.log("\n--- [6] Step E: Project Execution & Payment Independence ---");
    const projRes = await createProjectForOrder(testOrderId, adminContext);
    assert(projRes.success && !!projRes.projectId, "Created Project linked to Order");
    testProjectId = projRes.projectId!;

    // Step through all 14 project statuses
    for (const status of ORDERED_PROJECT_STATUSES) {
      const res = await updateProjectStatus(testProjectId, status, adminContext);
      assert(res.success, `Project progressed to status: ${status}`);
    }

    const completedProject = await getProjectById(testProjectId, adminContext);
    assert(
      completedProject?.status === ProjectStatus.POST_LAUNCH_SUPPORT,
      "Project reached final status POST_LAUNCH_SUPPORT"
    );

    // Verify order is still UNPAID -> Payment Independence confirmed
    order = await getOrderById(testOrderId, employeeContext);
    assert(
      order?.paymentStatus === PaymentStatus.UNPAID,
      "CRITICAL RULE VERIFIED: Project completed to POST_LAUNCH_SUPPORT while Order payment status remains UNPAID"
    );

    // 7. Lifecycle Step F: Payment Execution & Cent-Precision Balances
    console.log("\n--- [7] Step F: Payment Execution & Split Milestone Tracking ---");
    // Payment 1: Deposit €4,800
    const pay1 = await recordPayment(
      {
        orderId: testOrderId,
        amount: 4800,
        paymentDate: new Date().toISOString(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-F1-${runId}`,
        notes: "30% Initial Deposit",
      },
      adminContext
    );
    assert(pay1.success, "Recorded 30% deposit payment of €4,800.00");

    let payments = await getPaymentsByOrder(testOrderId, adminContext);
    assert(payments.totalPaid === 4800, "Total paid reflects €4,800.00");
    assert(payments.outstandingBalance === 11200, "Outstanding balance updated to €11,200.00");
    order = await getOrderById(testOrderId, employeeContext);
    assert(order?.paymentStatus === PaymentStatus.PARTIALLY_PAID, "Order status transitioned to PARTIALLY_PAID");

    // Payment 2: Milestone €6,400 (40%)
    const pay2 = await recordPayment(
      {
        orderId: testOrderId,
        amount: 6400,
        paymentDate: new Date().toISOString(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-F2-${runId}`,
        notes: "40% Design & QA Approval Milestone",
      },
      adminContext
    );
    assert(pay2.success, "Recorded 40% milestone payment of €6,400.00");

    payments = await getPaymentsByOrder(testOrderId, adminContext);
    assert(payments.totalPaid === 11200, "Total paid reflects €11,200.00");
    assert(payments.outstandingBalance === 4800, "Outstanding balance updated to €4,800.00");

    // Overpayment Protection Test
    const overpayAttempt = await recordPayment(
      {
        orderId: testOrderId,
        amount: 5000, // Exceeds remaining €4,800
        paymentDate: new Date().toISOString(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-OVER-${runId}`,
      },
      adminContext
    );
    assert(!overpayAttempt.success, "Overpayment attempt of €5,000 against €4,800 balance correctly rejected");

    // Payment 3: Final Balance €4,800 (30%)
    const pay3 = await recordPayment(
      {
        orderId: testOrderId,
        amount: 4800,
        paymentDate: new Date().toISOString(),
        paymentMethod: "BANK_TRANSFER",
        reference: `PAY-F3-${runId}`,
        notes: "30% Final Balance Payment",
      },
      adminContext
    );
    assert(pay3.success, "Recorded final balance payment of €4,800.00");

    payments = await getPaymentsByOrder(testOrderId, adminContext);
    assert(payments.totalPaid === 16000, "Total paid equals exact order total €16,000.00");
    assert(payments.outstandingBalance === 0, "Outstanding balance equals exactly €0.00");
    order = await getOrderById(testOrderId, employeeContext);
    assert(order?.paymentStatus === PaymentStatus.PAID, "Order payment status transitioned to PAID");

    // 8. Lifecycle Step G: Predefined Additional Services & MRR
    console.log("\n--- [8] Step G: Predefined Catalogue Services & Active MRR ---");
    const predefinedServices = await getPredefinedServices();
    assert(predefinedServices.length >= 3, `Found ${predefinedServices.length} catalogue services`);

    const maintService = predefinedServices.find((s) => s.name === "Website Maintenance");
    const seoService = predefinedServices.find((s) => s.name === "Care + SEO Start");
    assert(maintService && maintService.price === 50, "Website Maintenance service verified at €50.00/mo");
    assert(seoService && seoService.price === 300, "Care + SEO Start service verified at €300.00/mo");

    // Subscribe customer to both services
    const sub1 = await assignServiceToCustomer(
      {
        customerId: testCustomerId,
        serviceId: maintService!.id,
        startDate: new Date().toISOString(),
      },
      adminContext
    );
    assert(sub1.success, "Customer subscribed to Website Maintenance (€50/mo)");

    const sub2 = await assignServiceToCustomer(
      {
        customerId: testCustomerId,
        serviceId: seoService!.id,
        startDate: new Date().toISOString(),
      },
      adminContext
    );
    assert(sub2.success, "Customer subscribed to Care + SEO Start (€300/mo)");

    // Verify Active MRR
    const activeSubs = await prisma.customerService.findMany({
      where: { customerId: testCustomerId, status: "ACTIVE" },
      include: { service: true },
    });
    const customerMRR = activeSubs.reduce((acc, sub) => acc + Number(sub.service.price), 0);
    assert(customerMRR === 350, "Customer active MRR accurately aggregated: €350.00/month");

    // 9. Lifecycle Step H: Employee Performance Attribution
    console.log("\n--- [9] Step H: Employee Performance Metrics Attribution ---");
    const employeeMetrics = await getEmployeePerformanceMetrics(employee!.id, adminContext);
    assert(employeeMetrics !== null, "Retrieved employee performance metrics");
    assert(employeeMetrics?.leadsProcessedCount! >= 1, `Employee processed leads: ${employeeMetrics?.leadsProcessedCount}`);
    assert(employeeMetrics?.dealsWonCount! >= 1, `Employee won deals: ${employeeMetrics?.dealsWonCount}`);
    assert(employeeMetrics?.conversionRate! > 0, `Employee conversion rate: ${employeeMetrics?.conversionRate}%`);
    assert(employeeMetrics?.totalRevenueGenerated! >= 16000, `Employee total revenue generated: €${employeeMetrics?.totalRevenueGenerated}`);
    assert(employeeMetrics?.activeRecurringRevenue! >= 350, `Employee active recurring revenue: €${employeeMetrics?.activeRecurringRevenue}/mo`);
    assert(employeeMetrics?.averageDealSize! >= 16000, `Employee average deal size: €${employeeMetrics?.averageDealSize}`);

    // 10. Lifecycle Step I: Security, RBAC & Audit Trail
    console.log("\n--- [10] Step I: Security, RBAC & Audit Trail Verification ---");
    // Verify employee cannot fetch employee metrics of another user
    const rbacEmployeeCheck = await getEmployeePerformanceMetrics(admin!.id, employeeContext);
    assert(rbacEmployeeCheck === null, "RBAC Security: Non-admin employee blocked from inspecting admin performance");

    // Verify audit logs were captured
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { recordId: testCustomerId },
          { recordId: testLeadId },
          { recordId: testSaleId },
          { recordId: testOrderId },
          { recordId: testProjectId },
        ],
      },
    });
    assert(logs.length >= 5, `Audit Trail: ${logs.length} immutable activity logs captured across all lifecycle operations`);

  } finally {
    // 11. Cleanup of test fixtures
    console.log("\n--- [11] Cleaning up Friday E2E Test Fixtures ---");
    if (testProjectId) {
      await prisma.project.deleteMany({ where: { id: testProjectId } });
    }
    if (testOrderId) {
      await prisma.payment.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.deleteMany({ where: { id: testOrderId } });
    }
    if (testQuotationId) {
      await prisma.quotation.deleteMany({ where: { id: testQuotationId } });
    }
    if (testSaleId) {
      await prisma.saleTask.deleteMany({ where: { saleId: testSaleId } });
      await prisma.saleCommunication.deleteMany({ where: { saleId: testSaleId } });
      await prisma.sale.deleteMany({ where: { id: testSaleId } });
    }
    if (testCustomerId) {
      await prisma.customerService.deleteMany({ where: { customerId: testCustomerId } });
      await prisma.customer.deleteMany({ where: { id: testCustomerId } });
    }
    if (testLeadId) {
      await prisma.lead.deleteMany({ where: { id: testLeadId } });
    }
    console.log("✅ [PASS] All temporary test fixtures cleaned up cleanly.");
  }

  console.log("\n" + "=".repeat(80));
  console.log(`RESULTS: ${passedCount} Passed, ${failedCount} Failed.`);
  if (failedCount === 0) {
    console.log("FRIDAY E2E ACCEPTANCE TEST SUITE: 100% SUCCESS - VERSION 1 PRODUCTION READY");
  } else {
    console.error("FRIDAY E2E ACCEPTANCE TEST SUITE: FAILURES DETECTED");
  }
  console.log("=".repeat(80));
}

runFridayE2EAcceptance()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

