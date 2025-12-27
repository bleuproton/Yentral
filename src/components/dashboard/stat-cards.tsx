"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "./utils";

export type StatCard = {
  label: string;
  value: string;
  delta: string;
  trend?: "up" | "down";
  helper?: string;
};

const defaultStats: StatCard[] = [
  { label: "Revenue", value: "$120k", delta: "+12%", trend: "up", helper: "vs last month" },
  { label: "Customers", value: "1,240", delta: "+3%", trend: "up", helper: "active accounts" },
  { label: "Active accounts", value: "840", delta: "-1%", trend: "down", helper: "30d active" },
  { label: "Growth", value: "18%", delta: "+2%", trend: "up", helper: "QoQ growth" },
];

export function StatCards({ stats = defaultStats }: { stats?: StatCard[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            <DeltaBadge trend={stat.trend} delta={stat.delta} />
          </div>
          <div className="text-2xl font-semibold mt-2">{stat.value}</div>
          {stat.helper ? <div className="text-xs text-slate-500 mt-1">{stat.helper}</div> : null}
        </div>
      ))}
    </div>
  );
}

function DeltaBadge({ trend, delta }: { trend?: "up" | "down"; delta: string }) {
  const Icon = trend === "down" ? ArrowDownRight : ArrowUpRight;
  const tone =
    trend === "down"
      ? "text-red-600 bg-red-50 border-red-100"
      : "text-emerald-600 bg-emerald-50 border-emerald-100";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border", tone)}>
      <Icon className="h-3 w-3" />
      {delta}
    </span>
  );
}
