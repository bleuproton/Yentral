// @ts-nocheck
import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/server/http/response';
import { TenantRequiredError } from '@/server/http/errors';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = body?.tenantId as string | undefined;
    if (!tenantId) throw new TenantRequiredError();
    cookies().set('tenantId', tenantId, { path: '/', httpOnly: false });
    return jsonOk({ tenantId });
  } catch (err: any) {
    return jsonError({ code: 'TENANT_SWITCH_FAILED', message: err?.message ?? 'Failed' }, { status: 400 });
  }
}
