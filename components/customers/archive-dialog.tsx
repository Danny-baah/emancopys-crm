"use client";

import { useState } from "react";
import { archiveCustomer, restoreCustomer } from "@/actions/customers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Archive, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ArchiveDialogProps {
  customerId: string;
  customerName: string;
  isArchived: boolean;
}

export function ArchiveDialog({
  customerId,
  customerName,
  isArchived,
}: ArchiveDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      if (isArchived) {
        await restoreCustomer(customerId);
        toast.success(`Customer "${customerName}" restored successfully`);
      } else {
        await archiveCustomer(customerId);
        toast.success(`Customer "${customerName}" archived. Record is safely preserved.`);
      }
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Operation failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isArchived ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#2d7a4f]" />
          <span>Restore Customer</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 px-4 rounded-xl border border-[#fbd8dc] bg-[#fef1f2] text-xs font-semibold text-[#c95965] hover:bg-[#fde8ea] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Archive</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px] bg-white border border-[#e8ecea] p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isArchived
                    ? "bg-[#e8f6ed] text-[#2d7a4f]"
                    : "bg-[#fdeef0] text-[#c95965]"
                }`}
              >
                {isArchived ? (
                  <RotateCcw className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <DialogTitle className="font-serif text-xl font-semibold text-[#13231c]">
                {isArchived ? "Restore Customer Account?" : "Archive Customer Account?"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#556660] leading-relaxed">
              {isArchived
                ? `Restoring "${customerName}" will return this account to active directory views and restore engagement tracking.`
                : `Archiving "${customerName}" safely preserves all organizational details and activity history without permanently deleting any records.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f0f3f1] mt-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className={`h-10 px-5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 ${
                isArchived
                  ? "bg-[#083d34] hover:bg-[#0b4b40]"
                  : "bg-[#c95965] hover:bg-[#b04854]"
              }`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isArchived ? "Confirm Restore" : "Confirm Archive"}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}