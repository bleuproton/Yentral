// @ts-nocheck
import { RequestContext } from '@/server/tenant/context';
import { can } from '@/server/rbac/rbac';
import { HttpError, unauthorized, forbidden } from '@/lib/httpErrors';

export function jsonOk(data: any, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), { status, headers: { 'content-type': 'application/json' } });
}

export function jsonError(err: any): Response {
  if (err instanceof HttpError) {
    return new Response(JSON.stringify({ ok: false, error: { code: err.code, message: err.message, details: err.details } }), {
      status: err.status,
      headers: { 'content-type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ ok: false, error: { code: 'INTERNAL_ERROR', message: err?.message ?? 'Internal error' } }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  });
}

export async function parseJson<T = any>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch (err: any) {
    throw new HttpError(400, 'BAD_JSON', 'Invalid JSON body');
  }
}

export function requireWriteAccess(ctx: RequestContext, action: any) {
  if (!ctx.userId) throw unauthorized('User required for write');
  if (!can(ctx.role, action)) throw forbidden('Insufficient role');
}
