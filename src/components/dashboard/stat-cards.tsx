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
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-[#1f1f1f] bg-[#121212] text-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-400">{stat.label}</div>
            <DeltaBadge trend={stat.trend} delta={stat.delta} />
          </div>
          <div className="text-3xl font-semibold">{stat.value}</div>
          {stat.helper ? <div className="text-sm font-semibold">{stat.helper}</div> : null}
          {stat.detail ? <div className="text-xs text-gray-400">{stat.detail}</div> : null}
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
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border", tone)}>
      <Icon className="h-3 w-3" />
      {delta}
    </span>
  );
}
