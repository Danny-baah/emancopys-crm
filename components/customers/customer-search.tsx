"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";

interface CustomerSearchProps {
  initialSearch?: string;
  isArchivedView?: boolean;
}

export function CustomerSearch({
  initialSearch = "",
  isArchivedView = false,
}: CustomerSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  function applySearch(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set("search", val.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset to page 1 on new search

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search company, contact person, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-16 bg-card"
        />
        <div className="absolute right-2 top-1.5 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => applySearch(searchTerm)}
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      {/* Active vs Archived Filter Tabs */}
      <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1 shrink-0">
        <Link
          href="/customers"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            !isArchivedView
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Active Directory
        </Link>
        <Link
          href="/customers?archived=true"
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            isArchivedView
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Archived Records
        </Link>
      </div>
    </div>
  );
}
