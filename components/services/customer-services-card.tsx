"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomerServiceModal } from "@/components/services/customer-service-modal";
import { updateCustomerServiceStatus } from "@/actions/services";
import { ServiceStatus } from "@/lib/generated/prisma/enums";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";

interface CustomerServiceItem {
  id: string;
  status: ServiceStatus;
  agreedPrice: number;
  isRecurring: boolean;
  offeredDate: Date | string;
  soldDate?: Date | string | null;
  declinedDate?: Date | string | null;
  notes?: string | null;
  service: {
    id: string;
    name: string;
    description?: string | null;
  };
  responsibleEmployee?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface CustomerServicesCardProps {
  customerId: string;
  customerName: string;
  services: CustomerServiceItem[];
  availableServices: Array<{
    id: string;
    name: string;
    price: number;
    isRecurring: boolean;
    description?: string | null;
  }>;
}

export function CustomerServicesCard({
  customerId,
  customerName,
  services,
  availableServices,
}: CustomerServicesCardProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function formatCurrency(val: number) {
    return `€${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(d: Date | string | null | undefined) {
    if (!d) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  function getStatusBadge(status: ServiceStatus) {
    switch (status) {
      case ServiceStatus.SOLD:
        return (
          <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-medium gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Sold (Active)</span>
          </Badge>
        );
      case ServiceStatus.OFFERED:
        return (
          <Badge className="bg-[#fbf5ee] text-[#ba7528] border-[#faecd8] text-[10px] font-medium gap-1">
            <Clock className="w-3 h-3" />
            <span>Offered</span>
          </Badge>
        );
      case ServiceStatus.DECLINED:
        return (
          <Badge className="bg-[#f5f7f6] text-[#708078] border-[#e1e6e3] text-[10px] font-medium gap-1">
            <XCircle className="w-3 h-3" />
            <span>Declined</span>
          </Badge>
        );
    }
  }

  async function handleQuickStatus(id: string, newStatus: ServiceStatus) {
    setUpdatingId(id);
    try {
      await updateCustomerServiceStatus(id, {
        status: newStatus,
      });
      toast.success(`Service marked as ${newStatus.toLowerCase()}.`);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update service status.";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  }

  const soldServices = services.filter((s) => s.status === ServiceStatus.SOLD);
  const recurringMRR = soldServices
    .filter((s) => s.isRecurring)
    .reduce((sum, s) => sum + s.agreedPrice, 0);

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0f3f1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f1edfb] text-[#6d51c7] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-[#13231c]">
                Additional Services & Upselling
              </h3>
              {recurringMRR > 0 && (
                <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[11px] font-semibold">
                  +€{recurringMRR.toFixed(2)}/mo MRR
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#708078] mt-0.5">
              Care plans, SEO maintenance, and ongoing retainers agreed with {customerName}.
            </p>
          </div>
        </div>

        <CustomerServiceModal
          customerId={customerId}
          customerName={customerName}
          availableServices={availableServices}
        />
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#faf8f5] text-center border border-dashed border-[#e1e6e3] space-y-2">
          <p className="text-xs font-semibold text-[#182922]">
            No additional services associated yet.
          </p>
          <p className="text-xs text-[#708078] max-w-sm mx-auto">
            Upsell Website Maintenance (€50/mo), Care + SEO Start (€300/mo), or Care + SEO Pro (€500/mo) to expand monthly recurring revenue.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-[#faf8f5] border border-[#f0eee9] hover:border-[#e1e6e3] transition-colors gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#e1e6e3] flex items-center justify-center text-[#083d34] font-semibold text-xs shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-[#8aa9a1]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#182922]">
                      {item.service.name}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="text-[11px] text-[#708078] mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#182922]">
                      Snapshot Price: {formatCurrency(item.agreedPrice)}
                      {item.isRecurring ? "/month" : " (one-time)"}
                    </span>
                    <span>•</span>
                    <span>Offered: {formatDate(item.offeredDate)}</span>
                    {item.soldDate && (
                      <>
                        <span>•</span>
                        <span className="text-[#2d7a4f]">Sold: {formatDate(item.soldDate)}</span>
                      </>
                    )}
                    {item.declinedDate && (
                      <>
                        <span>•</span>
                        <span className="text-[#c95965]">Declined: {formatDate(item.declinedDate)}</span>
                      </>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-[#708078] mt-1 italic">
                      &quot;{item.notes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Status Update Quick Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                {item.status !== ServiceStatus.SOLD && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === item.id}
                    onClick={() => handleQuickStatus(item.id, ServiceStatus.SOLD)}
                    className="h-8 rounded-xl text-[11px] bg-white border-[#cbe8d5] text-[#2d7a4f] hover:bg-[#e8f6ed] gap-1"
                  >
                    {updatingId === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Mark Sold</span>
                  </Button>
                )}
                {item.status !== ServiceStatus.DECLINED && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updatingId === item.id}
                    onClick={() => handleQuickStatus(item.id, ServiceStatus.DECLINED)}
                    className="h-8 rounded-xl text-[11px] bg-white border-[#fad5d9] text-[#c95965] hover:bg-[#fef1f2] gap-1"
                  >
                    <span>Declined</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
