import {
  EmailDirection,
  EmailThreadStatus,
  ReservationStatus,
  TicketStatus
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type InboundPayload = {
  to: { address: string; name?: string }[] | string[];
  from: { address: string; name?: string }[] | string[];
  cc?: { address: string; name?: string }[] | string[];
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  headers?: Record<string, any>;
  messageId?: string;
  inReplyTo?: string;
  externalThreadId?: string;
  raw?: any;
};

export class EmailIngestService {
  async ingestInboundEmail(tenantId: string, payload: InboundPayload) {
    const toAddr = Array.isArray(payload.to) ? payload.to[0] : payload.to;
    if (!toAddr) throw new Error("NO_RECIPIENT");

    const mailbox = await prisma.mailbox.findFirst({
      where: { tenantId, inboundAddress: typeof toAddr === "string" ? toAddr : toAddr.address }
    });
    if (!mailbox) throw new Error("MAILBOX_NOT_FOUND");

    return prisma.$transaction(async (tx) => {
      let thread = await tx.emailThread.findFirst({
        where: {
          tenantId,
          mailboxId: mailbox.id,
          OR: [
            { externalThreadId: payload.externalThreadId ?? "" },
            payload.subject ? { subject: payload.subject } : undefined
          ].filter(Boolean) as any
        }
      });

      if (!thread) {
        thread = await tx.emailThread.create({
          data: {
            tenantId,
            mailboxId: mailbox.id,
            subject: payload.subject ?? null,
            participants: payload.from ?? null,
            externalThreadId: payload.externalThreadId ?? null
          }
        });
      }

      let ticketId = thread.ticketId;
      if (!ticketId) {
        const ticket = await tx.ticket.create({
          data: {
            tenantId,
            authorId: mailbox.id, // placeholder, no user
            title: payload.subject ?? "Inbound email",
            description: payload.textBody ?? payload.htmlBody ?? "",
            status: TicketStatus.OPEN,
            priority: 3,
            emailThreadId: thread.id
          }
        });
        ticketId = ticket.id;
        await tx.emailThread.update({
          where: { id: thread.id },
          data: { ticketId }
        });
      }

      const message = await tx.emailMessage.create({
        data: {
          tenantId,
          threadId: thread.id,
          direction: EmailDirection.INBOUND,
          messageId: payload.messageId ?? null,
          inReplyTo: payload.inReplyTo ?? null,
          from: payload.from as any,
          to: payload.to as any,
          cc: (payload.cc as any) ?? null,
          subject: payload.subject ?? null,
          textBody: payload.textBody ?? null,
          htmlBody: payload.htmlBody ?? null,
          headers: payload.headers ?? null,
          raw: payload.raw ?? null,
          sentAt: new Date()
        }
      });

      await tx.auditEvent.create({
        data: {
          tenantId,
          action: "EMAIL_INBOUND",
          resourceType: "EmailMessage",
          resourceId: message.id
        }
      });

      return { threadId: thread.id, ticketId, messageId: message.id };
    });
  }
}
