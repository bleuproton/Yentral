import { NextRequest } from 'next/server';
import { buildContext } from '@/server/tenant/buildContext';
import { jsonOk, jsonError, parseJson, requireWriteAccess } from '@/app/api/_utils';
import { TicketService } from '@/server/services/ticketService';
import { TicketRepo } from '@/server/repos/ticketRepo';
import { TicketUpdateSchema } from '@/server/validators/ticket';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await buildContext(req);
    requireWriteAccess(ctx, 'ticket.write');
    const body = TicketUpdateSchema.parse(await parseJson(req));
    const repo = new TicketRepo();
    let result;
    if (body.status) {
      result = await repo.updateTicketStatus(ctx, params.id, body.status);
    } else {
      // fallback: no status provided, return current ticket
      const svc = new TicketService();
      const tickets = await svc.listTickets(ctx, {});
      result = tickets.find((t) => t?.id === params.id);
    }
    return jsonOk(result);
  } catch (err) {
    return jsonError(err);
  }
}
