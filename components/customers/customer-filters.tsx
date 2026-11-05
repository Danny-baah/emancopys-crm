"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  SlidersHorizontal,
  ChevronDown,
  Download,
  FileSpreadsheet,
} from "lucide-react";

interface CustomerFiltersProps {
  initialSearch?: string;
  currentTab: "all" | "active" | "archived";
  counts: {
    all: number;
    active: number;
    archived: number;
  };
}

export function CustomerFilters({
  initialSearch = "",
  currentTab,
  counts,
}: CustomerFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);

  function handleExport(format: "xlsx" | "csv") {
    const params = new URLSearchParams();
    params.set("format", format);
    const s = searchParams.get("search");
    if (s) params.set("search", s);
    if (currentTab === "archived") params.set("archived", "true");

    setExportOpen(false);
    const a = document.createElement("a");
    a.href = `/api/export/customers?${params.toString()}`;
    a.click();
  }

  function applySearch(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set("search", val.trim());
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      applySearch(searchTerm);
    }
  }

  function clearSearch() {
    setSearchTerm("");
    applySearch("");
  }

  return (
    <div className="space-y-4">
      {/* 1. Tabs & Add Customer Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#e8ecea] rounded-2xl w-fit shadow-2xs">
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "all"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>All Customers</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentTab === "all"
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
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "active"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Active</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentTab === "active"
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
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "archived"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Archived</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentTab === "archived"
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
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#2d7a4f]" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport("csv")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#182922] hover:bg-[#f5f8f6] transition-colors"
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
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company, contact, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8a9992] hover:text-[#182922] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown filters */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Industry Filter */}
          <div className="relative">
            <button
              type="button"
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs"
            >
              <span className="text-[#708078]">Industry:</span>
              <span>All Industries</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>
          </div>

          {/* Assigned To Filter */}
          <div className="relative">
            <button
              type="button"
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs"
            >
              <span className="text-[#708078]">Assigned To:</span>
              <span>All Team Members</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>
          </div>

          {/* Sort By Filter */}
          <div className="relative">
            <button
              type="button"
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs"
            >
              <span className="text-[#708078]">Sort by:</span>
              <span>Date Added</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>
          </div>

          {/* Settings / Sliders Icon Button */}
          <button
            type="button"
            className="w-11 h-11 rounded-xl border border-[#e1e6e3] bg-white flex items-center justify-center text-[#556660] hover:text-[#182922] hover:border-[#cbd5d0] transition-colors shadow-2xs"
            aria-label="Filter settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}