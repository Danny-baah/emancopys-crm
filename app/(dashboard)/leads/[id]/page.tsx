import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/actions/leads";
import { LeadActivityDialog } from "@/components/leads/lead-activity-dialog";
import { ActivityType, LeadStatus } from "@/lib/generated/prisma/enums";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Edit,
  Clock,
  UserCheck,
  PhoneCall,
  DollarSign,
  Tag,
  Briefcase,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";

interface LeadDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailsPage({ params }: LeadDetailsPageProps) {
  const { id } = await params;

  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

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

  function formatCurrency(val: number | null) {
    if (val === null || val === undefined) return "Not estimated";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  }

  function getStatusBadge(status: LeadStatus) {
    switch (status) {
      case LeadStatus.NEW:
        return "bg-[#e6f4ff] text-[#0958d9] border-[#91caff]";
      case LeadStatus.CONTACTED:
        return "bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7]";
      case LeadStatus.QUALIFIED:
        return "bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5]";
      case LeadStatus.PROPOSAL_SENT:
        return "bg-[#fff7e6] text-[#d46b08] border-[#ffd591]";
      case LeadStatus.CONVERTED:
        return "bg-[#083d34] text-white border-[#083d34]";
      case LeadStatus.LOST:
        return "bg-[#fdeef0] text-[#c95965] border-[#fad5d9]";
      default:
        return "bg-[#f4f7f5] text-[#556660] border-[#dbe3df]";
    }
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
          label: "Status / Other",
        };
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#708078] hover:text-[#182922] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leads Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
              {lead.companyName}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                lead.status
              )}`}
            >
              {lead.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-[#708078] mt-1 font-normal">
            Lead registered on {formatDate(lead.createdAt)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link href={`/sales/new?leadId=${lead.id}`}>
            <button
              type="button"
              className="h-10 px-4 rounded-xl bg-[#062e26] text-white text-xs font-semibold hover:bg-[#0b4337] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#f5adb2]" />
              <span>Promote to Deal</span>
            </button>
          </Link>

          <LeadActivityDialog leadId={lead.id} leadName={lead.companyName} />

          <Link href={`/leads/${lead.id}/edit`}>
            <button
              type="button"
              className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-[#708078]" />
              <span>Edit Lead</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Details (Left 5 cols) & Engagement Timeline (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Organization & Contact Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Opportunity Overview Card */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#fff7e6] text-[#d46b08] flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Opportunity Qualification
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Estimated value and lead source.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#708078]">Estimated Deal Value</div>
                <div className="font-serif text-lg font-bold text-[#182922] mt-0.5">
                  {formatCurrency(lead.estimatedValue)}
                </div>
              </div>

              <div>
                <div className="text-[#708078]">Lead Source</div>
                <div className="font-semibold text-[#182922] mt-0.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-[#8a9992]" />
                  <span>{lead.source || "Direct Contact"}</span>
                </div>
              </div>
            </div>

            {lead.importBatch && (
              <div className="pt-2 border-t border-[#f0f3f1] text-[11px] text-[#708078] flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#2d7a4f]" />
                <span>
                  Imported from spreadsheet:{" "}
                  <strong className="text-[#182922]">{lead.importBatch.fileName}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Key Contact Card */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#fdeef0] text-[#c95965] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Primary Contact Person
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Prospect representative.
                </p>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#708078]">Full Name</div>
              <div className="font-semibold text-[#182922] text-sm mt-0.5">
                {lead.contactPerson}
              </div>
              {lead.jobTitle && (
                <div className="text-xs text-[#708078] flex items-center gap-1 mt-0.5">
                  <Briefcase className="w-3 h-3 text-[#9aa7a1]" />
                  <span>{lead.jobTitle}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#f0f3f1] space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#8a9992] shrink-0" />
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-[#083d34] hover:underline font-medium"
                  >
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-[#a0aca6]">No email registered</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#8a9992] shrink-0" />
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-[#182922] hover:underline font-medium"
                  >
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-[#a0aca6]">No phone registered</span>
                )}
              </div>
            </div>
          </div>

          {/* Organization & Location Card */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Organization Parameters
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Industry and geographical base.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#708078]">Industry</div>
                <div className="font-semibold text-[#182922] mt-0.5">
                  {lead.industry || "General / Other"}
                </div>
              </div>
              <div>
                <div className="text-[#708078]">Location</div>
                <div className="font-semibold text-[#182922] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8a9992]" />
                  <span>{lead.location || "Kumasi, Ghana"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Assignment */}
          <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f3f1]">
              <div className="w-8 h-8 rounded-lg bg-[#fbf5ee] text-[#b8742b] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-[#182922]">
                  Internal Ownership
                </h2>
                <p className="text-[11px] text-[#708078]">
                  Team responsibility.
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-[#708078]">Assigned Consultant:</span>{" "}
                <strong className="text-[#182922]">
                  {lead.assignedTo?.name || "Unassigned (Open Pool)"}
                </strong>
                {lead.assignedTo?.email && (
                  <span className="text-[#8a9992] ml-1">
                    ({lead.assignedTo.email})
                  </span>
                )}
              </div>
              <div>
                <span className="text-[#708078]">Registered by:</span>{" "}
                <span className="text-[#182922] font-medium">
                  {lead.createdBy?.name || "System Administrator"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] space-y-2">
              <div className="font-semibold text-xs text-[#182922] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8a9992]" />
                <span>Intelligence Notes</span>
              </div>
              <p className="text-xs text-[#556660] leading-relaxed whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Activity History Timeline */}
        <div className="lg:col-span-7 bg-white rounded-[24px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#f0f3f1]">
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#13231c]">
                Engagement &amp; Qualification History
              </h2>
              <p className="text-xs text-[#708078] mt-0.5">
                Chronological interactions, meetings, calls, and status milestones.
              </p>
            </div>
            <LeadActivityDialog leadId={lead.id} leadName={lead.companyName} />
          </div>

          {lead.activities.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#708078]">
              <Clock className="w-8 h-8 text-[#8a9992] mx-auto mb-2 opacity-50" />
              <p className="font-medium text-[#182922]">No interactions recorded yet</p>
              <p className="text-[#8a9992] mt-1">
                Log a phone call, meeting or qualification note to build this prospect&apos;s history.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-[#e8ecea]">
              {lead.activities.map((act) => {
                const badge = getActivityIcon(act.activityType);

                return (
                  <div key={act.id} className="relative flex items-start gap-4">
                    {/* Node Icon Circle */}
                    <div
                      className={`absolute -left-6 w-7 h-7 rounded-full border ${badge.bg} flex items-center justify-center shrink-0 bg-white`}
                    >
                      {badge.icon}
                    </div>

                    {/* Timeline Card */}
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
