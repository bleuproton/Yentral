import { PrismaClient } from '@prisma/client';
import { TicketCreateSchema, TicketUpdateSchema } from '../schemas/ticket';
import { TicketRepository } from '../repositories/ticketRepository';
import { writeAudit } from '../audit/audit';

export class TicketService {
  constructor(private prisma: PrismaClient, private tenantId: string, private actorUserId: string) {}

  repo() {
    return new TicketRepository(this.prisma, this.tenantId);
  }

  list(filters: { status?: string }) {
    return this.repo().listTickets(filters);
  }

  async create(input: unknown) {
    const data = TicketCreateSchema.parse(input);
    const ticket = await this.repo().createTicket(this.actorUserId, data);
    await writeAudit(this.tenantId, this.actorUserId, 'ticket.create', 'Ticket', ticket.id, data);
    return ticket;
  }

  get(ticketId: string) {
    return this.repo().getTicket(ticketId);
  }

  async update(ticketId: string, input: unknown) {
    const data = TicketUpdateSchema.parse(input);
    const ticket = await this.repo().updateTicket(ticketId, data);
    await writeAudit(this.tenantId, this.actorUserId, 'ticket.update', 'Ticket', ticket.id, data);
    return ticket;
  }
}
