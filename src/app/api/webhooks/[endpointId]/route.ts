// @ts-nocheck
import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';
import { FlowRunService } from '@/server/services/flowRunService';
import { withContext } from '@/server/tenant/als';

export async function POST(req: NextRequest, { params }: { params: { endpointId: string } }) {
  try {
    const endpointRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT "tenantId","flowId" FROM "WebhookEndpoint" WHERE id = $1 LIMIT 1`,
      params.endpointId
    );
    const endpoint = endpointRows[0];
    if (!endpoint) throw new Error('Endpoint not found');
    const body = await req.json().catch(() => ({}));
    const ctx = { tenantId: endpoint.tenantId };
    const service = new FlowRunService();
    const run = await withContext(ctx, () => service.startRun(ctx as any, endpoint.flowId, body));
    return jsonOk(run, 202);
  } catch (err) {
    return jsonError(err);
  }
}
