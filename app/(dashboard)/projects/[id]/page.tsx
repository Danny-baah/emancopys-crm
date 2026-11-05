import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { getProjectById } from "@/actions/projects";
import { ORDERED_PROJECT_STATUSES, PROJECT_STATUS_CONFIG } from "@/lib/constants/projects";
import { ProjectWorkspaceClient } from "@/components/projects/project-workspace-client";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  ShoppingBag,
  Globe,
  FileCheck,
  History,
  Check,
  AlertCircle,
} from "lucide-react";

export const metadata = {
  title: "Project Workspace | EmanCopys CRM",
};

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  await requireAuth();
  const resolvedParams = await params;
  const project = await getProjectById(resolvedParams.id);

  if (!project) {
    notFound();
  }

  const currentConf = PROJECT_STATUS_CONFIG[project.status];
  const percent = Math.round((currentConf.step / 14) * 100);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/projects"
            className="p-2 rounded-xl border border-[#ece8e3] bg-white text-[#708078] hover:text-[#182922] hover:bg-[#f4f7f6] transition-colors mt-0.5 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-medium text-[#182922]">
                {project.projectNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentConf.bg} ${currentConf.text} ${currentConf.border}`}
              >
                <span>Stage {currentConf.step}:</span> {currentConf.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#708078]">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#8aa9a1]" />
                <span className="font-medium text-[#2c4035]">
                  {project.customer.companyName}
                </span>
              </div>
              <span className="text-[#a0aca6]">•</span>
              <span>{project.title}</span>
              {project.assignedTo && (
                <>
                  <span className="text-[#a0aca6]">•</span>
                  <span>
                    Project Lead:{" "}
                    <strong className="text-[#2c4035]">{project.assignedTo.name}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Client-side quick stage button */}
        <ProjectWorkspaceClient
          projectId={project.id}
          projectNumber={project.projectNumber}
          currentStatus={project.status}
          websiteUrl={project.websiteUrl}
          stagingUrl={project.stagingUrl}
          materialsNotes={project.materialsNotes}
          revisionsNotes={project.revisionsNotes}
        />
      </div>

      {/* 14-Step Complete Production Timeline Visualization */}
      <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#182922] uppercase tracking-wider">
            14-Stage Production Roadmap
          </span>
          <span className="text-xs font-bold text-[#062e26]">
            {percent}% Completed (Stage {currentConf.step} of 14)
          </span>
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center min-w-[950px]">
            {ORDERED_PROJECT_STATUSES.map((status, idx) => {
              const conf = PROJECT_STATUS_CONFIG[status];
              const isPast = conf.step < currentConf.step;
              const isCurrent = status === project.status;

              let circleClass = "bg-[#f4f7f6] text-[#708078] border-[#ece8e3]";
              if (isCurrent) {
                circleClass = "bg-[#062e26] text-white border-[#062e26] ring-4 ring-[#062e26]/10 font-bold";
              } else if (isPast) {
                circleClass = "bg-[#e8f1ed] text-[#1d634d] border-[#b8dcd0]";
              }

              return (
                <div key={status} className="flex-1 flex items-center min-w-[62px]">
                  <div className="flex flex-col items-center w-full">
                    <div
                      className={`w-7 h-7 rounded-full border text-[11px] flex items-center justify-center transition-all ${circleClass}`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : conf.step}
                    </div>
                    <span
                      className={`text-[9px] text-center mt-1.5 truncate max-w-[64px] font-medium leading-tight ${
                        isCurrent
                          ? "text-[#062e26] font-bold"
                          : isPast
                          ? "text-[#1d634d]"
                          : "text-[#a0aca6]"
                      }`}
                      title={conf.label}
                    >
                      {conf.label}
                    </span>
                  </div>

                  {idx < ORDERED_PROJECT_STATUSES.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        isPast ? "bg-[#1d634d]" : "bg-[#ece8e3]"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Production Assets, Materials & Handover */}
        <div className="lg:col-span-7 space-y-6">
          {/* Handover & Live Deployment Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1d634d]" />
              Website Deployment & Handover
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#ece8e3] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa9a1]">
                  Staging / Client Preview URL
                </span>
                {project.stagingUrl ? (
                  <a
                    href={project.stagingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#1d4ed8] hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{project.stagingUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-[#a0aca6] italic">Not published yet</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#ece8e3] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa9a1]">
                  Live Production Domain
                </span>
                {project.websiteUrl ? (
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#137333] hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{project.websiteUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-[#a0aca6] italic">Not transferred yet</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[11px] font-semibold text-[#708078] block mb-1">
                  Target Handover Date
                </span>
                <p className="text-xs font-medium text-[#182922]">
                  {project.targetHandoverDate
                    ? new Date(project.targetHandoverDate).toLocaleDateString("en-GB")
                    : "Not scheduled"}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#708078] block mb-1">
                  Actual Transfer Date
                </span>
                <p className="text-xs font-medium text-[#182922]">
                  {project.handoverDate
                    ? new Date(project.handoverDate).toLocaleDateString("en-GB")
                    : "Pending project completion"}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Materials & Content Tracking */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#c2410c]" />
              Customer Materials & Content Assets
            </h3>
            <p className="text-xs text-[#2c4035] bg-[#fcfbf9] p-4 rounded-xl border border-[#ece8e3] whitespace-pre-wrap">
              {project.materialsNotes ||
                "No specific materials notes logged. Click 'Update Stage' to add copy, media, or branding asset status."}
            </p>
          </div>

          {/* Quality Control & Customer Revisions */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#be123c]" />
              Quality Control & Customer Revisions
            </h3>
            <p className="text-xs text-[#2c4035] bg-[#fcfbf9] p-4 rounded-xl border border-[#ece8e3] whitespace-pre-wrap">
              {project.revisionsNotes ||
                "No client revisions logged. All deliverables conform to internal quality standards."}
            </p>
          </div>
        </div>

        {/* Right Column (5 Cols): Order Association & Audit History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Associated Order & Customer Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#182922] border-b border-[#ece8e3] pb-3">
              Originating Commercials
            </h3>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa9a1] block mb-1">
                Contracted Order
              </span>
              <Link
                href={`/orders/${project.order.id}`}
                className="font-bold text-xs text-[#062e26] hover:underline flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{project.order.orderNumber}</span>
              </Link>
              <div className="text-xs text-[#708078] mt-1">
                GHS {project.order.totalAmount.toLocaleString()} • {project.order.serviceSold}
              </div>
            </div>

            <div className="pt-2 border-t border-[#ece8e3]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa9a1] block mb-1">
                Customer Account
              </span>
              <div className="font-semibold text-xs text-[#182922]">
                {project.customer.companyName}
              </div>
              <div className="text-xs text-[#708078]">
                Contact Person: {project.customer.contactPerson}
              </div>
              {project.customer.email && (
                <div className="text-xs text-[#708078]">{project.customer.email}</div>
              )}
            </div>

            {project.order.quotation && (
              <div className="pt-2 border-t border-[#ece8e3]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8aa9a1] block mb-1">
                  Originating Quotation
                </span>
                <Link
                  href={`/quotations/${project.order.quotation.id}`}
                  className="font-semibold text-xs text-[#1d4ed8] hover:underline"
                >
                  {project.order.quotation.quotationNumber}
                </Link>
              </div>
            )}
          </div>

          {/* Status Change Audit Trail */}
          <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-3">
            <h3 className="font-serif text-sm font-semibold text-[#182922] flex items-center gap-2">
              <History className="w-4 h-4 text-[#8aa9a1]" />
              Production Milestones Audit Trail
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
              {project.statusHistory.map((h) => (
                <div key={h.id} className="border-l-2 border-[#062e26] pl-3 py-0.5">
                  <div className="font-semibold text-[#182922]">
                    {h.fromStatus ? `${h.fromStatus} → ` : ""}
                    {h.toStatus}
                  </div>
                  {h.notes && (
                    <div className="text-[#2c4035] text-[11px] mt-0.5 whitespace-pre-wrap">
                      {h.notes}
                    </div>
                  )}
                  <div className="text-[10px] text-[#8aa9a1] mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    by {h.user.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
