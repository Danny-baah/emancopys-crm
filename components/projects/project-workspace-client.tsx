"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@/lib/generated/prisma/enums";
import { ProjectStatusModal } from "./project-status-modal";
import { TrendingUp } from "lucide-react";

interface ProjectWorkspaceClientProps {
  projectId: string;
  projectNumber: string;
  currentStatus: ProjectStatus;
  websiteUrl?: string | null;
  stagingUrl?: string | null;
  materialsNotes?: string | null;
  revisionsNotes?: string | null;
}

export function ProjectWorkspaceClient({
  projectId,
  projectNumber,
  currentStatus,
  websiteUrl,
  stagingUrl,
  materialsNotes,
  revisionsNotes,
}: ProjectWorkspaceClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#062e26] text-white text-xs font-semibold hover:bg-[#0b4337] transition-all shadow-xs shrink-0"
      >
        <TrendingUp className="w-3.5 h-3.5 text-[#f5adb2]" />
        <span>Update Production Stage</span>
      </button>

      {isModalOpen && (
        <ProjectStatusModal
          projectId={projectId}
          projectNumber={projectNumber}
          currentStatus={currentStatus}
          initialWebsiteUrl={websiteUrl}
          initialStagingUrl={stagingUrl}
          initialMaterialsNotes={materialsNotes}
          initialRevisionsNotes={revisionsNotes}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
