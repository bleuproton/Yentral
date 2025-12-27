import { randomUUID } from 'crypto';
import { prisma } from '@/server/db';
import { withContext } from '@/server/tenant/als';
import { RequestContext } from '@/server/tenant/context';
import { ProductService } from '@/server/services/productService';
import { IntegrationRepo } from '@/server/repos/integrationRepo';
import { MappingRepo } from '@/server/repos/mappingRepo';
import { JobRepo } from '@/server/repos/jobRepo';
import { TicketService } from '@/server/services/ticketService';

async function ensureTenant(): Promise<{ id: string }> {
  const existing = await prisma.tenant.findFirst();
  if (existing) return existing;
  return prisma.tenant.create({
    data: { name: 'Smoke Tenant 7B', slug: `smoke-7b-${randomUUID().slice(0, 6)}` },
  });
}

async function ensureUserAndMembership(tenantId: string) {
  const email = 'smoke7b@example.com';
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  await withContext({ tenantId }, () =>
    prisma.membership.upsert({
      where: { userId_tenantId: { tenantId, userId: user.id } },
      update: {},
      create: { tenantId, userId: user.id, role: 'ADMIN' },
    })
  );
  return user;
}

async function ensureConnector(): Promise<{ id: string }> {
  const key = 'smoke-connector-7b';
  const connector = await prisma.connector.upsert({
    where: { key },
    update: {},
    create: { key, name: 'Smoke Connector 7B', type: 'CHANNEL' as any },
  });
  const version = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: '1.0.0' } },
    update: {},
    create: { connectorId: connector.id, version: '1.0.0', schema: {} as any },
  });
  return { id: version.id };
}

async function ensureWarehouse(ctx: RequestContext) {
  const code = 'SMOKE-WH-7B';
  return withContext(ctx, () =>
    prisma.warehouse.upsert({
      where: { tenantId_code: { tenantId: ctx.tenantId, code } },
      update: {},
      create: { tenantId: ctx.tenantId, code, name: 'Smoke Warehouse 7B' },
    })
  );
}

async function run() {
  const tenant = await ensureTenant();
  const ctx: RequestContext = { tenantId: tenant.id };

  const productService = new ProductService();
  const integrationRepo = new IntegrationRepo();
  const mappingRepo = new MappingRepo();
  const jobRepo = new JobRepo();
  const ticketService = new TicketService();
  const user = await ensureUserAndMembership(ctx.tenantId);

  // Product + variant
  const product = await productService.createProductWithDefaultVariant(ctx, {
    sku: `SMK-P-${Date.now()}`,
    name: 'Smoke Product 7B',
    priceCents: 1000,
  }, `SMK-V-${Date.now()}`);
  const variant = await productService.ensureProductVariant(ctx, product.id);

  // Warehouse + mapping
  const warehouse = await ensureWarehouse(ctx);

  const connectorVersion = await ensureConnector();
  const connection = await integrationRepo.createConnection(ctx, {
    connectorVersionId: connectorVersion.id,
    name: 'Smoke Connection 7B',
    status: 'ACTIVE' as any,
  } as any);

  await mappingRepo.upsertWarehouseMapping(ctx, connection.id, 'EXT-LOC-7B', warehouse.id);
  await mappingRepo.linkChannelVariant(ctx, connection.id, 'EXT-VAR-7B', variant.id, undefined, 'EXTSKU7B');

  // Job enqueue
  await jobRepo.enqueueJob(ctx, {
    type: 'SMOKE_TEST',
    payload: {},
    tenantId: ctx.tenantId,
    dedupeKey: 'smoke-7b-job',
  } as any);

  // Ticket
  await ticketService.createTicketAndLinkThread(ctx, {
    title: 'Smoke Ticket 7B',
    description: 'Test ticket',
    authorId: user.id,
  });

  // Assertions
  const productCount = await withContext(ctx, () => prisma.product.count({ where: { tenantId: ctx.tenantId } }));
  const connectionCount = await withContext(ctx, () =>
    prisma.integrationConnection.count({ where: { tenantId: ctx.tenantId } })
  );
  const jobCount = await withContext(ctx, () => prisma.job.count({ where: { tenantId: ctx.tenantId } }));
  const ticketCount = await withContext(ctx, () => prisma.ticket.count({ where: { tenantId: ctx.tenantId } }));

  if (!productCount || !connectionCount || !jobCount || !ticketCount) {
    throw new Error('Smoke 7B assertions failed');
  }

  // eslint-disable-next-line no-console
  console.log('SMOKE PASS phase7b');
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('SMOKE FAIL phase7b', err);
    await prisma.$disconnect();
    process.exit(1);
  });
