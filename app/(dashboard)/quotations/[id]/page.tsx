import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getQuotationById } from "@/actions/quotations";
import {
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  Mail,
  Phone,
} from "lucide-react";

export const metadata = {
  title: "Quotation Details | EmanCopys CRM",
};

interface QuotationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  await requireAuth();
  const resolvedParams = await params;
  const quotation = await getQuotationById(resolvedParams.id);

  if (!quotation) {
    notFound();
  }

  const hasOrders = quotation.orders.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/quotations"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quotations</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/orders/new?quotationId=${quotation.id}&customerId=${quotation.customerId}${
              quotation.saleId ? `&saleId=${quotation.saleId}` : ""
            }`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#062e26] text-white text-xs font-semibold hover:bg-[#0b4337] transition-all shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Convert to Confirmed Order</span>
          </Link>
        </div>
      </div>

      {/* Printable / Clean Quotation Sheet */}
      <div className="bg-white rounded-3xl border border-[#ece8e3] shadow-md p-8 sm:p-12 space-y-8">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#ece8e3] pb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#062e26] text-white flex items-center justify-center font-serif text-xl font-bold shadow-xs">
                E
              </div>
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#182922]">
                  EmanCopys
                </h2>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8aa9a1]">
                  Web & Print Solutions
                </p>
              </div>
            </div>
            <p className="text-xs text-[#708078] mt-3">
              Kumasi & Accra, Ghana • contact@emancopys.com • +233 24 000 0000
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8aa9a1]">
              Commercial Quotation
            </span>
            <div className="font-serif text-2xl font-bold text-[#062e26] mt-0.5">
              {quotation.quotationNumber}
            </div>
            <div className="text-xs text-[#708078] mt-1 space-y-0.5">
              <div>
                Issued:{" "}
                <strong className="text-[#2c4035]">
                  {new Date(quotation.quotationDate).toLocaleDateString("en-GB")}
                </strong>
              </div>
              {quotation.validUntil && (
                <div>
                  Valid Until:{" "}
                  <strong className="text-[#2c4035]">
                    {new Date(quotation.validUntil).toLocaleDateString("en-GB")}
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Sale Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8aa9a1] block mb-2">
              Quotation Prepared For
            </span>
            <div className="text-sm font-bold text-[#182922]">
              {quotation.customer.companyName}
            </div>
            <div className="text-xs text-[#2c4035] font-medium mt-0.5">
              Attn: {quotation.customer.contactPerson}
            </div>
            <div className="text-xs text-[#708078] mt-2 space-y-1">
              {quotation.customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-[#8aa9a1]" />
                  <span>{quotation.customer.email}</span>
                </div>
              )}
              {quotation.customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-[#8aa9a1]" />
                  <span>{quotation.customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8aa9a1] block mb-2">
              Representative Details
            </span>
            <div className="text-sm font-semibold text-[#182922]">
              {quotation.responsibleEmployee.name}
            </div>
            <div className="text-xs text-[#708078] mt-0.5">
              Sales Account Manager • {quotation.responsibleEmployee.email}
            </div>

            {quotation.sale && (
              <div className="mt-3 p-2.5 rounded-xl bg-[#fcfbf9] border border-[#ece8e3] text-xs">
                <span className="text-[#8aa9a1] text-[10px] uppercase font-bold">
                  Associated Deal:
                </span>
                <div className="font-semibold text-[#182922] mt-0.5">
                  {quotation.sale.title}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-[#ece8e3] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fcfbf9] border-b border-[#ece8e3] text-[11px] font-semibold text-[#708078] uppercase">
              <tr>
                <th className="py-3 px-4">Description of Deliverables & Scope</th>
                <th className="py-3 px-4 text-right">Price (GHS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8e3]">
              <tr>
                <td className="py-4 px-4 text-[#182922]">
                  <div className="font-semibold text-sm">{quotation.serviceSold}</div>
                  {quotation.notes && (
                    <p className="text-xs text-[#708078] mt-1 whitespace-pre-wrap">
                      {quotation.notes}
                    </p>
                  )}
                </td>
                <td className="py-4 px-4 text-right font-bold text-sm text-[#182922]">
                  GHS {quotation.quotationPrice.toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-[#fcfbf9] border-t border-[#ece8e3]">
              <tr>
                <td className="py-3.5 px-4 font-bold text-xs text-[#182922] uppercase tracking-wider">
                  Total Quoted Amount
                </td>
                <td className="py-3.5 px-4 text-right font-serif text-lg font-bold text-[#062e26]">
                  GHS {quotation.quotationPrice.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Status Badge & Existing Order Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#fcfbf9] border border-[#ece8e3]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#708078]">Current Status:</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#062e26] text-white">
              {quotation.status}
            </span>
          </div>

          {hasOrders && (
            <div className="flex items-center gap-2 text-xs text-[#137333] font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Converted into Order {quotation.orders[0].orderNumber}</span>
              <Link
                href={`/orders/${quotation.orders[0].id}`}
                className="underline font-bold ml-1 hover:text-[#062e26]"
              >
                View Order
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
