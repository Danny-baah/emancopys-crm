"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderSchema, type OrderFormValues } from "@/lib/validations/orders";
import { createOrder } from "@/actions/orders";
import { OrderStatus } from "@/lib/generated/prisma/enums";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson: string;
}

interface QuotationOption {
  id: string;
  quotationNumber: string;
  customerId: string;
  saleId?: string | null;
  serviceSold: string;
  quotationPrice: number;
}

interface SaleOption {
  id: string;
  title: string;
  customerId?: string | null;
  estimatedValue?: number | null;
  serviceType?: string | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface OrderFormProps {
  customers: CustomerOption[];
  quotations: QuotationOption[];
  sales: SaleOption[];
  employees: UserOption[];
  preselectedCustomerId?: string;
  preselectedQuotationId?: string;
  preselectedSaleId?: string;
  isAdmin: boolean;
  currentUserId: string;
}

const DEFAULT_ORDER_DATE = new Date().toISOString().slice(0, 10);

export function OrderForm({
  customers,
  quotations,
  sales,
  employees,
  preselectedCustomerId,
  preselectedQuotationId,
  preselectedSaleId,
  isAdmin,
  currentUserId,
}: OrderFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Match preselected quotation
  const matchedQuote = quotations.find((q) => q.id === preselectedQuotationId);
  const matchedSale = sales.find((s) => s.id === preselectedSaleId);

  const initialAmount =
    matchedQuote?.quotationPrice || matchedSale?.estimatedValue || 20000;
  // Standard agreed commission guideline
  const initialCommission = Math.round(initialAmount * 0.1);

  const [selectedQuotationId, setSelectedQuotationId] = useState(
    preselectedQuotationId || ""
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId:
        preselectedCustomerId ||
        matchedQuote?.customerId ||
        matchedSale?.customerId ||
        "",
      quotationId: preselectedQuotationId || null,
      saleId: preselectedSaleId || matchedQuote?.saleId || null,
      serviceSold:
        matchedQuote?.serviceSold ||
        matchedSale?.serviceType ||
        "Corporate Website Design & Custom Print Package",
      totalAmount: initialAmount,
      agreedCommission: initialCommission,
      orderDate: DEFAULT_ORDER_DATE,
      responsibleEmployeeId: isAdmin ? "" : currentUserId,
      status: OrderStatus.CONFIRMED,
      notes: "Deal closed successfully. Client ready for project onboarding.",
      autoCreateProject: true,
    },
  });

  function handleQuotationSelect(quoteId: string) {
    setSelectedQuotationId(quoteId);
    setValue("quotationId", quoteId || null);
    const q = quotations.find((item) => item.id === quoteId);
    if (q) {
      setValue("customerId", q.customerId);
      setValue("serviceSold", q.serviceSold);
      setValue("totalAmount", q.quotationPrice);
      setValue("agreedCommission", Math.round(q.quotationPrice * 0.1));
      if (q.saleId) setValue("saleId", q.saleId);
    }
  }

  async function onSubmit(data: OrderFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await createOrder(data);
      router.push(`/orders/${res.orderId}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record order.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {serverError}
        </div>
      )}

      {/* Card 1: Commercial Order & Customer Link */}
      <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-5">
        <h2 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
          Order Agreement Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Customer Account <span className="text-red-500">*</span>
            </label>
            <select
              {...register("customerId")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            >
              <option value="">-- Select Customer Account --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactPerson})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Originating Quotation (Optional)
            </label>
            <select
              value={selectedQuotationId || ""}
              onChange={(e) => handleQuotationSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            >
              <option value="">-- None (Direct Order) --</option>
              {quotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quotationNumber} — GHS {q.quotationPrice.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-1.5">
            Service Sold <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("serviceSold")}
            placeholder="e.g. Website Design, Full-Stack Portal & Stationery Printing"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
          />
          {errors.serviceSold && (
            <p className="text-[11px] text-red-500 mt-1">
              {errors.serviceSold.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Total Order Amount (GHS) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register("totalAmount", { valueAsNumber: true })}
              placeholder="e.g. 20000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
            {errors.totalAmount && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.totalAmount.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Agreed Sales Commission (GHS) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register("agreedCommission", { valueAsNumber: true })}
              placeholder="e.g. 2000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
            {errors.agreedCommission && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.agreedCommission.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Order Date
            </label>
            <input
              type="date"
              {...register("orderDate")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Responsible Sales Employee
              </label>
              <select
                {...register("responsibleEmployeeId")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
              >
                <option value="">-- Select Team Member --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Responsible Sales Employee
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#f4f7f6] text-xs text-[#708078]">
                Assigned to your account
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Order Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            >
              <option value={OrderStatus.CONFIRMED}>Confirmed (Ready for Production)</option>
              <option value={OrderStatus.IN_PRODUCTION}>In Production</option>
              <option value={OrderStatus.COMPLETED}>Completed</option>
              <option value={OrderStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Card 2: Automatic Project Initialization Setting */}
      <div className="bg-[#e8f1ed] p-6 rounded-2xl border border-[#b8dcd0] space-y-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="autoCreateProject"
            {...register("autoCreateProject")}
            className="mt-1 w-4 h-4 rounded text-[#062e26] border-[#ece8e3] focus:ring-[#062e26]"
          />
          <div>
            <label
              htmlFor="autoCreateProject"
              className="text-xs font-bold text-[#182922] cursor-pointer"
            >
              Automatically Initialize Website Production Project
            </label>
            <p className="text-[11px] text-[#2c4035] mt-0.5">
              Instantly creates a tracked website project linked to this order with initial stage &quot;Order Won&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] transition-all shadow-xs"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Record Order</span>
        </button>
      </div>
    </form>
  );
}
