// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { jsonOk, jsonError } from '@/server/http/response';
import { TenantRequiredError } from '@/server/http/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = body?.tenantId as string | undefined;
    if (!tenantId) throw new TenantRequiredError();
    const secure = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ ok: true, tenantId });
    res.cookies.set('tenantId', tenantId, { path: '/', httpOnly: true, sameSite: 'lax', secure });
    return res;
  } catch (err: any) {
    return jsonError({ code: 'TENANT_SWITCH_FAILED', message: err?.message ?? 'Failed' }, { status: 400 });
  }
}
