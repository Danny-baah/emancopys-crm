"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

interface ProjectsFiltersProps {
  currentStageFilter?: string;
  currentSearch?: string;
}

export function ProjectsFilters({
  currentStageFilter = "ALL",
  currentSearch = "",
}: ProjectsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");

    startTransition(() => {
      router.push(`/projects?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleFilterChange("search", searchTerm);
  }

  const stageTabs = [
    { label: "All Projects", value: "ALL" },
    { label: "Awaiting Materials", value: "MATERIALS" },
    { label: "In Production", value: "PRODUCTION" },
    { label: "Revisions & Approval", value: "REVISIONS" },
    { label: "Ready for Handover", value: "HANDOVER" },
    { label: "Completed", value: "COMPLETED" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {stageTabs.map((tab) => {
            const isActive =
              currentStageFilter === tab.value ||
              (!currentStageFilter && tab.value === "ALL");
            return (
              <button
                key={tab.value}
                onClick={() => handleFilterChange("stageFilter", tab.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#062e26] text-white shadow-xs"
                    : "bg-white text-[#708078] border border-[#ece8e3] hover:border-[#b8dcd0] hover:text-[#182922]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8aa9a1]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by ID, title, customer, or scope..."
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-[#ece8e3] bg-white text-xs text-[#182922] placeholder:text-[#9ab7b0] focus:outline-none focus:border-[#062e26] shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                handleFilterChange("search", "");
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-[#8aa9a1] hover:text-[#182922]"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-[#e8f1ed] text-[#1d634d] hover:bg-[#b8dcd0] text-xs font-medium transition-colors"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
