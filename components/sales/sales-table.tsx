"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreVertical,
  Calendar,
  Building2,
  FileText,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import { SALES_STATUS_CONFIG } from "@/lib/constants/sales";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import { SalesStatusModal } from "./sales-status-modal";

interface SaleItem {
  id: string;
  title: string;
  status: SalesStatus;
  estimatedValue: number | null;
  serviceType: string | null;
  nextContactDate: Date | string | null;
  updatedAt: Date | string;
  customer?: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  } | null;
  lead?: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string | null;
    phone: string | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    communications: number;
    tasks: number;
    quotations: number;
    orders: number;
  };
}

interface SalesTableProps {
  sales: SaleItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function SalesTable({
  sales,
  totalCount,
  currentPage,
  totalPages,
}: SalesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [modalSale, setModalSale] = useState<SaleItem | null>(null);

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/sales?${params.toString()}`);
  }

  function formatGHS(val: number | null) {
    if (val === null || val === undefined) return "—";
    return `GHS ${val.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#ece8e3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece8e3] bg-[#fcfbf9] text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
                <th className="py-3.5 px-4">Deal & Company</th>
                <th className="py-3.5 px-4">Sales Stage</th>
                <th className="py-3.5 px-4">Est. Value</th>
                <th className="py-3.5 px-4">Assigned Officer</th>
                <th className="py-3.5 px-4">Next Contact</th>
                <th className="py-3.5 px-4">Engagements</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8e3] text-xs text-[#182922]">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9ab7b0]">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#b8dcd0]" />
                    <p className="font-medium text-sm text-[#476355]">No deals found</p>
                    <p className="text-xs text-[#708078] mt-1">
                      Create a new deal or adjust your active search and status filters.
                    </p>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const statusConfig = SALES_STATUS_CONFIG[sale.status];
                  const party = sale.customer || sale.lead;
                  const isCustomer = Boolean(sale.customer);

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-[#fbfcfb] transition-colors group"
                    >
                      {/* Deal & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#182922] group-hover:text-[#062e26]">
                          <Link href={`/sales/${sale.id}`} className="hover:underline">
                            {sale.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#708078]">
                          <Building2 className="w-3 h-3 text-[#8aa9a1]" />
                          <span>{party?.companyName || "No company linked"}</span>
                          {party && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                isCustomer
                                  ? "bg-[#e8f1ed] text-[#1d634d]"
                                  : "bg-[#f5f3ff] text-[#6b21a8]"
                              }`}
                            >
                              {isCustomer ? "Customer" : "Lead"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sales Stage Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          <span>
                            <span className="opacity-60 mr-1">{statusConfig.step}.</span>
                            {statusConfig.label}
                          </span>
                        </span>
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3.5 px-4 font-semibold text-[#182922]">
                        {formatGHS(sale.estimatedValue)}
                      </td>

                      {/* Assigned Officer */}
                      <td className="py-3.5 px-4">
                        {sale.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#062e26] text-white text-[10px] flex items-center justify-center font-bold">
                              {sale.assignedTo.name.charAt(0)}
                            </div>
                            <span className="text-xs text-[#2c4035]">
                              {sale.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9ab7b0] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Next Contact Date */}
                      <td className="py-3.5 px-4 text-[#708078]">
                        {sale.nextContactDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#8aa9a1]" />
                            <span>
                              {new Date(sale.nextContactDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#a0aca6]">—</span>
                        )}
                      </td>

                      {/* Engagement Counters */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-xs text-[#708078]">
                          <span
                            title="Logged Communications"
                            className="flex items-center gap-1 bg-[#f4f7f6] px-2 py-0.5 rounded-md"
                          >
                            <MessageSquare className="w-3 h-3 text-[#8aa9a1]" />
                            {sale._count.communications}
                          </span>
                          <span
                            title="Active Tasks"
                            className="flex items-center gap-1 bg-[#f4f7f6] px-2 py-0.5 rounded-md"
                          >
                            <CheckSquare className="w-3 h-3 text-[#8aa9a1]" />
                            {sale._count.tasks}
                          </span>
                        </div>
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === sale.id ? null : sale.id)
                          }
                          className="p-1.5 rounded-lg text-[#708078] hover:text-[#182922] hover:bg-[#f4f7f6] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === sale.id && (
                          <div className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-xl border border-[#ece8e3] py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                            <Link
                              href={`/sales/${sale.id}`}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-[#182922] hover:bg-[#f4f7f6]"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#8aa9a1]" />
                              View Deal Workspace
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setModalSale(sale);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#182922] hover:bg-[#f4f7f6] text-left"
                            >
                              <TrendingUp className="w-3.5 h-3.5 text-[#8aa9a1]" />
                              Update Stage
                            </button>

                            <Link
                              href={`/quotations/new?saleId=${sale.id}${
                                sale.customer ? `&customerId=${sale.customer.id}` : ""
                              }`}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-[#182922] hover:bg-[#f4f7f6]"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <FileText className="w-3.5 h-3.5 text-[#8aa9a1]" />
                              Create Quotation
                            </Link>

                            <Link
                              href={`/orders/new?saleId=${sale.id}${
                                sale.customer ? `&customerId=${sale.customer.id}` : ""
                              }`}
                              className="flex items-center gap-2 px-3 py-2 text-xs text-[#182922] hover:bg-[#f4f7f6]"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-[#8aa9a1]" />
                              Create Order
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="px-4 py-3 bg-[#fcfbf9] border-t border-[#ece8e3] flex items-center justify-between text-xs text-[#708078]">
            <div>
              Showing {sales.length} of {totalCount} deals
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

      {/* Modal for Status Changes */}
      {modalSale && (
        <SalesStatusModal
          saleId={modalSale.id}
          currentStatus={modalSale.status}
          dealTitle={modalSale.title}
          isOpen={Boolean(modalSale)}
          onClose={() => setModalSale(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
