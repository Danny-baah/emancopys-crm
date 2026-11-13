"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import { SalePipelineStepper } from "./sale-pipeline-stepper";
import { SalesStatusModal } from "./sales-status-modal";
import { ChevronRight } from "lucide-react";

interface SaleStatusStepperClientProps {
  saleId: string;
  currentStatus: SalesStatus;
  dealTitle: string;
}

export function SaleStatusStepperClient({
  saleId,
  currentStatus,
  dealTitle,
}: SaleStatusStepperClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8aa9a1]">
          Sales Pipeline Stage Progression (Click to Transition)
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d634d] hover:text-[#062e26] transition-colors cursor-pointer"
        >
          <span>Change Sales Stage</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <SalePipelineStepper
        currentStatus={currentStatus}
        onSelectStatus={() => setModalOpen(true)}
      />

      {modalOpen && (
        <SalesStatusModal
          saleId={saleId}
          currentStatus={currentStatus}
          dealTitle={dealTitle}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

