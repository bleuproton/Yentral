#!/usr/bin/env node --loader tsx
import { PrismaClient } from "@prisma/client";
import { EmailIngestService } from "@/domain/email/email-ingest.service";

const prisma = new PrismaClient();
const ingest = new EmailIngestService();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-phase6" },
    update: {},
    create: { slug: "smoke-phase6", name: "Smoke Phase6" }
  });

  const mailbox = await prisma.mailbox.upsert({
    where: { tenantId_inboundAddress: { tenantId: tenant.id, inboundAddress: "inbound+smoke@yentral.test" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Smoke Mailbox",
      inboundAddress: "inbound+smoke@yentral.test",
      provider: "GENERIC_WEBHOOK"
    }
  });

  const result = await ingest.ingestInboundEmail(tenant.id, {
    to: [{ address: mailbox.inboundAddress }],
    from: [{ address: "user@example.com" }],
    subject: "Smoke inbound",
    textBody: "Hello smoke",
    headers: { "message-id": "smoke-msg-1" },
    messageId: "smoke-msg-1",
    raw: { demo: true }
  });

  const ticket = await prisma.ticket.findFirst({ where: { tenantId: tenant.id, id: result.ticketId } });
  const thread = await prisma.emailThread.findFirst({ where: { tenantId: tenant.id, id: result.threadId } });
  const messages = await prisma.emailMessage.findMany({ where: { tenantId: tenant.id, threadId: result.threadId } });

  console.log(
    "OK",
    JSON.stringify(
      {
        ticketId: ticket?.id,
        threadId: thread?.id,
        messageCount: messages.length
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
