"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ServiceStatus } from "@/lib/generated/prisma/enums";
import { assignCustomerService } from "@/actions/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sparkles, Loader2 } from "lucide-react";

interface CustomerServiceModalProps {
  customerId: string;
  customerName: string;
  availableServices: Array<{
    id: string;
    name: string;
    price: number;
    isRecurring: boolean;
    description?: string | null;
  }>;
  triggerButton?: React.ReactNode;
}

export function CustomerServiceModal({
  customerId,
  customerName,
  availableServices,
  triggerButton,
}: CustomerServiceModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState(
    availableServices[0]?.id || ""
  );
  const selectedService = availableServices.find((s) => s.id === selectedServiceId);

  const [status, setStatus] = useState<ServiceStatus>(ServiceStatus.OFFERED);
  const [agreedPrice, setAgreedPrice] = useState<string>(
    selectedService ? selectedService.price.toString() : ""
  );
  const [isRecurring, setIsRecurring] = useState<boolean>(
    selectedService ? selectedService.isRecurring : true
  );
  const [notes, setNotes] = useState("");

  function handleServiceChange(serviceId: string) {
    setSelectedServiceId(serviceId);
    const s = availableServices.find((item) => item.id === serviceId);
    if (s) {
      setAgreedPrice(s.price.toString());
      setIsRecurring(s.isRecurring);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceVal = parseFloat(agreedPrice);

    if (!selectedServiceId) {
      toast.error("Please select a service.");
      return;
    }

    if (isNaN(priceVal) || priceVal < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    setLoading(true);
    try {
      await assignCustomerService({
        customerId,
        serviceId: selectedServiceId,
        status,
        agreedPrice: priceVal,
        isRecurring,
        notes: notes.trim() || null,
      });

      toast.success(
        `Service recorded as ${status.toLowerCase()} for ${customerName}.`
      );
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to associate service.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {triggerButton}
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl shadow-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Offer / Sell Service</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#e1e6e3] shadow-xl">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2.5 text-[#083d34] mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-normal text-[#13231c]">
                  Additional Service Agreement
                </DialogTitle>
                <p className="text-xs text-[#708078]">
                  Offer, sell, or document a declined service for {customerName}.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Select Catalogue Service *
              </Label>
              <Select
                value={selectedServiceId}
                onValueChange={(val) => {
                  if (val) handleServiceChange(val);
                }}
              >
                <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                  {availableServices.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (€{s.price.toFixed(2)}{s.isRecurring ? "/mo" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#182922]">
                  Service Status *
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => {
                    if (val) setStatus(val as ServiceStatus);
                  }}
                >
                  <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                    <SelectItem value={ServiceStatus.OFFERED}>
                      Offered (Proposal / Discussion)
                    </SelectItem>
                    <SelectItem value={ServiceStatus.SOLD}>
                      Sold (Active Agreement / MRR)
                    </SelectItem>
                    <SelectItem value={ServiceStatus.DECLINED}>
                      Declined (Customer passed)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#182922]">
                  Agreed Price (€) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#708078]">
                    €
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Billing Frequency
              </Label>
              <Select
                value={isRecurring ? "monthly" : "one_time"}
                onValueChange={(val) => {
                  if (val) setIsRecurring(val === "monthly");
                }}
              >
              <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                <SelectItem value="monthly">Monthly Recurring Revenue (MRR)</SelectItem>
                <SelectItem value="one_time">One-Off Upfront Fee</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-[#708078]">
              Snapshot price is locked in for this client even if catalogue price changes later.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Notes / Scope
            </Label>
            <Textarea
              placeholder="Any specific agreed terms or customer objections if declined..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="rounded-xl border-[#e1e6e3] text-xs focus:border-[#083d34] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f3f1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl text-xs gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Agreement</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
