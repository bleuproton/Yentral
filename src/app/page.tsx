export default function Home() {
  return (
    <main style={{ padding: "3rem", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1>Yentral Platform</h1>
      <p>Backend-first Next.js scaffold with multi-tenant Auth.js, Prisma, RBAC, and Stripe billing.</p>
      <ul>
        <li>API health: <code>/api/health</code></li>
        <li>Auth: <code>/api/auth/[...nextauth]</code></li>
        <li>Billing: <code>/api/billing/create-checkout-session</code></li>
      </ul>
    </main>
  );
}
