"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { updateOrderPaymentDates } from "@/actions/payments";
import { PaymentStatus, PaymentType } from "@/lib/generated/prisma/enums";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Edit2,
  Loader2,
} from "lucide-react";

interface OrderPaymentsCardProps {
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    depositAmount?: number | null;
    invoiceDate?: Date | null;
    paymentDueDate?: Date | null;
    paymentStatus: PaymentStatus;
    customer: {
      id: string;
      companyName: string;
    };
    payments: Array<{
      id: string;
      paymentNumber: string;
      amount: number;
      paymentType: PaymentType;
      paymentMethod: string;
      paymentDate: Date | string;
      reference?: string | null;
      notes?: string | null;
      receivedBy: {
        name?: string | null;
        email?: string | null;
      };
    }>;
  };
}

export function OrderPaymentsCard({ order }: OrderPaymentsCardProps) {
  const router = useRouter();
  const [editingDates, setEditingDates] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);

  const [invoiceDate, setInvoiceDate] = useState(
    order.invoiceDate ? new Date(order.invoiceDate).toISOString().slice(0, 10) : ""
  );
  const [paymentDueDate, setPaymentDueDate] = useState(
    order.paymentDueDate
      ? new Date(order.paymentDueDate).toISOString().slice(0, 10)
      : ""
  );
  const [depositAmount, setDepositAmount] = useState<string>(
    order.depositAmount ? order.depositAmount.toString() : ""
  );

  const totalPaid = Math.round(
    order.payments.reduce((sum, p) => sum + p.amount, 0) * 100
  ) / 100;
  const outstandingBalance = Math.round(
    Math.max(0, order.totalAmount - totalPaid) * 100
  ) / 100;

  function formatCurrency(val: number) {
    return `€${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(d: Date | string | null | undefined) {
    if (!d) return "Not set";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  function getStatusBadge(status: PaymentStatus) {
    switch (status) {
      case PaymentStatus.FULLY_PAID:
        return (
          <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] px-2.5 py-1 text-xs font-medium gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fully Paid</span>
          </Badge>
        );
      case PaymentStatus.PARTIALLY_PAID:
        return (
          <Badge className="bg-[#fbf5ee] text-[#ba7528] border-[#faecd8] px-2.5 py-1 text-xs font-medium gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Partially Paid</span>
          </Badge>
        );
      case PaymentStatus.OVERDUE:
        return (
          <Badge className="bg-[#fef1f2] text-[#c95965] border-[#fad5d9] px-2.5 py-1 text-xs font-medium gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#f5f7f6] text-[#708078] border-[#e1e6e3] px-2.5 py-1 text-xs font-medium gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Unpaid</span>
          </Badge>
        );
    }
  }

  async function handleSaveDates(e: React.FormEvent) {
    e.preventDefault();
    setLoadingDates(true);
    try {
      await updateOrderPaymentDates({
        orderId: order.id,
        invoiceDate: invoiceDate || null,
        paymentDueDate: paymentDueDate || null,
        depositAmount: depositAmount ? parseFloat(depositAmount) : null,
      });
      toast.success("Payment schedule and dates updated.");
      setEditingDates(false);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update payment dates.";
      toast.error(message);
    } finally {
      setLoadingDates(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f0f3f1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-semibold text-[#13231c]">
                Payment Management
              </h3>
              {getStatusBadge(order.paymentStatus)}
            </div>
            <p className="text-xs text-[#708078] mt-0.5">
              Financial breakdown and recorded payments for {order.orderNumber}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingDates(!editingDates)}
            className="rounded-xl text-xs gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#708078]" />
            <span>{editingDates ? "Cancel Dates" : "Invoice & Dates"}</span>
          </Button>

          <RecordPaymentDialog
            orderId={order.id}
            orderNumber={order.orderNumber}
            customerName={order.customer.companyName}
            outstandingBalance={outstandingBalance}
          />
        </div>
      </div>

      {/* Date edit form */}
      {editingDates && (
        <form
          onSubmit={handleSaveDates}
          className="p-4 rounded-2xl bg-[#faf8f5] border border-[#f0eee9] space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#182922]">
                Invoice Date
              </Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="rounded-xl bg-white border-[#e1e6e3] text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#182922]">
                Payment Due Date
              </Label>
              <Input
                type="date"
                value={paymentDueDate}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                className="rounded-xl bg-white border-[#e1e6e3] text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-[#182922]">
                Required Deposit (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Optional agreed deposit"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="rounded-xl bg-white border-[#e1e6e3] text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={loadingDates}
              className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl text-xs gap-1"
            >
              {loadingDates && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      )}

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Amount */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#f0eee9]">
          <span className="text-[11px] font-medium text-[#708078] block">
            Total Order Amount
          </span>
          <span className="font-serif text-xl font-semibold text-[#182922] mt-1 block">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>

        {/* Amount Paid */}
        <div className="p-4 rounded-2xl bg-[#e8f6ed]/60 border border-[#cbe8d5]">
          <span className="text-[11px] font-medium text-[#2d7a4f] block">
            Amount Already Paid
          </span>
          <span className="font-serif text-xl font-semibold text-[#2d7a4f] mt-1 block">
            {formatCurrency(totalPaid)}
          </span>
          <span className="text-[10px] text-[#2d7a4f] mt-0.5 block font-medium">
            {order.totalAmount > 0
              ? `${Math.round((totalPaid / order.totalAmount) * 100)}% settled`
              : "0%"}
          </span>
        </div>

        {/* Outstanding Balance */}
        <div className="p-4 rounded-2xl bg-[#fef1f2]/70 border border-[#fad5d9]">
          <span className="text-[11px] font-medium text-[#c95965] block">
            Outstanding Amount
          </span>
          <span className="font-serif text-xl font-semibold text-[#c95965] mt-1 block">
            {formatCurrency(outstandingBalance)}
          </span>
          <span className="text-[10px] text-[#c95965] mt-0.5 block font-medium">
            Remaining balance
          </span>
        </div>

        {/* Deposit & Dates */}
        <div className="p-4 rounded-2xl bg-white border border-[#e8ecea]">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#708078]">Deposit:</span>
              <span className="font-medium text-[#182922]">
                {order.depositAmount ? formatCurrency(order.depositAmount) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#708078]">Invoice:</span>
              <span className="font-medium text-[#182922]">
                {formatDate(order.invoiceDate)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#708078]">Due Date:</span>
              <span className="font-medium text-[#182922]">
                {formatDate(order.paymentDueDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History List */}
      <div>
        <h4 className="font-serif text-sm font-semibold text-[#182922] mb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#083d34]" />
          <span>Payment History ({order.payments.length})</span>
        </h4>

        {order.payments.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#faf8f5] text-center text-xs text-[#708078] border border-dashed border-[#e1e6e3]">
            No payments recorded yet for this order. Click &quot;Record Payment&quot; above to add an initial deposit or milestone payment.
          </div>
        ) : (
          <div className="space-y-2.5">
            {order.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#faf8f5] border border-[#f0eee9] hover:border-[#e1e6e3] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#e1e6e3] flex items-center justify-center font-mono text-[10px] font-bold text-[#083d34]">
                    €
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-[#182922]">
                        {p.paymentNumber}
                      </span>
                      <Badge className="bg-white border-[#e1e6e3] text-[#505f58] text-[9px] font-normal uppercase">
                        {p.paymentType}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-[#708078] mt-0.5 flex items-center gap-2">
                      <span>{formatDate(p.paymentDate)}</span>
                      <span>•</span>
                      <span className="capitalize">{p.paymentMethod.replace(/_/g, " ").toLowerCase()}</span>
                      {p.reference && (
                        <>
                          <span>•</span>
                          <span className="text-[#8a9992]">Ref: {p.reference}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-serif text-sm font-semibold text-[#182922] block">
                    {formatCurrency(p.amount)}
                  </span>
                  <span className="text-[10px] text-[#8a9992] block">
                    by {p.receivedBy.name || p.receivedBy.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
