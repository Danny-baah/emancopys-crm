"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PaymentType, PaymentMethod } from "@/lib/generated/prisma/enums";
import { CreditCard, Calendar, ArrowUpRight } from "lucide-react";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentDate: Date | string;
  reference?: string | null;
  notes?: string | null;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    paymentStatus: string;
  };
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
  };
  receivedBy: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

interface PaymentsTableProps {
  payments: PaymentItem[];
  emptyMessage?: string;
}

export function PaymentsTable({
  payments,
  emptyMessage = "No payment records found.",
}: PaymentsTableProps) {
  function formatCurrency(val: number) {
    return `€${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(d: Date | string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  function getTypeBadge(type: PaymentType) {
    switch (type) {
      case PaymentType.DEPOSIT:
        return (
          <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px] font-medium">
            Deposit
          </Badge>
        );
      case PaymentType.MILESTONE:
        return (
          <Badge className="bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7] text-[10px] font-medium">
            Milestone
          </Badge>
        );
      case PaymentType.FINAL:
        return (
          <Badge className="bg-[#fef1f2] text-[#c95965] border-[#fad5d9] text-[10px] font-medium">
            Final Balance
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#fbf5ee] text-[#ba7528] border-[#faecd8] text-[10px] font-medium">
            Other
          </Badge>
        );
    }
  }

  function formatMethod(method: PaymentMethod) {
    return method.replace(/_/g, " ").toLowerCase();
  }

  if (payments.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-[#e8ecea]">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f7f3] text-[#377b58] flex items-center justify-center mx-auto mb-3">
          <CreditCard className="w-6 h-6" />
        </div>
        <p className="font-serif text-base text-[#13231c] font-normal">{emptyMessage}</p>
        <p className="text-xs text-[#708078] mt-1 max-w-sm mx-auto">
          Record initial deposits and final milestone payments on orders to keep your cashflow and accounts balanced.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#e8ecea] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#f0f3f1] bg-[#fbfaf8] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase">
              <th className="py-3.5 px-6 font-semibold">Payment No.</th>
              <th className="py-3.5 px-4 font-semibold">Date</th>
              <th className="py-3.5 px-4 font-semibold">Customer</th>
              <th className="py-3.5 px-4 font-semibold">Order</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold">Method</th>
              <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
              <th className="py-3.5 px-6 font-semibold">Received By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7faf8]">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-[#fafbfb] transition-colors">
                <td className="py-4 px-6 font-medium text-[#182922]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#083d34] font-semibold">
                      {p.paymentNumber}
                    </span>
                    {p.reference && (
                      <span className="text-[10px] text-[#8a9992] truncate max-w-[90px]" title={p.reference}>
                        ({p.reference})
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-4 px-4 text-[#708078]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#a0aca6]" />
                    <span>{formatDate(p.paymentDate)}</span>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <Link
                    href={`/customers/${p.customer.id}`}
                    className="group flex flex-col hover:text-[#083d34] transition-colors"
                  >
                    <span className="font-medium text-[#182922] group-hover:text-[#083d34]">
                      {p.customer.companyName}
                    </span>
                    <span className="text-[10px] text-[#8a9992]">
                      {p.customer.contactPerson}
                    </span>
                  </Link>
                </td>

                <td className="py-4 px-4">
                  <Link
                    href={`/orders/${p.order.id}`}
                    className="inline-flex items-center gap-1 text-[#083d34] hover:underline font-mono text-[11px]"
                  >
                    <span>{p.order.orderNumber}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>

                <td className="py-4 px-4">{getTypeBadge(p.paymentType)}</td>

                <td className="py-4 px-4 text-[#505f58] capitalize">
                  {formatMethod(p.paymentMethod)}
                </td>

                <td className="py-4 px-4 text-right font-serif text-sm font-semibold text-[#182922]">
                  {formatCurrency(p.amount)}
                </td>

                <td className="py-4 px-6 text-[#708078]">
                  <span className="text-xs">{p.receivedBy.name || p.receivedBy.email}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

