"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  TrendingUp,
  FileText,
  Calendar,
  Briefcase,
  CreditCard,
  UserCheck,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const coreNavItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Orders", href: "/orders", icon: Calendar },
  { name: "Projects", href: "/projects", icon: Briefcase },
];

const upcomingModules: { name: string; icon: React.ElementType }[] = [
  { name: "Payments", icon: CreditCard },
  { name: "Employees", icon: UserCheck },
  { name: "Reports", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative w-64 lg:w-72 bg-[#062e26] text-white shrink-0 flex flex-col min-h-screen justify-between overflow-hidden select-none border-r border-[#093c32]">
      {/* Subtle top wave decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-30 z-0">
        <svg viewBox="0 0 300 300" fill="none" className="w-full h-full">
          <path
            d="M-20 -20 C80 10 160 80 140 180 C120 250 60 280 -20 290 Z"
            fill="#0b4337"
          />
        </svg>
      </div>

      {/* Main Navigation Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-8">
          {/* Stylized Ribbon 'E' Monogram Logo */}
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5adb2" />
                  <stop offset="100%" stopColor="#d7727b" />
                </linearGradient>
              </defs>
              <path
                d="M 10 9 C 10 9 24 9 32 9 C 34.5 9 36 10.8 34.5 13 C 33 15.2 31 15.5 28.5 15.5 L 14.5 15.5 C 12 15.5 10 17.5 10 20 L 10 9 Z"
                fill="url(#sidebarLogoGrad)"
              />
              <path
                d="M 10 19 L 26 19 C 28.2 19 29.5 20.6 28.2 22.5 C 27 24.4 25.2 24.5 23 24.5 L 10 24.5 Z"
                fill="url(#sidebarLogoGrad)"
              />
              <path
                d="M 10 28 L 29 28 C 31.5 28 33.5 29.8 32 32 C 30.5 34.2 28.5 35 25.5 35 L 10 35 C 7.5 35 7.5 28 10 28 Z"
                fill="url(#sidebarLogoGrad)"
              />
            </svg>
          </div>
          <div>
            <div className="font-serif text-xl font-normal tracking-tight text-white leading-tight">
              EmanCopys
            </div>
            <div className="text-[10px] font-semibold tracking-[0.3em] text-[#d4e1dd] uppercase pl-0.5">
              CRM
            </div>
          </div>
        </div>

        {/* Section 1: Core Workspace */}
        <div className="mb-7">
          <div className="px-3 mb-2.5 text-[10px] font-semibold tracking-[0.2em] text-[#8aa9a1] uppercase">
            Core Workspace
          </div>
          <nav className="space-y-1.5">
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-[#f7c2c7] text-[#182922] font-semibold shadow-xs"
                      : "text-[#9ab7b0] hover:text-white hover:bg-white/5 font-medium"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-[#182922]" : "text-[#9ab7b0]"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Upcoming Modules */}
        <div className="mb-6">
          <div className="px-3 mb-2.5 text-[10px] font-semibold tracking-[0.2em] text-[#8aa9a1] uppercase">
            Upcoming Modules
          </div>
          <div className="space-y-1">
            {upcomingModules.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm text-[#7e9d94] hover:text-[#9ab7b0] transition-colors cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-[#6a8b82]" />
                    <span className="text-xs font-normal">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#0d3b32] border border-[#184e44] text-[#8aa9a1]">
                    Soon
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botanical Pink Leaf Illustration in bottom-right corner */}
      <div className="absolute bottom-0 right-0 w-[180px] h-[220px] pointer-events-none z-0">
        <svg
          viewBox="0 0 240 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-contain"
        >
          <defs>
            <linearGradient id="sbLeafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5adb2" />
              <stop offset="55%" stopColor="#e59398" />
              <stop offset="100%" stopColor="#c86e75" />
            </linearGradient>
            <linearGradient id="sbLeafShadow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b85f67" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#9e4951" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <path
            d="M200 280 C180 220 160 160 150 100"
            stroke="#c86e75"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Top leaf */}
          <path
            d="M150 100 C135 60 145 20 155 10 C165 40 160 75 150 100 Z"
            fill="url(#sbLeafGrad1)"
          />
          {/* Left leaf 1 */}
          <path
            d="M154 135 C115 105 85 115 70 130 C85 160 120 165 154 135 Z"
            fill="url(#sbLeafGrad1)"
          />
          {/* Right leaf 1 */}
          <path
            d="M158 160 C195 135 225 145 238 165 C222 190 190 185 158 160 Z"
            fill="url(#sbLeafGrad1)"
          />
          {/* Left leaf 2 */}
          <path
            d="M165 200 C105 160 55 180 35 210 C60 250 120 245 165 200 Z"
            fill="url(#sbLeafGrad1)"
          />
        </svg>
      </div>

      {/* Sidebar Footer Branding */}
      <div className="relative z-10 p-6 pt-0">
        <div className="font-serif text-sm font-semibold text-white">
          EmanCopys CRM
        </div>
        <p className="text-[11px] text-[#8aa9a1] leading-tight mt-1 max-w-[190px]">
          Manage clients, projects and operations in one place.
        </p>
      </div>
    </aside>
  );
}