// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { JobService } from '@/server/services/jobService';
import { parseJson } from '@/server/http/validators';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const mode = body?.mode ?? 'connection';
    const type = mode === 'catalog' ? 'SYNC_CATALOG' : mode === 'orders' ? 'SYNC_ORDERS' : 'SYNC_CONNECTION';
    const jobService = new JobService();
    const job = await jobService.enqueue(ctx, {
      type,
      payload: { connectionId: params.connectionId },
      dedupeKey: `sync:${mode}:${params.connectionId}`,
    });
    return jsonOk(job);
  });
}
