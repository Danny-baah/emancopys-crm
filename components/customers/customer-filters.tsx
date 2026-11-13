"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Loader2,
  Check,
  RotateCcw,
} from "lucide-react";

interface CustomerFiltersProps {
  initialSearch?: string;
  currentTab: "all" | "active" | "archived";
  currentIndustry?: string;
  currentAssignedToId?: string;
  currentSortBy?: string;
  currentSortOrder?: string;
  industries?: string[];
  teamMembers?: { id: string; name: string | null; email: string | null }[];
  counts: {
    all: number;
    active: number;
    archived: number;
  };
}

export function CustomerFilters({
  initialSearch = "",
  currentTab,
  currentIndustry = "",
  currentAssignedToId = "",
  currentSortBy = "createdAt",
  currentSortOrder = "desc",
  industries = [],
  teamMembers = [],
  counts,
}: CustomerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const [exportOpen, setExportOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [assignedOpen, setAssignedOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Keep search term state synced with URL parameter if it changes from outside
  const searchInUrl = searchParams.get("search") || "";
  const [prevSearchInUrl, setPrevSearchInUrl] = useState(searchInUrl);
  if (prevSearchInUrl !== searchInUrl) {
    setPrevSearchInUrl(searchInUrl);
    setSearchTerm(searchInUrl);
  }

  // Debounced typing effect
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (searchTerm === searchInUrl) {
      return;
    }

    const timer = setTimeout(() => {
      applySearch(searchTerm);
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  function applySearch(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = val.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleTabChange(tab: "all" | "active" | "archived") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (tab === "archived") {
      params.set("archived", "true");
      params.delete("tab");
    } else if (tab === "active") {
      params.set("tab", "active");
      params.delete("archived");
    } else {
      params.delete("archived");
      params.delete("tab");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleIndustrySelect(ind: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (ind && ind !== "ALL") {
      params.set("industry", ind);
    } else {
      params.delete("industry");
    }
    setIndustryOpen(false);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleAssignedSelect(userId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (userId && userId !== "ALL") {
      params.set("assignedToId", userId);
    } else {
      params.delete("assignedToId");
    }
    setAssignedOpen(false);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSortSelect(sortBy: string, sortOrder: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    setSortOpen(false);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      applySearch(searchTerm);
    }
  }

  function clearSearch() {
    setSearchTerm("");
    applySearch("");
  }

  function resetAllFilters() {
    const params = new URLSearchParams();
    if (currentTab === "archived") {
      params.set("archived", "true");
    } else if (currentTab === "active") {
      params.set("tab", "active");
    }
    setSearchTerm("");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleExport(format: "xlsx" | "csv") {
    const params = new URLSearchParams();
    params.set("format", format);
    const s = searchParams.get("search");
    if (s) params.set("search", s);
    if (currentTab === "archived") params.set("archived", "true");
    const ind = searchParams.get("industry");
    if (ind) params.set("industry", ind);
    const asg = searchParams.get("assignedToId");
    if (asg) params.set("assignedToId", asg);

    setExportOpen(false);
    const a = document.createElement("a");
    a.href = `/api/export/customers?${params.toString()}`;
    a.click();
  }

  // Selected labels
  const selectedAssignedUser = teamMembers.find((m) => m.id === currentAssignedToId);
  const assignedLabel = selectedAssignedUser
    ? selectedAssignedUser.name || selectedAssignedUser.email || "Assigned"
    : "All Team Members";

  const sortOptions = [
    { label: "Date Added (Newest)", sortBy: "createdAt", sortOrder: "desc" },
    { label: "Date Added (Oldest)", sortBy: "createdAt", sortOrder: "asc" },
    { label: "Company Name (A–Z)", sortBy: "companyName", sortOrder: "asc" },
    { label: "Company Name (Z–A)", sortBy: "companyName", sortOrder: "desc" },
    { label: "Contact Person (A–Z)", sortBy: "contactPerson", sortOrder: "asc" },
  ];

  const currentSortOption = sortOptions.find(
    (o) => o.sortBy === currentSortBy && o.sortOrder === currentSortOrder
  ) || sortOptions[0];

  const hasActiveFilters = Boolean(
    searchTerm || currentIndustry || currentAssignedToId
  );

  return (
    <div className="space-y-4">
      {/* 1. Tabs & Add Customer Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#e8ecea] rounded-2xl w-fit shadow-2xs">
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${currentTab === "all"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
              }`}
          >
            <span>All Customers</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentTab === "all"
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
                }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("active")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${currentTab === "active"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
              }`}
          >
            <span>Active</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentTab === "active"
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
                }`}
            >
              {counts.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("archived")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${currentTab === "archived"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
              }`}
          >
            <span>Archived</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentTab === "archived"
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
                }`}
            >
              {counts.archived}
            </span>
          </button>
        </div>

        {/* Actions: Export + Add Customer */}
        <div className="flex items-center gap-2.5">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="h-11 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#708078]" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>

            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-[#e1e6e3] shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 text-left">
                  <button
                    type="button"
                    onClick={() => handleExport("xlsx")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2d7a4f]" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("csv")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#6d51c7]" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <Link href="/customers/new">
            <button
              type="button"
              className="h-11 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] active:bg-[#063029] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>Add Customer</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Search & Multi-Filters Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input with clickable search button and clear button */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => applySearch(searchTerm)}
            title="Execute search"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#8a9992] hover:text-[#083d34] rounded-md transition-colors cursor-pointer focus:outline-none"
            aria-label="Search"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#083d34]" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>

          <input
            type="text"
            placeholder="Search by company, contact, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-11 pl-10 pr-24 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all shadow-2xs"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                title="Clear search"
                className="p-1 text-[#8a9992] hover:text-[#182922] transition-colors rounded cursor-pointer"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => applySearch(searchTerm)}
              disabled={isPending}
              className="px-2.5 py-1 rounded-lg bg-[#e8f1ed] hover:bg-[#d0e5db] text-[#1d634d] text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Search
            </button>
          </div>
        </div>

        {/* Dropdown filters */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Industry Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIndustryOpen(!industryOpen);
                setAssignedOpen(false);
                setSortOpen(false);
              }}
              className={`h-11 px-3.5 rounded-xl border bg-white text-xs text-[#182922] font-medium flex items-center gap-2 transition-colors shadow-2xs cursor-pointer ${currentIndustry
                  ? "border-[#083d34] bg-[#f5f8f6] font-semibold text-[#083d34]"
                  : "border-[#e1e6e3] hover:border-[#cbd5d0]"
                }`}
            >
              <span className="text-[#708078]">Industry:</span>
              <span className="max-w-[120px] truncate">{currentIndustry || "All"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>

            {industryOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIndustryOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-52 max-h-60 overflow-y-auto rounded-xl bg-white border border-[#e1e6e3] shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 text-left">
                  <button
                    type="button"
                    onClick={() => handleIndustrySelect("ALL")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                  >
                    <span>All Industries</span>
                    {!currentIndustry && <Check className="w-3.5 h-3.5 text-[#083d34]" />}
                  </button>
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => handleIndustrySelect(ind)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                    >
                      <span className="truncate">{ind}</span>
                      {currentIndustry.toLowerCase() === ind.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-[#083d34]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Assigned To Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAssignedOpen(!assignedOpen);
                setIndustryOpen(false);
                setSortOpen(false);
              }}
              className={`h-11 px-3.5 rounded-xl border bg-white text-xs text-[#182922] font-medium flex items-center gap-2 transition-colors shadow-2xs cursor-pointer ${currentAssignedToId
                  ? "border-[#083d34] bg-[#f5f8f6] font-semibold text-[#083d34]"
                  : "border-[#e1e6e3] hover:border-[#cbd5d0]"
                }`}
            >
              <span className="text-[#708078]">Assigned:</span>
              <span className="max-w-[120px] truncate">{assignedLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>

            {assignedOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setAssignedOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-56 max-h-60 overflow-y-auto rounded-xl bg-white border border-[#e1e6e3] shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 text-left">
                  <button
                    type="button"
                    onClick={() => handleAssignedSelect("ALL")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                  >
                    <span>All Team Members</span>
                    {!currentAssignedToId && <Check className="w-3.5 h-3.5 text-[#083d34]" />}
                  </button>
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleAssignedSelect(member.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                    >
                      <span className="truncate">{member.name || member.email}</span>
                      {currentAssignedToId === member.id && (
                        <Check className="w-3.5 h-3.5 text-[#083d34]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sort By Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSortOpen(!sortOpen);
                setIndustryOpen(false);
                setAssignedOpen(false);
              }}
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs cursor-pointer"
            >
              <span className="text-[#708078]">Sort:</span>
              <span className="max-w-[120px] truncate">{currentSortOption.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>

            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white border border-[#e1e6e3] shadow-lg p-1.5 z-40 animate-in fade-in zoom-in-95 text-left">
                  {sortOptions.map((opt) => {
                    const isSelected =
                      opt.sortBy === currentSortBy && opt.sortOrder === currentSortOrder;
                    return (
                      <button
                        key={`${opt.sortBy}-${opt.sortOrder}`}
                        type="button"
                        onClick={() => handleSortSelect(opt.sortBy, opt.sortOrder)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#083d34]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Reset Filters / Sliders Icon Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-11 px-3 rounded-xl border border-[#fad5d9] bg-[#fdeef0] text-[#c95965] hover:bg-[#fcd9dd] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Reset search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {!hasActiveFilters && (
            <div
              className="w-11 h-11 rounded-xl border border-[#e1e6e3] bg-white flex items-center justify-center text-[#8a9992] shadow-2xs select-none"
              title="Filter toolbar active"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
