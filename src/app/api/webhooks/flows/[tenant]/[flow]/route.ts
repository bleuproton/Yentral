// @ts-nocheck
import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/app/api/_utils';
import { prisma } from '@/server/db/prisma';

export async function POST(req: NextRequest, { params }: { params: { tenant: string; flow: string } }) {
  try {
    const payload = await req.json().catch(() => ({}));
    const run = await prisma.flowRun.create({
      data: {
        tenantId: params.tenant,
        flowId: params.flow,
        flowVersionId: params.flow, // placeholder relation
        status: 'PENDING',
        triggerType: 'webhook',
        triggerPayload: payload,
      },
    });
    return jsonOk(run, 202);
  } catch (err) {
    return jsonError(err);
  }
}
