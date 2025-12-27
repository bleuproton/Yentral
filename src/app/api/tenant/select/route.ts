import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const TENANT_COOKIE = 'tenantId';

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession().catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : '';
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'tenantId required' }, { status: 400 });
    }
    const membership = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId: session.user.id, tenantId } },
    });
    if (!membership) {
      return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const secure = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ ok: true, tenantId });
    res.cookies.set(TENANT_COOKIE, tenantId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure,
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TENANT_COOKIE, '', { path: '/', maxAge: 0, sameSite: 'lax' });
  return res;
}
