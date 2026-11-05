import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getCustomers } from "@/actions/customers";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerTable } from "@/components/customers/customer-table";
import { Role } from "@/lib/generated/prisma/enums";
import {
  Users,
  Building2,
  Archive,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
} from "lucide-react";

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    archived?: string;
    tab?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;
  const resolvedParams = await searchParams;

  const search = resolvedParams.search || "";
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));

  const tab = resolvedParams.tab || (resolvedParams.archived === "true" ? "archived" : "all");
  const isArchived = tab === "archived";

  // Base scope for counting
  const userScope = isAdmin
    ? {}
    : { OR: [{ assignedToId: user.id }, { createdById: user.id }] };

  // Fetch counts and customers
  const [totalAllCount, activeCount, archivedCount, myAssignedCount, customerData] =
    await Promise.all([
      prisma.customer.count({ where: userScope }),
      prisma.customer.count({
        where: { ...userScope, archivedAt: null },
      }),
      prisma.customer.count({
        where: { ...userScope, archivedAt: { not: null } },
      }),
      prisma.customer.count({
        where: { assignedToId: user.id, archivedAt: null },
      }),
      getCustomers({
        search,
        page,
        limit: 10,
        archived: isArchived,
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
          Customers
        </h1>
        <p className="text-sm text-[#708078] mt-1.5 font-normal">
          Manage your client accounts, assignments and engagement history.
        </p>
      </div>

      {/* 2. Top Stats Cards (4 Distinct Visual Styles matching image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Customers (Featured Dark Pine Green with Leaf Graphic) */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[160px]">
          {/* Leaf artwork in bottom-right corner */}
          <div className="absolute -bottom-2 -right-2 w-32 h-32 pointer-events-none opacity-80">
            <svg viewBox="0 0 150 150" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="custCardLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
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
                fill="url(#custCardLeaf)"
              />
              <path
                d="M85 55 C55 35 35 45 25 60 C40 80 65 80 85 55 Z"
                fill="url(#custCardLeaf)"
              />
              <path
                d="M90 85 C120 65 145 75 155 90 C140 110 115 105 90 85 Z"
                fill="url(#custCardLeaf)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              Total Customers
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-white mt-1">
              {totalAllCount}
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#52c41a] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+20% from last month</span>
          </div>
        </div>

        {/* Card 2: Active Customers (Pastel Blush Pink) */}
        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Active Customers
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {activeCount}
            </div>
          </div>
          <div className="text-xs text-[#2e7d32] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12% from last month</span>
          </div>
        </div>

        {/* Card 3: Archived Customers (Pastel Sage Green) */}
        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <Archive className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Archived Customers
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {archivedCount}
            </div>
          </div>
          <div className="text-xs text-[#d76a74] font-medium flex items-center gap-1 mt-3">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-2 from last month</span>
          </div>
        </div>

        {/* Card 4: My Assigned (Pastel Warm Cream) */}
        <div className="rounded-[26px] bg-[#fbf5ee] border border-[#faecd8] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f9ebd7] border border-[#f5dfbf] flex items-center justify-center text-[#ba7528]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              My Assigned
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {myAssignedCount}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-3">
            Customers under your care
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Tabs */}
      <Suspense fallback={<div className="h-12 bg-white rounded-2xl animate-pulse" />}>
        <CustomerFilters
          initialSearch={search}
          currentTab={tab as "all" | "active" | "archived"}
          counts={{
            all: totalAllCount,
            active: activeCount,
            archived: archivedCount,
          }}
        />
      </Suspense>

      {/* 4. Customer Directory Table */}
      <CustomerTable
        customers={customerData.customers}
        totalCount={customerData.totalCount}
        currentPage={customerData.currentPage}
        totalPages={customerData.totalPages}
      />
    </div>
  );
}