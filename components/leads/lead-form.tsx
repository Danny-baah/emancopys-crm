"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadFormValues } from "@/lib/validations/lead";
import { createLead, updateLead } from "@/actions/leads";
import { LeadStatus } from "@/lib/generated/prisma/enums";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  UserCheck,
  Tag,
} from "lucide-react";
import Link from "next/link";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LeadFormProps {
  initialData?: LeadFormValues & { id?: string };
  users?: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}

export function LeadForm({
  initialData,
  users = [],
  isAdmin,
  currentUserId,
}: LeadFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      contactPerson: initialData?.contactPerson || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      jobTitle: initialData?.jobTitle || "",
      industry: initialData?.industry || "",
      location: initialData?.location || "",
      status: initialData?.status || LeadStatus.NEW,
      source: initialData?.source || "Direct Outreach",
      estimatedValue: initialData?.estimatedValue ?? undefined,
      notes: initialData?.notes || "",
      assignedToId: initialData?.assignedToId || (isAdmin ? "" : currentUserId),
    },
  });

  async function onSubmit(data: LeadFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData?.id) {
        await updateLead(initialData.id, data);
        toast.success("Lead record updated successfully");
        router.push(`/leads/${initialData.id}`);
      } else {
        const result = await createLead(data);
        toast.success("Lead created successfully");
        router.push(`/leads/${result.leadId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save lead record. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={isEditing ? `/leads/${initialData?.id}` : "/leads"}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#708078] hover:text-[#182922] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isEditing ? "Lead Details" : "Leads Directory"}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={isEditing ? `/leads/${initialData?.id}` : "/leads"}>
            <button
              type="button"
              disabled={isSubmitting}
              className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] active:bg-[#063029] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? "Save Changes" : "Create Lead"}</span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Organization Details */}
        <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
            <div className="w-8 h-8 rounded-lg bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#182922]">
                Organization Information
              </h2>
              <p className="text-[11px] text-[#708078]">
                Company identifiers and sector.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="companyName" className="block text-xs font-semibold text-[#182922]">
              Company / Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              placeholder="e.g. Graphic Communications Group"
              {...register("companyName")}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            />
            {errors.companyName && (
              <p className="text-[11px] text-red-600 font-medium">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="industry" className="block text-xs font-semibold text-[#182922]">
              Industry / Sector
            </label>
            <input
              id="industry"
              placeholder="e.g. Publishing, Education, Healthcare"
              {...register("industry")}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            />
            {errors.industry && (
              <p className="text-[11px] text-red-600 font-medium">{errors.industry.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="block text-xs font-semibold text-[#182922]">
              Location / City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="location"
                placeholder="e.g. Kumasi, Ghana"
                {...register("location")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
            {errors.location && (
              <p className="text-[11px] text-red-600 font-medium">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="source" className="block text-xs font-semibold text-[#182922]">
              Lead Source
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="source"
                placeholder="e.g. Website, Referral, Cold Outreach, Trade Show"
                {...register("source")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Contact Person Details */}
        <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
            <div className="w-8 h-8 rounded-lg bg-[#fdeef0] text-[#c95965] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#182922]">
                Key Contact Person
              </h2>
              <p className="text-[11px] text-[#708078]">
                Primary lead representative details.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contactPerson" className="block text-xs font-semibold text-[#182922]">
              Contact Person Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contactPerson"
              placeholder="e.g. Yaw Osei"
              {...register("contactPerson")}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            />
            {errors.contactPerson && (
              <p className="text-[11px] text-red-600 font-medium">{errors.contactPerson.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="jobTitle" className="block text-xs font-semibold text-[#182922]">
              Job Title / Designation
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="jobTitle"
                placeholder="e.g. Procurement Director, Operations Manager"
                {...register("jobTitle")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-[#182922]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="yaw@example.com"
                {...register("email")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-semibold text-[#182922]">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="phone"
                placeholder="e.g. +233 20 445 6789"
                {...register("phone")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-600 font-medium">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Status, Value & Assignment */}
      <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
          <div className="w-8 h-8 rounded-lg bg-[#fbf5ee] text-[#b8742b] flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[#182922]">
              Pipeline Qualification &amp; Ownership
            </h2>
            <p className="text-[11px] text-[#708078]">
              Estimated opportunity size, status, and team assignments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-xs font-semibold text-[#182922]">
              Pipeline Status
            </label>
            <select
              id="status"
              {...register("status")}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            >
              {Object.values(LeadStatus).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="estimatedValue" className="block text-xs font-semibold text-[#182922]">
              Estimated Deal Value ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="estimatedValue"
                type="number"
                step="any"
                placeholder="e.g. 5000"
                {...register("estimatedValue", { valueAsNumber: true })}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
            {errors.estimatedValue && (
              <p className="text-[11px] text-red-600 font-medium">{errors.estimatedValue.message}</p>
            )}
          </div>

          {isAdmin ? (
            <div className="space-y-1.5">
              <label htmlFor="assignedToId" className="block text-xs font-semibold text-[#182922]">
                Assign to Team Member
              </label>
              <select
                id="assignedToId"
                {...register("assignedToId")}
                disabled={isSubmitting}
                className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              >
                <option value="">Unassigned (Open Lead Pool)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#182922]">
                Assigned Consultant
              </label>
              <div className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-[#f9faf9] text-xs text-[#556660] flex items-center">
                Assigned to your care
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-2">
          <label htmlFor="notes" className="block text-xs font-semibold text-[#182922]">
            Lead Intelligence &amp; Background Notes
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8a9992] pointer-events-none" />
            <textarea
              id="notes"
              rows={4}
              placeholder="Record preliminary requirements, initial interest, procurement schedule, or special customer conditions..."
              {...register("notes")}
              disabled={isSubmitting}
              className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
