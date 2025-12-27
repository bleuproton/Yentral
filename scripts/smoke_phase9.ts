#!/usr/bin/env tsx
// @ts-nocheck
import { prisma } from '@/server/db';
import { SyncService } from '@/server/services/syncService';
import { ConnectorType } from '@prisma/client';
import { withContext } from '@/server/tenant/als';

async function ensureTenant() {
  const slug = 'smoke-phase9';
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.tenant.create({ data: { slug, name: 'Smoke Phase9 Tenant' } });
}

async function ensureConnector() {
  const connector = await prisma.connector.upsert({
    where: { key: 'amazon_spapi' },
    update: {},
    create: { key: 'amazon_spapi', name: 'Amazon SP-API', type: ConnectorType.CHANNEL },
  });
  const version = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: '1.0.0' } },
    update: {},
    create: { connectorId: connector.id, version: '1.0.0' },
  });
  return version;
}

async function ensureConnection(tenantId: string, connectorVersionId: string) {
  return prisma.integrationConnection.upsert({
    where: { tenantId_id: { tenantId, id: `conn-phase9-${connectorVersionId}` } },
    update: {},
    create: {
      id: `conn-phase9-${connectorVersionId}`,
      tenantId,
      connectorVersionId,
      status: 'ACTIVE' as any,
      name: 'Phase9 Connection',
    },
  });
}

async function main() {
  const tenant = await ensureTenant();
  const version = await ensureConnector();
  const connection = await ensureConnection(tenant.id, version.id);

  const ctx = { tenantId: tenant.id };
  const svc = new SyncService();
  await svc.runConnectionSync(ctx, connection.id, { catalog: true, orders: true, inventory: true });

  const channelVariants = await withContext(ctx, () =>
    prisma.channelVariant.findMany({ where: { tenantId: tenant.id, connectionId: connection.id } })
  );
  const channelOrders = await withContext(ctx, () =>
    prisma.channelOrder.findMany({ where: { tenantId: tenant.id, connectionId: connection.id } })
  );

  if (channelVariants.length === 0 || channelOrders.length === 0) {
    throw new Error('Sync did not create channel mappings');
  }

  console.log('SMOKE PASS phase9', {
    channelVariants: channelVariants.length,
    channelOrders: channelOrders.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
