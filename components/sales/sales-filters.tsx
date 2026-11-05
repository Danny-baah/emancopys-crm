"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { SalesStatus } from "@/lib/generated/prisma/enums";

interface SalesFiltersProps {
  currentStatus?: string;
  currentSearch?: string;
}

export function SalesFilters({
  currentStatus = "ALL",
  currentSearch = "",
}: SalesFiltersProps) {
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
    params.delete("page"); // Reset page on filter

    startTransition(() => {
      router.push(`/sales?${params.toString()}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleFilterChange("search", searchTerm);
  }

  const primaryStatusTabs = [
    { label: "All Deals", value: "ALL" },
    { label: "New Lead", value: SalesStatus.NEW_LEAD },
    { label: "Interested", value: SalesStatus.INTERESTED },
    { label: "Quotation Sent", value: SalesStatus.QUOTATION_SENT },
    { label: "Follow-Up Required", value: SalesStatus.FOLLOW_UP_REQUIRED },
    { label: "Deal Won", value: SalesStatus.DEAL_WON },
    { label: "Deal Lost", value: SalesStatus.DEAL_LOST },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {primaryStatusTabs.map((tab) => {
            const isActive =
              currentStatus === tab.value ||
              (!currentStatus && tab.value === "ALL");
            return (
              <button
                key={tab.value}
                onClick={() => handleFilterChange("status", tab.value)}
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

        {/* Action Button: Add Deal */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/sales/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] transition-all shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </Link>
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
            placeholder="Search deals by title, company, contact, or service..."
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
