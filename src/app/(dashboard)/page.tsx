import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { StatCards } from "@/components/dashboard/stat-cards";

async function getCounts(tenantId: string) {
  const [integrations, jobs, tickets] = await Promise.all([
    prisma.integrationConnection.count({ where: { tenantId } }),
    prisma.job.count({ where: { tenantId, status: "PENDING" } }),
    prisma.ticket.count({ where: { tenantId, status: "OPEN" } }),
  ]);
  return { integrations, jobs, tickets, lowStock: 0 };
}

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) redirect("/login");
  const tenantId = cookies().get("tenantId")?.value;
  if (!tenantId) redirect("/select-tenant");
  const counts = await getCounts(tenantId);

  const statCards = [
    { label: "Revenue", value: "$120k", delta: "+12%", trend: "up" as const, helper: "vs last month" },
    { label: "New customers", value: "240", delta: "+8%", trend: "up" as const, helper: "30d" },
    { label: "Active accounts", value: "840", delta: "-1%", trend: "down" as const, helper: "7d active" },
    { label: "Growth rate", value: "18%", delta: "+2%", trend: "up" as const, helper: "QoQ" },
  ];

  const quickActions = [
    { label: "Create Quote", href: "/dashboard/orders" },
    { label: "Create Invoice", href: "/dashboard/invoices" },
    { label: "New Flow", href: "/dashboard/automations" },
    { label: "New Ticket", href: "/dashboard/support" },
  ];

  const activities = [
    { title: "Integration sync completed", meta: "Amazon SP-API · 2h ago" },
    { title: "Invoice INV-1024 issued", meta: "Customer: Demo Corp · 4h ago" },
    { title: "Ticket #321 replied", meta: "Support · 6h ago" },
    { title: "Stock adjusted", meta: "NL_INTERNAL · 1d ago" },
  ];

  return (
    <div className="space-y-6 text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-gray-400">Overview of your key metrics</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#161616] px-4 py-2 text-sm font-medium hover:bg-[#1f1f1f]"
        >
          + Quick Create
        </Link>
      </div>

      <StatCards stats={statCards} />

      <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Total Visitors</div>
            <div className="text-sm text-gray-400">Total for the last 3 months</div>
          </div>
          <div className="flex gap-2 text-sm">
            <button className="px-3 py-1 rounded-md border border-[#1f1f1f] bg-[#1a1a1a] hover:bg-[#222]">Last 3 months</button>
            <button className="px-3 py-1 rounded-md border border-[#1f1f1f] bg-[#111] hover:bg-[#1f1f1f]">Last 30 days</button>
            <button className="px-3 py-1 rounded-md border border-[#1f1f1f] bg-[#111] hover:bg-[#1f1f1f]">Last 7 days</button>
          </div>
        </div>
        <div className="h-64 rounded-lg border border-[#1f1f1f] bg-gradient-to-b from-[#1c1c1c] to-[#0f0f0f] flex items-center justify-center text-gray-500 text-sm">
          Placeholder chart
        </div>
      </div>

      <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Recent activity</div>
          <div className="text-xs text-gray-400">Last 24h</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((item) => (
            <div key={item.title} className="rounded-lg border border-[#1f1f1f] bg-[#161616] p-3 space-y-1">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-gray-400">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-[#1f1f1f] bg-[#111] p-4 space-y-3">
          <div className="text-sm font-semibold">Quick actions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickActions.map((qa) => (
              <Link
                key={qa.label}
                href={qa.href}
                className="w-full inline-flex items-center justify-center rounded-md border border-[#1f1f1f] bg-[#161616] px-3 py-2 text-sm font-medium hover:bg-[#1f1f1f] transition"
              >
                {qa.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-4 text-sm text-gray-400 space-y-2">
          <div className="text-base font-semibold text-gray-100">At a glance</div>
          <div>Integrations: {counts.integrations}</div>
          <div>Pending jobs: {counts.jobs}</div>
          <div>Open tickets: {counts.tickets}</div>
        </div>
      </div>
    </div>
  );
}
