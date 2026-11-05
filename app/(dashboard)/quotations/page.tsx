import { requireAuth } from "@/lib/auth-utils";
import { getQuotations } from "@/actions/quotations";
import { prisma } from "@/lib/prisma";
import { QuotationsTable } from "@/components/quotations/quotations-table";
import { Role, QuotationStatus } from "@/lib/generated/prisma/enums";
import Link from "next/link";
import { FileText, Plus, CheckCircle, Clock } from "lucide-react";

export const metadata = {
  title: "Quotations | EmanCopys CRM",
};

interface QuotationsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const search = resolvedSearchParams.search || "";
  const status = resolvedSearchParams.status || "";
  const page = Number(resolvedSearchParams.page) || 1;

  const userScope =
    user.role === Role.ADMIN
      ? {}
      : {
          OR: [
            { responsibleEmployeeId: user.id },
            { createdById: user.id },
            { customer: { assignedToId: user.id } },
          ],
        };

  const [
    totalCount,
    acceptedCount,
    sentCount,
    quotedTotalAgg,
    quotationsData,
  ] = await Promise.all([
    prisma.quotation.count({ where: userScope }),
    prisma.quotation.count({
      where: { ...userScope, status: QuotationStatus.ACCEPTED },
    }),
    prisma.quotation.count({
      where: { ...userScope, status: QuotationStatus.SENT },
    }),
    prisma.quotation.aggregate({
      where: userScope,
      _sum: { quotationPrice: true },
    }),
    getQuotations({ search, status, page, limit: 10 }),
  ]);

  const totalQuotedValue = quotedTotalAgg._sum.quotationPrice || 0;

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-medium text-[#182922]">
            Quotations Management
          </h1>
          <p className="text-xs lg:text-sm text-[#708078] mt-1">
            Create, track, and convert client quotations into confirmed production orders.
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#062e26] text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ab7b0]">Total Quotations</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#f5adb2]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold">{totalCount}</div>
            <div className="text-[11px] text-[#8aa9a1] mt-1">Issued commercial offers</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1d4ed8]">Total Quoted Value</span>
            <div className="w-8 h-8 rounded-xl bg-[#dbeafe] flex items-center justify-center text-[#1d4ed8]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl font-bold text-[#182922]">
              GHS {totalQuotedValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Across all issued proposals</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#e6f4ea] border border-[#b7e1cd] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#137333]">Accepted Quotes</span>
            <div className="w-8 h-8 rounded-xl bg-[#cbf0d8] flex items-center justify-center text-[#137333]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">
              {acceptedCount}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Ready for order creation</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#fff7ed] border border-[#ffedd5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#c2410c]">Awaiting Response</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffedd5] flex items-center justify-center text-[#c2410c]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">{sentCount}</div>
            <div className="text-[11px] text-[#708078] mt-1">Sent to customers</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <QuotationsTable
        quotations={quotationsData.quotations}
        totalCount={quotationsData.totalCount}
        currentPage={quotationsData.currentPage}
        totalPages={quotationsData.totalPages}
      />
    </div>
  );
}
