import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { TicketService } from '@/server/services/ticketService';
import { TicketCreateSchema } from '@/server/validators/ticket';

export async function GET(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    const status = req.nextUrl.searchParams.get('status') || undefined;
    const service = new TicketService();
    const tickets = await service.listTickets(ctx, { status });
    return jsonOk(tickets);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await buildContext(req);
    if (!ctx.userId) {
      return jsonError(new Error('User required to create ticket'));
    }
    const body = TicketCreateSchema.parse(await parseJson(req));
    const service = new TicketService();
    const ticket = await service.createTicketAndLinkThread(ctx, { ...body, authorId: ctx.userId });
    return jsonOk(ticket, 201);
  } catch (err) {
    return jsonError(err);
  }
}
