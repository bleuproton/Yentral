"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "./utils";

export type StatCard = {
  label: string;
  value: string;
  delta: string;
  trend?: "up" | "down";
  helper?: string;
  detail?: string;
};

const defaultStats: StatCard[] = [
  { label: "Total Revenue", value: "$1,250.00", delta: "+12.5%", trend: "up", helper: "Trending up this month", detail: "Visitors for the last 6 months" },
  { label: "New Customers", value: "1,234", delta: "-20%", trend: "down", helper: "Down 20% this period", detail: "Acquisition needs attention" },
  { label: "Active Accounts", value: "45,678", delta: "+12.5%", trend: "up", helper: "Strong user retention", detail: "Engagement exceed targets" },
  { label: "Growth Rate", value: "4.5%", delta: "+4.5%", trend: "up", helper: "Steady performance increase", detail: "Meets growth projections" },
];

export function StatCards({ stats = defaultStats }: { stats?: StatCard[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, idx) => (
        <div 
          key={stat.label} 
          className="group relative rounded-xl border border-[#1f1f1f] bg-gradient-to-br from-[#141414] to-[#0a0a0a] text-gray-100 shadow-sm p-5 space-y-3 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Background gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-cyan-600/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">{stat.label}</div>
            <DeltaBadge trend={stat.trend} delta={stat.delta} />
          </div>
          <div className="relative z-10 text-4xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-cyan-200 transition-all">
            {stat.value}
          </div>
          {stat.helper ? <div className="relative z-10 text-sm font-semibold text-gray-300 group-hover:text-gray-200 transition-colors">{stat.helper}</div> : null}
          {stat.detail ? <div className="relative z-10 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{stat.detail}</div> : null}
        </div>
      ))}
    </div>
  );
}

function DeltaBadge({ trend, delta }: { trend?: "up" | "down"; delta: string }) {
  const Icon = trend === "down" ? ArrowDownRight : ArrowUpRight;
  const tone =
    trend === "down"
      ? "text-red-400 bg-red-950/40 border-red-900"
      : "text-emerald-300 bg-emerald-950/40 border-emerald-900";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border font-semibold transition-all", tone)}>
      <Icon className="h-3 w-3" />
      {delta}
    </span>
  );
}
