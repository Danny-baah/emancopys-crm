import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getOrderById } from "@/actions/orders";
import { createProjectForOrder } from "@/actions/projects";
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  Award,
  ExternalLink,
  Plus,
} from "lucide-react";

export const metadata = {
  title: "Order Details | EmanCopys CRM",
};

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  await requireAuth();
  const resolvedParams = await params;
  const order = await getOrderById(resolvedParams.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>

        {order.project ? (
          <Link
            href={`/projects/${order.project.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#062e26] text-white text-xs font-semibold hover:bg-[#0b4337] transition-all shadow-xs"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#f5adb2]" />
            <span>Open Website Project ({order.project.projectNumber})</span>
          </Link>
        ) : (
          <form
            action={async () => {
              "use server";
              await createProjectForOrder(order.id);
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#062e26] text-white text-xs font-semibold hover:bg-[#0b4337] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Initialize Website Production Project</span>
            </button>
          </form>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl border border-[#ece8e3] shadow-md p-8 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#ece8e3] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8aa9a1] uppercase tracking-wider">
              <span>Confirmed Production Order</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#182922] mt-1">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-[#708078] mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8aa9a1]" />
              Contracted on {new Date(order.orderDate).toLocaleDateString("en-GB", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd]">
              {order.status}
            </span>
          </div>
        </div>

        {/* 2 Metric Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe]">
            <span className="text-xs font-semibold text-[#1d4ed8] flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Total Order Volume
            </span>
            <div className="font-serif text-3xl font-bold text-[#182922] mt-2">
              GHS {order.totalAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Contract value</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#e6f4ea] border border-[#b7e1cd]">
            <span className="text-xs font-semibold text-[#137333] flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Agreed Sales Commission
            </span>
            <div className="font-serif text-3xl font-bold text-[#137333] mt-2">
              GHS {order.agreedCommission.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#2c4035] mt-1">
              Stored commission for {order.responsibleEmployee.name}
            </div>
          </div>
        </div>

        {/* Customer & Scope Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-[#fcfbf9] border border-[#ece8e3] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8aa9a1]">
              Customer Account
            </span>
            <div className="text-sm font-bold text-[#182922]">
              {order.customer.companyName}
            </div>
            <div className="text-xs text-[#2c4035]">
              Contact: {order.customer.contactPerson}
            </div>
            {order.customer.email && (
              <div className="text-xs text-[#708078]">{order.customer.email}</div>
            )}
            {order.customer.phone && (
              <div className="text-xs text-[#708078]">{order.customer.phone}</div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-[#fcfbf9] border border-[#ece8e3] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8aa9a1]">
              Contracted Service Scope
            </span>
            <div className="text-sm font-semibold text-[#182922]">
              {order.serviceSold}
            </div>
            {order.notes && (
              <p className="text-xs text-[#708078] italic whitespace-pre-wrap mt-1">
                {order.notes}
              </p>
            )}
            <div className="pt-2 text-[11px] text-[#708078]">
              Account Officer: <strong className="text-[#2c4035]">{order.responsibleEmployee.name}</strong>
            </div>
          </div>
        </div>

        {/* Associated Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#ece8e3]">
          {order.quotation && (
            <div className="p-4 rounded-xl border border-[#ece8e3] bg-[#fdfdfd]">
              <span className="text-[10px] font-bold uppercase text-[#8aa9a1]">
                Originating Quotation
              </span>
              <div className="font-semibold text-xs text-[#182922] mt-1">
                <Link
                  href={`/quotations/${order.quotation.id}`}
                  className="hover:underline flex items-center gap-1 text-[#062e26]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {order.quotation.quotationNumber}
                </Link>
              </div>
            </div>
          )}

          {order.sale && (
            <div className="p-4 rounded-xl border border-[#ece8e3] bg-[#fdfdfd]">
              <span className="text-[10px] font-bold uppercase text-[#8aa9a1]">
                Deal Pipeline
              </span>
              <div className="font-semibold text-xs text-[#182922] mt-1">
                <Link
                  href={`/sales/${order.sale.id}`}
                  className="hover:underline flex items-center gap-1 text-[#062e26]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {order.sale.title}
                </Link>
              </div>
            </div>
          )}

          {order.project && (
            <div className="p-4 rounded-xl border border-[#b8dcd0] bg-[#e8f1ed]">
              <span className="text-[10px] font-bold uppercase text-[#1d634d]">
                Connected Production Project
              </span>
              <div className="font-semibold text-xs text-[#062e26] mt-1">
                <Link
                  href={`/projects/${order.project.id}`}
                  className="hover:underline flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#1d634d]" />
                  {order.project.projectNumber} ({order.project.status})
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
