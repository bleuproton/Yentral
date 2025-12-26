import { TicketStatus } from "@prisma/client";
import { TicketRepository } from "@/_legacy/repositories/ticketRepository";

export class TicketService {
  constructor(private repo = new TicketRepository()) {}

  async createTicket(tenantId: string, input: { authorId: string; title: string; description: string; priority?: number }) {
    if (!input.title) throw new Error("Title is required");
    const ticket = await this.repo.create({
      tenantId,
      authorId: input.authorId,
      title: input.title,
      description: input.description,
      priority: input.priority ?? 3,
      status: TicketStatus.OPEN
    });
    return { ticket, events: [{ type: "ticket.created", tenantId, ticketId: ticket.id }] };
  }

  async assign(tenantId: string, ticketId: string, assigneeId: string) {
    const existing = await this.repo.getById(tenantId, ticketId);
    if (!existing) throw new Error("Ticket not found");
    await this.repo.update(ticketId, { assigneeId });
    return { events: [{ type: "ticket.assigned", tenantId, ticketId, assigneeId }] };
  }

  async updateStatus(tenantId: string, ticketId: string, status: TicketStatus) {
    const existing = await this.repo.getById(tenantId, ticketId);
    if (!existing) throw new Error("Ticket not found");
    await this.repo.update(ticketId, { status });
    return { events: [{ type: "ticket.status_changed", tenantId, ticketId, status }] };
  }

  async comment(tenantId: string, input: { ticketId: string; authorId: string; body: string }) {
    const existing = await this.repo.getById(tenantId, input.ticketId);
    if (!existing) throw new Error("Ticket not found");
    const comment = await this.repo.addComment({
      tenantId,
      ticketId: input.ticketId,
      authorId: input.authorId,
      body: input.body
    });
    return { comment, events: [{ type: "ticket.commented", tenantId, ticketId: input.ticketId, commentId: comment.id }] };
  }
}
