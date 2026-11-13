import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getEmployeePerformance } from "@/actions/employees";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role } from "@/lib/generated/prisma/enums";
import {
  ArrowLeft,
  Edit,
  Shield,
  CheckCircle2,
  XCircle,
  Briefcase,
  CheckSquare,
  Clock,
} from "lucide-react";

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const admin = await requireAdmin();
  const resolvedParams = await params;
  const data = await getEmployeePerformance(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { employee, metrics, wonOrders, outstandingTasks, recentAuditLogs } = data;

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

  const initials = (employee.name || "EC")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isSelf = employee.id === admin.id;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Team</span>
        </Link>

        <Link href={`/employees/${employee.id}/edit`}>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs gap-1.5 bg-white border-[#e1e6e3]"
          >
            <Edit className="w-3.5 h-3.5 text-[#708078]" />
            <span>Edit Account & Permissions</span>
          </Button>
        </Link>
      </div>

      {/* 2. Employee Profile Header Card */}
      <div className="bg-white rounded-3xl p-7 lg:p-8 border border-[#e8ecea] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#083d34] text-white font-serif text-2xl flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#182922]">
                {employee.name}
              </h1>
              {isSelf && (
                <span className="text-xs text-[#8aa9a1] font-medium">(You)</span>
              )}
            </div>
            <p className="text-xs text-[#708078] mt-0.5">{employee.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {employee.role === Role.ADMIN ? (
                <Badge className="bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7] text-[10px] font-medium gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Administrator</span>
                </Badge>
              ) : (
                <Badge className="bg-[#f0f7f3] text-[#377b58] border-[#d6ebd9] text-[10px] font-medium">
                  Employee
                </Badge>
              )}

              {employee.isActive ? (
                <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-medium gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Account</span>
                </Badge>
              ) : (
                <Badge className="bg-[#fef1f2] text-[#c95965] border-[#fad5d9] text-[10px] font-medium gap-1">
                  <XCircle className="w-3 h-3" />
                  <span>Account Deactivated</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-[#f0f3f1]">
          <span className="text-[11px] text-[#708078] block">Account Created</span>
          <span className="font-medium text-xs text-[#182922] mt-0.5 block">
            {formatDate(employee.createdAt)}
          </span>
        </div>
      </div>

      {/* 3. Section Title */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#182922]">
          Sales & Operational Performance
        </h2>
        <p className="text-xs text-[#708078] mt-0.5">
          Calculated from real CRM leads, conversations, quotations, won orders, and tasks.
        </p>
      </div>

      {/* 4. The 8 Verified Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Leads Assigned */}
        <div className="p-5 rounded-2xl bg-[#faf8f5] border border-[#f0eee9]">
          <span className="text-[11px] font-medium text-[#708078] block">
            1. Leads Assigned
          </span>
          <span className="font-serif text-3xl font-semibold text-[#182922] mt-2 block">
            {metrics.leadsAssigned}
          </span>
          <span className="text-[10px] text-[#8a9992] mt-1 block">
            Currently in portfolio
          </span>
        </div>

        {/* Metric 2: Leads Processed */}
        <div className="p-5 rounded-2xl bg-[#f0f7f3] border border-[#d6ebd9]">
          <span className="text-[11px] font-medium text-[#2d7a4f] block">
            2. Leads Processed
          </span>
          <span className="font-serif text-3xl font-semibold text-[#2d7a4f] mt-2 block">
            {metrics.leadsProcessed}
          </span>
          <span className="text-[10px] text-[#2d7a4f] mt-1 block">
            Advanced beyond new
          </span>
        </div>

        {/* Metric 3: Customers Contacted */}
        <div className="p-5 rounded-2xl bg-[#fbf5ee] border border-[#faecd8]">
          <span className="text-[11px] font-medium text-[#ba7528] block">
            3. Unique Clients Contacted
          </span>
          <span className="font-serif text-3xl font-semibold text-[#ba7528] mt-2 block">
            {metrics.customersContacted}
          </span>
          <span className="text-[10px] text-[#ba7528] mt-1 block">
            Recorded touchpoints
          </span>
        </div>

        {/* Metric 4: Conversations Documented */}
        <div className="p-5 rounded-2xl bg-[#fef1f2] border border-[#fcd9dd]">
          <span className="text-[11px] font-medium text-[#c95965] block">
            4. Conversations Logged
          </span>
          <span className="font-serif text-3xl font-semibold text-[#c95965] mt-2 block">
            {metrics.conversationsDocumented}
          </span>
          <span className="text-[10px] text-[#c95965] mt-1 block">
            Comms, calls & meetings
          </span>
        </div>

        {/* Metric 5: Quotations Created */}
        <div className="p-5 rounded-2xl bg-[#f1edfb] border border-[#ddd4f7]">
          <span className="text-[11px] font-medium text-[#6d51c7] block">
            5. Quotations Created
          </span>
          <span className="font-serif text-3xl font-semibold text-[#6d51c7] mt-2 block">
            {metrics.quotationsCreated}
          </span>
          <span className="text-[10px] text-[#6d51c7] mt-1 block">
            Generated proposals
          </span>
        </div>

        {/* Metric 6: Orders Won */}
        <div className="p-5 rounded-2xl bg-[#e8f6ed] border border-[#cbe8d5]">
          <span className="text-[11px] font-medium text-[#2d7a4f] block">
            6. Orders Won
          </span>
          <span className="font-serif text-3xl font-semibold text-[#2d7a4f] mt-2 block">
            {metrics.ordersWon}
          </span>
          <span className="text-[10px] text-[#2d7a4f] mt-1 block">
            Confirmed client contracts
          </span>
        </div>

        {/* Metric 7: Revenue Generated (Featured) */}
        <div className="p-5 rounded-2xl bg-[#062e26] text-white shadow-xs">
          <span className="text-[11px] font-medium text-[#9ab7b0] block">
            7. Revenue Generated
          </span>
          <span className="font-serif text-2xl font-semibold text-white mt-2 block">
            {formatCurrency(metrics.revenueGenerated)}
          </span>
          <span className="text-[10px] text-[#9ab7b0] mt-1 block">
            From won deals
          </span>
        </div>

        {/* Metric 8: Outstanding Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-[#e8ecea]">
          <span className="text-[11px] font-medium text-[#708078] block">
            8. Outstanding Tasks
          </span>
          <span className="font-serif text-3xl font-semibold text-[#182922] mt-2 block">
            {metrics.outstandingTasksCount}
          </span>
          <span className="text-[10px] text-[#708078] mt-1 block">
            Pending completion
          </span>
        </div>
      </div>

      {/* 5. Two Columns: Won Orders & Open Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Won Orders by Employee */}
        <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-semibold text-[#182922] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#083d34]" />
              <span>Attributed Won Orders ({wonOrders.length})</span>
            </h3>
            <Link
              href="/orders"
              className="text-xs font-semibold text-[#c86e75] hover:underline"
            >
              All Orders
            </Link>
          </div>

          {wonOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#708078]">
              No won orders recorded for this employee yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {wonOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#f0eee9]"
                >
                  <div>
                    <Link
                      href={`/orders/${o.id}`}
                      className="font-mono text-xs font-semibold text-[#083d34] hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <div className="text-[11px] text-[#708078] mt-0.5">
                      {o.customer.companyName} • {o.serviceSold}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-sm font-semibold text-[#182922]">
                      {formatCurrency(o.totalAmount)}
                    </span>
                    <span className="text-[10px] text-[#8a9992] block">
                      {formatDate(o.orderDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outstanding Tasks */}
        <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-base font-semibold text-[#182922] flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#ba7528]" />
              <span>Outstanding Assigned Tasks ({outstandingTasks.length})</span>
            </h3>
          </div>

          {outstandingTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#708078]">
              No outstanding tasks assigned to this employee.
            </div>
          ) : (
            <div className="space-y-2.5">
              {outstandingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl bg-[#faf8f5] border border-[#f0eee9]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-[#182922]">
                      {t.title}
                    </span>
                    <span className="text-[10px] text-[#ba7528] font-medium shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due {formatDate(t.dueDate)}
                    </span>
                  </div>
                  {t.sale && (
                    <div className="text-[11px] text-[#708078] mt-1">
                      Deal: {t.sale.title}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Recent Audit Trail for this Employee */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base font-semibold text-[#182922] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#083d34]" />
            <span>Recent Logged Actions</span>
          </h3>
          <Link
            href={`/audit-logs?userId=${employee.id}`}
            className="text-xs font-semibold text-[#c86e75] hover:underline"
          >
            View Full Audit Trail
          </Link>
        </div>

        {recentAuditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#708078]">
            No activity logs recorded for this employee yet.
          </div>
        ) : (
          <div className="space-y-2">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#f0eee9] text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white border-[#e1e6e3] text-[#505f58] text-[9px] uppercase font-mono">
                      {log.action}
                    </Badge>
                    <span className="font-medium text-[#182922]">
                      {log.entityType}
                    </span>
                    {log.entityName && (
                      <span className="text-[#708078]">({log.entityName})</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#708078] mt-1">
                    {log.details}
                  </p>
                </div>
                <span className="text-[10px] text-[#8a9992] shrink-0 font-medium ml-4">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
