"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, type CustomerFormValues } from "@/lib/validations/customer";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CustomerFormProps {
  initialData?: CustomerFormValues & { id?: string };
  users?: UserOption[];
  isAdmin: boolean;
  currentUserId: string;
}

export function CustomerForm({
  initialData,
  users = [],
  isAdmin,
  currentUserId,
}: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      contactPerson: initialData?.contactPerson || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      website: initialData?.website || "",
      industry: initialData?.industry || "",
      location: initialData?.location || "",
      firstContactDate: initialData?.firstContactDate
        ? new Date(initialData.firstContactDate).toISOString().split("T")[0]
        : "",
      notes: initialData?.notes || "",
      assignedToId: initialData?.assignedToId || (isAdmin ? "" : currentUserId),
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData?.id) {
        await updateCustomer(initialData.id, data);
        toast.success("Customer record updated successfully");
        router.push(`/customers/${initialData.id}`);
      } else {
        const result = await createCustomer(data);
        toast.success("Customer registered successfully");
        router.push(`/customers/${result.customerId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save customer record. Please try again.";
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
          href={isEditing ? `/customers/${initialData?.id}` : "/customers"}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#708078] hover:text-[#182922] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {isEditing ? "Customer Details" : "Customers Directory"}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href={isEditing ? `/customers/${initialData?.id}` : "/customers"}>
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
              <span>{isEditing ? "Save Changes" : "Create Customer"}</span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Company Details */}
        <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
            <div className="w-8 h-8 rounded-lg bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#182922]">
                Company Information
              </h2>
              <p className="text-[11px] text-[#708078]">
                Primary organization identifiers.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="companyName" className="block text-xs font-semibold text-[#182922]">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              placeholder="e.g. Ashanti Precision Manufacturing"
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
              placeholder="e.g. Manufacturing, Publishing, IT Services"
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
              City / Location
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
            <label htmlFor="website" className="block text-xs font-semibold text-[#182922]">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="website"
                placeholder="https://example.com"
                {...register("website")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
            {errors.website && (
              <p className="text-[11px] text-red-600 font-medium">{errors.website.message}</p>
            )}
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
                Primary stakeholder and communication details.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="contactPerson" className="block text-xs font-semibold text-[#182922]">
              Contact Person Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contactPerson"
              placeholder="e.g. Akua Servaa"
              {...register("contactPerson")}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            />
            {errors.contactPerson && (
              <p className="text-[11px] text-red-600 font-medium">{errors.contactPerson.message}</p>
            )}
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
                placeholder="name@example.com"
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
                placeholder="e.g. +233 24 123 4567"
                {...register("phone")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-600 font-medium">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="firstContactDate" className="block text-xs font-semibold text-[#182922]">
              First Contact Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
              <input
                id="firstContactDate"
                type="date"
                {...register("firstContactDate")}
                disabled={isSubmitting}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment & Notes Section */}
      <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
          <div className="w-8 h-8 rounded-lg bg-[#fbf5ee] text-[#b8742b] flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-[#182922]">
              Assignment &amp; Relationship Notes
            </h2>
            <p className="text-[11px] text-[#708078]">
              Team ownership and initial background context.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-1.5">
            <label htmlFor="assignedToId" className="block text-xs font-semibold text-[#182922]">
              Assign Account to Team Member
            </label>
            <select
              id="assignedToId"
              {...register("assignedToId")}
              disabled={isSubmitting}
              className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
            >
              <option value="">Unassigned (Open Pool)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) – {u.role}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="notes" className="block text-xs font-semibold text-[#182922]">
            Initial Background / Notes
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8a9992] pointer-events-none" />
            <textarea
              id="notes"
              rows={4}
              placeholder="Record any relevant historical notes, client requirements, or special instructions..."
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