# Architecture Overview

## Scope
Multi-tenant commerce platform with modular capabilities (catalog, orders, payments, customers, pricing). Backend-first, async-ready, plugin-friendly to enable domain extensions and tenant-specific behavior.

## Principles
- Backend-first: API contracts and domain logic lead, UI follows.
- Async-first: prefer queues/events for long-running flows; plan for outbox/retries.
- Plugin-based: modular route handlers and shared libraries that domain packages can extend without forking core.
- Tenant safety: strict tenant scoping at every boundary (session, data access, events).
- Observability: structured logs, metrics, health/readiness endpoints, 12-factor config.

## Stack
- Runtime: Node.js 20 LTS + TypeScript.
- Framework: Next.js (App Router) as API/backend host.
- Data: PostgreSQL (shared DB, tenant-scoped tables).
- ORM: Prisma.
- Authn/z: Auth.js (NextAuth) credentials flow + Prisma adapter; RBAC (OWNER ≥ ADMIN ≥ MEMBER).
- Queue/bus: Redis + BullMQ planned for async jobs (not scaffolded yet).
- Package manager: pnpm.

## Tenancy Model
- Shared Postgres with `tenantId` on tables; Prisma helpers enforce scoping.
- Tenant resolution: credentials login requires tenant slug; API helpers also read `x-tenant-id` header or `tenant` query param.
- Events: include tenant metadata; consumers discard mismatches (future when queues land).

## Module Layout
- `src/app/api/*`: API route handlers per domain (auth, billing, health, user/tenant ops).
- `src/lib/*`: shared building blocks (Prisma client, env validation, RBAC, tenant helpers, Stripe client, auth config).
- `prisma/*`: schema and migrations.
- Future: `packages/workers` for queues sharing `src/lib` code.

## Async & Reliability (future work)
- Outbox pattern for reliable event publishing.
- Idempotent jobs and API idempotency keys on writes.
- Metrics and tracing for queue + API.

## Near-Term Steps
1) Scaffold Next.js API backend with health route. ✅
2) Add Prisma schema, tenant resolution helpers, Auth.js credentials flow, RBAC utilities. ✅
3) Add Stripe checkout integration and document setup. ✅
4) Next: add migrations, seed data, domain modules (catalog/orders), background worker for outbox + billing webhooks, structured logging/metrics.
