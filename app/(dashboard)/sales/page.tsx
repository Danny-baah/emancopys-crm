import { requireAuth } from "@/lib/auth-utils";
import { getSales } from "@/actions/sales";
import { prisma } from "@/lib/prisma";
import { SalesFilters } from "@/components/sales/sales-filters";
import { SalesTable } from "@/components/sales/sales-table";
import { Role, SalesStatus } from "@/lib/generated/prisma/enums";
import { TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Sales Management | EmanCopys CRM",
  description: "Manage client deals, communications, quotations, and sales pipeline.",
};

interface SalesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const search = resolvedSearchParams.search || "";
  const status = resolvedSearchParams.status || "";
  const page = Number(resolvedSearchParams.page) || 1;

  const userScope =
    user.role === Role.ADMIN
      ? {}
      : { OR: [{ assignedToId: user.id }, { createdById: user.id }] };

  // Fetch metrics & deals concurrently
  const [
    totalDeals,
    wonDeals,
    followUpDeals,
    pipelineAgg,
    salesData,
  ] = await Promise.all([
    prisma.sale.count({ where: userScope }),
    prisma.sale.count({ where: { ...userScope, status: SalesStatus.DEAL_WON } }),
    prisma.sale.count({
      where: { ...userScope, status: SalesStatus.FOLLOW_UP_REQUIRED },
    }),
    prisma.sale.aggregate({
      where: {
        ...userScope,
        status: { notIn: [SalesStatus.DEAL_WON, SalesStatus.DEAL_LOST] },
      },
      _sum: { estimatedValue: true },
    }),
    getSales({ search, status, page, limit: 10 }),
  ]);

  const pipelineValue = pipelineAgg._sum.estimatedValue || 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-medium text-[#182922]">
          Sales Management
        </h1>
        <p className="text-xs lg:text-sm text-[#708078] mt-1">
          Track deals across the 10 sales milestones, log client communications, and convert opportunities into orders.
        </p>
      </div>

      {/* 4 Metric Cards matching EmanCopys visual identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Deals */}
        <div className="p-5 rounded-2xl bg-[#062e26] text-white shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ab7b0]">Active Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#f5adb2]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold">{totalDeals}</div>
            <div className="text-[11px] text-[#8aa9a1] mt-1">Opportunities tracked</div>
          </div>
        </div>

        {/* Card 2: Pipeline Value */}
        <div className="p-5 rounded-2xl bg-[#fff7ed] border border-[#ffedd5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#c2410c]">Pipeline Value</span>
            <div className="w-8 h-8 rounded-xl bg-[#ffedd5] flex items-center justify-center text-[#c2410c]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl font-bold text-[#182922]">
              GHS {pipelineValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">In active progression</div>
          </div>
        </div>

        {/* Card 3: Deals Won */}
        <div className="p-5 rounded-2xl bg-[#e6f4ea] border border-[#b7e1cd] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#137333]">Won Deals</span>
            <div className="w-8 h-8 rounded-xl bg-[#cbf0d8] flex items-center justify-center text-[#137333]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">{wonDeals}</div>
            <div className="text-[11px] text-[#708078] mt-1">Converted to orders</div>
          </div>
        </div>

        {/* Card 4: Follow-Ups Required */}
        <div className="p-5 rounded-2xl bg-[#fdf2e9] border border-[#fcd9be] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#b25e14]">Follow-Ups</span>
            <div className="w-8 h-8 rounded-xl bg-[#fae5d3] flex items-center justify-center text-[#b25e14]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">
              {followUpDeals}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Action required</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <SalesFilters currentStatus={status} currentSearch={search} />

      {/* Sales Data Table */}
      <SalesTable
        sales={salesData.sales}
        totalCount={salesData.totalCount}
        currentPage={salesData.currentPage}
        totalPages={salesData.totalPages}
      />
    </div>
  );
}
