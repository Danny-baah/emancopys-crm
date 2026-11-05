import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getLeads } from "@/actions/leads";
import { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import { Role, LeadStatus } from "@/lib/generated/prisma/enums";
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    status?: string;
    assignedToId?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;
  const resolvedParams = await searchParams;

  const search = resolvedParams.search || "";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const status = resolvedParams.status || "ALL";
  const assignedToId = resolvedParams.assignedToId || "";

  // Base scope
  const userScope = isAdmin
    ? {}
    : { OR: [{ assignedToId: user.id }, { createdById: user.id }] };

  // Fetch counts, aggregations, and leads list concurrently
  const [
    totalAllCount,
    newCount,
    contactedCount,
    qualifiedCount,
    proposalCount,
    convertedCount,
    pipelineSum,
    leadsData,
  ] = await Promise.all([
    prisma.lead.count({ where: userScope }),
    prisma.lead.count({ where: { ...userScope, status: LeadStatus.NEW } }),
    prisma.lead.count({ where: { ...userScope, status: LeadStatus.CONTACTED } }),
    prisma.lead.count({ where: { ...userScope, status: LeadStatus.QUALIFIED } }),
    prisma.lead.count({ where: { ...userScope, status: LeadStatus.PROPOSAL_SENT } }),
    prisma.lead.count({ where: { ...userScope, status: LeadStatus.CONVERTED } }),
    prisma.lead.aggregate({
      where: {
        ...userScope,
        status: { in: [LeadStatus.QUALIFIED, LeadStatus.PROPOSAL_SENT, LeadStatus.NEW] },
      },
      _sum: { estimatedValue: true },
    }),
    getLeads({
      search,
      status,
      page,
      limit: 10,
      assignedToId,
    }),
  ]);

  const totalPipelineValue = pipelineSum._sum.estimatedValue || 0;

  function formatCurrency(val: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  }

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
          Leads Management
        </h1>
        <p className="text-sm text-[#708078] mt-1.5 font-normal">
          Capture, qualify, and convert new business opportunities across your team.
        </p>
      </div>

      {/* 2. Top Stats Cards (4 Distinct Visual Styles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Leads (Featured Pine Green with Leaf Illustration) */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[160px]">
          {/* Leaf artwork in bottom-right corner */}
          <div className="absolute -bottom-2 -right-2 w-32 h-32 pointer-events-none opacity-80">
            <svg viewBox="0 0 150 150" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="leadCardLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5adb2" />
                  <stop offset="100%" stopColor="#c86e75" />
                </linearGradient>
              </defs>
              <path
                d="M130 150 C110 110 90 70 80 30"
                stroke="#c86e75"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M80 30 C70 5 80 -15 90 -20 C95 10 90 25 80 30 Z"
                fill="url(#leadCardLeaf)"
              />
              <path
                d="M85 55 C55 35 35 45 25 60 C40 80 65 80 85 55 Z"
                fill="url(#leadCardLeaf)"
              />
              <path
                d="M90 85 C120 65 145 75 155 90 C140 110 115 105 90 85 Z"
                fill="url(#leadCardLeaf)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              Total Pipeline Leads
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-white mt-1">
              {totalAllCount}
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#52c41a] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Active opportunity pool</span>
          </div>
        </div>

        {/* Card 2: Active Pipeline Value (Pastel Blush Pink) */}
        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Pipeline Value
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-[#13231c] mt-1">
              {formatCurrency(totalPipelineValue)}
            </div>
          </div>
          <div className="text-xs text-[#2e7d32] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{qualifiedCount + proposalCount} in active proposals</span>
          </div>
        </div>

        {/* Card 3: New Opportunities (Pastel Sage Green) */}
        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <Target className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              New Opportunities
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {newCount}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-3">
            Awaiting discovery &amp; outreach
          </div>
        </div>

        {/* Card 4: Converted Clients (Pastel Warm Cream) */}
        <div className="rounded-[26px] bg-[#fbf5ee] border border-[#faecd8] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f9ebd7] border border-[#f5dfbf] flex items-center justify-center text-[#ba7528]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Converted Deals
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {convertedCount}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-3">
            Successfully won clients
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Tabs */}
      <Suspense fallback={<div className="h-12 bg-white rounded-2xl animate-pulse" />}>
        <LeadFilters
          initialSearch={search}
          currentStatus={status}
          counts={{
            all: totalAllCount,
            new: newCount,
            contacted: contactedCount,
            qualified: qualifiedCount,
            proposal: proposalCount,
            converted: convertedCount,
          }}
        />
      </Suspense>

      {/* 4. Leads Table */}
      <LeadTable
        leads={leadsData.leads}
        totalCount={leadsData.totalCount}
        currentPage={leadsData.currentPage}
        totalPages={leadsData.totalPages}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
