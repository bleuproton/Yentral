"use client";

import { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { cn } from "./utils";

type HeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function DashboardHeader({ title, description, actions, className }: HeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-white shadow-sm">
          <Search className="h-4 w-4" />
          <input
            className="bg-transparent outline-none placeholder:text-slate-400 text-sm w-40"
            placeholder="Search"
            aria-label="Search"
          />
        </div>
        {actions}
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">
          <Bell className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    </div>
  );
}
