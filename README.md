# Deployment Guide

Backend-first Next.js (App Router) scaffold with Prisma + PostgreSQL, Auth.js (NextAuth) credentials provider, multi-tenant RBAC, and Stripe billing API.

## Prerequisites
- Node.js 20 LTS + pnpm v10+
- PostgreSQL 14+
- Docker (for local Postgres/Redis), Redis (queues later), `psql` or GUI client

## Configuration
- Copy `.env.example` to `.env` and set:
  - `APP_ENV`, `PORT`
  - `DATABASE_URL`
  - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` (for webhook validation)
  - Support ingest: `IMAP_*` (host/port/user/pass/tls) and `SMTP_*` (`SMTP_FROM`)
- Keep secrets in a secret manager; never commit real values.

## Quickstart
```bash
pnpm install           # install deps (pnpm v10+)
pnpm prisma:generate   # generate Prisma client
pnpm dev               # http://localhost:3000
```

Prisma migrations (require DATABASE_URL):
```bash
pnpm prisma:migrate    # dev migration
pnpm prisma:deploy     # apply committed migrations (CI/prod)
pnpm db:seed           # seed demo data (tenant: demo, user: admin@yentral.test / changeme123)
```

Health: `curl http://localhost:3000/api/health`

## Build & Run
```bash
pnpm build
pnpm start
```

Container template:
```bash
docker build -t <registry>/<app>:<tag> .
docker run -p 3000:3000 --env-file .env <registry>/<app>:<tag>
```

## Jobs (pg-boss)
- Worker (dev): `pnpm boss:worker` (loads `.env`, starts pg-boss worker with queues `sync.job`, `email.ingest`, `sla.monitor`).
- Job monitoring table: `JobRun` captures status/attempts for each run; `Job` table records job payloads/results.
- Job processors live in `src/jobs/processors.ts`.

## Auth & Multi-tenancy
- Auth: Auth.js (NextAuth) Credentials provider + Prisma adapter.
- Login: `POST /api/auth/callback/credentials` with form fields `email`, `password`, `tenant` (tenant slug).
- Session contains `tenantId`, `tenantSlug`, `role` (`OWNER | ADMIN | MEMBER`).
- Tenant resolution helpers read `x-tenant-id` header or `?tenant=` param for API calls.
- RBAC ladder defined in `src/lib/rbac.ts` (OWNER ≥ ADMIN ≥ MEMBER).

## APIs (initial)
- `GET /api/health` — liveness probe.
- `GET /api/me` — session info + memberships (requires authenticated session).
- `POST /api/billing/create-checkout-session` — creates Stripe Checkout session for subscription (OWNER/ADMIN only). Uses `STRIPE_PRICE_ID`, reuses/creates Stripe customer per tenant, attaches tenant metadata.
- `POST /api/plugins/install` — marketplace install flow (OWNER/ADMIN). Body: `{ pluginKey, version?, config? }`. Uses registry definitions (`src/plugins/registry.ts`) and upserts `PluginInstallation` for the active tenant.
- Products: `GET /api/products`, `POST /api/products`, `GET/PUT/DELETE /api/products/[id]`.
- Integrations: `GET /api/connectors`, `GET /api/connections`, `POST /api/connections`, `PUT /api/connections/[id]`, `POST /api/connections/[id]/test`.
- Jobs: `GET /api/jobs`, `GET /api/jobs/[id]`, `POST /api/jobs/[id]/retry`, `POST /api/jobs/[id]/cancel`.
- Support: `GET /api/tickets`, `POST /api/tickets`, `GET /api/tickets/[id]`, `POST /api/tickets/[id]/reply`, `POST /api/tickets/[id]/assign`.
- Fulfillment: `GET/POST /api/v1/shipments`, `POST /api/v1/shipments/[id]/confirm`, `GET/POST /api/v1/returns`, `POST /api/v1/returns/[id]/receive`.

## State Check
Run these to validate the setup:
```bash
pnpm db:validate
pnpm db:status
pnpm db:generate
pnpm state:check
pnpm db:check        # migration sanity (validate/status/diff + DB checks)
```
- Tickets UI: `/tickets` (requires authenticated session; lists recent tickets with SLA info).

## Smoke Tests
- Inventory & variants: `npx tsx scripts/smoke_phase2.ts`
- Channel mappings: `npx tsx scripts/smoke-phase3.ts`
- Combined Phase2/3: `npm run smoke:phase2-3`
- Fulfillment Phase4: `npm run smoke:phase4`

## Git Hooks (optional)
- Pre-push: run `pnpm db:check` to ensure migrations and schema are in sync.

## Migrations & Shadow DB
- `DATABASE_URL` points to your main database.
- `SHADOW_DATABASE_URL` is required for drift checks; create a separate empty database (e.g. `yentral_shadow`) and set the URL.
- Example:
  ```
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral?schema=public
  SHADOW_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/yentral_shadow?schema=public
  ```
- Common commands:
  ```bash
  npm run db:validate       # prisma validate
  npm run db:status         # prisma migrate status
  npm run db:verify         # verify applied migrations in DB vs local folders
  npm run db:check          # migrations + drift checks
  npm run db:check:migrations # check _prisma_migrations for unfinished/rolled-back
  npm run db:check:tenant   # tenantId + tenant uniques on core tables
  npm run db:check-all      # validate + status + migrations + tenant checks
  npm run db:migrate:dev    # apply migrations in dev
  npm run db:migrate:deploy # apply migrations in deploy/CI
  ```

## Deployment Checklist
1) Set env vars on the platform.
2) Run `pnpm install` and `pnpm prisma:deploy` during build/deploy.
3) Build/start (`pnpm build && pnpm start` or container image).
4) Smoke-test `/api/health`, `/api/me`, and a billing checkout session.

## Notes
- Stripe webhook handler not yet added; subscriptions should be verified manually until then.
- Upgrade Next.js to the latest patched release before production (current scaffold uses 14.2.5; see security advisories).
- All repository changes are logged in `changes.md`.
