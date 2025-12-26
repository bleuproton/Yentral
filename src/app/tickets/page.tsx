import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Tickets</h1>
        <p>Please sign in to view tickets.</p>
      </main>
    );
  }

  const tickets = await prisma.ticket.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", color: "#e2e8f0" }}>
      <h1>Tickets</h1>
      <p>Tenant: {session.tenantSlug}</p>
      <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        {tickets.map((t) => (
          <div
            key={t.id}
            style={{
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "1rem",
              background: "#0f172a"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{t.title}</strong>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.id}</div>
              </div>
              <span style={{ fontSize: 12, padding: "2px 8px", border: "1px solid #475569", borderRadius: 12 }}>
                {t.status}
              </span>
            </div>
            <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{t.description}</p>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
              Priority: {t.priority} · Created: {t.createdAt.toISOString()}
              {t.slaDueAt ? ` · SLA due: ${t.slaDueAt.toISOString()}` : ""}
              {t.lastSlaNotifiedAt ? ` · Last SLA ping: ${t.lastSlaNotifiedAt.toISOString()}` : ""}
            </div>
          </div>
        ))}
        {tickets.length === 0 && <p>No tickets yet.</p>}
      </div>
    </main>
  );
}
