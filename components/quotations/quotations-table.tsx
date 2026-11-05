"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QuotationStatus } from "@/lib/generated/prisma/enums";
import { updateQuotationStatus } from "@/actions/quotations";
import {
  FileText,
  Calendar,
  ExternalLink,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";

interface QuotationItem {
  id: string;
  quotationNumber: string;
  serviceSold: string;
  quotationPrice: number;
  quotationDate: Date | string;
  status: QuotationStatus;
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string | null;
  };
  responsibleEmployee: {
    id: string;
    name: string;
  };
  sale?: {
    id: string;
    title: string;
    status: string;
  } | null;
  _count: {
    orders: number;
  };
}

interface QuotationsTableProps {
  quotations: QuotationItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function QuotationsTable({
  quotations,
  totalCount,
  currentPage,
  totalPages,
}: QuotationsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  function getStatusBadge(status: QuotationStatus) {
    switch (status) {
      case QuotationStatus.DRAFT:
        return "bg-[#f4f7f6] text-[#708078] border-[#ece8e3]";
      case QuotationStatus.SENT:
        return "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]";
      case QuotationStatus.ACCEPTED:
        return "bg-[#e6f4ea] text-[#137333] border-[#b7e1cd]";
      case QuotationStatus.REJECTED:
        return "bg-[#fff1f2] text-[#be123c] border-[#fecdd3]";
      case QuotationStatus.EXPIRED:
        return "bg-[#fff7ed] text-[#c2410c] border-[#ffedd5]";
      default:
        return "bg-[#f4f7f6] text-[#708078] border-[#ece8e3]";
    }
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/quotations?${params.toString()}`);
  }

  async function handleQuickStatus(id: string, newStatus: QuotationStatus) {
    setActiveMenuId(null);
    try {
      await updateQuotationStatus(id, newStatus);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#ece8e3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece8e3] bg-[#fcfbf9] text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
                <th className="py-3.5 px-4">Quotation #</th>
                <th className="py-3.5 px-4">Customer Account</th>
                <th className="py-3.5 px-4">Service Description</th>
                <th className="py-3.5 px-4">Quoted Price</th>
                <th className="py-3.5 px-4">Responsible Officer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8e3] text-xs text-[#182922]">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9ab7b0]">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-[#b8dcd0]" />
                    <p className="font-medium text-sm text-[#476355]">No quotations created</p>
                    <p className="text-xs text-[#708078] mt-1">
                      Draft a new quotation for a customer to start tracking commercial terms.
                    </p>
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-[#fbfcfb] transition-colors group">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/quotations/${q.id}`}
                        className="font-bold text-[#062e26] hover:underline"
                      >
                        {q.quotationNumber}
                      </Link>
                      <div className="text-[10px] text-[#708078] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-[#8aa9a1]" />
                        {new Date(q.quotationDate).toLocaleDateString("en-GB")}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#182922]">
                        {q.customer.companyName}
                      </div>
                      <div className="text-[11px] text-[#708078]">
                        {q.customer.contactPerson}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#2c4035] max-w-xs truncate">
                      {q.serviceSold}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#182922]">
                      GHS {q.quotationPrice.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#062e26] text-white text-[9px] flex items-center justify-center font-bold">
                          {q.responsibleEmployee.name.charAt(0)}
                        </div>
                        <span className="text-xs text-[#2c4035]">
                          {q.responsibleEmployee.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(
                          q.status
                        )}`}
                      >
                        {q.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(activeMenuId === q.id ? null : q.id)
                        }
                        className="p-1.5 rounded-lg text-[#708078] hover:text-[#182922] hover:bg-[#f4f7f6] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === q.id && (
                        <div className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-xl border border-[#ece8e3] py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                          <Link
                            href={`/quotations/${q.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-[#182922] hover:bg-[#f4f7f6]"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#8aa9a1]" />
                            View Quotation
                          </Link>

                          {q.status !== QuotationStatus.ACCEPTED && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickStatus(q.id, QuotationStatus.ACCEPTED)
                              }
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#137333] hover:bg-[#e6f4ea] text-left"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#137333]" />
                              Mark Accepted
                            </button>
                          )}

                          {q.status !== QuotationStatus.SENT && (
                            <button
                              type="button"
                              onClick={() => handleQuickStatus(q.id, QuotationStatus.SENT)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1d4ed8] hover:bg-[#eff6ff] text-left"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#1d4ed8]" />
                              Mark as Sent
                            </button>
                          )}

                          <Link
                            href={`/orders/new?quotationId=${q.id}&customerId=${q.customer.id}${
                              q.sale ? `&saleId=${q.sale.id}` : ""
                            }`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#062e26] hover:bg-[#e8f1ed]"
                            onClick={() => setActiveMenuId(null)}
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-[#1d634d]" />
                            Convert to Order
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="px-4 py-3 bg-[#fcfbf9] border-t border-[#ece8e3] flex items-center justify-between text-xs text-[#708078]">
            <div>
              Showing {quotations.length} of {totalCount} quotations
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1 rounded-lg border border-[#ece8e3] bg-white disabled:opacity-40 hover:bg-[#f4f7f6] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-[#182922]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1 rounded-lg border border-[#ece8e3] bg-white disabled:opacity-40 hover:bg-[#f4f7f6] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
