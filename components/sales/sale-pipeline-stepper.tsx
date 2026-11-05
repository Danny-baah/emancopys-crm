"use client";

import { SalesStatus } from "@/lib/generated/prisma/enums";
import { ORDERED_SALES_STATUSES, SALES_STATUS_CONFIG } from "@/lib/constants/sales";
import { Check } from "lucide-react";

interface SalePipelineStepperProps {
  currentStatus: SalesStatus;
  onSelectStatus?: (status: SalesStatus) => void;
}

export function SalePipelineStepper({
  currentStatus,
  onSelectStatus,
}: SalePipelineStepperProps) {
  const currentStep = SALES_STATUS_CONFIG[currentStatus].step;
  const isWon = currentStatus === SalesStatus.DEAL_WON;
  const isLost = currentStatus === SalesStatus.DEAL_LOST;

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#ece8e3] shadow-xs overflow-x-auto scrollbar-none">
      <div className="flex items-center min-w-[780px]">
        {ORDERED_SALES_STATUSES.map((status, index) => {
          const config = SALES_STATUS_CONFIG[status];
          const isCurrent = status === currentStatus;
          const isPast = config.step < currentStep && !isLost;

          let stepClass =
            "bg-[#f4f7f6] text-[#708078] border-[#ece8e3] hover:border-[#b8dcd0]";
          if (isCurrent) {
            stepClass = `${config.bg} ${config.text} ${config.border} ring-2 ring-[#062e26]/10 font-bold`;
          } else if (isPast) {
            stepClass = "bg-[#e8f1ed] text-[#1d634d] border-[#b8dcd0]";
          }

          if (isWon && status === SalesStatus.DEAL_WON) {
            stepClass = "bg-[#e6f4ea] text-[#137333] border-[#b7e1cd] font-bold";
          }
          if (isLost && status === SalesStatus.DEAL_LOST) {
            stepClass = "bg-[#fce8e6] text-[#c5221f] border-[#f7c2be] font-bold";
          }

          return (
            <div key={status} className="flex-1 flex items-center min-w-[74px]">
              <button
                type="button"
                onClick={() => onSelectStatus && onSelectStatus(status)}
                disabled={!onSelectStatus}
                className={`w-full py-2 px-1.5 rounded-xl border text-[11px] text-center transition-all flex flex-col items-center justify-center gap-0.5 ${stepClass} ${
                  onSelectStatus ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex items-center gap-1">
                  {isPast ? (
                    <Check className="w-3 h-3 text-[#1d634d]" />
                  ) : (
                    <span className="text-[10px] opacity-70">{config.step}.</span>
                  )}
                </div>
                <span className="truncate w-full font-medium leading-tight">
                  {config.label}
                </span>
              </button>

              {index < ORDERED_SALES_STATUSES.length - 1 && (
                <div
                  className={`w-2 h-0.5 shrink-0 mx-0.5 ${
                    isPast ? "bg-[#1d634d]" : "bg-[#ece8e3]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
