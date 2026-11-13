"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  Upload,
  Download,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { SalesStatus } from "@/lib/generated/prisma/enums";
import { ORDERED_SALES_STATUSES, SALES_STATUS_CONFIG } from "@/lib/constants/sales";

interface LeadFiltersProps {
  initialSearch?: string;
  currentStatus: string;
  counts: {
    all: number;
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    won: number;
    lost: number;
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
  const [isPending, startTransition] = useTransition();
  const [exportOpen, setExportOpen] = useState(false);

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
            onClick={() => handleStatusChange(SalesStatus.NEW_LEAD)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === SalesStatus.NEW_LEAD
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>New Lead</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === SalesStatus.NEW_LEAD
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.new}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(SalesStatus.FIRST_CONTACT_MADE)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === SalesStatus.FIRST_CONTACT_MADE
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Contact Made</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === SalesStatus.FIRST_CONTACT_MADE
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.contacted}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(SalesStatus.DECISION_MAKER_REACHED)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === SalesStatus.DECISION_MAKER_REACHED
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Decision Maker</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === SalesStatus.DECISION_MAKER_REACHED
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.qualified}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(SalesStatus.QUOTATION_SENT)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === SalesStatus.QUOTATION_SENT
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Quote Sent</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === SalesStatus.QUOTATION_SENT
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.proposal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(SalesStatus.DEAL_WON)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === SalesStatus.DEAL_WON
                ? "bg-[#e8f6ed] text-[#2d7a4f] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Deal Won</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === SalesStatus.DEAL_WON
                  ? "bg-[#cbe8d5] text-[#2d7a4f]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.won}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange(SalesStatus.DEAL_LOST)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              currentStatus === SalesStatus.DEAL_LOST
                ? "bg-[#fdeef0] text-[#c95965] shadow-2xs"
                : "text-[#556660] hover:text-[#182922]"
            }`}
          >
            <span>Deal Lost</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                currentStatus === SalesStatus.DEAL_LOST
                  ? "bg-[#fad5d9] text-[#c95965]"
                  : "bg-[#f0f3f1] text-[#708078]"
              }`}
            >
              {counts.lost}
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
          <div className="relative">
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Filter by stage"
              className="h-11 px-3.5 pr-8 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] font-medium hover:border-[#cbd5d0] transition-colors shadow-2xs focus:outline-none focus:border-[#083d34] cursor-pointer"
            >
              <option value="ALL">All 10 Pipeline Stages</option>
              {ORDERED_SALES_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SALES_STATUS_CONFIG[s].step}. {SALES_STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
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
