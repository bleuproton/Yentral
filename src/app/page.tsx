import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";

export default async function Home() {
  const session = await getServerAuthSession().catch(() => null);
  if (session?.user?.id) {
    // Authenticated: show landing with CTA to dashboard
    return (
      <Landing
        primaryHref="/dashboard"
        primaryLabel="Go to Dashboard"
        secondaryHref="/api/health"
        secondaryLabel="API Health"
      />
    );
  }
  // Anonymous: still show landing but keep login path discoverable
  return (
    <Landing
      primaryHref="/login"
      primaryLabel="Login to Dashboard"
      secondaryHref="/api/health"
      secondaryLabel="API Health"
    />
  );
}

function Landing({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  const cards = [
    { title: "Multi-tenant", desc: "Isolated tenants with scoped RBAC and audit-ready logging." },
    { title: "RBAC", desc: "Owner/Admin/Member/Accountant roles with fine-grained controls." },
    { title: "Integrations", desc: "Channel + connector architecture for Amazon, bol, Shopify, more." },
    { title: "Accounting", desc: "Invoices, exports, OSS/VAT-ready with ReportExport jobs." },
    { title: "Automations", desc: "Flow builder + jobs to orchestrate sync, mail, and support." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="max-w-5xl mx-auto px-6 py-14 flex flex-col gap-6">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit">
          Enterprise SaaS Commerce Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-slate-900">
          Run your multi-tenant commerce, integrations, and finance in one console.
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl">
          Yentral brings products, inventory, orders, billing, support, and automations together with strong tenant
          isolation and RBAC out of the box.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-100 transition"
          >
            {secondaryLabel}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-800 hover:bg-slate-100 transition"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-lg border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-semibold text-slate-900">{card.title}</div>
            <div className="text-sm text-slate-600 mt-2">{card.desc}</div>
          </div>
        ))}
      </main>
    </div>
  );
}
