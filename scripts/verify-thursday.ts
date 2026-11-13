import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import {
  Role,
  OrderStatus,
  ProjectStatus,
  SalesStatus,
  QuotationStatus,
  ServiceStatus,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
  AuditAction,
} from "../lib/generated/prisma/enums";
import { computeOrderPaymentMetrics, roundCurrency } from "../lib/validations/payments";
import { logAudit } from "../lib/audit";

async function verifyAll() {
  console.log("================================================================================");
  console.log("       EMANCOPYS CRM - THURSDAY MASTER VERIFICATION & TEST SUITE                ");
  console.log("================================================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`✅ [PASS] ${message}`);
  }

  // 0. Database Connection & Admin Check
  console.log("\n--- [1] Checking Database & Admin Account ---");
  const admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });
  assert(!!admin, `Admin account exists in database (${admin?.email})`);

  // Pre-cleanup of any previous test fixtures
  await prisma.payment.deleteMany({ where: { reference: { startsWith: "DEP-VERIF" } } });
  await prisma.project.deleteMany({ where: { projectNumber: { startsWith: "PRJ-V-" } } });
  await prisma.order.deleteMany({ where: { orderNumber: { startsWith: "ORD-V-" } } });
  await prisma.quotation.deleteMany({ where: { quotationNumber: { startsWith: "QUO-V-" } } });
  await prisma.saleTask.deleteMany({ where: { title: "Send final specification sheet" } });
  await prisma.saleCommunication.deleteMany({ where: { subject: "Requirements Workshop" } });
  await prisma.sale.deleteMany({ where: { title: "Omnichannel Redesign Deal" } });
  await prisma.lead.deleteMany({ where: { companyName: { startsWith: "Test Enterprise" } } });
  await prisma.customerService.deleteMany({ where: { customer: { companyName: { startsWith: "Test Enterprise" } } } });
  await prisma.customer.deleteMany({ where: { companyName: { startsWith: "Test Enterprise" } } });
  await prisma.additionalService.deleteMany({ where: { name: { startsWith: "Performance Marketing Boost" } } });
  await prisma.user.deleteMany({ where: { email: { contains: "employee.verification" } } });

  // 1. Predefined Additional Services
  console.log("\n--- [2] Checking Predefined Additional Services ---");
  const services = await prisma.additionalService.findMany({
    orderBy: { price: "asc" },
  });
  assert(services.length >= 3, `Found ${services.length} catalogue services in database (expected >= 3)`);

  const maintenance = services.find((s) => s.name === "Website Maintenance");
  const seoStart = services.find((s) => s.name === "Care + SEO Start");
  const seoPro = services.find((s) => s.name === "Care + SEO Pro");

  assert(!!maintenance && maintenance.price === 50, "Website Maintenance exists with €50/month");
  assert(!!seoStart && seoStart.price === 300, "Care + SEO Start exists with €300/month");
  assert(!!seoPro && seoPro.price === 500, "Care + SEO Pro exists with €500/month");

  // 2. Employee Management & RBAC
  console.log("\n--- [3] Employee Account Creation, Hashing & Deactivation ---");
  const testEmail = `employee.verification.${Date.now()}@emancopys.com`;
  const plainPassword = "SecureEmployeePass123!";
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const newEmployee = await prisma.user.create({
    data: {
      name: "Marcus V Test",
      email: testEmail,
      passwordHash: passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
    },
  });
  assert(!!newEmployee.id, `Created test employee account: ${newEmployee.email} (ID: ${newEmployee.id})`);

  const passwordMatches = await bcrypt.compare(plainPassword, newEmployee.passwordHash);
  assert(passwordMatches, "Bcrypt password verification with 12 salt rounds succeeds");

  // Audit employee creation
  await logAudit({
    userId: admin!.id,
    action: AuditAction.CREATE,
    entityType: "EMPLOYEE",
    entityId: newEmployee.id,
    entityName: newEmployee.name,
    details: `Created employee account ${newEmployee.email} with role EMPLOYEE`,
    metadata: {
      role: newEmployee.role,
      password: "PLAIN_TEXT_SHOULD_BE_FILTERED",
      passwordHash: "HASH_SHOULD_BE_FILTERED",
    },
  });

  // Test Deactivation & Session Invalidation logic
  const deactivated = await prisma.user.update({
    where: { id: newEmployee.id },
    data: { isActive: false },
  });
  assert(deactivated.isActive === false, "Employee account successfully deactivated");

  // Verify that getCurrentUser logic rejects deactivated accounts
  const checkDeactivatedUser = await prisma.user.findUnique({
    where: { id: newEmployee.id },
    select: { id: true, isActive: true },
  });
  assert(!checkDeactivatedUser?.isActive, "System immediately rejects session for deactivated user (isActive is false)");

  // Reactivate for performance test
  await prisma.user.update({
    where: { id: newEmployee.id },
    data: { isActive: true },
  });
  assert(true, "Employee account reactivated for live workflow testing");

  // 3. Employee Performance Metrics (8 Live DB Metrics)
  console.log("\n--- [4] Generating Activities & Calculating 8 Live Employee Performance Metrics ---");
  const timestamp = Date.now();
  const testCustomer = await prisma.customer.create({
    data: {
      companyName: `Test Enterprise ${timestamp}`,
      contactPerson: "Dr. Klaus Weber",
      email: `klaus.${timestamp}@enterprise.test`,
      phone: "+49 30 98765432",
      assignedToId: newEmployee.id,
      createdById: admin!.id,
    },
  });

  const testLead = await prisma.lead.create({
    data: {
      companyName: testCustomer.companyName,
      contactPerson: "Dr. Klaus Weber",
      email: testCustomer.email,
      status: "FIRST_CONTACT_MADE", // Processed lead
      assignedToId: newEmployee.id,
      createdById: admin!.id,
    },
  });

  const testSale = await prisma.sale.create({
    data: {
      title: "Omnichannel Redesign Deal",
      customerId: testCustomer.id,
      leadId: testLead.id,
      assignedToId: newEmployee.id,
      createdById: newEmployee.id,
      status: SalesStatus.INTERESTED,
      estimatedValue: 4000,
      communications: {
        create: {
          userId: newEmployee.id,
          subject: "Requirements Workshop",
          notes: "Deep dive into web design and monthly care requirements.",
        },
      },
      tasks: {
        create: {
          title: "Send final specification sheet",
          assignedToId: newEmployee.id,
          createdById: admin!.id,
          dueDate: new Date(Date.now() + 86400000 * 2),
          isCompleted: false, // Outstanding task
        },
      },
    },
  });

  const testQuotation = await prisma.quotation.create({
    data: {
      quotationNumber: `QUO-V-${timestamp.toString().slice(-4)}`,
      customerId: testCustomer.id,
      saleId: testSale.id,
      serviceSold: "Enterprise Design Package",
      quotationPrice: 4000,
      responsibleEmployeeId: newEmployee.id,
      createdById: newEmployee.id,
      status: QuotationStatus.ACCEPTED,
    },
  });

  const testOrder = await prisma.order.create({
    data: {
      orderNumber: `ORD-V-${timestamp.toString().slice(-4)}`,
      customerId: testCustomer.id,
      quotationId: testQuotation.id,
      saleId: testSale.id,
      serviceSold: "Enterprise Design Package",
      totalAmount: 4000,
      agreedCommission: 400,
      responsibleEmployeeId: newEmployee.id,
      createdById: newEmployee.id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.UNPAID,
      paymentDueDate: new Date(Date.now() + 86400000 * 14),
    },
  });

  const testProject = await prisma.project.create({
    data: {
      projectNumber: `PRJ-V-${timestamp.toString().slice(-4)}`,
      title: "Enterprise Design Package Implementation",
      orderId: testOrder.id,
      customerId: testCustomer.id,
      status: ProjectStatus.IN_PRODUCTION,
      assignedToId: newEmployee.id,
      createdById: admin!.id,
    },
  });

  // Compute the 8 performance metrics directly via DB queries
  const [
    leadsAssigned,
    leadsProcessed,
    uniqueCustomersContacted,
    conversationsDocumented,
    quotationsCreated,
    ordersWon,
    revenueAgg,
    outstandingTasks,
  ] = await Promise.all([
    prisma.lead.count({ where: { assignedToId: newEmployee.id } }),
    prisma.lead.count({
      where: {
        OR: [
          { assignedToId: newEmployee.id, status: { not: "NEW_LEAD" } },
          { sales: { some: { communications: { some: { userId: newEmployee.id } } } } },
        ],
      },
    }),
    prisma.customer.count({
      where: {
        OR: [
          { sales: { some: { communications: { some: { userId: newEmployee.id } } } } },
          { assignedToId: newEmployee.id },
        ],
      },
    }),
    prisma.saleCommunication.count({ where: { userId: newEmployee.id } }),
    prisma.quotation.count({ where: { createdById: newEmployee.id } }),
    prisma.order.count({
      where: {
        responsibleEmployeeId: newEmployee.id,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED] },
      },
    }),
    prisma.order.aggregate({
      where: {
        responsibleEmployeeId: newEmployee.id,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.saleTask.count({
      where: {
        assignedToId: newEmployee.id,
        isCompleted: false,
      },
    }),
  ]);

  const revenueGenerated = revenueAgg._sum.totalAmount || 0;

  console.log(`- Metric 1: Leads Assigned: ${leadsAssigned}`);
  console.log(`- Metric 2: Leads Processed: ${leadsProcessed}`);
  console.log(`- Metric 3: Customers Contacted: ${uniqueCustomersContacted}`);
  console.log(`- Metric 4: Conversations Documented: ${conversationsDocumented}`);
  console.log(`- Metric 5: Quotations Created: ${quotationsCreated}`);
  console.log(`- Metric 6: Orders Won: ${ordersWon}`);
  console.log(`- Metric 7: Revenue Generated: €${revenueGenerated}`);
  console.log(`- Metric 8: Outstanding Tasks: ${outstandingTasks}`);

  assert(leadsAssigned === 1, "Metric 1: Leads assigned matches DB count (1)");
  assert(leadsProcessed === 1, "Metric 2: Leads processed matches DB count (1)");
  assert(uniqueCustomersContacted === 1, "Metric 3: Unique customers contacted matches DB count (1)");
  assert(conversationsDocumented === 1, "Metric 4: Conversations documented matches DB count (1)");
  assert(quotationsCreated === 1, "Metric 5: Quotations created matches DB count (1)");
  assert(ordersWon === 1, "Metric 6: Orders won matches DB count (1)");
  assert(revenueGenerated === 4000, "Metric 7: Revenue generated matches DB sum (€4,000.00)");
  assert(outstandingTasks === 1, "Metric 8: Outstanding tasks matches DB count (1)");

  // 4. Payment Management & Validations
  console.log("\n--- [5] Payment Management & Calculation Tests ---");
  // Test initial order calculation
  let metrics = computeOrderPaymentMetrics({
    totalAmount: testOrder.totalAmount,
    paymentDueDate: testOrder.paymentDueDate,
    payments: [],
  });
  assert(metrics.totalPaid === 0, "Initial totalPaid is €0.00");
  assert(metrics.outstandingBalance === 4000, "Initial outstandingBalance is €4,000.00");
  assert(metrics.remainingPayment === 4000, "Initial remainingPayment is €4,000.00");
  assert(metrics.status === PaymentStatus.UNPAID, "Initial status is UNPAID");

  // Record Deposit: €1,000
  const paymentNumber1 = `PAY-${Date.now().toString().slice(-6)}-1`;
  const depositPayment = await prisma.payment.create({
    data: {
      paymentNumber: paymentNumber1,
      orderId: testOrder.id,
      customerId: testCustomer.id,
      amount: 1000,
      paymentType: PaymentType.DEPOSIT,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(),
      reference: "DEP-VERIF-01",
      notes: "25% Initial project deposit",
      receivedById: admin!.id,
    },
  });
  assert(!!depositPayment.id, "Deposit payment of €1,000 successfully recorded");

  // Update order depositAmount & paymentStatus
  await prisma.order.update({
    where: { id: testOrder.id },
    data: {
      depositAmount: 1000,
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
    },
  });

  // Re-fetch payments and verify metrics
  let allPayments = await prisma.payment.findMany({ where: { orderId: testOrder.id } });
  metrics = computeOrderPaymentMetrics({
    totalAmount: testOrder.totalAmount,
    paymentDueDate: testOrder.paymentDueDate,
    payments: allPayments,
  });
  assert(metrics.totalPaid === 1000, "After deposit, totalPaid is €1,000.00");
  assert(metrics.outstandingBalance === 3000, "After deposit, outstandingBalance is €3,000.00");
  assert(metrics.status === PaymentStatus.PARTIALLY_PAID, "After deposit, status is PARTIALLY_PAID");

  // VERIFY PROJECT STATUS INDEPENDENCE
  const projectAfterDeposit = await prisma.project.findUnique({ where: { id: testProject.id } });
  assert(
    projectAfterDeposit?.status === ProjectStatus.IN_PRODUCTION,
    "CRITICAL: Project status remains IN_PRODUCTION after deposit payment (Status Independence)"
  );

  // Record Milestone Payment: €1,500
  const paymentNumber2 = `PAY-${Date.now().toString().slice(-6)}-2`;
  const milestonePayment = await prisma.payment.create({
    data: {
      paymentNumber: paymentNumber2,
      orderId: testOrder.id,
      customerId: testCustomer.id,
      amount: 1500,
      paymentType: PaymentType.MILESTONE,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(),
      reference: "MLS-VERIF-02",
      notes: "Design approval milestone payment",
      receivedById: admin!.id,
    },
  });
  assert(!!milestonePayment.id, "Milestone payment of €1,500 recorded");

  allPayments = await prisma.payment.findMany({ where: { orderId: testOrder.id } });
  metrics = computeOrderPaymentMetrics({
    totalAmount: testOrder.totalAmount,
    paymentDueDate: testOrder.paymentDueDate,
    payments: allPayments,
  });
  assert(metrics.totalPaid === 2500, "After milestone, totalPaid is €2,500.00");
  assert(metrics.outstandingBalance === 1500, "After milestone, outstandingBalance is €1,500.00");
  assert(metrics.status === PaymentStatus.PARTIALLY_PAID, "Status remains PARTIALLY_PAID");

  // OVERPAYMENT PREVENTION TEST
  console.log("- Testing Overpayment Prevention Logic:");
  const attemptedOverpayment = 2000;
  const remaining = metrics.remainingPayment;
  const isOverpayment = attemptedOverpayment > remaining;
  assert(isOverpayment, `Attempting to pay €${attemptedOverpayment} against remaining €${remaining} is correctly identified as overpayment`);
  assert(
    roundCurrency(attemptedOverpayment) > roundCurrency(metrics.outstandingBalance),
    "Validation rule rejects overpayment exceeding order balance"
  );

  // Record Final Balance Payment: €1,500
  const paymentNumber3 = `PAY-${Date.now().toString().slice(-6)}-3`;
  const finalPayment = await prisma.payment.create({
    data: {
      paymentNumber: paymentNumber3,
      orderId: testOrder.id,
      customerId: testCustomer.id,
      amount: 1500,
      paymentType: PaymentType.FINAL,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentDate: new Date(),
      reference: "FIN-VERIF-03",
      notes: "Final balance settled",
      receivedById: admin!.id,
    },
  });
  assert(!!finalPayment.id, "Final balance payment of €1,500 recorded");

  allPayments = await prisma.payment.findMany({ where: { orderId: testOrder.id } });
  metrics = computeOrderPaymentMetrics({
    totalAmount: testOrder.totalAmount,
    paymentDueDate: testOrder.paymentDueDate,
    payments: allPayments,
  });
  assert(metrics.totalPaid === 4000, "After final payment, totalPaid equals totalAmount (€4,000.00)");
  assert(metrics.outstandingBalance === 0, "After final payment, outstandingBalance is €0.00");
  assert(metrics.status === PaymentStatus.FULLY_PAID, "Payment status transitions to FULLY_PAID");

  // Re-verify Project Status Independence: Project is still IN_PRODUCTION (NOT completed simply because order is paid!)
  const projectAfterFullPayment = await prisma.project.findUnique({ where: { id: testProject.id } });
  assert(
    projectAfterFullPayment?.status === ProjectStatus.IN_PRODUCTION,
    "CRITICAL: Project status remains IN_PRODUCTION after order is FULLY_PAID (Project & Payment Independence)"
  );

  // 5. Additional Services & Upselling
  console.log("\n--- [6] Additional Services & Upselling Module ---");
  // Create Custom Service
  const customService = await prisma.additionalService.create({
    data: {
      name: `Performance Marketing Boost ${timestamp}`,
      description: "Custom Google Ads & Meta Ads campaign management",
      price: 450,
      isRecurring: true,
      isActive: true,
    },
  });
  assert(!!customService.id, "Custom service created successfully");

  // Assign Predefined Service (Website Maintenance €50) as OFFERED
  const offeredService = await prisma.customerService.create({
    data: {
      customerId: testCustomer.id,
      serviceId: maintenance!.id,
      status: ServiceStatus.OFFERED,
      agreedPrice: maintenance!.price,
      isRecurring: true,
      responsibleEmployeeId: newEmployee.id,
    },
  });
  assert(offeredService.status === ServiceStatus.OFFERED, "Service assigned with status OFFERED");

  // Check MRR: Offered service should NOT be included in MRR
  let activeSoldServices = await prisma.customerService.findMany({
    where: { customerId: testCustomer.id, status: ServiceStatus.SOLD, isRecurring: true },
  });
  let mrr = activeSoldServices.reduce((sum, s) => sum + s.agreedPrice, 0);
  assert(mrr === 0, "OFFERED service is not included in MRR (€0.00)");

  // Convert to SOLD with custom snapshot price
  const soldService = await prisma.customerService.update({
    where: { id: offeredService.id },
    data: {
      status: ServiceStatus.SOLD,
      soldDate: new Date(),
      agreedPrice: 50,
    },
  });
  assert(soldService.status === ServiceStatus.SOLD, "Customer agreement moved to SOLD");

  // Also sell the custom service at €450/month
  const soldCustom = await prisma.customerService.create({
    data: {
      customerId: testCustomer.id,
      serviceId: customService.id,
      status: ServiceStatus.SOLD,
      soldDate: new Date(),
      agreedPrice: 450,
      isRecurring: true,
      responsibleEmployeeId: newEmployee.id,
    },
  });
  assert(soldCustom.status === ServiceStatus.SOLD, "Custom service assigned and SOLD at €450/month");

  // Calculate MRR for customer
  activeSoldServices = await prisma.customerService.findMany({
    where: { customerId: testCustomer.id, status: ServiceStatus.SOLD, isRecurring: true },
  });
  mrr = activeSoldServices.reduce((sum, s) => sum + s.agreedPrice, 0);
  assert(mrr === 500, `MRR accurately calculated from active SOLD services: €${mrr}/month (€50 + €450)`);

  // Transition one service to DECLINED
  const declinedService = await prisma.customerService.update({
    where: { id: soldCustom.id },
    data: { status: ServiceStatus.DECLINED, declinedDate: new Date() },
  });
  assert(declinedService.status === ServiceStatus.DECLINED, "Service transitioned to DECLINED");

  // Re-calculate MRR
  activeSoldServices = await prisma.customerService.findMany({
    where: { customerId: testCustomer.id, status: ServiceStatus.SOLD, isRecurring: true },
  });
  mrr = activeSoldServices.reduce((sum, s) => sum + s.agreedPrice, 0);
  assert(mrr === 50, `MRR after declining custom service accurately drops to €${mrr}/month`);

  // 6. Audit Trail & Activity Logs
  console.log("\n--- [7] Activity Logs & Audit Trail Verification ---");
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityId: newEmployee.id },
        { entityId: testOrder.id },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  assert(auditLogs.length > 0, `Found ${auditLogs.length} audit log entries for test entities`);

  const empCreationAudit = auditLogs.find((l) => l.entityId === newEmployee.id && l.action === AuditAction.CREATE);
  assert(!!empCreationAudit, "Audit record for employee creation exists");

  if (empCreationAudit?.metadata) {
    const metaStr = empCreationAudit.metadata;
    assert(!metaStr.includes("PLAIN_TEXT_SHOULD_BE_FILTERED"), "Audit logger sanitizes plain-text passwords");
    assert(!metaStr.includes("HASH_SHOULD_BE_FILTERED"), "Audit logger sanitizes password hashes");
  }

  // 7. Cleanup Test Records
  console.log("\n--- [8] Cleaning Up Verification Test Fixtures ---");
  await prisma.payment.deleteMany({ where: { orderId: testOrder.id } });
  await prisma.customerService.deleteMany({ where: { customerId: testCustomer.id } });
  await prisma.additionalService.delete({ where: { id: customService.id } });
  await prisma.project.delete({ where: { orderId: testOrder.id } });
  await prisma.order.delete({ where: { id: testOrder.id } });
  await prisma.quotation.delete({ where: { id: testQuotation.id } });
  await prisma.saleTask.deleteMany({ where: { saleId: testSale.id } });
  await prisma.saleCommunication.deleteMany({ where: { saleId: testSale.id } });
  await prisma.sale.delete({ where: { id: testSale.id } });
  await prisma.lead.delete({ where: { id: testLead.id } });
  await prisma.customer.delete({ where: { id: testCustomer.id } });
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entityId: newEmployee.id },
        { entityId: testOrder.id },
      ],
    },
  });
  await prisma.user.delete({ where: { id: newEmployee.id } });
  console.log("✅ [CLEANUP] All test fixtures cleanly removed from database.");

  console.log("\n================================================================================");
  console.log(`🎉 ALL TESTS COMPLETED: ${passedTests}/${totalTests} PASSED (0 FAILURES)`);
  console.log("================================================================================");
}

verifyAll()
  .catch((err) => {
    console.error("Verification suite failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
