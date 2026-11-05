"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import {
  ShoppingBag,
  Calendar,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface OrderItem {
  id: string;
  orderNumber: string;
  serviceSold: string;
  totalAmount: number;
  agreedCommission: number;
  orderDate: Date | string;
  status: OrderStatus;
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
  quotation?: {
    id: string;
    quotationNumber: string;
    quotationPrice: number;
  } | null;
  project?: {
    id: string;
    projectNumber: string;
    status: string;
  } | null;
}

interface OrdersTableProps {
  orders: OrderItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function OrdersTable({
  orders,
  totalCount,
  currentPage,
  totalPages,
}: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/orders?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#ece8e3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece8e3] bg-[#fcfbf9] text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer Account</th>
                <th className="py-3.5 px-4">Service Sold</th>
                <th className="py-3.5 px-4">Order Total</th>
                <th className="py-3.5 px-4">Agreed Commission</th>
                <th className="py-3.5 px-4">Responsible Officer</th>
                <th className="py-3.5 px-4">Project Pipeline</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8e3] text-xs text-[#182922]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9ab7b0]">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#b8dcd0]" />
                    <p className="font-medium text-sm text-[#476355]">No orders found</p>
                    <p className="text-xs text-[#708078] mt-1">
                      Convert an accepted quotation or record a won deal to register an order.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#fbfcfb] transition-colors group">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/orders/${o.id}`}
                        className="font-bold text-[#062e26] hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <div className="text-[10px] text-[#708078] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-[#8aa9a1]" />
                        {new Date(o.orderDate).toLocaleDateString("en-GB")}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#182922]">
                        {o.customer.companyName}
                      </div>
                      <div className="text-[11px] text-[#708078]">
                        {o.customer.contactPerson}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#2c4035] max-w-xs truncate">
                      {o.serviceSold}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#182922]">
                      GHS {o.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#137333] bg-[#e6f4ea] px-2 py-0.5 rounded-md border border-[#b7e1cd]">
                        GHS {o.agreedCommission.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#062e26] text-white text-[9px] flex items-center justify-center font-bold">
                          {o.responsibleEmployee.name.charAt(0)}
                        </div>
                        <span className="text-xs text-[#2c4035]">
                          {o.responsibleEmployee.name}
                        </span>
                      </div>
                    </td>

                    {/* Associated Project */}
                    <td className="py-3.5 px-4">
                      {o.project ? (
                        <Link
                          href={`/projects/${o.project.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#062e26] text-white text-[11px] font-medium hover:bg-[#0b4337] transition-colors"
                        >
                          <Briefcase className="w-3 h-3 text-[#f5adb2]" />
                          <span>{o.project.projectNumber}</span>
                        </Link>
                      ) : (
                        <span className="text-[#a0aca6] text-[11px] italic">
                          No project linked
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#ece8e3] bg-white text-xs text-[#182922] hover:bg-[#f4f7f6] transition-colors font-medium"
                      >
                        <ExternalLink className="w-3 h-3 text-[#8aa9a1]" />
                        <span>Details</span>
                      </Link>
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
              Showing {orders.length} of {totalCount} orders
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
