import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { JobService } from '@/server/services/jobService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const status = req.nextUrl.searchParams.get('status') || undefined;
    const service = new JobService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const list = await service.list({ status });
    return jsonOk(list);
  });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new JobService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const job = await service.enqueue(body);
    return created(job);
  });
}
