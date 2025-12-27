# Phase 8 — Repository Inspection & UI Scaffold Report

## Stack & Tooling
- Node: v22.9.0
- Next.js: 14.2.5 (App Router)
- Prisma: 5.22.0 client (schema in `prisma/schema.prisma`)
- TypeScript: 5.4.5 (tsconfig paths `@/*`)
- tsx: 4.19.x for scripts
- Auth: NextAuth credentials (see `src/lib/auth.ts`)
- Queue/worker: Graphile Worker stub + custom DB worker (Jobs table)

## Structure Highlights
- App routes: `src/app/(dashboard)/*`, `src/app/api/*` (REST-style), auth route under `src/app/api/auth/[...nextauth]`.
- Server libs: `src/server/db` (Prisma with tenant guard), `src/server/tenant/*`, `src/server/repos/*`, `src/server/services/*`, `src/server/validators/*`, `src/server/rbac`.
- UI components: `src/ui/*` (Sidebar, Topbar, TenantSwitcher), shared `src/components/DataTable.tsx` placeholder.
- Worker: `src/worker/*`, enqueue helper `scripts/enqueue_sync_connection.ts`.
- Scripts: rich DB/migration health + smoke suites (`package.json` scripts).

## API Routes (current snapshot)
- Products: `/api/products`, `/api/products/[id]`
- Integrations: `/api/integrations/connections`, `/api/integrations/connections/[id]`, `/api/integrations/mappings/*`
- Jobs: `/api/jobs`
- Tickets: `/api/tickets`, `/api/tickets/[id]`
- v1: shipments, returns, invoices, mailboxes (legacy paths)
- Other: auth, customers, connectors, plugins install, health, tenant switch, billing checkout.

## UI / Dashboard State
- Dashboard layout with Sidebar/Topbar/TenantSwitcher.
- Pages present: overview (dashboard), products, integrations, jobs, tickets, marketplace, ai-studio; Phase 8 adds placeholders for catalog, inventory, orders, fulfillment, returns, customers, invoices, email, settings landing.
- No deep data binding yet for new placeholders; existing products page fetches tenant-scoped API.

## Auth & Tenancy
- NextAuth credential flow; session includes tenantId/slug via memberships lookup.
- Tenant guard on Prisma + withContext ALS; API buildContext resolves tenant from header/cookie.
- RBAC helper (`can`) with OWNER/ADMIN/MEMBER semantics.

## Gaps / Next Steps for Enterprise Dashboard
- Wire new placeholder pages to real services/APIs; add filters/search/pagination.
- Improve tenant switcher UX and enforce tenantId header on client fetcher.
- Add reusable layout primitives (cards, form components) and real DataTable with sorting/filtering.
- Consolidate legacy/v1 routes into tenant-scoped API namespace.
- Add loading/error states and route guards per role; integrate audit/event timelines on detail pages.
