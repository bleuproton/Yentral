import { NextRequest } from 'next/server';
import { withApiContext } from '@/server/http/withApiContext';
import { jsonOk } from '@/server/http/response';
import { parseJson } from '@/server/http/validators';
import { TicketService } from '@/server/services/ticketService';

export async function GET(req: NextRequest, { params }: { params: { tenantId: string; ticketId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const service = new TicketService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const ticket = await service.get(params.ticketId);
    return jsonOk(ticket);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { tenantId: string; ticketId: string } }) {
  return withApiContext(req, params, async (ctx) => {
    const body = await parseJson(req);
    const service = new TicketService(ctx.db, ctx.tenantId, ctx.actorUserId);
    const ticket = await service.update(params.ticketId, body);
    return jsonOk(ticket);
  });
}
