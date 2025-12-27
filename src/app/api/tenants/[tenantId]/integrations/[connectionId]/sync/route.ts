import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { JobService } from '@/server/services/jobService';
import { parseJson } from '@/server/http/validators';
import { JobTypes } from '@/worker/types';

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string; connectionId: string } }
) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const mode = body?.mode ?? 'connection';
    const type =
      mode === 'catalog'
        ? JobTypes.SYNC_CATALOG
        : mode === 'orders'
        ? JobTypes.SYNC_ORDERS
        : JobTypes.SYNC_CONNECTION;
    const jobService = new JobService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const job = await jobService.enqueue({
      type,
      payload: { connectionId: params.connectionId },
      dedupeKey: `sync:${mode}:${params.connectionId}`,
    });
    return jsonOk(job);
  });
}
