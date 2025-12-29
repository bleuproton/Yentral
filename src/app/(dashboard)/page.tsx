import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { StatCards } from "@/components/dashboard/stat-cards";
import { Activity, Zap, Clock, AlertCircle, TrendingUp } from "lucide-react";

async function getCounts(tenantId: string) {
  const [integrations, jobs, tickets, orders, products] = await Promise.all([
    prisma.integrationConnection.count({ where: { tenantId } }),
    prisma.job.count({ where: { tenantId, status: "PENDING" } }),
    prisma.ticket.count({ where: { tenantId, status: "OPEN" } }),
    prisma.order?.count?.({ where: { tenantId } }).catch(() => 0) || Promise.resolve(0),
    prisma.product?.count?.({ where: { tenantId } }).catch(() => 0) || Promise.resolve(0),
  ]);
  return { integrations, jobs, tickets, orders: orders || 0, products: products || 0 };
}

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/login");
  const tenantId = cookies().get("tenantId")?.value;
  if (!tenantId) redirect("/select-tenant");
  const counts = await getCounts(tenantId);

  const statCards = [
    { label: "Active Integrations", value: counts.integrations.toString(), delta: "+2", trend: "up" as const, helper: "Connected systems" },
    { label: "Pending Jobs", value: counts.jobs.toString(), delta: counts.jobs > 10 ? "⚠️ High" : "✓ Normal", trend: counts.jobs > 10 ? "down" : "up" as const, helper: "In queue" },
    { label: "Open Tickets", value: counts.tickets.toString(), delta: counts.tickets > 5 ? "⚠️ Action needed" : "✓ Managed", trend: counts.tickets > 5 ? "down" : "up" as const, helper: "Support requests" },
    { label: "Total Orders", value: counts.orders.toString(), delta: "+5%", trend: "up" as const, helper: "This period" },
  ];

  const quickActions = [
    { label: "📋 New Order", href: "/dashboard/orders", icon: "📋" },
    { label: "💰 Create Invoice", href: "/dashboard/invoices", icon: "💰" },
    { label: "⚙️ New Automation", href: "/dashboard/automations", icon: "⚙️" },
    { label: "🎫 Support Ticket", href: "/dashboard/support", icon: "🎫" },
  ];

  const modules = [
    { label: "Products", href: "/dashboard/products", emoji: "🛍️" },
    { label: "Inventory", href: "/dashboard/inventory", emoji: "📦" },
    { label: "Orders", href: "/dashboard/orders", emoji: "🧾" },
    { label: "Fulfillment", href: "/dashboard/fulfillment", emoji: "🚚" },
    { label: "Customers", href: "/dashboard/customers", emoji: "👥" },
    { label: "Invoices", href: "/dashboard/invoices", emoji: "💳" },
    { label: "Integrations", href: "/dashboard/integrations", emoji: "🔌" },
    { label: "Support", href: "/dashboard/support", emoji: "🎧" },
    { label: "Accounting", href: "/dashboard/accountant", emoji: "📒" },
    { label: "Settings", href: "/dashboard/settings", emoji: "⚙️" },
  ];

  const activities = [
    { title: "Integration sync completed", meta: "Amazon SP-API · 2h ago", icon: Zap, status: "success" },
    { title: "Invoice INV-1024 issued", meta: "Customer: Demo Corp · 4h ago", icon: Activity, status: "success" },
    { title: "Ticket #321 replied", meta: "Support · 6h ago", icon: Clock, status: "pending" },
    { title: "Stock adjusted", meta: "NL_INTERNAL · 1d ago", icon: TrendingUp, status: "info" },
  ];

  return (
    <div className="space-y-6 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back! Here's your business overview</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-blue-500/50 transition-all duration-200 transform hover:scale-105"
        >
          ✨ Quick Create
        </Link>
      </div>

      {/* Stat Cards */}
      <StatCards stats={statCards} />

      {/* Main Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-xl border border-[#1f1f1f] bg-gradient-to-br from-[#141414] to-[#0a0a0a] p-6 space-y-5 hover:border-[#2a2a2a] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Recent Activity
              </h2>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {activities.map((item) => {
              const Icon = item.icon;
              const statusColors = {
                success: "bg-emerald-950/30 border-emerald-900/50",
                pending: "bg-yellow-950/30 border-yellow-900/50",
                info: "bg-blue-950/30 border-blue-900/50",
              };
              return (
                <div key={item.title} className={`rounded-lg border ${statusColors[item.status]} p-4 space-y-2 hover:border-current transition-all group cursor-pointer transform hover:scale-105`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-100 truncate">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.meta}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status Summary */}
        <div className="rounded-xl border border-[#1f1f1f] bg-gradient-to-br from-[#141414] to-[#0a0a0a] p-6 space-y-4 hover:border-[#2a2a2a] transition-all">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-cyan-400" />
            System Status
          </h3>
          <div className="space-y-4">
            <Link href="/dashboard/integrations" className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors group">
              <span className="text-sm font-medium">Integrations</span>
              <span className="text-lg font-bold text-blue-400 group-hover:text-blue-300">{counts.integrations}</span>
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors group">
              <span className="text-sm font-medium">Pending Jobs</span>
              <span className={`text-lg font-bold ${counts.jobs > 10 ? "text-red-400" : "text-emerald-400"} group-hover:text-opacity-80`}>{counts.jobs}</span>
            </Link>
            <Link href="/dashboard/support" className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors group">
              <span className="text-sm font-medium">Open Tickets</span>
              <span className={`text-lg font-bold ${counts.tickets > 5 ? "text-yellow-400" : "text-emerald-400"} group-hover:text-opacity-80`}>{counts.tickets}</span>
            </Link>
            <Link href="/dashboard/orders" className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a1a] hover:bg-[#222] transition-colors group">
              <span className="text-sm font-medium">Total Orders</span>
              <span className="text-lg font-bold text-purple-400 group-hover:text-purple-300">{counts.orders}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-[#1f1f1f] bg-gradient-to-br from-[#141414] to-[#0a0a0a] p-6 space-y-4 hover:border-[#2a2a2a] transition-all">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((qa) => (
            <Link
              key={qa.label}
              href={qa.href}
              className="group relative overflow-hidden rounded-lg border border-[#1f1f1f] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] px-4 py-4 text-center font-medium text-gray-200 hover:from-[#1f1f1f] hover:to-[#1a1a1a] transition-all duration-300 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-600/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-xl">{qa.icon}</span>
                <span className="text-sm">{qa.label.split(" ")[1]}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-cyan-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="rounded-xl border border-[#1f1f1f] bg-gradient-to-br from-[#141414] to-[#0a0a0a] p-6 space-y-4 hover:border-[#2a2a2a] transition-all">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Modules</h3>
          <div className="text-xs text-gray-500">Navigatie overzicht</div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {modules.map((mod) => (
            <Link
              key={mod.label}
              href={mod.href}
              className="group relative overflow-hidden rounded-lg border border-[#1f1f1f] bg-[#111] px-4 py-4 text-center text-sm font-semibold text-gray-200 hover:border-blue-600/50 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200"
            >
              <div className="text-2xl mb-2">{mod.emoji}</div>
              <div className="group-hover:text-white transition-colors">{mod.label}</div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-cyan-600/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
