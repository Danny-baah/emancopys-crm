"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  Upload,
  Download,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import { LeadStatus } from "@/lib/generated/prisma/enums";

interface LeadFiltersProps {
  initialSearch?: string;
  currentStatus: string;
  counts: {
    all: number;
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    converted: number;
  };
}

export function LeadFilters({
  initialSearch = "",
  currentStatus = "ALL",
  counts,
}: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);

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

  function handleStatusChange(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
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

  function handleExport(format: "xlsx" | "csv") {
    const params = new URLSearchParams();
    params.set("format", format);
    const s = searchParams.get("search");
    if (s) params.set("search", s);
    const st = searchParams.get("status");
    if (st) params.set("status", st);

    setExportOpen(false);
    const a = document.createElement("a");
    a.href = `/api/export/leads?${params.toString()}`;
    a.click();
  }

  return (
    <div className="space-y-4">
      {/* 1. Status Tabs & Action Buttons Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#e8ecea] rounded-2xl w-fit shadow-2xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => handleStatusChange("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === "ALL"
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>All Leads</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === "ALL"
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(LeadStatus.NEW)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === LeadStatus.NEW
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>New</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === LeadStatus.NEW
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.new}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(LeadStatus.CONTACTED)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === LeadStatus.CONTACTED
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Contacted</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === LeadStatus.CONTACTED
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.contacted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(LeadStatus.QUALIFIED)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === LeadStatus.QUALIFIED
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Qualified</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === LeadStatus.QUALIFIED
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.qualified}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(LeadStatus.PROPOSAL_SENT)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === LeadStatus.PROPOSAL_SENT
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Proposal</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === LeadStatus.PROPOSAL_SENT
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.proposal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(LeadStatus.CONVERTED)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === LeadStatus.CONVERTED
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Converted</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === LeadStatus.CONVERTED
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.converted}
            </span>
          </button>
        </div>

        {/* Action Buttons: Add Lead + Import + Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

          {/* Import Leads Button */}
          <Link href="/leads/import">
            <button
              type="button"
              className="h-11 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#182922] hover:border-[#cbd5d0] flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#708078]" />
              <span>Import Leads</span>
            </button>
          </Link>

          {/* + Add Lead Primary Button */}
          <Link href="/leads/new">
            <button
              type="button"
              className="h-11 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] active:bg-[#063029] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>Add Lead</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Search & Toolbar Row */}
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
          <div className="relative">
            <button
              type="button"
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs"
            >
              <span className="text-[#708078]">Status:</span>
              <span>{currentStatus === "ALL" ? "All Statuses" : currentStatus}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs"
            >
              <span className="text-[#708078]">Assigned:</span>
              <span>All Team Members</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a9992]" />
            </button>
          </div>

          <Link href="/leads/import/history">
            <button
              type="button"
              className="h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium flex items-center gap-2 hover:border-[#cbd5d0] transition-colors shadow-2xs"
              title="View bulk import history"
            >
              <span>Import History</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
