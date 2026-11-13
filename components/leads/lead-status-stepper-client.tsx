"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import { ORDERED_SALES_STATUSES, SALES_STATUS_CONFIG } from "@/lib/constants/sales";
import { updateLeadStatus } from "@/actions/leads";
import { SalePipelineStepper } from "@/components/sales/sale-pipeline-stepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

interface LeadStatusStepperClientProps {
  leadId: string;
  leadName: string;
  currentStatus: SalesStatus;
}

export function LeadStatusStepperClient({
  leadId,
  leadName,
  currentStatus,
}: LeadStatusStepperClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<SalesStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await updateLeadStatus(leadId, selectedStatus);
      toast.success(`Lead status updated to ${SALES_STATUS_CONFIG[selectedStatus].label}`);
      setModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update lead status.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8aa9a1]">
          Sales Pipeline Stage Progression (Click to Transition)
        </span>
        <button
          type="button"
          onClick={() => {
            setSelectedStatus(currentStatus);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d634d] hover:text-[#062e26] transition-colors cursor-pointer"
        >
          <span>Change Stage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <SalePipelineStepper
        currentStatus={currentStatus}
        onSelectStatus={(status) => {
          setSelectedStatus(status);
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <Dialog open={modalOpen} onOpenChange={() => setModalOpen(false)}>
          <DialogContent className="sm:max-w-md rounded-[24px] bg-white border border-[#e8ecea] p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl font-semibold text-[#13231c]">
                Update Lead Sales Stage
              </DialogTitle>
              <DialogDescription className="text-xs text-[#708078] mt-1">
                Advance &quot;{leadName}&quot; through the commercial pipeline.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#182922]">
                  Select New Stage
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as SalesStatus)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
                >
                  {ORDERED_SALES_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {SALES_STATUS_CONFIG[s].step}. {SALES_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f3f1]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                  className="h-10 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Save Stage"}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

