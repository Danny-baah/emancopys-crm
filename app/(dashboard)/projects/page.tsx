import { requireAuth } from "@/lib/auth-utils";
import { getProjects } from "@/actions/projects";
import { prisma } from "@/lib/prisma";
import { ProjectsFilters } from "@/components/projects/projects-filters";
import { ProjectsTable } from "@/components/projects/projects-table";
import { Role, ProjectStatus } from "@/lib/generated/prisma/enums";
import { Briefcase, Clock, AlertCircle, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Website Production Projects | EmanCopys CRM",
};

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    stageFilter?: "ALL" | "MATERIALS" | "PRODUCTION" | "REVISIONS" | "HANDOVER" | "COMPLETED";
    page?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const search = resolvedSearchParams.search || "";
  const status = resolvedSearchParams.status || "";
  const stageFilter = resolvedSearchParams.stageFilter || "ALL";
  const page = Number(resolvedSearchParams.page) || 1;

  const userScope =
    user.role === Role.ADMIN
      ? {}
      : {
          OR: [
            { assignedToId: user.id },
            { createdById: user.id },
            { customer: { assignedToId: user.id } },
          ],
        };

  const [
    totalProjects,
    awaitingMaterialsCount,
    inProductionCount,
    readyForHandoverCount,
    projectsData,
  ] = await Promise.all([
    prisma.project.count({ where: userScope }),
    prisma.project.count({
      where: {
        ...userScope,
        status: {
          in: [
            ProjectStatus.WAITING_FOR_CUSTOMER_MATERIALS,
          ],
        },
      },
    }),
    prisma.project.count({
      where: {
        ...userScope,
        status: {
          in: [
            ProjectStatus.IN_PRODUCTION,
            ProjectStatus.INTERNAL_QUALITY_CONTROL,
            ProjectStatus.CUSTOMER_REVISIONS,
          ],
        },
      },
    }),
    prisma.project.count({
      where: {
        ...userScope,
        status: {
          in: [
            ProjectStatus.READY_FOR_HANDOVER,
            ProjectStatus.REMAINING_PAYMENT_PENDING,
          ],
        },
      },
    }),
    getProjects({ search, status, stageFilter, page, limit: 10 }),
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-medium text-[#182922]">
          Website Production Projects
        </h1>
        <p className="text-xs lg:text-sm text-[#708078] mt-1">
          Track client website development across all 14 production milestones from order won to final transfer.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#062e26] text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9ab7b0]">Active Projects</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#f5adb2]">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold">{totalProjects}</div>
            <div className="text-[11px] text-[#8aa9a1] mt-1">Website engagements</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#fef3c7] border border-[#fde68a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#92400e]">Awaiting Materials</span>
            <div className="w-8 h-8 rounded-xl bg-[#fde68a] flex items-center justify-center text-[#92400e]">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">
              {awaitingMaterialsCount}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Pending copy or assets</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1e40af]">In Production & QA</span>
            <div className="w-8 h-8 rounded-xl bg-[#dbeafe] flex items-center justify-center text-[#1e40af]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">
              {inProductionCount}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Engineering & design</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#ecfeff] border border-[#a5f3fc] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#0e7490]">Ready for Handover</span>
            <div className="w-8 h-8 rounded-xl bg-[#cffafe] flex items-center justify-center text-[#0e7490]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-3xl font-bold text-[#182922]">
              {readyForHandoverCount}
            </div>
            <div className="text-[11px] text-[#708078] mt-1">Pending final signoff & transfer</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ProjectsFilters currentStageFilter={stageFilter} currentSearch={search} />

      {/* Projects Table */}
      <ProjectsTable
        projects={projectsData.projects}
        totalCount={projectsData.totalCount}
        currentPage={projectsData.currentPage}
        totalPages={projectsData.totalPages}
      />
    </div>
  );
}
