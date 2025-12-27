// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function dedupeKey(type: string, tenantId: string, id: string, scope: string) {
  const now = new Date();
  const slot = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
  ].join('-');
  return `${type}:${tenantId}:${id}:${scope}:${slot}`;
}

async function scheduleIntegrationJobs() {
  const connections = await prisma.integrationConnection.findMany();
  for (const conn of connections) {
    const scopes = ['catalog', 'orders', 'inventory'];
    for (const scope of scopes) {
      const key = dedupeKey('integration.sync', conn.tenantId, conn.id, scope);
      await prisma.job.upsert({
        where: { tenantId_dedupeKey: { tenantId: conn.tenantId, dedupeKey: key } },
        update: { nextRunAt: new Date(Date.now() + 5 * 60 * 1000) },
        create: {
          tenantId: conn.tenantId,
          type: 'integration.sync',
          payload: { connectionId: conn.id, scope },
          dedupeKey: key,
          status: 'PENDING',
          maxAttempts: 5,
          nextRunAt: new Date(),
        },
      });
    }
  }
}

async function scheduleMailboxJobs() {
  const mailboxes = await prisma.mailbox.findMany();
  for (const mb of mailboxes) {
    const key = dedupeKey('mailbox.sync', mb.tenantId, mb.id, 'default');
    await prisma.job.upsert({
      where: { tenantId_dedupeKey: { tenantId: mb.tenantId, dedupeKey: key } },
      update: { nextRunAt: new Date(Date.now() + 5 * 60 * 1000) },
      create: {
        tenantId: mb.tenantId,
        type: 'mailbox.sync',
        payload: { mailboxId: mb.id },
        dedupeKey: key,
        status: 'PENDING',
        maxAttempts: 3,
        nextRunAt: new Date(),
      },
    });
  }
}

async function scheduleVatJobs() {
  const tenants = await prisma.tenant.findMany();
  for (const t of tenants) {
    const key = dedupeKey('vat.rebuild', t.id, 'global', 'daily');
    await prisma.job.upsert({
      where: { tenantId_dedupeKey: { tenantId: t.id, dedupeKey: key } },
      update: { nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      create: {
        tenantId: t.id,
        type: 'vat.rebuild',
        payload: {},
        dedupeKey: key,
        status: 'PENDING',
        maxAttempts: 3,
        nextRunAt: new Date(),
      },
    });
  }
}

async function main() {
  await scheduleIntegrationJobs();
  await scheduleMailboxJobs();
  await scheduleVatJobs();
  await prisma.$disconnect();
  console.log('Scheduler tick complete');
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
