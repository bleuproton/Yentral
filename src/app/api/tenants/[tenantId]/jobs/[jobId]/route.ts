// @ts-nocheck
import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { JobService } from '@/server/services/jobService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string; jobId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new JobService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const job = await service.get(params.jobId);
    return jsonOk(job);
  });
}
