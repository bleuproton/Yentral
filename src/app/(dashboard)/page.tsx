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
    <div className="space-y-6">
      <StatCards stats={statCards} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-900">Recent activity</div>
            <div className="text-xs text-slate-500">Last 24h</div>
          </div>
          <div className="space-y-3">
            {activities.map((item) => (
              <div key={item.title} className="flex flex-col">
                <div className="text-sm font-medium text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.meta}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm p-4 space-y-3">
          <div className="text-sm font-semibold text-slate-900">Quick actions</div>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((qa) => (
              <Link
                key={qa.label}
                href={qa.href}
                className="w-full inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 transition"
              >
                {qa.label}
              </Link>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Integrations: {counts.integrations} · Pending jobs: {counts.jobs} · Open tickets: {counts.tickets}
          </div>
        </div>
      </div>
    </div>
  );
}
