import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  Role,
  OrderStatus,
  ProjectStatus,
  SalesStatus,
  QuotationStatus,
  ServiceStatus,
} from "@/lib/generated/prisma/enums";
import {
  Users,
  UserPlus,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  CheckSquare,
  ArrowRight,
  Sparkles,
  CreditCard,
} from "lucide-react";
import {
  ClientGrowthChart,
  ClientOverviewChart,
} from "@/components/dashboard/dashboard-charts";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;

  // Role visibility clauses
  const customerFilter = isAdmin
    ? { archivedAt: null }
    : { archivedAt: null, OR: [{ assignedToId: user.id }, { createdById: user.id }] };

  const leadFilter = isAdmin
    ? {}
    : { OR: [{ assignedToId: user.id }, { createdById: user.id }] };

  const orderFilter = isAdmin
    ? {}
    : {
        OR: [
          { responsibleEmployeeId: user.id },
          { createdById: user.id },
          { customer: { assignedToId: user.id } },
        ],
      };

  const projectFilter = isAdmin
    ? {}
    : {
        OR: [
          { assignedToId: user.id },
          { createdById: user.id },
          { customer: { assignedToId: user.id } },
        ],
      };

  // 1. Total Customers
  // 2. New Leads
  // 3. Open Quotations
  // 4. Won Orders
  // 5. Lost Orders
  // 6. Ongoing Projects
  // 7. Orders & Payments for Cash Received & Outstanding Balance
  // 8. Recurring MRR
  // 9. Upcoming Tasks
  // 10. Active Employees for Sales Performance
  const [
    totalCustomers,
    archivedCount,
    newLeadsCount,
    openQuotationsCount,
    wonOrdersCount,
    lostOrdersCount,
    lostSalesCount,
    ongoingProjectsCount,
    allOrders,
    paymentsSum,
    soldRecurringServices,
    upcomingTasks,
    activeEmployees,
    recentActivities,
  ] = await Promise.all([
    // Metric 1: Total active customers
    prisma.customer.count({ where: customerFilter }),
    prisma.customer.count({ where: { archivedAt: { not: null } } }),

    // Metric 2: New leads
    prisma.lead.count({ where: { ...leadFilter, status: SalesStatus.NEW_LEAD } }),

    // Metric 3: Open quotations
    prisma.quotation.count({
      where: {
        status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] },
        ...(isAdmin ? {} : { OR: [{ createdById: user.id }, { responsibleEmployeeId: user.id }] }),
      },
    }),

    // Metric 4: Won orders
    prisma.order.count({
      where: {
        ...orderFilter,
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION, OrderStatus.COMPLETED] },
      },
    }),

    // Metric 5: Lost orders & lost sales deals
    prisma.order.count({
      where: { ...orderFilter, status: OrderStatus.CANCELLED },
    }),
    prisma.sale.count({
      where: {
        status: SalesStatus.DEAL_LOST,
        ...(isAdmin ? {} : { OR: [{ assignedToId: user.id }, { createdById: user.id }] }),
      },
    }),

    // Metric 6: Ongoing projects
    prisma.project.count({
      where: {
        ...projectFilter,
        status: { not: ProjectStatus.PROJECT_COMPLETED },
      },
    }),

    // Metric 7 & 8: Orders with payments for financial calculations
    prisma.order.findMany({
      where: orderFilter,
      select: {
        id: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        payments: {
          select: {
            amount: true,
          },
        },
      },
    }),

    // Actual cash received from payments
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: isAdmin
        ? {}
        : {
            order: {
              OR: [
                { responsibleEmployeeId: user.id },
                { createdById: user.id },
                { customer: { assignedToId: user.id } },
              ],
            },
          },
    }),

    // Metric 9: Recurring monthly revenue (MRR)
    prisma.customerService.findMany({
      where: {
        status: ServiceStatus.SOLD,
        isRecurring: true,
      },
      select: { agreedPrice: true },
    }),

    // Metric 10: Upcoming tasks
    prisma.saleTask.findMany({
      where: {
        isCompleted: false,
        ...(isAdmin ? {} : { assignedToId: user.id }),
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      include: {
        assignedTo: { select: { name: true, email: true } },
        sale: { select: { id: true, title: true } },
      },
    }),

    // Metric 11: Employee Sales Performance data
    prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedLeads: { select: { id: true, status: true } },
        responsibleQuotations: { select: { id: true } },
        responsibleOrders: {
          where: {
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.IN_PRODUCTION] },
          },
          select: { totalAmount: true },
        },
        assignedSaleTasks: {
          where: { isCompleted: false },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    }),

    // Recent activity feed
    prisma.customerActivity.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, companyName: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  // Financial calculations
  let totalBookedOrderValue = 0;
  let totalOutstandingPayments = 0;

  for (const o of allOrders) {
    const totalAmount = Math.round((o.totalAmount || 0) * 100) / 100;
    const paid = Math.round(
      o.payments.reduce((sum, p) => sum + p.amount, 0) * 100
    ) / 100;
    const outstanding = Math.round(Math.max(0, totalAmount - paid) * 100) / 100;

    if (
      o.status === OrderStatus.CONFIRMED ||
      o.status === OrderStatus.COMPLETED ||
      o.status === OrderStatus.IN_PRODUCTION
    ) {
      totalBookedOrderValue += totalAmount;
    }
    totalOutstandingPayments += outstanding;
  }

  const totalCashReceived = Math.round((paymentsSum._sum.amount || 0) * 100) / 100;
  const recurringMRR = Math.round(
    soldRecurringServices.reduce((sum, s) => sum + (s.agreedPrice || 0), 0) * 100
  ) / 100;

  const totalLostCount = lostOrdersCount + lostSalesCount;

  function formatCurrency(val: number) {
    return `€${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(d: Date | string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  // Greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="space-y-8">
      {/* 1. Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
            {greeting}, {user.name || "EmanCopys Admin"} 👋
          </h1>
          <p className="text-sm text-[#677770] mt-1.5 font-normal">
            Company performance overview across clients, sales, production, payments, and recurring revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/payments"
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#e1e6e3] text-xs font-semibold text-[#182922] hover:bg-[#fafbfb] transition-all shadow-2xs flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4 text-[#083d34]" />
            <span>Payments Hub</span>
          </Link>
          <Link
            href="/services"
            className="px-3.5 py-2 rounded-2xl bg-[#083d34] text-white text-xs font-semibold hover:bg-[#062e26] transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#f5adb2]" />
            <span>MRR & Retainers</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Tier Financial & Cashflow Cards (4 Distinct Visual Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 8: Booked Order Revenue (Featured Dark Pine Green Card with Botanical Artwork) */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[160px]">
          <div className="absolute -bottom-2 -right-2 w-32 h-32 pointer-events-none opacity-80">
            <svg viewBox="0 0 150 150" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="dbLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5adb2" />
                  <stop offset="100%" stopColor="#c86e75" />
                </linearGradient>
              </defs>
              <path
                d="M130 150 C110 110 90 70 80 30"
                stroke="#c86e75"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M80 30 C70 5 80 -15 90 -20 C95 10 90 25 80 30 Z"
                fill="url(#dbLeaf)"
              />
              <path
                d="M85 55 C55 35 35 45 25 60 C40 80 65 80 85 55 Z"
                fill="url(#dbLeaf)"
              />
              <path
                d="M90 85 C120 65 145 75 155 90 C140 110 115 105 90 85 Z"
                fill="url(#dbLeaf)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <DollarSign className="w-5 h-5 text-[#52c41a]" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              8. Booked Order Value
            </div>
            <div className="font-serif text-3xl font-normal text-white mt-1">
              {formatCurrency(totalBookedOrderValue)}
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#9ab7b0] font-medium flex items-center gap-1 mt-2">
            <span>Cash collected: {formatCurrency(totalCashReceived)}</span>
          </div>
        </div>

        {/* Metric 9: Recurring Monthly Revenue (Soft Blush Pink) */}
        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              9. Recurring Revenue (MRR)
            </div>
            <div className="font-serif text-3xl font-normal text-[#13231c] mt-1">
              {formatCurrency(recurringMRR)}
              <span className="text-xs font-sans text-[#708078] font-normal">/mo</span>
            </div>
          </div>
          <div className="text-xs text-[#2e7d32] font-medium flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{soldRecurringServices.length} active service agreements</span>
          </div>
        </div>

        {/* Metric 7: Outstanding Payments (Warm Ivory) */}
        <div className="rounded-[26px] bg-[#fbf5ee] border border-[#faecd8] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f9ebd7] border border-[#f5dfbf] flex items-center justify-center text-[#ba7528]">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              7. Outstanding Payments
            </div>
            <div className="font-serif text-3xl font-normal text-[#c95965] mt-1">
              {formatCurrency(totalOutstandingPayments)}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-2">
            Unpaid balance across client orders
          </div>
        </div>

        {/* Metric 1: Total Active Customers (Sage Green) */}
        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              1. Total Active Clients
            </div>
            <div className="font-serif text-3xl font-normal text-[#13231c] mt-1">
              {totalCustomers}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-2">
            {archivedCount} archived clients preserved
          </div>
        </div>
      </div>

      {/* 3. Pipeline & Operations Operational Row (Metrics 2, 3, 4, 5, 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Metric 2: New Leads */}
        <Link
          href="/leads?status=NEW"
          className="p-5 rounded-2xl bg-white border border-[#e8ecea] hover:border-[#083d34] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
              2. New Leads
            </span>
            <UserPlus className="w-4 h-4 text-[#8aa9a1] group-hover:text-[#083d34] transition-colors" />
          </div>
          <span className="font-serif text-3xl font-semibold text-[#182922] mt-2 block">
            {newLeadsCount}
          </span>
          <span className="text-[10px] text-[#8aa9a1] mt-0.5 block">
            Incoming opportunities
          </span>
        </Link>

        {/* Metric 3: Open Quotations */}
        <Link
          href="/quotations"
          className="p-5 rounded-2xl bg-white border border-[#e8ecea] hover:border-[#083d34] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
              3. Open Quotes
            </span>
            <FileText className="w-4 h-4 text-[#8aa9a1] group-hover:text-[#083d34] transition-colors" />
          </div>
          <span className="font-serif text-3xl font-semibold text-[#182922] mt-2 block">
            {openQuotationsCount}
          </span>
          <span className="text-[10px] text-[#8aa9a1] mt-0.5 block">
            Draft or Sent to clients
          </span>
        </Link>

        {/* Metric 4: Won Orders */}
        <Link
          href="/orders"
          className="p-5 rounded-2xl bg-white border border-[#e8ecea] hover:border-[#083d34] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#2d7a4f] uppercase tracking-wider">
              4. Won Orders
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#2d7a4f]" />
          </div>
          <span className="font-serif text-3xl font-semibold text-[#2d7a4f] mt-2 block">
            {wonOrdersCount}
          </span>
          <span className="text-[10px] text-[#2d7a4f] mt-0.5 block">
            Confirmed contracts
          </span>
        </Link>

        {/* Metric 5: Lost Orders / Deals */}
        <div className="p-5 rounded-2xl bg-white border border-[#e8ecea] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#c95965] uppercase tracking-wider">
              5. Lost Orders
            </span>
            <XCircle className="w-4 h-4 text-[#c95965]" />
          </div>
          <span className="font-serif text-3xl font-semibold text-[#c95965] mt-2 block">
            {totalLostCount}
          </span>
          <span className="text-[10px] text-[#c95965] mt-0.5 block">
            Cancelled or lost deals
          </span>
        </div>

        {/* Metric 6: Ongoing Projects */}
        <Link
          href="/projects"
          className="p-5 rounded-2xl bg-white border border-[#e8ecea] hover:border-[#083d34] transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
              6. Projects
            </span>
            <Briefcase className="w-4 h-4 text-[#8aa9a1] group-hover:text-[#083d34] transition-colors" />
          </div>
          <span className="font-serif text-3xl font-semibold text-[#182922] mt-2 block">
            {ongoingProjectsCount}
          </span>
          <span className="text-[10px] text-[#8aa9a1] mt-0.5 block">
            Websites in production
          </span>
        </Link>
      </div>

      {/* 4. Metric 11: Employee Sales Performance Table */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f0f3f1]">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#13231c]">
              11. Employee Sales & Pipeline Performance
            </h3>
            <p className="text-xs text-[#708078] mt-0.5">
              Live performance metrics derived directly from real CRM assignments, quotations, won orders, and revenue.
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/employees"
              className="text-xs font-semibold text-[#083d34] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Manage Team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f0f3f1] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase">
                <th className="pb-3 font-semibold">Team Member</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold text-center">Leads Assigned</th>
                <th className="pb-3 font-semibold text-center">Quotes Created</th>
                <th className="pb-3 font-semibold text-center">Orders Won</th>
                <th className="pb-3 font-semibold text-right">Revenue Generated</th>
                <th className="pb-3 font-semibold text-center">Open Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7faf8]">
              {activeEmployees.map((emp) => {
                const revenue = emp.responsibleOrders.reduce(
                  (sum, o) => sum + (o.totalAmount || 0),
                  0
                );
                const initials = (emp.name || "EC")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={emp.id} className="hover:bg-[#fafbfb] transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#083d34] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-[#182922] block">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-[#8a9992]">
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 pr-4">
                      {emp.role === Role.ADMIN ? (
                        <Badge className="bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7] text-[9px] font-medium">
                          Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-[#f0f7f3] text-[#377b58] border-[#d6ebd9] text-[9px] font-medium">
                          Employee
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 pr-4 text-center font-medium text-[#182922]">
                      {emp.assignedLeads.length}
                    </td>

                    <td className="py-3.5 pr-4 text-center font-medium text-[#182922]">
                      {emp.responsibleQuotations.length}
                    </td>

                    <td className="py-3.5 pr-4 text-center font-semibold text-[#2d7a4f]">
                      {emp.responsibleOrders.length}
                    </td>

                    <td className="py-3.5 pr-4 text-right font-serif font-semibold text-[#182922]">
                      {formatCurrency(revenue)}
                    </td>

                    <td className="py-3.5 text-center">
                      {emp.assignedSaleTasks.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#fbf5ee] text-[#ba7528] text-[10px] font-medium">
                          {emp.assignedSaleTasks.length} pending
                        </span>
                      ) : (
                        <span className="text-[#a0aca6]">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Middle Section: Growth Analytics & Upcoming Tasks (Metric 10) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <ClientGrowthChart />
        </div>

        {/* Metric 10: Upcoming Tasks Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#e8ecea] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-base font-semibold text-[#182922] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#ba7528]" />
                <span>10. Upcoming Tasks</span>
              </h3>
              <span className="text-[11px] font-semibold text-[#ba7528]">
                {upcomingTasks.length} pending
              </span>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#708078]">
                No pending tasks with upcoming due dates.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-[#faf8f5] border border-[#f0eee9]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-xs text-[#182922]">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-[#ba7528] font-medium shrink-0">
                        {formatDate(t.dueDate)}
                      </span>
                    </div>
                    {t.sale && (
                      <div className="text-[11px] text-[#708078] mt-1">
                        Deal: {t.sale.title}
                      </div>
                    )}
                    <div className="text-[10px] text-[#8a9992] mt-0.5">
                      Assigned to: {t.assignedTo?.name || "Unassigned"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/sales"
            className="text-xs font-semibold text-[#083d34] hover:underline pt-3 border-t border-[#f0f3f1] flex items-center justify-between mt-4"
          >
            <span>View Deal Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 6. Bottom Feeds: Client Overview Chart & Recent Engagements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4">
          <ClientOverviewChart
            activeCount={totalCustomers}
            archivedCount={archivedCount}
          />
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#13231c]">
                Recent Client Engagements
              </h3>
              <p className="text-xs text-[#708078] mt-0.5">
                Latest client touchpoints logged across calls, meetings, and conversations.
              </p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-semibold text-[#c86e75] hover:text-[#9e4951] flex items-center gap-1 transition-colors"
            >
              <span>All Clients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#708078]">
              No activities logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between p-3.5 rounded-2xl bg-[#faf8f5] border border-[#f0eee9]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#182922]">
                        {act.title}
                      </span>
                      <Badge className="bg-white border-[#e1e6e3] text-[#505f58] text-[9px] uppercase">
                        {act.activityType}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#708078] mt-1 line-clamp-1">
                      {act.description || `Engagement with ${act.customer.companyName}`}
                    </p>
                    <div className="text-[10px] text-[#8a9992] mt-0.5">
                      {act.customer.companyName} &bull; by {act.user.name || act.user.email}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#8a9992] font-medium shrink-0 ml-3">
                    {formatDate(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
