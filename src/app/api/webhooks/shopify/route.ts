// @ts-nocheck
import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const connectionId = payload?.connectionId || req.headers.get('x-connection-id');
    if (!connectionId) throw new Error('Missing connectionId');
    const connection = await prisma.integrationConnection.findUnique({ where: { id: String(connectionId) } });
    if (!connection) throw new Error('Connection not found');
    await prisma.job.create({
      data: {
        tenantId: connection.tenantId,
        type: 'integration.sync',
        payload: { connectionId: connection.id, scope: 'orders' },
        status: 'PENDING',
        maxAttempts: 5,
      },
    });
    return jsonOk({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
