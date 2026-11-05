import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getSaleById } from "@/actions/sales";
import { SalePipelineStepper } from "@/components/sales/sale-pipeline-stepper";
import { SaleCommunicationsPanel } from "@/components/sales/sale-communications-panel";
import { SaleTasksPanel } from "@/components/sales/sale-tasks-panel";
import { SALES_STATUS_CONFIG } from "@/lib/constants/sales";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import {
  Building2,
  Calendar,
  FileText,
  ShoppingBag,
  Edit,
  ArrowLeft,
  Tag,
  AlertTriangle,
  History,
} from "lucide-react";

export const metadata = {
  title: "Deal Workspace | EmanCopys CRM",
};

interface SaleDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  await requireAuth();
  const resolvedParams = await params;
  const sale = await getSaleById(resolvedParams.id);

  if (!sale) {
    notFound();
  }

  const statusConfig = SALES_STATUS_CONFIG[sale.status];
  const party = sale.customer || sale.lead;
  const isCustomer = Boolean(sale.customer);
  const isWon = sale.status === SalesStatus.DEAL_WON;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/sales"
            className="p-2 rounded-xl border border-[#ece8e3] bg-white text-[#708078] hover:text-[#182922] hover:bg-[#f4f7f6] transition-colors mt-0.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-medium text-[#182922]">
                {sale.title}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                <span>{statusConfig.step}.</span> {statusConfig.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#708078]">
              {party && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8aa9a1]" />
                  <span className="font-medium text-[#2c4035]">{party.companyName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      isCustomer
                        ? "bg-[#e8f1ed] text-[#1d634d]"
                        : "bg-[#f5f3ff] text-[#6b21a8]"
                    }`}
                  >
                    {isCustomer ? "Customer" : "Lead"}
                  </span>
                </div>
              )}

              {sale.serviceType && (
                <span className="text-[#a0aca6]">• {sale.serviceType}</span>
              )}

              {sale.assignedTo && (
                <span className="text-[#a0aca6]">
                  • Assigned to: <strong className="text-[#2c4035]">{sale.assignedTo.name}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/sales/${sale.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#182922] hover:bg-[#f4f7f6] transition-colors shadow-xs"
          >
            <Edit className="w-3.5 h-3.5 text-[#8aa9a1]" />
            <span>Edit Deal</span>
          </Link>

          <Link
            href={`/quotations/new?saleId=${sale.id}${
              sale.customerId ? `&customerId=${sale.customerId}` : ""
            }`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#b8dcd0] bg-[#e8f1ed] text-xs font-semibold text-[#1d634d] hover:bg-[#b8dcd0] transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </Link>

          <Link
            href={`/orders/new?saleId=${sale.id}${
              sale.customerId ? `&customerId=${sale.customerId}` : ""
            }`}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              isWon
                ? "bg-[#137333] text-white hover:bg-[#0e5a27]"
                : "bg-[#062e26] text-white hover:bg-[#0b4337]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isWon ? "Create Project Order" : "Mark Won & Order"}</span>
          </Link>
        </div>
      </div>

      {/* Horizontal Pipeline Stepper (All 10 Statuses) */}
      <SalePipelineStepper currentStatus={sale.status} />

      {/* Main Grid: Left side intelligence & records, Right side communications & tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Discovery Intelligence & Linked Records */}
        <div className="lg:col-span-5 space-y-6">
          {/* Discovery Intelligence Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
              Discovery Intelligence
            </h3>

            <div>
              <span className="block text-[11px] font-semibold text-[#8aa9a1] uppercase tracking-wider mb-1">
                Estimated Deal Value
              </span>
              <div className="font-serif text-2xl font-bold text-[#182922]">
                {sale.estimatedValue
                  ? `GHS ${sale.estimatedValue.toLocaleString()}`
                  : "Not specified"}
              </div>
            </div>

            <div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8aa9a1] uppercase tracking-wider mb-1">
                <Tag className="w-3 h-3 text-[#1d634d]" />
                Customer Interests
              </span>
              <p className="text-xs text-[#2c4035] bg-[#fcfbf9] p-3 rounded-xl border border-[#ece8e3] whitespace-pre-wrap">
                {sale.interests || "No customer interests documented yet."}
              </p>
            </div>

            <div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8aa9a1] uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3 h-3 text-[#be123c]" />
                Customer Objections
              </span>
              <p className="text-xs text-[#2c4035] bg-[#fcfbf9] p-3 rounded-xl border border-[#ece8e3] whitespace-pre-wrap">
                {sale.objections || "No customer objections documented."}
              </p>
            </div>

            {sale.nextContactDate && (
              <div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#8aa9a1] uppercase tracking-wider mb-1">
                  <Calendar className="w-3 h-3 text-[#c2410c]" />
                  Next Scheduled Contact
                </span>
                <p className="text-xs font-semibold text-[#c2410c] bg-[#fff7ed] p-2.5 rounded-xl border border-[#ffedd5]">
                  {new Date(sale.nextContactDate).toLocaleDateString("en-GB", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}

            {sale.notes && (
              <div>
                <span className="block text-[11px] font-semibold text-[#8aa9a1] uppercase tracking-wider mb-1">
                  Internal Notes
                </span>
                <p className="text-xs text-[#708078] italic whitespace-pre-wrap">
                  {sale.notes}
                </p>
              </div>
            )}
          </div>

          {/* Connected Quotations & Orders Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
              Commercial Documents
            </h3>

            {/* Quotations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#182922]">Quotations</span>
                <Link
                  href={`/quotations/new?saleId=${sale.id}${
                    sale.customerId ? `&customerId=${sale.customerId}` : ""
                  }`}
                  className="text-[11px] text-[#1d634d] hover:underline font-medium"
                >
                  + Add Quote
                </Link>
              </div>
              {sale.quotations.length === 0 ? (
                <p className="text-xs text-[#9ab7b0] italic">No quotations drafted.</p>
              ) : (
                <div className="space-y-2">
                  {sale.quotations.map((q) => (
                    <Link
                      key={q.id}
                      href={`/quotations/${q.id}`}
                      className="p-3 rounded-xl border border-[#ece8e3] hover:border-[#b8dcd0] transition-colors flex items-center justify-between block group"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#182922] group-hover:text-[#062e26]">
                          {q.quotationNumber}
                        </div>
                        <div className="text-[11px] text-[#708078]">
                          GHS {q.quotationPrice.toLocaleString()} • {q.serviceSold}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f4f7f6] border border-[#ece8e3] font-medium text-[#2c4035]">
                        {q.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Orders */}
            <div className="pt-2 border-t border-[#ece8e3]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#182922]">Confirmed Orders</span>
                <Link
                  href={`/orders/new?saleId=${sale.id}${
                    sale.customerId ? `&customerId=${sale.customerId}` : ""
                  }`}
                  className="text-[11px] text-[#1d634d] hover:underline font-medium"
                >
                  + New Order
                </Link>
              </div>
              {sale.orders.length === 0 ? (
                <p className="text-xs text-[#9ab7b0] italic">No orders confirmed yet.</p>
              ) : (
                <div className="space-y-2">
                  {sale.orders.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="p-3 rounded-xl border border-[#ece8e3] hover:border-[#b8dcd0] transition-colors flex items-center justify-between block group bg-[#fbfcfa]"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#182922] group-hover:text-[#062e26]">
                          {o.orderNumber}
                        </div>
                        <div className="text-[11px] text-[#708078]">
                          GHS {o.totalAmount.toLocaleString()} • Commission: GHS{" "}
                          {o.agreedCommission.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {o.project && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#062e26] text-white font-medium">
                            Project Active
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] font-medium border border-[#b7e1cd]">
                          {o.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Change Audit Trail */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-3">
            <h3 className="font-serif text-sm font-semibold text-[#182922] flex items-center gap-2">
              <History className="w-4 h-4 text-[#8aa9a1]" />
              Status Audit History
            </h3>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {sale.statusHistory.map((h) => (
                <div key={h.id} className="border-l-2 border-[#b8dcd0] pl-3 py-0.5">
                  <div className="font-semibold text-[#182922]">
                    {h.fromStatus ? `${h.fromStatus} → ` : ""}
                    {h.toStatus}
                  </div>
                  {h.notes && <div className="text-[#708078] text-[11px] mt-0.5">{h.notes}</div>}
                  <div className="text-[10px] text-[#a0aca6] mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    by {h.user.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Communication Notes & Tasks Panels */}
        <div className="lg:col-span-7 space-y-6">
          <SaleCommunicationsPanel
            saleId={sale.id}
            communications={sale.communications}
          />

          <SaleTasksPanel saleId={sale.id} tasks={sale.tasks} />
        </div>
      </div>
    </div>
  );
}
