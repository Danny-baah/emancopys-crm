"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectStatus } from "@/lib/generated/prisma/enums";
import { PROJECT_STATUS_CONFIG } from "@/lib/constants/projects";
import {
  Briefcase,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { ProjectStatusModal } from "./project-status-modal";

interface ProjectItem {
  id: string;
  projectNumber: string;
  title: string;
  status: ProjectStatus;
  startDate: Date | string;
  targetHandoverDate?: Date | string | null;
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
  };
  order: {
    id: string;
    orderNumber: string;
    serviceSold: string;
    totalAmount: number;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  _count: {
    statusHistory: number;
  };
}

interface ProjectsTableProps {
  projects: ProjectItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function ProjectsTable({
  projects,
  totalCount,
  currentPage,
  totalPages,
}: ProjectsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalProject, setModalProject] = useState<ProjectItem | null>(null);

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/projects?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#ece8e3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ece8e3] bg-[#fcfbf9] text-[11px] font-semibold text-[#708078] uppercase tracking-wider">
                <th className="py-3.5 px-4">Project ID & Title</th>
                <th className="py-3.5 px-4">Customer Account</th>
                <th className="py-3.5 px-4">Current Production Stage</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Project Lead</th>
                <th className="py-3.5 px-4">Originating Order</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8e3] text-xs text-[#182922]">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9ab7b0]">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 text-[#b8dcd0]" />
                    <p className="font-medium text-sm text-[#476355]">No projects found</p>
                    <p className="text-xs text-[#708078] mt-1">
                      Projects are created when deals are won and orders are confirmed.
                    </p>
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const conf = PROJECT_STATUS_CONFIG[p.status];
                  const percent = Math.round((conf.step / 14) * 100);

                  return (
                    <tr key={p.id} className="hover:bg-[#fbfcfb] transition-colors group">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-bold text-[#062e26] hover:underline"
                        >
                          {p.projectNumber}
                        </Link>
                        <div className="text-xs text-[#2c4035] font-medium mt-0.5 line-clamp-1">
                          {p.title}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#182922]">
                          {p.customer.companyName}
                        </div>
                        <div className="text-[11px] text-[#708078]">
                          {p.customer.contactPerson}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          <span>
                            <span className="opacity-60 mr-1">{conf.step}.</span>
                            {conf.label}
                          </span>
                        </span>
                      </td>

                      {/* Progress Bar (1-14) */}
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#f4f7f6] rounded-full h-2 overflow-hidden border border-[#ece8e3]">
                            <div
                              className="bg-[#062e26] h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-[#708078] shrink-0">
                            {conf.step}/14
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#062e26] text-white text-[9px] flex items-center justify-center font-bold">
                              {p.assignedTo.name.charAt(0)}
                            </div>
                            <span className="text-xs text-[#2c4035]">
                              {p.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9ab7b0] italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/orders/${p.order.id}`}
                          className="font-medium text-[#1d634d] hover:underline"
                        >
                          {p.order.orderNumber}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModalProject(p)}
                            className="px-2.5 py-1 rounded-lg bg-[#e8f1ed] text-[#1d634d] hover:bg-[#b8dcd0] text-[11px] font-medium transition-colors"
                          >
                            Update Stage
                          </button>
                          <Link
                            href={`/projects/${p.id}`}
                            className="p-1 rounded-lg text-[#708078] hover:text-[#182922] hover:bg-[#f4f7f6]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="px-4 py-3 bg-[#fcfbf9] border-t border-[#ece8e3] flex items-center justify-between text-xs text-[#708078]">
            <div>
              Showing {projects.length} of {totalCount} projects
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-1 rounded-lg border border-[#ece8e3] bg-white disabled:opacity-40 hover:bg-[#f4f7f6] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-[#182922]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-1 rounded-lg border border-[#ece8e3] bg-white disabled:opacity-40 hover:bg-[#f4f7f6] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modalProject && (
        <ProjectStatusModal
          projectId={modalProject.id}
          projectNumber={modalProject.projectNumber}
          currentStatus={modalProject.status}
          isOpen={Boolean(modalProject)}
          onClose={() => setModalProject(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
