"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  MapPin,
  Phone,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  PhoneCall,
  Calendar,
  Mail,
  FileText,
} from "lucide-react";
import { ActivityType } from "@/lib/generated/prisma/enums";
import { ArchiveDialog } from "@/components/customers/archive-dialog";

interface CustomerItem {
  id: string;
  companyName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  location: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  assignedTo: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  activities?: {
    activityType: ActivityType;
    title: string;
    createdAt: Date;
  }[];
}

interface CustomerTableProps {
  customers: CustomerItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function CustomerTable({
  customers,
  totalCount,
  currentPage,
  totalPages,
}: CustomerTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Selection toggle
  function toggleSelectAll() {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  }

  function toggleSelectRow(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  // Page navigation
  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  // Helper for industry tags
  function getIndustryBadge(industry?: string | null) {
    const ind = (industry || "").toLowerCase();
    if (ind.includes("manufactur")) {
      return {
        bg: "bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5]",
        label: industry || "Manufacturing",
      };
    }
    if (ind.includes("publish") || ind.includes("print")) {
      return {
        bg: "bg-[#fdeef0] text-[#c95965] border-[#fad5d9]",
        label: industry || "Publishing",
      };
    }
    if (ind.includes("it") || ind.includes("tech") || ind.includes("soft")) {
      return {
        bg: "bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7]",
        label: industry || "IT Services",
      };
    }
    if (ind.includes("logist") || ind.includes("transport")) {
      return {
        bg: "bg-[#eef7f3] text-[#34785c] border-[#d2ebde]",
        label: industry || "Logistics",
      };
    }
    if (ind.includes("food") || ind.includes("beverage")) {
      return {
        bg: "bg-[#fdf4e9] text-[#b46d23] border-[#fce3c7]",
        label: industry || "Food & Beverage",
      };
    }
    return {
      bg: "bg-[#f4f7f5] text-[#556660] border-[#dbe3df]",
      label: industry || "Corporate",
    };
  }

  // Helper for last activity badge
  function getLastActivityBadge(activities?: CustomerItem["activities"]) {
    if (!activities || activities.length === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f0f3f1] text-[#708078] border border-[#e1e6e3]">
          <FileText className="w-3 h-3 text-[#8a9992]" />
          <span>New Lead</span>
        </span>
      );
    }

    const latest = activities[0];
    switch (latest.activityType) {
      case ActivityType.CALL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#e8f6ed] text-[#2d7a4f] border border-[#cbe8d5]">
            <PhoneCall className="w-3 h-3 text-[#2d7a4f]" />
            <span>Call</span>
          </span>
        );
      case ActivityType.MEETING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#fdeef0] text-[#c95965] border border-[#fad5d9]">
            <Calendar className="w-3 h-3 text-[#c95965]" />
            <span>Meeting</span>
          </span>
        );
      case ActivityType.EMAIL:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#e8f6ed] text-[#2d7a4f] border border-[#cbe8d5]">
            <Mail className="w-3 h-3 text-[#2d7a4f]" />
            <span>Email</span>
          </span>
        );
      case ActivityType.NOTE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f1edfb] text-[#6d51c7] border border-[#ddd4f7]">
            <FileText className="w-3 h-3 text-[#6d51c7]" />
            <span>Note</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#f4f7f5] text-[#556660] border border-[#dbe3df]">
            <span>Activity</span>
          </span>
        );
    }
  }

  // Format date helper
  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  // Avatar palette picker based on string hash
  function getAvatarColor(name: string) {
    const colors = [
      "bg-[#fdeee9] text-[#c76545]",
      "bg-[#fdeef0] text-[#c95965]",
      "bg-[#e8f6ed] text-[#2d7a4f]",
      "bg-[#eef7f3] text-[#34785c]",
      "bg-[#f1edfb] text-[#6d51c7]",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  const startRecord = totalCount === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endRecord = Math.min(currentPage * 10, totalCount);

  return (
    <div className="space-y-4">
      {/* Table Container Card */}
      <div className="bg-white rounded-[24px] border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        {customers.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#708078]">
            <p className="font-semibold text-sm text-[#182922]">No customers found</p>
            <p className="mt-1 text-[#8a9992]">
              Try adjusting your search criteria or register a new customer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0f3f1] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase bg-[#fafbfb]/60">
                  <th className="py-3.5 pl-5 pr-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === customers.length &&
                        customers.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#cbd5d0] text-[#083d34] focus:ring-[#083d34] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3 font-semibold">Customer / Company</th>
                  <th className="py-3.5 px-3 font-semibold">Industry</th>
                  <th className="py-3.5 px-3 font-semibold">Contact Person</th>
                  <th className="py-3.5 px-3 font-semibold">Phone</th>
                  <th className="py-3.5 px-3 font-semibold">Assigned To</th>
                  <th className="py-3.5 px-3 font-semibold">Last Activity</th>
                  <th className="py-3.5 px-3 font-semibold">Date Added</th>
                  <th className="py-3.5 pr-5 pl-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f8f6]">
                {customers.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  const isArchived = Boolean(c.archivedAt);
                  const initials = (c.companyName || "EC")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  const industryData = getIndustryBadge(c.industry);
                  const avatarColor = getAvatarColor(c.companyName);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-[#fafbfb] transition-colors ${
                        isSelected ? "bg-[#f5f8f6]/50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-5 pr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(c.id)}
                          className="w-4 h-4 rounded border-[#cbd5d0] text-[#083d34] focus:ring-[#083d34] cursor-pointer"
                        />
                      </td>

                      {/* Customer / Company */}
                      <td className="py-4 px-3">
                        <Link
                          href={`/customers/${c.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className={`w-9 h-9 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#182922] group-hover:text-[#083d34] transition-colors">
                              {c.companyName}
                            </div>
                            <div className="text-[11px] text-[#708078] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#9aa7a1] shrink-0" />
                              <span>{c.location || "Kumasi, Ghana"}</span>
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Industry */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${industryData.bg}`}
                        >
                          {industryData.label}
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-4 px-3 text-[#2c3d36] font-medium">
                        {c.contactPerson || "—"}
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-3">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1.5 text-[#3c4c45] hover:text-[#083d34] transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#8a9992]" />
                            <span>{c.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[#a0aca6]">—</span>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#083d34] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                            {c.assignedTo?.name
                              ? c.assignedTo.name.slice(0, 2).toUpperCase()
                              : "EC"}
                          </div>
                          <span className="text-[#3c4c45]">
                            {c.assignedTo?.name || "Unassigned"}
                          </span>
                        </div>
                      </td>

                      {/* Last Activity */}
                      <td className="py-4 px-3">
                        {getLastActivityBadge(c.activities)}
                      </td>

                      {/* Date Added */}
                      <td className="py-4 px-3 text-[#708078]">
                        {formatDate(c.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-5 pl-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === c.id ? null : c.id)
                            }
                            className="p-1.5 rounded-lg text-[#8a9992] hover:text-[#182922] hover:bg-[#f0f3f1] transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === c.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[#e1e6e3] shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 text-left">
                                <Link
                                  href={`/customers/${c.id}`}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#182922] hover:bg-[#f5f8f6] transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#708078]" />
                                  <span>View Profile</span>
                                </Link>

                                <Link
                                  href={`/customers/${c.id}/edit`}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#182922] hover:bg-[#f5f8f6] transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Edit className="w-3.5 h-3.5 text-[#708078]" />
                                  <span>Edit Customer</span>
                                </Link>

                                <div className="my-1 border-t border-[#f0f3f1]" />

                                <div className="px-1 py-1">
                                  <ArchiveDialog
                                    customerId={c.id}
                                    customerName={c.companyName}
                                    isArchived={isArchived}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
        <div className="text-xs text-[#708078]">
          Showing {startRecord} – {endRecord} of {totalCount} customers
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded-xl border border-[#e1e6e3] bg-white flex items-center justify-center text-[#556660] hover:border-[#cbd5d0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#083d34] text-white shadow-2xs"
                      : "border border-[#e1e6e3] bg-white text-[#556660] hover:border-[#cbd5d0]"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="w-8 h-8 rounded-xl border border-[#e1e6e3] bg-white flex items-center justify-center text-[#556660] hover:border-[#cbd5d0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}