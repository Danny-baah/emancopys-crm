"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  quotationSchema,
  type QuotationFormValues,
} from "@/lib/validations/quotations";
import { createQuotation } from "@/actions/quotations";
import { QuotationStatus } from "@/lib/generated/prisma/enums";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson: string;
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

interface QuotationFormProps {
  customers: CustomerOption[];
  sales: SaleOption[];
  employees: UserOption[];
  preselectedCustomerId?: string;
  preselectedSaleId?: string;
  isAdmin: boolean;
  currentUserId: string;
}

const DEFAULT_QUOTATION_DATE = new Date().toISOString().slice(0, 10);
const DEFAULT_VALID_UNTIL = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

export function QuotationForm({
  customers,
  sales,
  employees,
  preselectedCustomerId,
  preselectedSaleId,
  isAdmin,
  currentUserId,
}: QuotationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill initial defaults based on preselected sale if any
  const matchedSale = sales.find((s) => s.id === preselectedSaleId);
  const [selectedSaleId, setSelectedSaleId] = useState(preselectedSaleId || "");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: preselectedCustomerId || matchedSale?.customerId || "",
      saleId: preselectedSaleId || null,
      serviceSold: matchedSale?.serviceType || "Corporate Website Design & Development",
      quotationPrice: matchedSale?.estimatedValue || 15000,
      quotationDate: DEFAULT_QUOTATION_DATE,
      validUntil: DEFAULT_VALID_UNTIL,
      responsibleEmployeeId: isAdmin ? "" : currentUserId,
      status: QuotationStatus.DRAFT,
      notes: "Quotation includes initial UI/UX wireframes, custom domain setup, responsive mobile optimization, and brand printing package.",
    },
  });

  function handleSaleChange(saleId: string) {
    setSelectedSaleId(saleId);
    setValue("saleId", saleId || null);
    const sale = sales.find((s) => s.id === saleId);
    if (sale) {
      if (sale.customerId) setValue("customerId", sale.customerId);
      if (sale.serviceType) setValue("serviceSold", sale.serviceType);
      if (sale.estimatedValue) setValue("quotationPrice", sale.estimatedValue);
    }
  }

  async function onSubmit(data: QuotationFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const res = await createQuotation(data);
      router.push(`/quotations/${res.quotationId}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create quotation.";
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

      {/* Card 1: Quotation Details */}
      <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-5">
        <h2 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
          Quotation Parameters
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
              Associated Deal Pipeline (Optional)
            </label>
            <select
              value={selectedSaleId || ""}
              onChange={(e) => handleSaleChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            >
              <option value="">-- None (Standalone Quote) --</option>
              {sales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-1.5">
            Service Description & Scope <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("serviceSold")}
            placeholder="e.g. Website Redesign, Custom E-Commerce & Corporate Print Collateral"
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
              Quotation Price (GHS) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register("quotationPrice", { valueAsNumber: true })}
              placeholder="e.g. 15000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
            {errors.quotationPrice && (
              <p className="text-[11px] text-red-500 mt-1">
                {errors.quotationPrice.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Quotation Date
            </label>
            <input
              type="date"
              {...register("quotationDate")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Valid Until
            </label>
            <input
              type="date"
              {...register("validUntil")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Responsible Sales Officer
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
                Responsible Sales Officer
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#f4f7f6] text-xs text-[#708078]">
                Assigned to your account
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Initial Quotation Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            >
              <option value={QuotationStatus.DRAFT}>Draft (Internal Review)</option>
              <option value={QuotationStatus.SENT}>Sent to Customer</option>
              <option value={QuotationStatus.ACCEPTED}>Accepted by Customer</option>
              <option value={QuotationStatus.REJECTED}>Rejected</option>
              <option value={QuotationStatus.EXPIRED}>Expired</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-1.5">
            Deliverable Terms & Commercial Notes
          </label>
          <textarea
            rows={3}
            {...register("notes")}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/quotations"
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
          <span>Generate Quotation</span>
        </button>
      </div>
    </form>
  );
}
