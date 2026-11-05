import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/actions/customers";
import { ActivityDialog } from "@/components/customers/activity-dialog";
import { ArchiveDialog } from "@/components/customers/archive-dialog";
import { ActivityType } from "@/lib/generated/prisma/enums";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  FileText,
  Edit,
  Clock,
  UserCheck,
  PhoneCall,
} from "lucide-react";

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { id } = await params;

  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const isArchived = Boolean(customer.archivedAt);

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  function formatTime(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(new Date(date))
      .toLowerCase();
  }

  function getActivityIcon(type: ActivityType) {
    switch (type) {
      case ActivityType.CALL:
        return {
          icon: <PhoneCall className="w-3.5 h-3.5 text-[#2d7a4f]" />,
          bg: "bg-[#e8f6ed] border-[#cbe8d5]",
          label: "Call",
        };
      case ActivityType.MEETING:
        return {
          icon: <Calendar className="w-3.5 h-3.5 text-[#c95965]" />,
          bg: "bg-[#fdeef0] border-[#fad5d9]",
          label: "Meeting",
        };
      case ActivityType.EMAIL:
        return {
          icon: <Mail className="w-3.5 h-3.5 text-[#2d7a4f]" />,
          bg: "bg-[#e8f6ed] border-[#cbe8d5]",
          label: "Email",
        };
      case ActivityType.NOTE:
        return {
          icon: <FileText className="w-3.5 h-3.5 text-[#6d51c7]" />,
          bg: "bg-[#f1edfb] border-[#ddd4f7]",
          label: "Note",
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-[#556660]" />,
          bg: "bg-[#f4f7f5] border-[#dbe3df]",
          label: "Other",
        };
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#708078] hover:text-[#182922] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Customers Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
              {customer.companyName}
            </h1>
            {isArchived ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#fdeef0] text-[#c95965] border border-[#fad5d9]">
                Archived
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#e8f6ed] text-[#2d7a4f] border border-[#cbe8d5]">
                Active Client
              </span>
            )}
          </div>
          <p className="text-xs text-[#708078] mt-1 font-normal">
            Account registered on {formatDate(customer.createdAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <ActivityDialog
            customerId={customer.id}
            customerName={customer.companyName}
          />

          <Link href={`/customers/${customer.id}/edit`}>
            <button
              type="button"
              className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-[#708078]" />
              <span>Edit Profile</span>
            </button>
          </Link>

          <ArchiveDialog
            customerId={customer.id}
            customerName={customer.companyName}
            isArchived={isArchived}
          />
        </div>
      </div>

      {/* Main Grid: Details (Left) & Engagement Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization & Contact Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Contact Card */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#fdeef0] text-[#c95965] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Primary Contact Stakeholder
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Direct communication contact.
                </p>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#708078]">Full Name</div>
              <div className="font-semibold text-[#182922] text-sm mt-0.5">
                {customer.contactPerson || "Not specified"}
              </div>
            </div>

            <div className="pt-2 border-t border-[#f0f3f1] space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#8a9992] shrink-0" />
                {customer.email ? (
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-[#083d34] hover:underline font-medium"
                  >
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-[#a0aca6]">No email registered</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#8a9992] shrink-0" />
                {customer.phone ? (
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-[#182922] hover:underline font-medium"
                  >
                    {customer.phone}
                  </a>
                ) : (
                  <span className="text-[#a0aca6]">No phone registered</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#8a9992] shrink-0" />
                <span className="text-[#556660]">
                  First Contact:{" "}
                  <strong className="text-[#182922]">
                    {customer.firstContactDate
                      ? formatDate(customer.firstContactDate)
                      : "Not specified"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Company Profile Card */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Company Details
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Industry and location parameters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#708078]">Industry</div>
                <div className="font-semibold text-[#182922] mt-0.5">
                  {customer.industry || "General"}
                </div>
              </div>
              <div>
                <div className="text-[#708078]">Location</div>
                <div className="font-semibold text-[#182922] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8a9992]" />
                  <span>{customer.location || "Kumasi, Ghana"}</span>
                </div>
              </div>
            </div>

            {customer.website && (
              <div className="pt-2 border-t border-[#f0f3f1] text-xs">
                <div className="text-[#708078]">Official Website</div>
                <a
                  href={
                    customer.website.startsWith("http")
                      ? customer.website
                      : `https://${customer.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#083d34] hover:underline flex items-center gap-1.5 mt-0.5"
                >
                  <Globe className="w-3.5 h-3.5 text-[#8a9992]" />
                  <span>{customer.website}</span>
                </a>
              </div>
            )}
          </div>

          {/* Account Ownership & Assignment */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#fbf5ee] text-[#b8742b] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Account Ownership
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Internal responsibilities.
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-[#708078]">Assigned Consultant:</span>{" "}
                <strong className="text-[#182922]">
                  {customer.assignedTo?.name || "Unassigned"}
                </strong>
                {customer.assignedTo?.email && (
                  <span className="text-[#8a9992] ml-1">
                    ({customer.assignedTo.email})
                  </span>
                )}
              </div>
              <div>
                <span className="text-[#708078]">Registered by:</span>{" "}
                <span className="text-[#182922] font-medium">
                  {customer.createdBy?.name || "System Administrator"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-2">
              <div className="font-semibold text-xs text-[#182922] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8a9992]" />
                <span>Relationship Notes</span>
              </div>
              <p className="text-xs text-[#556660] leading-relaxed whitespace-pre-wrap">
                {customer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Activity History Timeline */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#f0f3f1]">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#13231c]">
                Activity &amp; Engagement Timeline
              </h2>
              <p className="text-xs text-[#708078] mt-0.5">
                Chronological record of meetings, phone calls, notes and emails.
              </p>
            </div>
            <ActivityDialog
              customerId={customer.id}
              customerName={customer.companyName}
            />
          </div>

          {customer.activities.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#708078]">
              <Clock className="w-8 h-8 text-[#8a9992] mx-auto mb-2 opacity-50" />
              <p className="font-medium text-[#182922]">No engagements recorded yet</p>
              <p className="text-[#8a9992] mt-1">
                Log a phone call, meeting or email to begin building this client&apos;s history.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-[#e8ecea]">
              {customer.activities.map((act) => {
                const badge = getActivityIcon(act.activityType);

                return (
                  <div key={act.id} className="relative flex items-start gap-4">
                    {/* Timeline Node Badge */}
                    <div
                      className={`absolute -left-6 w-7 h-7 rounded-full border ${badge.bg} flex items-center justify-center shrink-0 bg-white`}
                    >
                      {badge.icon}
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 bg-[#fafbfb] rounded-2xl p-4 border border-[#eef2f0]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-xs text-[#182922]">
                            {act.title}
                          </div>
                          <div className="text-[10px] text-[#8a9992] mt-0.5">
                            Recorded by {act.user.name} &bull; {formatDate(act.createdAt)} at{" "}
                            {formatTime(act.createdAt)}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {act.description && (
                        <p className="text-xs text-[#556660] mt-2 leading-relaxed whitespace-pre-wrap">
                          {act.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}