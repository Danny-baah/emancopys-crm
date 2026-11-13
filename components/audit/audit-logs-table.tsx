"use client";

import { Badge } from "@/components/ui/badge";
import { AuditAction } from "@/lib/generated/prisma/enums";
import { Clock } from "lucide-react";

interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string | null;
  details: string;
  createdAt: Date | string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

interface AuditLogsTableProps {
  logs: AuditLogItem[];
  emptyMessage?: string;
}

export function AuditLogsTable({
  logs,
  emptyMessage = "No audit log records found.",
}: AuditLogsTableProps) {
  function formatDate(d: Date | string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(d));
  }

  function getActionBadge(action: AuditAction) {
    switch (action) {
      case AuditAction.CREATE:
        return (
          <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-mono">
            CREATE
          </Badge>
        );
      case AuditAction.UPDATE:
        return (
          <Badge className="bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7] text-[10px] font-mono">
            UPDATE
          </Badge>
        );
      case AuditAction.DELETE:
        return (
          <Badge className="bg-[#fef1f2] text-[#c95965] border-[#fad5d9] text-[10px] font-mono">
            DELETE
          </Badge>
        );
      case AuditAction.STATUS_CHANGE:
        return (
          <Badge className="bg-[#fbf5ee] text-[#ba7528] border-[#faecd8] text-[10px] font-mono">
            STATUS
          </Badge>
        );
      case AuditAction.PAYMENT_RECORDED:
        return (
          <Badge className="bg-[#083d34] text-white border-transparent text-[10px] font-mono">
            PAYMENT
          </Badge>
        );
      case AuditAction.ACTIVATED:
        return (
          <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-mono">
            ACTIVATED
          </Badge>
        );
      case AuditAction.DEACTIVATED:
        return (
          <Badge className="bg-[#fef1f2] text-[#c95965] border-[#fad5d9] text-[10px] font-mono">
            DEACTIVATED
          </Badge>
        );
      case AuditAction.SOLD:
        return (
          <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-mono">
            SERVICE SOLD
          </Badge>
        );
      case AuditAction.OFFERED:
        return (
          <Badge className="bg-[#fbf5ee] text-[#ba7528] border-[#faecd8] text-[10px] font-mono">
            SERVICE OFFERED
          </Badge>
        );
      case AuditAction.DECLINED:
        return (
          <Badge className="bg-[#f5f7f6] text-[#708078] border-[#e1e6e3] text-[10px] font-mono">
            SERVICE DECLINED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white border-[#e1e6e3] text-[#505f58] text-[10px] font-mono">
            {action}
          </Badge>
        );
    }
  }

  function getModuleBadge(entityType: string) {
    return (
      <span className="font-mono text-[11px] font-semibold text-[#083d34] bg-[#e8f6ed]/60 px-2 py-0.5 rounded-md">
        {entityType}
      </span>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-[#e8ecea]">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f7f3] text-[#377b58] flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <p className="font-serif text-base text-[#13231c] font-normal">{emptyMessage}</p>
        <p className="text-xs text-[#708078] mt-1 max-w-sm mx-auto">
          Audit entries are generated automatically server-side whenever customers, leads, deals, orders, payments, employees or services are modified.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#e8ecea] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#f0f3f1] bg-[#fbfaf8] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase">
              <th className="py-3.5 px-6 font-semibold">Timestamp</th>
              <th className="py-3.5 px-4 font-semibold">User</th>
              <th className="py-3.5 px-4 font-semibold">Action</th>
              <th className="py-3.5 px-4 font-semibold">Module</th>
              <th className="py-3.5 px-4 font-semibold">Record</th>
              <th className="py-3.5 px-6 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7faf8]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#fafbfb] transition-colors">
                <td className="py-4 px-6 text-[#708078] font-mono text-[11px] whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </td>

                <td className="py-4 px-4 font-medium text-[#182922]">
                  {log.user ? (
                    <div>
                      <span className="font-semibold text-xs block">
                        {log.user.name || log.user.email}
                      </span>
                      <span className="text-[10px] text-[#8a9992] capitalize">
                        {log.user.role?.toLowerCase() || "user"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[#a0aca6] italic">System</span>
                  )}
                </td>

                <td className="py-4 px-4">{getActionBadge(log.action)}</td>

                <td className="py-4 px-4">{getModuleBadge(log.entityType)}</td>

                <td className="py-4 px-4 font-medium text-[#182922]">
                  {log.entityName || (
                    <span className="font-mono text-[11px] text-[#8a9992]">
                      {log.entityId.slice(0, 10)}...
                    </span>
                  )}
                </td>

                <td className="py-4 px-6 text-[#505f58] max-w-md">
                  <p className="line-clamp-2 leading-relaxed text-xs">
                    {log.details}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
