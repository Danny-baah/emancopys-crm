"use client";

import { useState } from "react";
import { ProjectStatus } from "@/lib/generated/prisma/enums";
import { ORDERED_PROJECT_STATUSES, PROJECT_STATUS_CONFIG } from "@/lib/constants/projects";
import { updateProjectStatus } from "@/actions/projects";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface ProjectStatusModalProps {
  projectId: string;
  projectNumber: string;
  currentStatus: ProjectStatus;
  initialWebsiteUrl?: string | null;
  initialStagingUrl?: string | null;
  initialMaterialsNotes?: string | null;
  initialRevisionsNotes?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProjectStatusModal({
  projectId,
  projectNumber,
  currentStatus,
  initialWebsiteUrl,
  initialStagingUrl,
  initialMaterialsNotes,
  initialRevisionsNotes,
  isOpen,
  onClose,
  onSuccess,
}: ProjectStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(currentStatus);
  const [statusChangeNote, setStatusChangeNote] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl || "");
  const [stagingUrl, setStagingUrl] = useState(initialStagingUrl || "");
  const [materialsNotes, setMaterialsNotes] = useState(initialMaterialsNotes || "");
  const [revisionsNotes, setRevisionsNotes] = useState(initialRevisionsNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateProjectStatus(projectId, {
        status: selectedStatus,
        statusChangeNote: statusChangeNote || undefined,
        websiteUrl: websiteUrl || undefined,
        stagingUrl: stagingUrl || undefined,
        materialsNotes: materialsNotes || undefined,
        revisionsNotes: revisionsNotes || undefined,
      });
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update project status.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#ece8e3] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-[#062e26] text-white flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-medium">Update Project Production Stage</h3>
            <p className="text-xs text-[#9ab7b0] mt-0.5">{projectNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9ab7b0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-2 uppercase tracking-wider">
              Select Production Stage (1 to 14)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {ORDERED_PROJECT_STATUSES.map((status) => {
                const conf = PROJECT_STATUS_CONFIG[status];
                const isSelected = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? "bg-[#062e26] text-white border-[#062e26] shadow-xs"
                        : "bg-[#fbfcfa] text-[#2c4035] border-[#ece8e3] hover:border-[#b8dcd0]"
                    }`}
                  >
                    <span className="truncate">
                      <span className="opacity-60 mr-1">{conf.step}.</span>
                      {conf.label}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Fields based on Stage */}
          {(selectedStatus === ProjectStatus.WAITING_FOR_CUSTOMER_MATERIALS ||
            selectedStatus === ProjectStatus.MATERIALS_COMPLETE) && (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Customer Materials Checklist / Notes
              </label>
              <textarea
                rows={2}
                value={materialsNotes}
                onChange={(e) => setMaterialsNotes(e.target.value)}
                placeholder="Log logo files, content copy, brand photography received or pending..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ece8e3] bg-[#fbfcfa] focus:outline-none focus:border-[#062e26]"
              />
            </div>
          )}

          {(selectedStatus === ProjectStatus.CUSTOMER_REVISIONS ||
            selectedStatus === ProjectStatus.CUSTOMER_APPROVAL) && (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Revision & Approval Notes
              </label>
              <textarea
                rows={2}
                value={revisionsNotes}
                onChange={(e) => setRevisionsNotes(e.target.value)}
                placeholder="Client feedback details, requested design tweaks, sign-off notes..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ece8e3] bg-[#fbfcfa] focus:outline-none focus:border-[#062e26]"
              />
            </div>
          )}

          {(selectedStatus === ProjectStatus.READY_FOR_HANDOVER ||
            selectedStatus === ProjectStatus.WEBSITE_TRANSFERRED ||
            selectedStatus === ProjectStatus.PROJECT_COMPLETED ||
            selectedStatus === ProjectStatus.IN_PRODUCTION) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#182922] mb-1">
                  Staging / Preview URL
                </label>
                <input
                  type="url"
                  value={stagingUrl}
                  onChange={(e) => setStagingUrl(e.target.value)}
                  placeholder="https://preview.emancopys.com/client"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-[#fbfcfa] focus:outline-none focus:border-[#062e26]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#182922] mb-1">
                  Production / Live URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://clientdomain.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-[#fbfcfa] focus:outline-none focus:border-[#062e26]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Status Change Reason / Milestone Log
            </label>
            <input
              type="text"
              value={statusChangeNote}
              onChange={(e) => setStatusChangeNote(e.target.value)}
              placeholder="e.g. Deposit verified, QA completed, client approved wireframes..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ece8e3] bg-[#fbfcfa] focus:outline-none focus:border-[#062e26]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium rounded-xl bg-[#062e26] text-white hover:bg-[#0b4337] transition-all flex items-center gap-2 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Stage Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
