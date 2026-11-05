import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { Role, ActivityType } from "@/lib/generated/prisma/enums";
import {
  Users,
  Activity,
  Archive,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  FileText,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import {
  ClientGrowthChart,
  ClientOverviewChart,
} from "@/components/dashboard/dashboard-charts";

export default async function DashboardPage() {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;

  const customerFilter = isAdmin
    ? { archivedAt: null }
    : { archivedAt: null, OR: [{ assignedToId: user.id }, { createdById: user.id }] };

  const activityFilter = isAdmin
    ? {}
    : {
        customer: {
          OR: [{ assignedToId: user.id }, { createdById: user.id }],
        },
      };

  const [
    totalCustomers,
    archivedCount,
    totalActivities,
    activeEmployeesCount,
    recentCustomers,
    recentActivities,
  ] = await Promise.all([
    prisma.customer.count({ where: customerFilter }),
    prisma.customer.count({
      where: isAdmin
        ? { archivedAt: { not: null } }
        : { archivedAt: { not: null }, OR: [{ assignedToId: user.id }, { createdById: user.id }] },
    }),
    prisma.customerActivity.count({ where: activityFilter }),
    isAdmin ? prisma.user.count({ where: { isActive: true } }) : Promise.resolve(1),
    prisma.customer.findMany({
      where: customerFilter,
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
      },
    }),
    prisma.customerActivity.findMany({
      where: activityFilter,
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, companyName: true, contactPerson: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    }),
  ]);

  // Dynamic time-of-day greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  // Industry pill styling helper
  function getIndustryBadgeClass(industry?: string | null) {
    const ind = (industry || "").toLowerCase();
    if (ind.includes("manufactur")) {
      return "bg-[#e8f6ed] text-[#2d7a4f] border-[#cbe8d5]";
    }
    if (ind.includes("publish") || ind.includes("print")) {
      return "bg-[#fdeef0] text-[#c95965] border-[#fad5d9]";
    }
    if (ind.includes("it") || ind.includes("tech") || ind.includes("soft")) {
      return "bg-[#f1edfb] text-[#6d51c7] border-[#ddd4f7]";
    }
    if (ind.includes("logist") || ind.includes("transport")) {
      return "bg-[#eef7f3] text-[#34785c] border-[#d2ebde]";
    }
    return "bg-[#fdf4e9] text-[#b46d23] border-[#fce3c7]";
  }

  // Format date helper
  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  // Format time helper
  function formatTime(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(new Date(date))
      .toLowerCase();
  }

  return (
    <div className="space-y-8">
      {/* 1. Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
            {greeting}, {user.name || "EmanCopys Admin"} 👋
          </h1>
          <p className="text-sm text-[#677770] mt-1.5 font-normal">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
      </div>

      {/* 2. Top Stats Cards (4 Distinct Visual Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Active Clients (Featured Dark Pine Green Card with Botanical Leaf Artwork) */}
        <div className="relative overflow-hidden rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[160px]">
          {/* Leaf artwork in bottom-right corner */}
          <div className="absolute -bottom-2 -right-2 w-32 h-32 pointer-events-none opacity-80">
            <svg viewBox="0 0 150 150" fill="none" className="w-full h-full">
              <defs>
                <linearGradient id="cardLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f5adb2" />
                  <stop offset="100%" stopColor="#c86e75" />
                </linearGradient>
              </defs>
              <path
                d="M130 150 C110 110 90 70 80 30"
                stroke="#c86e75"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M80 30 C70 5 80 -15 90 -20 C95 10 90 25 80 30 Z"
                fill="url(#cardLeaf)"
              />
              <path
                d="M85 55 C55 35 35 45 25 60 C40 80 65 80 85 55 Z"
                fill="url(#cardLeaf)"
              />
              <path
                d="M90 85 C120 65 145 75 155 90 C140 110 115 105 90 85 Z"
                fill="url(#cardLeaf)"
              />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              Total Active Clients
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-white mt-1">
              {totalCustomers}
            </div>
          </div>

          <div className="relative z-10 text-xs text-[#52c41a] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+20% from last month</span>
          </div>
        </div>

        {/* Card 2: Recorded Activities (Pastel Blush Pink) */}
        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Recorded Activities
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {totalActivities}
            </div>
          </div>
          <div className="text-xs text-[#2e7d32] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12% from last month</span>
          </div>
        </div>

        {/* Card 3: Archived Clients (Pastel Sage Green) */}
        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <Archive className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Archived Clients
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {archivedCount}
            </div>
          </div>
          <div className="text-xs text-[#d76a74] font-medium flex items-center gap-1 mt-3">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+2 from last month</span>
          </div>
        </div>

        {/* Card 4: Team Members (Pastel Warm Cream) */}
        <div className="rounded-[26px] bg-[#fbf5ee] border border-[#faecd8] p-6 shadow-2xs flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#f9ebd7] border border-[#f5dfbf] flex items-center justify-center text-[#ba7528]">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Team Members
            </div>
            <div className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] mt-1">
              {activeEmployeesCount}
            </div>
          </div>
          <div className="text-xs text-[#708078] font-normal mt-3">
            Active in workspace
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Analytics & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <ClientGrowthChart />
        </div>
        <div className="lg:col-span-4">
          <ClientOverviewChart
            activeCount={totalCustomers}
            archivedCount={archivedCount}
          />
        </div>
      </div>

      {/* 4. Bottom Section: Recent Feeds (Clients & Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Feed: Recent Clients */}
        <div className="lg:col-span-7 bg-white rounded-[26px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#13231c]">
                Recent Clients
              </h3>
              <p className="text-xs text-[#708078] mt-0.5">
                Latest client accounts added to the system.
              </p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-semibold text-[#c86e75] hover:text-[#9e4951] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCustomers.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#708078]">
              No clients recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#f0f3f1] text-[10px] font-semibold tracking-wider text-[#8a9992] uppercase">
                    <th className="pb-3 font-semibold">Client</th>
                    <th className="pb-3 font-semibold">Industry</th>
                    <th className="pb-3 font-semibold">Assigned To</th>
                    <th className="pb-3 font-semibold">Date Added</th>
                    <th className="pb-3 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7faf8]">
                  {recentCustomers.map((c) => {
                    const initials = (c.companyName || "EC")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr key={c.id} className="hover:bg-[#fafbfb] transition-colors">
                        <td className="py-3.5 pr-3">
                          <Link
                            href={`/customers/${c.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#fdeee9] text-[#c76545] font-semibold text-[11px] flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-[#182922] group-hover:text-[#083d34] transition-colors">
                                {c.companyName}
                              </div>
                              <div className="text-[11px] text-[#708078]">
                                {c.contactPerson || "Direct Contact"}
                              </div>
                            </div>
                          </Link>
                        </td>

                        <td className="py-3.5 pr-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getIndustryBadgeClass(
                              c.industry
                            )}`}
                          >
                            {c.industry || "General"}
                          </span>
                        </td>

                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#083d34] text-white text-[9px] font-medium flex items-center justify-center shrink-0">
                              {c.assignedTo?.name
                                ? c.assignedTo.name.slice(0, 2).toUpperCase()
                                : "EC"}
                            </div>
                            <span className="text-[#3c4c45]">
                              {c.assignedTo?.name || "Unassigned"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 pr-3 text-[#708078]">
                          {formatDate(c.createdAt)}
                        </td>

                        <td className="py-3.5 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            className="p-1 text-[#8a9992] hover:text-[#182922] transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 inline-block" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Feed: Recent Activities Timeline */}
        <div className="lg:col-span-5 bg-white rounded-[26px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#13231c]">
                Recent Activities
              </h3>
              <p className="text-xs text-[#708078] mt-0.5">
                Latest client engagements across your team.
              </p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-semibold text-[#c86e75] hover:text-[#9e4951] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#708078]">
              No activities logged yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-[#e8ecea]">
              {recentActivities.map((act) => {
                let icon = <Phone className="w-3.5 h-3.5 text-[#2d7a4f]" />;
                let iconBg = "bg-[#e8f6ed] border-[#cbe8d5]";

                if (act.activityType === ActivityType.MEETING) {
                  icon = <Calendar className="w-3.5 h-3.5 text-[#c95965]" />;
                  iconBg = "bg-[#fdeef0] border-[#fad5d9]";
                } else if (act.activityType === ActivityType.EMAIL) {
                  icon = <Mail className="w-3.5 h-3.5 text-[#2d7a4f]" />;
                  iconBg = "bg-[#e8f6ed] border-[#cbe8d5]";
                } else if (act.activityType === ActivityType.NOTE) {
                  icon = <FileText className="w-3.5 h-3.5 text-[#6d51c7]" />;
                  iconBg = "bg-[#f1edfb] border-[#ddd4f7]";
                }

                return (
                  <div key={act.id} className="relative flex items-start gap-3.5">
                    {/* Activity Icon Circle */}
                    <div
                      className={`absolute -left-6 w-7 h-7 rounded-full border ${iconBg} flex items-center justify-center shrink-0 bg-white`}
                    >
                      {icon}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-xs text-[#182922] leading-tight">
                          {act.title}
                        </div>
                        <div className="text-[10px] text-[#8a9992] shrink-0 font-medium">
                          {formatTime(act.createdAt)}
                        </div>
                      </div>
                      <p className="text-xs text-[#708078] mt-1 line-clamp-1 leading-relaxed">
                        {act.description || `Engagement with ${act.customer.companyName}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}