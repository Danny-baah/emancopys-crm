"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saleSchema, type SaleFormValues } from "@/lib/validations/sales";
import { createSale, updateSale } from "@/actions/sales";
import { ORDERED_SALES_STATUSES, SALES_STATUS_CONFIG } from "@/lib/constants/sales";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PartyOption {
  id: string;
  companyName: string;
  contactPerson: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface SaleFormProps {
  saleId?: string;
  initialData?: SaleFormValues;
  customers: PartyOption[];
  leads: PartyOption[];
  employees: UserOption[];
  preselectedCustomerId?: string;
  preselectedLeadId?: string;
  isAdmin: boolean;
  currentUserId: string;
}

export function SaleForm({
  saleId,
  initialData,
  customers,
  leads,
  employees,
  preselectedCustomerId,
  preselectedLeadId,
  isAdmin,
  currentUserId,
}: SaleFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [linkType, setLinkType] = useState<"customer" | "lead">(
    preselectedLeadId || initialData?.leadId ? "lead" : "customer"
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState(
    preselectedCustomerId || initialData?.customerId || ""
  );
  const [selectedLeadId, setSelectedLeadId] = useState(
    preselectedLeadId || initialData?.leadId || ""
  );

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: initialData || {
      title: "",
      customerId: preselectedCustomerId || null,
      leadId: preselectedLeadId || null,
      assignedToId: isAdmin ? "" : currentUserId,
      status: SalesStatus.NEW_LEAD,
      estimatedValue: undefined,
      serviceType: "Corporate Website & Custom Printing",
      interests: "",
      objections: "",
      nextContactDate: "",
      notes: "",
    },
  });

  // Auto-fill title if empty when party is selected
  function handlePartySelect(type: "customer" | "lead", id: string) {
    if (type === "customer") {
      setSelectedCustomerId(id);
      setSelectedLeadId("");
      setValue("customerId", id);
      setValue("leadId", null);
      const cust = customers.find((c) => c.id === id);
      if (cust && !getValues("title")) {
        setValue("title", `${cust.companyName} - Website Deal`);
      }
    } else {
      setSelectedLeadId(id);
      setSelectedCustomerId("");
      setValue("leadId", id);
      setValue("customerId", null);
      const lead = leads.find((l) => l.id === id);
      if (lead && !getValues("title")) {
        setValue("title", `${lead.companyName} - Deal Pipeline`);
      }
    }
  }

  async function onSubmit(data: SaleFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      if (saleId) {
        await updateSale(saleId, data);
        router.push(`/sales/${saleId}`);
      } else {
        const res = await createSale(data);
        router.push(`/sales/${res.saleId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
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

      {/* Card 1: Deal Identification & Entity Association */}
      <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-5">
        <h2 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
          Deal Identification
        </h2>

        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-1.5">
            Deal Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("title")}
            placeholder="e.g. Ashanti Precision - Corporate Website Redesign & Packaging"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
          />
          {errors.title && (
            <p className="text-[11px] text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Association Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-2">
            Associate Deal With
          </label>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setLinkType("customer");
                setValue("leadId", null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                linkType === "customer"
                  ? "bg-[#062e26] text-white border-[#062e26]"
                  : "bg-white text-[#708078] border-[#ece8e3] hover:border-[#b8dcd0]"
              }`}
            >
              Existing Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkType("lead");
                setValue("customerId", null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                linkType === "lead"
                  ? "bg-[#062e26] text-white border-[#062e26]"
                  : "bg-white text-[#708078] border-[#ece8e3] hover:border-[#b8dcd0]"
              }`}
            >
              Prospective Lead
            </button>
          </div>

          {linkType === "customer" ? (
            <div>
              <select
                value={selectedCustomerId || ""}
                onChange={(e) => handlePartySelect("customer", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
              >
                <option value="">-- Select Customer Account --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.contactPerson})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <select
                value={selectedLeadId || ""}
                onChange={(e) => handlePartySelect("lead", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
              >
                <option value="">-- Select Lead Record --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.companyName} ({l.contactPerson})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Service Offering
            </label>
            <input
              type="text"
              {...register("serviceType")}
              placeholder="e.g. Website Design & Custom Print"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Estimated Deal Value (GHS)
            </label>
            <input
              type="number"
              step="any"
              {...register("estimatedValue", { valueAsNumber: true })}
              placeholder="e.g. 25000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Sales Progression & Employee Assignment */}
      <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-5">
        <h2 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
          Sales Stage & Assignment
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Current Sales Stage
            </label>
            <select
              {...register("status")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            >
              {ORDERED_SALES_STATUSES.map((status) => {
                const conf = SALES_STATUS_CONFIG[status];
                return (
                  <option key={status} value={status}>
                    {conf.step}. {conf.label}
                  </option>
                );
              })}
            </select>
          </div>

          {isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-[#182922] mb-1.5">
                Assigned Sales Officer
              </label>
              <select
                {...register("assignedToId")}
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
                Assigned Sales Officer
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#f4f7f6] text-xs text-[#708078]">
                Assigned to your workspace account
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-1.5">
            Next Contact / Follow-Up Date
          </label>
          <input
            type="date"
            {...register("nextContactDate")}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
          />
        </div>
      </div>

      {/* Card 3: Discovery Intelligence (Interests & Objections) */}
      <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-5">
        <h2 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
          Discovery Intelligence
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Customer Interests
            </label>
            <textarea
              rows={3}
              {...register("interests")}
              placeholder="e.g. Modern responsive catalog, fast loading speed, embossed packaging labels..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#182922] mb-1.5">
              Customer Objections
            </label>
            <textarea
              rows={3}
              {...register("objections")}
              placeholder="e.g. Concerned about 4-week delivery turnaround, seeking payment split..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#182922] mb-1.5">
            Internal Strategy Notes
          </label>
          <textarea
            rows={3}
            {...register("notes")}
            placeholder="Context on negotiation history, decision makers, and closing approach..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#ece8e3] bg-[#fcfbf9] text-xs text-[#182922] focus:outline-none focus:border-[#062e26]"
          />
        </div>
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={saleId ? `/sales/${saleId}` : "/sales"}
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
          <span>{saleId ? "Save Changes" : "Create Deal"}</span>
        </button>
      </div>
    </form>
  );
}
