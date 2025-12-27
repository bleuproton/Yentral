import { withApi } from '@/server/http/withApi';
import { TicketService } from '@/server/services/ticketService';
import { tenantDb } from '@/server/db/tenantDb';
import { jsonOk, created } from '@/server/http/response';
import { parseJson } from '@/server/validation/zod';
import { TicketCreateSchema } from '@/server/schemas/ticket';

export const GET = withApi(async (ctx) => {
  const service = new TicketService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const tickets = await service.list({});
  return jsonOk(tickets);
});

export const POST = withApi(async (ctx) => {
  const body = await parseJson(ctx.req, TicketCreateSchema);
  const service = new TicketService(tenantDb(ctx.tenantId), ctx.tenantId, ctx.actorUserId || '');
  const ticket = await service.create(body);
  return created(ticket);
});
