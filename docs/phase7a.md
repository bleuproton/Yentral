# Phase 7A — Tenant Boundary & Guards

## Tenant resolution
- API expects `x-tenant-id` header (preferred).  
- Fallback: `x-tenant-slug` header (resolved to tenantId via DB with simple in-memory cache).
- `x-request-id` is generated if missing.

## Actor resolution
- Uses NextAuth `getServerSession` when available; `actorUserId` is session.user.id (or null if not signed in).

## Authorization
- If `actorUserId` is present, membership is required (`Membership` by `userId + tenantId`); otherwise 403.

## Guards & helpers
- `src/server/context/requestContext.ts`: builds RequestContext from headers, resolves tenant via slug if needed.
- `src/server/auth/requireMembership.ts`: membership/role enforcement.
- `src/server/http/errors.ts` + `response.ts`: consistent { ok: true/false } API responses.
- `src/server/http/withApi.ts`: wraps route handlers with context + error handling.
- `src/server/audit/auditService.ts`: writes `AuditEvent` (best-effort).
- `src/server/validation/zod.ts`: parseJson/parseQuery helpers (throw BadRequestError on validation failures).

## Usage in routes
- Wrap handlers with `withApi`.
- Always rely on resolved `tenantId` (never trust body/query for tenant).
- Any tenant-scoped query must include `tenantId` in WHERE.

## Required headers
- `x-tenant-id: <uuid>` (recommended)
- Optionally `x-tenant-slug: <slug>` (will be resolved to tenantId)
- Optional `x-request-id` (generated if absent)
