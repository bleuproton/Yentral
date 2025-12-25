# Architecture Overview

## Scope
Multi-tenant commerce platform with modular capabilities (catalog, orders, payments, customers, pricing). Backend-first, async-first, plugin-based to allow domain extensions and tenant-specific behaviors.

## Principles
- Backend-first: API-first domain modules with explicit contracts before UI.
- Async-first: prefer event-driven workflows and queues for long-running work; outbox pattern for reliability.
- Plugin-based: composable Fastify plugins plus domain-packaged extensions to add routes, handlers, and hooks without forking core.
- Tenant safety: strict tenant scoping at every boundary (request context, data access, events).
- Observability and ops: metrics, structured logs, health checks; 12-factor config.

## Stack Choices
- Runtime: Node.js 20 LTS with TypeScript.
- Web framework: Fastify for high throughput and plugin ecosystem.
- Data: PostgreSQL (single database, tenant_id column scoping to start).
- ORM: Prisma (typed data access; supports row-level scoping and migrations).
- Queue/bus: Redis + BullMQ for async jobs (later Kafka/CloudPubSub if needed).
- Authn/z: JWT/OIDC gateway in front (future); request contains tenant and subject claims.
- Testing: Vitest for unit/integration; Supertest/LightMyRequest for HTTP.
- Packaging: pnpm for workspaces when we add plugins/packages.

## Tenancy Model
- Initial model: single shared Postgres database; all domain tables include `tenant_id`. Access layer enforces tenant filter by default and prohibits cross-tenant queries.
- Option for future isolation: per-tenant schemas or databases behind the same interface; abstraction via a tenant-aware data provider.
- Tenant resolution: middleware extracts tenant from signed auth token header (`x-tenant-id` fallback for admin use), validates against cache/DB, injects into request context.
- Event scoping: emitted events include `tenant_id`; consumers discard mismatched events.

## Async and Reliability
- Command + event separation: synchronous commands for immediate effects; events emitted to queue for downstream reactions.
- Outbox pattern: domain changes write to `outbox` table within same transaction; background worker publishes to BullMQ.
- Idempotency: idempotency keys on write APIs; job handlers idempotent based on keys or natural identifiers.

## Plugin System
- Fastify plugin tree: core server loads platform plugins (logging, metrics, security), then domain plugins (catalog, orders, payments), then optional tenant plugins.
- Domain plugins expose registrations: routes, lifecycle hooks, jobs, schema additions.
- Plugin boundaries: domain packages depend on shared platform libraries (context, database client, event emitter) but not vice versa.

## Service Layout (planned)
- `packages/platform`: server bootstrap, config, logging, metrics, plugin loader.
- `packages/domain-*`: catalog, pricing, orders, etc., each as Fastify plugins + job handlers.
- `packages/workers`: queue processors sharing domain logic.
- `packages/shared`: types, context builder, error helpers, telemetry utilities.

## Operations
- Configuration via environment variables; `.env.example` to be provided.
- Health endpoints: `/healthz` (liveness), `/readyz` (readiness).
- Metrics: Prometheus format via plugin (to add later).
- Structured logging (pino) with tenant and request correlation ids.

## Near-Term Steps
1) Scaffold Fastify + TypeScript project with pnpm, baseline scripts, lint/test, health routes.
2) Add request context + tenant resolution middleware and shared Prisma client with tenant scoping helpers.
3) Introduce queue worker package and outbox publisher skeleton.
