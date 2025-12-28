"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, NavItem } from "./nav-config";
import { cn } from "./utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-[#1f1f1f] bg-[#111] text-gray-200">
      <div className="px-5 py-6 space-y-6">
        <div>
          <div className="text-xl font-semibold">Acme Inc.</div>
          <div className="text-xs text-gray-500">Documents</div>
        </div>
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-gray-500">Home</div>
          <nav className="space-y-1">
            {mainNav.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>
        </div>
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
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
