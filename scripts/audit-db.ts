import { prisma } from "../lib/prisma";

async function run() {
  const users = await prisma.user.count();
  const customers = await prisma.customer.count();
  const leads = await prisma.lead.count();
  const sales = await prisma.sale.count();
  const quotations = await prisma.quotation.count();
  const orders = await prisma.order.count();
  const projects = await prisma.project.count();
  const payments = await prisma.payment.count();
  const services = await prisma.additionalService.count();
  const customerServices = await prisma.customerService.count();
  const auditLogs = await prisma.auditLog.count();

  console.log("DATABASE COUNTS:", {
    users,
    customers,
    leads,
    sales,
    quotations,
    orders,
    projects,
    payments,
    services,
    customerServices,
    auditLogs,
  });

  const leadRecords = await prisma.lead.findMany({
    select: { id: true, companyName: true, status: true, assignedToId: true },
  });
  console.log("LEAD RECORDS:", leadRecords);

  const saleRecords = await prisma.sale.findMany({
    select: { id: true, title: true, status: true, assignedToId: true },
  });
  console.log("SALE RECORDS:", saleRecords);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

