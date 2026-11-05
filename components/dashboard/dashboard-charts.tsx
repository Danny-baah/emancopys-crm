"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChevronDown } from "lucide-react";

interface DashboardChartsProps {
  activeCount: number;
  archivedCount: number;
}

export function ClientGrowthChart() {
  const growthData = [
    { month: "Jan", clients: 10 },
    { month: "Feb", clients: 12 },
    { month: "Mar", clients: 16 },
    { month: "Apr", clients: 19 },
    { month: "May", clients: 24 },
  ];

  return (
    <div className="bg-white rounded-[26px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#13231c]">
            Client Growth
          </h3>
          <p className="text-xs text-[#708078] mt-0.5">
            Total active clients over time.
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e1e6e3] text-xs font-medium text-[#182922] bg-white hover:border-[#cbd5d0] transition-colors cursor-pointer"
        >
          <span>This Year</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#708078]" />
        </button>
      </div>

      {/* Area Chart Container */}
      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={growthData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#083d34" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#083d34" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8a9992", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8a9992", fontSize: 11 }}
              ticks={[0, 5, 10, 15, 20, 25, 30]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#083d34] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-md">
                      {payload[0].value} Clients
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="clients"
              stroke="#083d34"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#growthGrad)"
              activeDot={{ r: 6, fill: "#083d34", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ClientOverviewChart({
  activeCount,
  archivedCount,
}: DashboardChartsProps) {
  const total = activeCount + archivedCount;
  const newThisMonth = Math.min(4, activeCount);

  const pieData = [
    { name: "Active", value: activeCount || 24, color: "#083d34" },
    { name: "Archived", value: archivedCount || 6, color: "#df8d93" },
    { name: "New (This Month)", value: newThisMonth || 4, color: "#48b387" },
  ];

  return (
    <div className="bg-white rounded-[26px] p-6 lg:p-7 border border-[#e8ecea] shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Chart Header */}
      <div className="mb-4">
        <h3 className="font-serif text-lg font-semibold text-[#13231c]">
          Client Overview
        </h3>
      </div>

      {/* Donut Chart & Legend Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
        {/* Donut Chart with Centered Total */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-serif text-3xl font-semibold text-[#13231c] leading-none">
              {total || 24}
            </span>
            <span className="text-xs text-[#708078] mt-1 font-medium">
              Clients
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-3.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#083d34] shrink-0" />
              <span className="text-[#3c4c45] font-medium">Active</span>
            </div>
            <span className="font-semibold text-[#13231c]">{activeCount || 24}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#df8d93] shrink-0" />
              <span className="text-[#3c4c45] font-medium">Archived</span>
            </div>
            <span className="font-semibold text-[#13231c]">{archivedCount || 6}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#48b387] shrink-0" />
              <span className="text-[#3c4c45] font-medium">New (This Month)</span>
            </div>
            <span className="font-semibold text-[#13231c]">{newThisMonth || 4}</span>
          </div>
        </div>
      </div>
    </div>
  );
}