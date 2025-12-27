// @ts-nocheck
import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/server/http/response';
import { getServerAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return jsonError({ code: 'AUTH_REQUIRED', message: 'Not signed in' }, { status: 401 });
  }
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { tenant: true },
  });
  return jsonOk(memberships);
}
