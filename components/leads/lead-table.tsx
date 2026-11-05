"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { LeadStatus } from "@/lib/generated/prisma/enums";
import { deleteLead, updateLeadStatus } from "@/actions/leads";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeadItem {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string | null;
  email: string | null;
  jobTitle: string | null;
  industry: string | null;
  location: string | null;
  status: LeadStatus;
  source: string | null;
  estimatedValue: number | null;
  createdAt: Date;
  assignedTo: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string | null;
  };
  activities?: {
    activityType: string;
    title: string;
    createdAt: Date;
  }[];
}

interface LeadTableProps {
  leads: LeadItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  currentUserId: string;
  isAdmin: boolean;
}

export function LeadTable({
  leads,
  totalCount,
  currentPage,
  totalPages,
  currentUserId,
  isAdmin,
}: LeadTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Change Dialog state
  const [statusTarget, setStatusTarget] = useState<LeadItem | null>(null);
  const [newStatus, setNewStatus] = useState<LeadStatus>(LeadStatus.NEW);

  function toggleSelectAll() {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  }

  function toggleSelectRow(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteLead(deleteTarget.id);
      toast.success(`Lead "${deleteTarget.companyName}" deleted successfully`);
      setDeleteTarget(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete lead.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusTarget) return;
    try {
      await updateLeadStatus(statusTarget.id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      setStatusTarget(null);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status.";
      toast.error(message);
    }
  }

  function getStatusBadge(status: LeadStatus) {
    switch (status) {
      case LeadStatus.NEW:
        return "bg-[#e6f4ff] text-[#0958d9] border-[#91caff]";
      case LeadStatus.CONTACTED:
        return "bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7]";
      case LeadStatus.QUALIFIED:
        return "bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5]";
      case LeadStatus.PROPOSAL_SENT:
        return "bg-[#fff7e6] text-[#d46b08] border-[#ffd591]";
      case LeadStatus.CONVERTED:
        return "bg-[#083d34] text-white border-[#083d34]";
      case LeadStatus.LOST:
        return "bg-[#fdeef0] text-[#c95965] border-[#fad5d9]";
      default:
        return "bg-[#f4f7f5] text-[#556660] border-[#dbe3df]";
    }
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatCurrency(val: number | null) {
    if (val === null || val === undefined) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  }

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
        {leads.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#708078]">
            <p className="font-semibold text-sm text-[#182922]">No leads found</p>
            <p className="mt-1 text-[#8a9992]">
              Try adjusting your filters, adding a lead, or importing leads from Excel/CSV.
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
                        selectedIds.length === leads.length &&
                        leads.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[#cbd5d0] text-[#083d34] focus:ring-[#083d34] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3 font-semibold">Lead / Organization</th>
                  <th className="py-3.5 px-3 font-semibold">Contact Person</th>
                  <th className="py-3.5 px-3 font-semibold">Status</th>
                  <th className="py-3.5 px-3 font-semibold">Phone / Email</th>
                  <th className="py-3.5 px-3 font-semibold">Est. Value</th>
                  <th className="py-3.5 px-3 font-semibold">Assigned To</th>
                  <th className="py-3.5 px-3 font-semibold">Date Added</th>
                  <th className="py-3.5 pr-5 pl-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f8f6]">
                {leads.map((l) => {
                  const isSelected = selectedIds.includes(l.id);
                  const canDelete = isAdmin || l.createdBy.id === currentUserId;
                  const initials = (l.companyName || "LD")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const avatarColor = getAvatarColor(l.companyName);

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-[#fafbfb] transition-colors ${
                        isSelected ? "bg-[#f5f8f6]/50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 pl-5 pr-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(l.id)}
                          className="w-4 h-4 rounded border-[#cbd5d0] text-[#083d34] focus:ring-[#083d34] cursor-pointer"
                        />
                      </td>

                      {/* Lead / Organization */}
                      <td className="py-4 px-3">
                        <Link
                          href={`/leads/${l.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className={`w-9 h-9 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 ${avatarColor}`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-[#182922] group-hover:text-[#083d34] transition-colors">
                              {l.companyName}
                            </div>
                            <div className="text-[11px] text-[#708078] flex items-center gap-1 mt-0.5">
                              {l.location && (
                                <>
                                  <MapPin className="w-3 h-3 text-[#9aa7a1] shrink-0" />
                                  <span>{l.location}</span>
                                </>
                              )}
                              {l.industry && (
                                <span className="text-[#a0aca6]">&bull; {l.industry}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Contact Person */}
                      <td className="py-4 px-3">
                        <div className="text-[#2c3d36] font-semibold text-xs">
                          {l.contactPerson}
                        </div>
                        {l.jobTitle && (
                          <div className="text-[11px] text-[#708078] mt-0.5">
                            {l.jobTitle}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusTarget(l);
                            setNewStatus(l.status);
                          }}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                            l.status
                          )} hover:opacity-80 transition-opacity cursor-pointer`}
                          title="Click to update status"
                        >
                          {l.status.replace("_", " ")}
                        </button>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-4 px-3">
                        <div className="space-y-1">
                          {l.phone ? (
                            <a
                              href={`tel:${l.phone}`}
                              className="flex items-center gap-1.5 text-[#3c4c45] hover:text-[#083d34] transition-colors"
                            >
                              <Phone className="w-3 h-3 text-[#8a9992]" />
                              <span>{l.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[#a0aca6]">—</span>
                          )}
                          {l.email && (
                            <a
                              href={`mailto:${l.email}`}
                              className="flex items-center gap-1.5 text-[#708078] hover:text-[#083d34] transition-colors text-[11px]"
                            >
                              <Mail className="w-3 h-3 text-[#8a9992]" />
                              <span className="truncate max-w-[140px]">{l.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Estimated Value */}
                      <td className="py-4 px-3 font-semibold text-[#182922]">
                        {formatCurrency(l.estimatedValue)}
                      </td>

                      {/* Assigned To */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#083d34] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                            {l.assignedTo?.name
                              ? l.assignedTo.name.slice(0, 2).toUpperCase()
                              : "EC"}
                          </div>
                          <span className="text-[#3c4c45]">
                            {l.assignedTo?.name || "Unassigned"}
                          </span>
                        </div>
                      </td>

                      {/* Date Added */}
                      <td className="py-4 px-3 text-[#708078]">
                        {formatDate(l.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-5 pl-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === l.id ? null : l.id)
                            }
                            className="p-1.5 rounded-lg text-[#8a9992] hover:text-[#182922] hover:bg-[#f0f3f1] transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeMenuId === l.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[#e1e6e3] shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 text-left">
                                <Link
                                  href={`/leads/${l.id}`}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#182922] hover:bg-[#f5f8f6] transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#708078]" />
                                  <span>View Profile</span>
                                </Link>

                                <Link
                                  href={`/leads/${l.id}/edit`}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#182922] hover:bg-[#f5f8f6] transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Edit className="w-3.5 h-3.5 text-[#708078]" />
                                  <span>Edit Lead</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setStatusTarget(l);
                                    setNewStatus(l.status);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#182922] hover:bg-[#f5f8f6] transition-colors text-left"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-[#708078]" />
                                  <span>Change Status</span>
                                </button>

                                {canDelete && (
                                  <>
                                    <div className="my-1 border-t border-[#f0f3f1]" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setDeleteTarget(l);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                      <span>Delete Lead</span>
                                    </button>
                                  </>
                                )}
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
          Showing {startRecord} – {endRecord} of {totalCount} leads
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

      {/* Quick Status Change Dialog */}
      {statusTarget && (
        <Dialog open={Boolean(statusTarget)} onOpenChange={() => setStatusTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-[24px] bg-white border border-[#e8ecea] p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-semibold text-[#13231c]">
                Update Lead Status
              </DialogTitle>
              <DialogDescription className="text-xs text-[#708078] mt-1">
                Change pipeline status for &quot;{statusTarget.companyName}&quot;.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#182922]">
                  Select New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
                >
                  {Object.values(LeadStatus).map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f3f1]">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusConfirm}
                  className="h-10 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Lead Confirmation Dialog */}
      {deleteTarget && (
        <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md rounded-[24px] bg-white border border-[#e8ecea] p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-semibold text-red-600">
                Delete Lead Record?
              </DialogTitle>
              <DialogDescription className="text-xs text-[#556660] mt-1 leading-relaxed">
                Are you sure you want to delete &quot;{deleteTarget.companyName}&quot;? This action will permanently remove the lead profile and its associated activity history.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f0f3f1] mt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
