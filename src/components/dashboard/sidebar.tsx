"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, NavItem } from "./nav-config";
import { cn } from "./utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-full w-64 border-r border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="text-sm text-slate-500 mb-1">Tenant</div>
        <div className="h-9 rounded-md border border-slate-200 px-3 flex items-center text-sm bg-slate-50 text-slate-700">
          Select tenant
        </div>
      </div>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <nav className="py-3">
          {mainNav.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm transition-colors",
        active ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900"
      )}
    >
      <Icon size={16} />
      <span>{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}
