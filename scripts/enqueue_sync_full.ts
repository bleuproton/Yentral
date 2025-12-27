#!/usr/bin/env tsx
// @ts-nocheck
import { makeWorkerUtils } from 'graphile-worker';
import { prisma } from '@/server/db';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL required');

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant found');
  const connection = await prisma.integrationConnection.findFirst({ where: { tenantId: tenant.id } });
  if (!connection) throw new Error('No integration connection found');

  const utils = await makeWorkerUtils({ connectionString });
  await utils.addJob('sync_connection_full', { tenantId: tenant.id, connectionId: connection.id });
  console.log('ENQUEUED sync_connection_full', { tenantId: tenant.id, connectionId: connection.id });
  await utils.release();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
