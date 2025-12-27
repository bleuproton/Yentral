import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { TicketService } from '@/server/services/ticketService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const status = req.nextUrl.searchParams.get('status') || undefined;
    const service = new TicketService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const list = await service.list({ status });
    return jsonOk(list);
  });
}

export async function POST(req: NextRequest, { params }: { params: { tenantId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new TicketService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const ticket = await service.create(body);
    return created(ticket);
  });
}
