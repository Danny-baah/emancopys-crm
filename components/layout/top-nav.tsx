"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Home,
} from "lucide-react";
import { Role } from "@/lib/generated/prisma/enums";

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    role: Role;
  };
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  // Generate dynamic breadcrumb segments
  function renderBreadcrumbs() {
    if (pathname === "/dashboard") {
      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <span className="font-semibold text-[#182922]">Dashboard</span>
        </div>
      );
    }

    if (pathname.startsWith("/leads")) {
      const isNew = pathname === "/leads/new";
      const isImport = pathname.startsWith("/leads/import");
      const isEdit = pathname.endsWith("/edit");

      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Link href="/dashboard" className="hover:text-[#182922] transition-colors">
            <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          </Link>
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <Link
            href="/leads"
            className={
              isNew || isImport || isEdit
                ? "hover:text-[#182922] transition-colors"
                : "font-semibold text-[#182922]"
            }
          >
            Leads
          </Link>
          {isNew && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">New Lead</span>
            </>
          )}
          {isImport && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">Bulk Import</span>
            </>
          )}
          {isEdit && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">Edit Lead</span>
            </>
          )}
        </div>
      );
    }

    if (pathname.startsWith("/customers")) {
      const isNew = pathname === "/customers/new";
      const isEdit = pathname.endsWith("/edit");

      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Link href="/dashboard" className="hover:text-[#182922] transition-colors">
            <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          </Link>
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <Link
            href="/customers"
            className={
              isNew || isEdit
                ? "hover:text-[#182922] transition-colors"
                : "font-semibold text-[#182922]"
            }
          >
            Customers
          </Link>
          {isNew && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">New Customer</span>
            </>
          )}
          {isEdit && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">Edit Customer</span>
            </>
          )}
        </div>
      );
    }

    if (pathname.startsWith("/sales")) {
      const isNew = pathname === "/sales/new";
      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Link href="/dashboard" className="hover:text-[#182922] transition-colors">
            <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          </Link>
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <Link
            href="/sales"
            className={isNew ? "hover:text-[#182922] transition-colors" : "font-semibold text-[#182922]"}
          >
            Sales Pipeline
          </Link>
          {isNew && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">New Deal</span>
            </>
          )}
        </div>
      );
    }

    if (pathname.startsWith("/quotations")) {
      const isNew = pathname === "/quotations/new";
      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Link href="/dashboard" className="hover:text-[#182922] transition-colors">
            <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          </Link>
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <Link
            href="/quotations"
            className={isNew ? "hover:text-[#182922] transition-colors" : "font-semibold text-[#182922]"}
          >
            Quotations
          </Link>
          {isNew && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">New Quotation</span>
            </>
          )}
        </div>
      );
    }

    if (pathname.startsWith("/orders")) {
      const isNew = pathname === "/orders/new";
      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Link href="/dashboard" className="hover:text-[#182922] transition-colors">
            <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          </Link>
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <Link
            href="/orders"
            className={isNew ? "hover:text-[#182922] transition-colors" : "font-semibold text-[#182922]"}
          >
            Orders
          </Link>
          {isNew && (
            <>
              <span className="text-[#a0aca6]">&gt;</span>
              <span className="font-semibold text-[#182922]">New Order</span>
            </>
          )}
        </div>
      );
    }

    if (pathname.startsWith("/projects")) {
      return (
        <div className="flex items-center gap-2 text-xs text-[#708078]">
          <Link href="/dashboard" className="hover:text-[#182922] transition-colors">
            <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
          </Link>
          <span>Workspace</span>
          <span className="text-[#a0aca6]">&gt;</span>
          <Link href="/projects" className="font-semibold text-[#182922]">
            Website Production Projects
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-xs text-[#708078]">
        <Home className="w-3.5 h-3.5 text-[#8aa9a1]" />
        <span>Workspace</span>
      </div>
    );
  }

  return (
    <header className="h-18 px-6 lg:px-10 flex items-center justify-between shrink-0 bg-transparent border-b border-[#ece8e3]/80">
      {/* Left side: Breadcrumb / Path */}
      <div className="hidden sm:flex items-center">
        {renderBreadcrumbs()}
      </div>

      {/* Right side: Global Search, Notification Bell, User Avatar */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Search Input Bar */}
        <div className="relative w-56 sm:w-72 lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers, activities, or anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all shadow-2xs"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            className="relative w-10 h-10 rounded-full bg-white border border-[#e1e6e3] flex items-center justify-center text-[#556660] hover:text-[#182922] hover:border-[#cbd5d0] transition-colors shadow-2xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {/* Notification badge dot */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#df8d93] ring-2 ring-white" />
          </button>
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-full bg-white border border-[#e1e6e3] hover:border-[#cbd5d0] transition-all shadow-2xs cursor-pointer select-none"
          >
            {/* Initials Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#083d34] text-white flex items-center justify-center font-semibold text-xs shrink-0">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "EC"}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-[#182922] leading-tight">
                {user.name || "EmanCopys Admin"}
              </div>
              <div className="text-[10px] text-[#708078] leading-tight capitalize">
                {user.role === Role.ADMIN ? "Admin" : "Employee"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#708078] shrink-0" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#e1e6e3] shadow-lg p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#f0f3f1] mb-1">
                  <p className="text-xs font-semibold text-[#182922]">
                    {user.name || "EmanCopys Admin"}
                  </p>
                  <p className="text-[11px] text-[#708078] truncate">
                    {user.email || "admin@emancopys.com"}
                  </p>
                </div>

                <div className="px-3 py-1.5 text-[11px] text-[#8aa9a1] uppercase font-semibold">
                  Account Role: {user.role}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}