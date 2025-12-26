import nodemailer from "nodemailer";
import { EmailDirection } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class AutoResponderService {
  async sendTicketReceivedAck(tenantId: string, ticketId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { tenantId, id: ticketId },
      include: { emailThread: { include: { mailbox: true } } }
    });
    if (!ticket || !ticket.emailThread || !ticket.emailThread.mailbox) return null;
    const mailbox = ticket.emailThread.mailbox;
    const outboundFrom = mailbox.outboundFrom;

    let sendResult: any = null;
    if (outboundFrom && mailbox.config && (mailbox.config as any).smtp) {
      const transporter = nodemailer.createTransport((mailbox.config as any).smtp);
      sendResult = await transporter.sendMail({
        from: outboundFrom,
        to: outboundFrom,
        subject: `Ticket ${ticket.id} received`,
        text: `We received your request: ${ticket.title}`
      });
    }

    const msg = await prisma.emailMessage.create({
      data: {
        tenantId,
        threadId: ticket.emailThreadId!,
        direction: EmailDirection.OUTBOUND,
        from: [{ address: outboundFrom ?? "noreply@example.com" }] as any,
        to: [{ address: outboundFrom ?? "noreply@example.com" }] as any,
        subject: `Ticket ${ticket.id} received`,
        textBody: `We received your request: ${ticket.title}`,
        raw: sendResult ? { messageId: sendResult.messageId } : null,
        sentAt: new Date()
      }
    });

    await prisma.auditEvent.create({
      data: {
        tenantId,
        action: "EMAIL_OUTBOUND_ACK",
        resourceType: "EmailMessage",
        resourceId: msg.id
      }
    });

    return msg;
  }
}
