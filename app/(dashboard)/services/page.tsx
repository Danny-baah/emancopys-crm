import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getCatalogueServices, getRecurringMonthlyRevenue } from "@/actions/services";
import { ServiceFormDialog } from "@/components/services/service-form-dialog";
import { Badge } from "@/components/ui/badge";
import { ServiceStatus, Role } from "@/lib/generated/prisma/enums";
import {
  Sparkles,
  TrendingUp,
  Edit2,
  Users,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Additional Services & Upselling | EmanCopys CRM",
};

export default async function ServicesPage() {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;

  const [catalogueServices, mrrSummary, customerAgreements] = await Promise.all([
    getCatalogueServices(),
    getRecurringMonthlyRevenue(),
    prisma.customerService.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, companyName: true, contactPerson: true },
        },
        service: true,
        responsibleEmployee: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  function formatCurrency(val: number) {
    return `€${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(d: Date | string | null | undefined) {
    if (!d) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(d));
  }

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
            Additional Services & Upselling
          </h1>
          <p className="text-sm text-[#677770] mt-1.5 font-normal">
            Manage your service catalogue, Website Maintenance, Care + SEO packages, and client retainers.
          </p>
        </div>

        {isAdmin && <ServiceFormDialog />}
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* MRR Card (Featured Pine Green) */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <TrendingUp className="w-5 h-5 text-[#52c41a]" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              Recurring Monthly Revenue (MRR)
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-white mt-1">
              {formatCurrency(mrrSummary.mrr)}
              <span className="text-sm font-sans text-[#9ab7b0] font-normal">/mo</span>
            </div>
          </div>
          <div className="text-xs text-[#9ab7b0] font-medium mt-2">
            From {mrrSummary.activeAgreementsCount} active recurring client contracts
          </div>
        </div>

        {/* Total Catalogue Services (Sage Green) */}
        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Available Service Packages
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {catalogueServices.length}
            </div>
          </div>
          <div className="text-xs text-[#708078] mt-2">
            Predefined packages & custom offerings
          </div>
        </div>

        {/* Total Upsell Agreements (Blush Pink) */}
        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Logged Client Upsells
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#c95965] mt-1">
              {customerAgreements.length}
            </div>
          </div>
          <div className="text-xs text-[#708078] mt-2">
            Offered, sold, and documented client agreements
          </div>
        </div>
      </div>

      {/* 3. Catalogue Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#13231c]">
              Service Catalogue
            </h2>
            <p className="text-xs text-[#708078] mt-0.5">
              Available packages ready to be offered to clients during or after website production.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {catalogueServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl p-6 border border-[#e8ecea] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-lg font-semibold text-[#182922]">
                    {service.name}
                  </h3>
                  {isAdmin && (
                    <ServiceFormDialog
                      initialService={service}
                      triggerButton={
                        <button
                          type="button"
                          className="p-1 rounded-lg text-[#708078] hover:text-[#182922] hover:bg-[#f0f3f1] transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      }
                    />
                  )}
                </div>

                <div className="mt-3">
                  <span className="font-serif text-2xl font-bold text-[#083d34]">
                    {formatCurrency(service.price)}
                  </span>
                  <span className="text-xs text-[#708078] ml-1 font-medium">
                    {service.isRecurring ? "/ month" : " one-time"}
                  </span>
                </div>

                <p className="text-xs text-[#505f58] mt-3 leading-relaxed min-h-[48px]">
                  {service.description || "Comprehensive website care and support."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#f0f3f1] flex items-center justify-between text-xs text-[#708078]">
                <Badge className="bg-[#f0f7f3] text-[#377b58] border-[#d6ebd9] text-[10px]">
                  {service.isRecurring ? "Recurring Retainer" : "One-Time"}
                </Badge>
                <span>{service._count.customerServices} clients</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Client Service Agreements */}
      <div className="bg-white rounded-3xl p-6 lg:p-7 border border-[#e8ecea] shadow-xs">
        <h3 className="font-serif text-lg font-semibold text-[#13231c] mb-4">
          Client Service Agreements
        </h3>

        {customerAgreements.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#708078]">
            No client service agreements recorded yet. Open any customer profile to offer or sell services.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f0f3f1] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase">
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Agreed Price</th>
                  <th className="pb-3 font-semibold">Offered / Sold Date</th>
                  <th className="pb-3 font-semibold">Responsible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7faf8]">
                {customerAgreements.map((ag) => (
                  <tr key={ag.id} className="hover:bg-[#fafbfb] transition-colors">
                    <td className="py-3.5 pr-4">
                      <Link
                        href={`/customers/${ag.customer.id}`}
                        className="font-medium text-[#182922] hover:text-[#083d34]"
                      >
                        {ag.customer.companyName}
                      </Link>
                    </td>

                    <td className="py-3.5 pr-4 text-[#505f58]">
                      {ag.service.name}
                    </td>

                    <td className="py-3.5 pr-4">
                      {ag.status === ServiceStatus.SOLD ? (
                        <Badge className="bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5] text-[10px]">
                          Sold
                        </Badge>
                      ) : ag.status === ServiceStatus.OFFERED ? (
                        <Badge className="bg-[#fbf5ee] text-[#ba7528] border-[#faecd8] text-[10px]">
                          Offered
                        </Badge>
                      ) : (
                        <Badge className="bg-[#f5f7f6] text-[#708078] border-[#e1e6e3] text-[10px]">
                          Declined
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 pr-4 font-serif font-semibold text-[#182922]">
                      {formatCurrency(ag.agreedPrice)}
                      {ag.isRecurring ? "/mo" : ""}
                    </td>

                    <td className="py-3.5 pr-4 text-[#708078]">
                      {formatDate(ag.soldDate || ag.offeredDate)}
                    </td>

                    <td className="py-3.5 text-[#708078]">
                      {ag.responsibleEmployee?.name || "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
