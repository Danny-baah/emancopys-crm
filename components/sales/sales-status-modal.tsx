"use client";

import { useState } from "react";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import { ORDERED_SALES_STATUSES, SALES_STATUS_CONFIG } from "@/lib/constants/sales";
import { updateSaleStatus } from "@/actions/sales";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface SalesStatusModalProps {
  saleId: string;
  currentStatus: SalesStatus;
  dealTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SalesStatusModal({
  saleId,
  currentStatus,
  dealTitle,
  isOpen,
  onClose,
  onSuccess,
}: SalesStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<SalesStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [lostReason, setLostReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await updateSaleStatus(saleId, selectedStatus, notes, lostReason);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#ece8e3] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-[#062e26] text-white flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-medium">Update Deal Sales Status</h3>
            <p className="text-xs text-[#9ab7b0] mt-0.5 line-clamp-1">{dealTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9ab7b0] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-2 uppercase tracking-wider">
              Select Sales Stage
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {ORDERED_SALES_STATUSES.map((status) => {
                const conf = SALES_STATUS_CONFIG[status];
                const isSelected = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? "bg-[#062e26] text-white border-[#062e26] shadow-xs"
                        : "bg-[#fbfcfa] text-[#2c4035] border-[#ece8e3] hover:border-[#b8dcd0]"
                    }`}
                  >
                    <span>
                      <span className="opacity-60 mr-1.5">{conf.step}.</span>
                      {conf.label}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedStatus === SalesStatus.DEAL_LOST && (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Reason for Lost Deal
              </label>
              <input
                type="text"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="e.g. Budget constraints, opted for competitor, no reply..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#ece8e3] bg-[#fbfcfa] focus:outline-none focus:border-[#062e26]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Status Change Note (Audit Trail)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key insights or milestone details..."
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
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
