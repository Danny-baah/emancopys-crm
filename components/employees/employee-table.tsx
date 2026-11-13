"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@/lib/generated/prisma/enums";
import { toggleEmployeeStatus } from "@/actions/employees";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Shield,
  Loader2,
  Calendar,
} from "lucide-react";

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date | string;
  _count: {
    assignedLeads: number;
    assignedCustomers: number;
    responsibleOrders: number;
    assignedSaleTasks: number;
  };
}

interface EmployeeTableProps {
  employees: EmployeeItem[];
  currentUserId?: string;
  emptyMessage?: string;
}

export function EmployeeTable({
  employees,
  currentUserId,
  emptyMessage = "No employee accounts found.",
}: EmployeeTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggleStatus(id: string, currentStatus: boolean, name: string) {
    if (id === currentUserId) {
      toast.error("You cannot deactivate your own administrator account.");
      return;
    }

    const actionText = currentStatus ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionText} ${name}'s account?`)) {
      return;
    }

    setLoadingId(id);
    try {
      await toggleEmployeeStatus(id, !currentStatus);
      toast.success(
        `Account for ${name} ${currentStatus ? "deactivated" : "activated"}.`
      );
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to change account status.";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  }

  function formatDate(d: Date | string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  if (employees.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-[#e8ecea]">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f7f3] text-[#377b58] flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>
        <p className="font-serif text-base text-[#13231c] font-normal">{emptyMessage}</p>
        <p className="text-xs text-[#708078] mt-1 max-w-sm mx-auto">
          Add team members so they can log in with individual accounts, manage assigned leads, and track their pipeline.
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
              <th className="py-3.5 px-6 font-semibold">Employee</th>
              <th className="py-3.5 px-4 font-semibold">Role</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-center">Assigned Leads</th>
              <th className="py-3.5 px-4 font-semibold text-center">Orders Won</th>
              <th className="py-3.5 px-4 font-semibold text-center">Open Tasks</th>
              <th className="py-3.5 px-4 font-semibold">Joined Date</th>
              <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7faf8]">
            {employees.map((emp) => {
              const initials = (emp.name || "EC")
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const isSelf = emp.id === currentUserId;

              return (
                <tr key={emp.id} className="hover:bg-[#fafbfb] transition-colors">
                  <td className="py-4 px-6">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#083d34] text-white font-semibold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[#182922] group-hover:text-[#083d34] transition-colors flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          {isSelf && (
                            <span className="text-[10px] text-[#8aa9a1] font-normal">
                              (You)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#708078] truncate max-w-[200px]">
                          {emp.email}
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td className="py-4 px-4">
                    {emp.role === Role.ADMIN ? (
                      <Badge className="bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7] text-[10px] font-medium gap-1">
                        <Shield className="w-3 h-3" />
                        <span>Administrator</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-[#f0f7f3] text-[#377b58] border-[#d6ebd9] text-[10px] font-medium">
                        Employee
                      </Badge>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    {emp.isActive ? (
                      <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-medium gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-[#fef1f2] text-[#c95965] border-[#fad5d9] text-[10px] font-medium gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Deactivated</span>
                      </Badge>
                    )}
                  </td>

                  <td className="py-4 px-4 text-center font-medium text-[#182922]">
                    {emp._count.assignedLeads}
                  </td>

                  <td className="py-4 px-4 text-center font-medium text-[#182922]">
                    {emp._count.responsibleOrders}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {emp._count.assignedSaleTasks > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#fbf5ee] text-[#ba7528] font-medium text-[11px]">
                        {emp._count.assignedSaleTasks} open
                      </span>
                    ) : (
                      <span className="text-[#a0aca6]">0</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-[#708078]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#a0aca6]" />
                      <span>{formatDate(emp.createdAt)}</span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="px-2.5 py-1 rounded-xl text-xs font-medium text-[#083d34] hover:bg-[#e8f6ed] transition-colors"
                      >
                        Performance
                      </Link>

                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="p-1.5 rounded-xl text-[#708078] hover:text-[#182922] hover:bg-[#f0f3f1] transition-colors"
                        title="Edit Employee"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleStatus(emp.id, emp.isActive, emp.name)
                          }
                          disabled={loadingId === emp.id}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors ${
                            emp.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {loadingId === emp.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : emp.isActive ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
