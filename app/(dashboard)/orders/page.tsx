import { requireAuth } from "@/lib/auth-utils";
import { getOrders } from "@/actions/orders";
import { prisma } from "@/lib/prisma";
import { OrdersTable } from "@/components/orders/orders-table";
import { Role } from "@/lib/generated/prisma/enums";
import Link from "next/link";
import { ShoppingBag, Plus, DollarSign, Briefcase, Award } from "lucide-react";

export const metadata = {
  title: "Orders Management | EmanCopys CRM",
};

interface OrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
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
    totalOrders,
    financialAgg,
    activeProjectsCount,
    ordersData,
  ] = await Promise.all([
    prisma.order.count({ where: userScope }),
    prisma.order.aggregate({
      where: userScope,
      _sum: {
        totalAmount: true,
        agreedCommission: true,
      },
    }),
    prisma.project.count({
      where:
        user.role === Role.ADMIN
          ? {}
          : {
              OR: [
                { assignedToId: user.id },
                { createdById: user.id },
                { customer: { assignedToId: user.id } },
              ],
            },
    }),
    getOrders({ search, status, page, limit: 10 }),
  ]);

  const totalRevenue = financialAgg._sum.totalAmount || 0;
  const totalCommission = financialAgg._sum.agreedCommission || 0;

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-medium text-[#182922]">
            Order Management
          </h1>
          <p className="text-xs lg:text-sm text-[#708078] mt-1">
            Manage confirmed production orders, agreed sales commissions, and track connected website projects.
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Order</span>
        </Link>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#062e26] text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ab7b0]">Confirmed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#f5adb2]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold">{totalOrders}</div>
            <div className="text-[11px] text-[#8aa9a1] mt-1">Total closed orders</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1d4ed8]">Total Order Volume</span>
            <div className="w-8 h-8 rounded-xl bg-[#dbeafe] flex items-center justify-center text-[#1d4ed8]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl font-bold text-[#182922]">
              GHS {totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Contracted sales value</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#e6f4ea] border border-[#b7e1cd] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#137333]">Agreed Commissions</span>
            <div className="w-8 h-8 rounded-xl bg-[#cbf0d8] flex items-center justify-center text-[#137333]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl font-bold text-[#182922]">
              GHS {totalCommission.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Stored sales commission total</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-[#ddd6fe] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6b21a8]">Website Projects</span>
            <div className="w-8 h-8 rounded-xl bg-[#ede9fe] flex items-center justify-center text-[#6b21a8]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">
              {activeProjectsCount}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">In website production</div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={ordersData.orders}
        totalCount={ordersData.totalCount}
        currentPage={ordersData.currentPage}
        totalPages={ordersData.totalPages}
      />
    </div>
  );
}
