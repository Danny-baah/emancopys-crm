"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaymentType, PaymentMethod } from "@/lib/generated/prisma/enums";
import { recordPayment } from "@/actions/payments";
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
import { Plus, CreditCard, Loader2 } from "lucide-react";

interface RecordPaymentDialogProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  outstandingBalance: number;
  triggerButton?: React.ReactNode;
  onPaymentRecorded?: () => void;
}

export function RecordPaymentDialog({
  orderId,
  orderNumber,
  customerName,
  outstandingBalance,
  triggerButton,
  onPaymentRecorded,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState<string>(
    outstandingBalance > 0 ? outstandingBalance.toString() : ""
  );
  const [paymentType, setPaymentType] = useState<PaymentType>(
    outstandingBalance === 0 ? PaymentType.OTHER : PaymentType.DEPOSIT
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.BANK_TRANSFER
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (parsedAmount > outstandingBalance + 0.01) {
      toast.error(
        `Amount (€${parsedAmount.toFixed(2)}) cannot exceed outstanding balance (€${outstandingBalance.toFixed(2)}).`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await recordPayment({
        orderId,
        amount: parsedAmount,
        paymentType,
        paymentMethod,
        paymentDate,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      });

      if (res.success) {
        toast.success(
          `Payment ${res.paymentNumber} recorded successfully! Remaining: €${res.outstandingBalance.toFixed(2)}`
        );
        setOpen(false);
        router.refresh();
        onPaymentRecorded?.();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to record payment.";
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
          disabled={outstandingBalance <= 0}
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#e1e6e3] shadow-xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2.5 text-[#083d34] mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-normal text-[#13231c]">
                Record Payment
              </DialogTitle>
              <p className="text-xs text-[#708078]">
                {orderNumber} • {customerName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-2xl bg-[#fbf5ee] border border-[#faecd8] flex items-center justify-between">
            <span className="text-xs text-[#505f58]">Outstanding Balance</span>
            <span className="font-serif text-lg font-semibold text-[#182922]">
              €{outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Payment Amount (€) *
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#708078]">
                €
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={outstandingBalance + 0.01}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
              />
            </div>
            {outstandingBalance > 0 && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAmount(outstandingBalance.toString())}
                  className="text-[11px] font-medium text-[#c86e75] hover:underline"
                >
                  Pay full balance (€{outstandingBalance.toFixed(2)})
                </button>
                <span className="text-[#a0aca6] text-[11px]">•</span>
                <button
                  type="button"
                  onClick={() =>
                    setAmount((Math.round(outstandingBalance * 0.5 * 100) / 100).toString())
                  }
                  className="text-[11px] font-medium text-[#708078] hover:underline"
                >
                  50% Deposit
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Payment Type *
              </Label>
              <Select
                value={paymentType}
                onValueChange={(val) => setPaymentType(val as PaymentType)}
              >
                <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                  <SelectItem value={PaymentType.DEPOSIT}>Initial Deposit</SelectItem>
                  <SelectItem value={PaymentType.MILESTONE}>Milestone Payment</SelectItem>
                  <SelectItem value={PaymentType.FINAL}>Final Balance</SelectItem>
                  <SelectItem value={PaymentType.OTHER}>Other Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Method *
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
              >
                <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                  <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                  <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethod.CHECK}>Check</SelectItem>
                  <SelectItem value={PaymentMethod.MOBILE_MONEY}>Mobile Money</SelectItem>
                  <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                  <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Payment Date *
              </Label>
              <Input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="rounded-xl border-[#e1e6e3] text-xs focus:border-[#083d34]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Reference / Note
              </Label>
              <Input
                type="text"
                placeholder="TXN ID or bank ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="rounded-xl border-[#e1e6e3] text-xs focus:border-[#083d34]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Notes
            </Label>
            <Textarea
              placeholder="Internal payment notes or receipt details..."
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
              <span>Save Payment</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
