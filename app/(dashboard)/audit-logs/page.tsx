import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getAuditLogs } from "@/actions/audit";
import { AuditLogsTable } from "@/components/audit/audit-logs-table";
import { AuditAction } from "@/lib/generated/prisma/enums";
import { Search } from "lucide-react";
import Link from "next/link";

interface AuditLogsPageProps {
  searchParams: Promise<{
    userId?: string;
    action?: string;
    entityType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const userId = params.userId || "";
  const action = params.action || "";
  const entityType = params.entityType || "";
  const search = params.search || "";
  const startDate = params.startDate || "";
  const endDate = params.endDate || "";
  const page = parseInt(params.page || "1", 10);

  const [users, auditData] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    getAuditLogs({
      userId,
      action,
      entityType,
      search,
      startDate,
      endDate,
      page,
      limit: 20,
    }),
  ]);

  const moduleList = [
    { label: "All Modules", value: "" },
    { label: "Customer", value: "CUSTOMER" },
    { label: "Lead", value: "LEAD" },
    { label: "Sales Deal", value: "SALE" },
    { label: "Quotation", value: "QUOTATION" },
    { label: "Order", value: "ORDER" },
    { label: "Project", value: "PROJECT" },
    { label: "Payment", value: "PAYMENT" },
    { label: "Employee", value: "EMPLOYEE" },
    { label: "Service", value: "SERVICE" },
    { label: "Client Service", value: "CUSTOMER_SERVICE" },
  ];

  const actionList = [
    { label: "All Actions", value: "" },
    { label: "Create", value: AuditAction.CREATE },
    { label: "Update", value: AuditAction.UPDATE },
    { label: "Delete", value: AuditAction.DELETE },
    { label: "Status Change", value: AuditAction.STATUS_CHANGE },
    { label: "Payment Recorded", value: AuditAction.PAYMENT_RECORDED },
    { label: "Account Activated", value: AuditAction.ACTIVATED },
    { label: "Account Deactivated", value: AuditAction.DEACTIVATED },
    { label: "Service Sold", value: AuditAction.SOLD },
    { label: "Service Offered", value: AuditAction.OFFERED },
    { label: "Service Declined", value: AuditAction.DECLINED },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
              Audit Trail & Activity Logs
            </h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f1edfb] text-[#6d51c7] border border-[#ddd4f7]">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-[#677770] mt-1.5 font-normal">
            Immutable server-side audit logs recording critical customer, deal, quotation, order, project, payment, and employee changes.
          </p>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white rounded-3xl p-6 border border-[#e8ecea] shadow-xs space-y-4">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search details or ID..."
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34]"
            />
          </div>

          {/* Module filter */}
          <div>
            <select
              name="entityType"
              defaultValue={entityType}
              className="w-full h-10 px-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34]"
            >
              {moduleList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action filter */}
          <div>
            <select
              name="action"
              defaultValue={action}
              className="w-full h-10 px-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34]"
            >
              {actionList.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Employee filter */}
          <div>
            <select
              name="userId"
              defaultValue={userId}
              className="w-full h-10 px-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34]"
            >
              <option value="">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Submit / Reset Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 h-10 bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl text-xs font-medium transition-colors"
            >
              Filter Logs
            </button>
            <Link
              href="/audit-logs"
              className="px-3.5 h-10 rounded-xl border border-[#e1e6e3] bg-white text-xs font-medium text-[#708078] hover:bg-[#fbfaf8] flex items-center justify-center transition-colors"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="flex items-center justify-between pt-2 border-t border-[#f0f3f1] text-[11px] text-[#708078]">
          <span>
            Showing {auditData.logs.length} of {auditData.totalCount} total audit log entries
          </span>
          <span className="text-[#8aa9a1] font-medium">
            Passwords, secrets, and auth tokens are strictly omitted
          </span>
        </div>
      </div>

      {/* 3. Table */}
      <AuditLogsTable
        logs={auditData.logs}
        emptyMessage={
          search || entityType || action || userId
            ? "No audit records match your current filter parameters."
            : "No audit events recorded yet."
        }
      />

      {/* 4. Pagination */}
      {auditData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-[#708078]">
          <div>
            Page {auditData.currentPage} of {auditData.totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/audit-logs?page=${page - 1}&search=${encodeURIComponent(
                  search
                )}&entityType=${entityType}&action=${action}&userId=${userId}`}
                className="px-3 py-1.5 rounded-xl border border-[#e1e6e3] bg-white hover:bg-[#fbfaf8] text-[#182922]"
              >
                Previous
              </Link>
            )}
            {page < auditData.totalPages && (
              <Link
                href={`/audit-logs?page=${page + 1}&search=${encodeURIComponent(
                  search
                )}&entityType=${entityType}&action=${action}&userId=${userId}`}
                className="px-3 py-1.5 rounded-xl border border-[#e1e6e3] bg-white hover:bg-[#fbfaf8] text-[#182922]"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
