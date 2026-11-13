import { requireAuth } from "@/lib/auth-utils";
import { getPayments, getPaymentOverviewStats } from "@/actions/payments";
import { PaymentsTable } from "@/components/payments/payments-table";
import { PaymentStatus } from "@/lib/generated/prisma/enums";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  Search,
} from "lucide-react";
import Link from "next/link";

interface PaymentsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  await requireAuth();
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "ALL";
  const page = parseInt(params.page || "1", 10);

  const [overview, paymentData] = await Promise.all([
    getPaymentOverviewStats(),
    getPayments({
      search,
      status,
      page,
      limit: 15,
    }),
  ]);

  function formatCurrency(val: number) {
    return `€${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const statusFilters = [
    { label: "All Records", value: "ALL" },
    { label: "Unpaid", value: PaymentStatus.UNPAID },
    { label: "Partially Paid", value: PaymentStatus.PARTIALLY_PAID },
    { label: "Fully Paid", value: PaymentStatus.FULLY_PAID },
    { label: "Overdue", value: PaymentStatus.OVERDUE },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
            Payment Management
          </h1>
          <p className="text-sm text-[#677770] mt-1.5 font-normal">
            Track customer deposits, milestone payments, and outstanding balances across all orders.
          </p>
        </div>
      </div>

      {/* 2. Overview Stat Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Cash Received (Deep Forest Teal Featured Card) */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[150px]">
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <CheckCircle2 className="w-5 h-5 text-[#52c41a]" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              Total Cash Received
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-white mt-1">
              {formatCurrency(overview.totalCashReceived)}
            </div>
          </div>
          <div className="text-xs text-[#9ab7b0] font-medium mt-2">
            From {paymentData.totalCount} recorded payment transactions
          </div>
        </div>

        {/* Card 2: Total Outstanding Balance (Soft Blush Pink) */}
        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[150px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Outstanding Balance
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-[#c95965] mt-1">
              {formatCurrency(overview.totalOutstanding)}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-2">
            Remaining uncollected across orders
          </div>
        </div>

        {/* Card 3: Total Booked Order Revenue (Pastel Warm Ivory) */}
        <div className="rounded-[26px] bg-[#fbf5ee] border border-[#faecd8] p-6 shadow-2xs flex flex-col justify-between min-h-[150px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f9ebd7] border border-[#f5dfbf] flex items-center justify-center text-[#ba7528]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Total Booked Orders
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-[#13231c] mt-1">
              {formatCurrency(overview.totalBookedOrderValue)}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-2">
            Across {overview.totalOrdersCount} confirmed client orders
          </div>
        </div>

        {/* Card 4: Order Payment Status Breakdown (Pastel Sage Green) */}
        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[150px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Orders Status
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-serif text-xl font-normal text-[#2d7a4f]">
                {overview.fullyPaidOrdersCount} Paid
              </span>
              <span className="text-[#a0aca6]">•</span>
              <span className="font-serif text-xl font-normal text-[#c95965]">
                {overview.overdueOrdersCount} Overdue
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#708078] font-normal mt-2">
            {overview.partiallyPaidOrdersCount} partial • {overview.unpaidOrdersCount} unpaid
          </div>
        </div>
      </div>

      {/* 3. Search and Status Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8ecea] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search payments, orders, clients..."
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
          />
          {status !== "ALL" && (
            <input type="hidden" name="status" value={status} />
          )}
        </form>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {statusFilters.map((f) => {
            const isActive = status === f.value;
            const searchParamQuery = new URLSearchParams();
            if (search) searchParamQuery.set("search", search);
            if (f.value !== "ALL") searchParamQuery.set("status", f.value);

            return (
              <Link
                key={f.value}
                href={`/payments?${searchParamQuery.toString()}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? "bg-[#083d34] text-white shadow-xs"
                    : "bg-[#fbfaf8] text-[#556660] hover:bg-[#f0f3f1] border border-[#e1e6e3]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Payments Table */}
      <PaymentsTable
        payments={paymentData.payments}
        emptyMessage={
          search || status !== "ALL"
            ? "No payments match your current search or filter."
            : "No payments recorded yet."
        }
      />

      {/* 5. Pagination */}
      {paymentData.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-[#708078]">
          <div>
            Showing page {paymentData.currentPage} of {paymentData.totalPages} ({paymentData.totalCount} total)
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/payments?page=${page - 1}&search=${encodeURIComponent(
                  search
                )}&status=${status}`}
                className="px-3 py-1.5 rounded-xl border border-[#e1e6e3] bg-white hover:bg-[#fbfaf8] text-[#182922]"
              >
                Previous
              </Link>
            )}
            {page < paymentData.totalPages && (
              <Link
                href={`/payments?page=${page + 1}&search=${encodeURIComponent(
                  search
                )}&status=${status}`}
                className="px-3 py-1.5 rounded-xl border border-[#e1e6e3] bg-white hover:bg-[#fbfaf8] text-[#182922]"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
