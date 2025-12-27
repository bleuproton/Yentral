import { PrismaClient, StockLedgerKind, ReservationStatus, ShipmentStatus, ReturnStatus, EmailDirection } from '@prisma/client';
import {
  getOrCreateTenant,
  getOrCreateJurisdiction,
  getOrCreateOrganization,
  getOrCreateLegalEntity,
  getOrCreateTaxProfile,
  getOrCreateWarehouse,
  getOrCreateProduct,
  getOrCreateVariant,
  getOrCreateCustomer,
  getOrCreateConnectorAndVersion,
  getOrCreateConnection,
} from './smoke_helpers';

const prisma = new PrismaClient();

function fail(msg: string): never {
  throw new Error(msg);
}

async function ensureBaseOrder(prisma: PrismaClient, tenantId: string) {
  const product = await getOrCreateProduct(prisma, tenantId, 'SMOKE-P1');
  const variant = await getOrCreateVariant(prisma, tenantId, product.id, 'SMOKE-P1-V1');
  const order = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId, orderNumber: 9001 } },
    update: {},
    create: { tenantId, orderNumber: 9001, currency: 'EUR', totalCents: 1000 },
  });
  const orderLine = await prisma.orderLine.upsert({
    where: { id: 'smoke-orderline' },
    update: { tenantId, orderId: order.id, productId: product.id, variantId: variant.id, quantity: 1, unitCents: 1000, totalCents: 1000 },
    create: {
      id: 'smoke-orderline',
      tenantId,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      unitCents: 1000,
      totalCents: 1000,
    },
  });
  return { product, variant, order, orderLine };
}

async function suitePhase2_3() {
  const tenant = await getOrCreateTenant(prisma);
  const { product, variant, order, orderLine } = await ensureBaseOrder(prisma, tenant.id);
  const warehouse = await getOrCreateWarehouse(prisma, tenant.id, 'SMOKE-WH');

  await prisma.stockLedger.create({
    data: {
      tenantId: tenant.id,
      warehouseId: warehouse.id,
      variantId: variant.id,
      qtyDelta: 10,
      kind: StockLedgerKind.ADJUST,
    },
  });

  await prisma.stockSnapshot.upsert({
    where: { tenantId_warehouseId_variantId: { tenantId: tenant.id, warehouseId: warehouse.id, variantId: variant.id } },
    update: { onHand: 10, reserved: 0, available: 10 },
    create: { tenantId: tenant.id, warehouseId: warehouse.id, variantId: variant.id, onHand: 10, reserved: 0, available: 10 },
  });

  await prisma.stockReservation.upsert({
    where: { tenantId_dedupeKey: { tenantId: tenant.id, dedupeKey: 'smoke-resv' } },
    update: { orderLineId: orderLine.id, warehouseId: warehouse.id, variantId: variant.id, qty: 2, status: ReservationStatus.ACTIVE },
    create: {
      tenantId: tenant.id,
      orderLineId: orderLine.id,
      warehouseId: warehouse.id,
      variantId: variant.id,
      qty: 2,
      status: ReservationStatus.ACTIVE,
      dedupeKey: 'smoke-resv',
    },
  });

  const { version } = await getOrCreateConnectorAndVersion(prisma, 'smoke-connector', '1.0.0');
  const connection = await getOrCreateConnection(prisma, tenant.id, version.id, 'Smoke Connection');

  await prisma.warehouseMapping.upsert({
    where: {
      tenantId_connectionId_externalLocationId: {
        tenantId: tenant.id,
        connectionId: connection.id,
        externalLocationId: 'ext-loc-1',
      },
    },
    update: { warehouseId: warehouse.id },
    create: {
      tenantId: tenant.id,
      connectionId: connection.id,
      externalLocationId: 'ext-loc-1',
      warehouseId: warehouse.id,
    },
  });

  await prisma.channelProduct.upsert({
    where: {
      tenantId_connectionId_externalId: { tenantId: tenant.id, connectionId: connection.id, externalId: 'ext-prod-1' },
    },
    update: { productId: product.id },
    create: {
      tenantId: tenant.id,
      connectionId: connection.id,
      externalId: 'ext-prod-1',
      productId: product.id,
      raw: {},
    },
  });

  await prisma.channelVariant.upsert({
    where: {
      tenantId_connectionId_externalId: { tenantId: tenant.id, connectionId: connection.id, externalId: 'ext-var-1' },
    },
    update: { variantId: variant.id },
    create: {
      tenantId: tenant.id,
      connectionId: connection.id,
      externalId: 'ext-var-1',
      variantId: variant.id,
      raw: {},
    },
  });

  await prisma.channelOrder.upsert({
    where: {
      tenantId_connectionId_externalOrderId: { tenantId: tenant.id, connectionId: connection.id, externalOrderId: 'ext-order-1' },
    },
    update: { orderId: order.id, raw: {} },
    create: { tenantId: tenant.id, connectionId: connection.id, externalOrderId: 'ext-order-1', orderId: order.id, raw: {} },
  });

  const channelVariants = await prisma.channelVariant.findMany({ where: { tenantId: tenant.id, connectionId: connection.id } });
  if (channelVariants.length === 0) fail('Phase2-3: channelVariant not found');
}

async function suitePhase4() {
  const tenant = await getOrCreateTenant(prisma);
  const { variant, order, orderLine } = await ensureBaseOrder(prisma, tenant.id);
  const warehouse = await getOrCreateWarehouse(prisma, tenant.id, 'SMOKE-WH');

  const shipment = await prisma.shipment.upsert({
    where: { id: 'smoke-shipment' },
    update: { tenantId: tenant.id, orderId: order.id, warehouseId: warehouse.id, status: ShipmentStatus.CREATED },
    create: { id: 'smoke-shipment', tenantId: tenant.id, orderId: order.id, warehouseId: warehouse.id, status: ShipmentStatus.CREATED },
  });

  await prisma.shipmentLine.upsert({
    where: { id: 'smoke-shipment-line' },
    update: { tenantId: tenant.id, shipmentId: shipment.id, orderLineId: orderLine.id, variantId: variant.id, qty: 1 },
    create: {
      id: 'smoke-shipment-line',
      tenantId: tenant.id,
      shipmentId: shipment.id,
      orderLineId: orderLine.id,
      variantId: variant.id,
      qty: 1,
    },
  });

  const ret = await prisma.return.upsert({
    where: { id: 'smoke-return' },
    update: { tenantId: tenant.id, orderId: order.id, status: ReturnStatus.REQUESTED },
    create: { id: 'smoke-return', tenantId: tenant.id, orderId: order.id, status: ReturnStatus.REQUESTED },
  });
  await prisma.returnLine.upsert({
    where: { id: 'smoke-return-line' },
    update: { tenantId: tenant.id, returnId: ret.id, orderLineId: orderLine.id, variantId: variant.id, qty: 1 },
    create: {
      id: 'smoke-return-line',
      tenantId: tenant.id,
      returnId: ret.id,
      orderLineId: orderLine.id,
      variantId: variant.id,
      qty: 1,
    },
  });

  const count = await prisma.shipmentLine.count({ where: { tenantId: tenant.id, shipmentId: shipment.id } });
  const rcount = await prisma.returnLine.count({ where: { tenantId: tenant.id, returnId: ret.id } });
  if (count === 0 || rcount === 0) fail('Phase4: shipment or return lines missing');
}

async function suitePhase5() {
  const tenant = await getOrCreateTenant(prisma);
  const jurisdiction = await getOrCreateJurisdiction(prisma, 'EU');
  const org = await getOrCreateOrganization(prisma, tenant.id, 'Smoke Org');
  const le = await getOrCreateLegalEntity(prisma, tenant.id, org.id, jurisdiction.id, 'Smoke LE');
  await getOrCreateTaxProfile(prisma, tenant.id, le.id, jurisdiction.id, 'SMOKE_TP');
  const customer = await getOrCreateCustomer(prisma, tenant.id, 'smoke@example.com');
  const { variant, order, orderLine } = await ensureBaseOrder(prisma, tenant.id);

  const invoice = await prisma.invoice.upsert({
    where: { tenantId_invoiceNumber: { tenantId: tenant.id, invoiceNumber: 9001 } },
    update: { legalEntityId: le.id, customerId: customer.id },
    create: {
      tenantId: tenant.id,
      invoiceNumber: 9001,
      orderId: order.id,
      legalEntityId: le.id,
      customerId: customer.id,
      status: 'DRAFT',
      currency: 'EUR',
      subtotalCents: 1000,
      taxCents: 0,
      totalCents: 1000,
    },
  });

  await prisma.invoiceLine.upsert({
    where: { id: 'smoke-invoiceline' },
    update: {
      tenantId: tenant.id,
      invoiceId: invoice.id,
      orderLineId: orderLine.id,
      variantId: variant.id,
      description: 'Smoke line',
      qty: 1,
      unitCents: 1000,
      totalCents: 1000,
    },
    create: {
      id: 'smoke-invoiceline',
      tenantId: tenant.id,
      invoiceId: invoice.id,
      orderLineId: orderLine.id,
      variantId: variant.id,
      description: 'Smoke line',
      qty: 1,
      unitCents: 1000,
      totalCents: 1000,
    },
  });

  const inv = await prisma.invoice.findUnique({
    where: { tenantId_invoiceNumber: { tenantId: tenant.id, invoiceNumber: 9001 } },
    include: { lines: true },
  });
  if (!inv || inv.lines.length === 0) fail('Phase5: invoice or lines missing');
}

async function suitePhase6() {
  const tenant = await getOrCreateTenant(prisma);
  const mailbox = await prisma.mailbox.upsert({
    where: { tenantId_inboundAddress: { tenantId: tenant.id, inboundAddress: 'smoke-inbound@example.com' } },
    update: { name: 'Smoke Mailbox' },
    create: { tenantId: tenant.id, name: 'Smoke Mailbox', inboundAddress: 'smoke-inbound@example.com' },
  });
  const user = await prisma.user.upsert({
    where: { email: 'smoke-user@yentral.test' },
    update: { name: 'Smoke User' },
    create: { email: 'smoke-user@yentral.test', name: 'Smoke User' },
  });
  const ticket = await prisma.ticket.upsert({
    where: { id: 'smoke-ticket' },
    update: { tenantId: tenant.id, authorId: user.id, title: 'Smoke Ticket', description: 'Smoke', status: 'OPEN' },
    create: {
      id: 'smoke-ticket',
      tenantId: tenant.id,
      authorId: user.id,
      title: 'Smoke Ticket',
      description: 'Smoke',
      status: 'OPEN',
    },
  });
  const thread = await prisma.emailThread.upsert({
    where: { id: 'smoke-thread' },
    update: { tenantId: tenant.id, mailboxId: mailbox.id, subject: 'Smoke Thread' },
    create: { id: 'smoke-thread', tenantId: tenant.id, mailboxId: mailbox.id, subject: 'Smoke Thread' },
  });
  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { emailThreadId: thread.id },
  });

  await prisma.emailMessage.upsert({
    where: { id: 'smoke-email-in' },
    update: {
      tenantId: tenant.id,
      threadId: thread.id,
      direction: EmailDirection.INBOUND,
      from: { addr: 'customer@example.com' },
      to: { addr: mailbox.inboundAddress },
    },
    create: {
      id: 'smoke-email-in',
      tenantId: tenant.id,
      threadId: thread.id,
      direction: EmailDirection.INBOUND,
      from: { addr: 'customer@example.com' },
      to: { addr: mailbox.inboundAddress },
    },
  });
  await prisma.emailMessage.upsert({
    where: { id: 'smoke-email-out' },
    update: {
      tenantId: tenant.id,
      threadId: thread.id,
      direction: EmailDirection.OUTBOUND,
      from: { addr: mailbox.inboundAddress },
      to: { addr: 'customer@example.com' },
    },
    create: {
      id: 'smoke-email-out',
      tenantId: tenant.id,
      threadId: thread.id,
      direction: EmailDirection.OUTBOUND,
      from: { addr: mailbox.inboundAddress },
      to: { addr: 'customer@example.com' },
    },
  });

  const msgs = await prisma.emailMessage.count({ where: { tenantId: tenant.id, threadId: thread.id } });
  const ticketReload = await prisma.ticket.findUnique({ where: { id: ticket.id } });
  if (msgs < 2 || !ticketReload?.emailThreadId) fail('Phase6: messages or ticket link missing');
}

async function suiteFulfillment() {
  const tenant = await getOrCreateTenant(prisma);
  const warehouse = await getOrCreateWarehouse(prisma, tenant.id, 'SMOKE-WH');
  const { variant, order, orderLine } = await ensureBaseOrder(prisma, tenant.id);
  await prisma.stockReservation.upsert({
    where: { tenantId_dedupeKey: { tenantId: tenant.id, dedupeKey: 'smoke-fulfill-resv' } },
    update: { orderLineId: orderLine.id, warehouseId: warehouse.id, variantId: variant.id, qty: 1, status: ReservationStatus.ACTIVE },
    create: {
      tenantId: tenant.id,
      orderLineId: orderLine.id,
      warehouseId: warehouse.id,
      variantId: variant.id,
      qty: 1,
      status: ReservationStatus.ACTIVE,
      dedupeKey: 'smoke-fulfill-resv',
    },
  });
  const resv = await prisma.stockReservation.findUnique({
    where: { tenantId_dedupeKey: { tenantId: tenant.id, dedupeKey: 'smoke-fulfill-resv' } },
  });
  if (!resv) fail('Fulfillment: reservation missing');

  await prisma.shipment.upsert({
    where: { id: 'smoke-ship-fulfill' },
    update: { tenantId: tenant.id, orderId: order.id, warehouseId: warehouse.id, status: ShipmentStatus.SHIPPED },
    create: {
      id: 'smoke-ship-fulfill',
      tenantId: tenant.id,
      orderId: order.id,
      warehouseId: warehouse.id,
      status: ShipmentStatus.SHIPPED,
    },
  });
  await prisma.shipmentLine.upsert({
    where: { id: 'smoke-shipline-fulfill' },
    update: { tenantId: tenant.id, shipmentId: 'smoke-ship-fulfill', orderLineId: orderLine.id, variantId: variant.id, qty: 1 },
    create: {
      id: 'smoke-shipline-fulfill',
      tenantId: tenant.id,
      shipmentId: 'smoke-ship-fulfill',
      orderLineId: orderLine.id,
      variantId: variant.id,
      qty: 1,
    },
  });
  await prisma.stockReservation.update({
    where: { tenantId_dedupeKey: { tenantId: tenant.id, dedupeKey: 'smoke-fulfill-resv' } },
    data: { status: ReservationStatus.CONSUMED },
  });

  const shipLineCount = await prisma.shipmentLine.count({
    where: { tenantId: tenant.id, shipmentId: 'smoke-ship-fulfill' },
  });
  if (shipLineCount === 0) fail('Fulfillment: shipment line missing');
}

async function suitePhase7() {
  const tenant = await getOrCreateTenant(prisma);
  const { version } = await getOrCreateConnectorAndVersion(prisma, 'smoke-connector', '1.0.0');
  const connection = await getOrCreateConnection(prisma, tenant.id, version.id, 'Smoke Connection');

  // Enqueue job
  const job = await prisma.job.upsert({
    where: { tenantId_dedupeKey: { tenantId: tenant.id, dedupeKey: `sync:connection:${connection.id}` } },
    update: { payload: { connectionId: connection.id }, attempts: 0, status: 'PENDING', lockedAt: null, nextRunAt: null },
    create: {
      tenantId: tenant.id,
      type: 'SYNC_CONNECTION',
      payload: { connectionId: connection.id },
      dedupeKey: `sync:connection:${connection.id}`,
      maxAttempts: 3,
    },
  });

  // Run worker once
  const { processOnce } = await import('../worker/index');
  await processOnce();

  const refreshedJob = await prisma.job.findUnique({ where: { id: job.id } });
  const conn = await prisma.integrationConnection.findUnique({
    where: { tenantId_id: { tenantId: tenant.id, id: connection.id } },
  });
  if (!refreshedJob || refreshedJob.status !== 'COMPLETED') fail('Phase7: job not completed');
  if (!conn?.lastSyncAt) fail('Phase7: lastSyncAt not set');
}

async function suiteWorker() {
  await suitePhase7();
}

async function suitePhase7a() {
  const tenantA = await prisma.tenant.upsert({
    where: { slug: 'smoke-a' },
    update: { name: 'Smoke A' },
    create: { slug: 'smoke-a', name: 'Smoke A' },
  });
  const tenantB = await prisma.tenant.upsert({
    where: { slug: 'smoke-b' },
    update: { name: 'Smoke B' },
    create: { slug: 'smoke-b', name: 'Smoke B' },
  });

  const { tenantDb } = await import('../src/server/db/tenantDb');
  const dbA = tenantDb(tenantA.id);
  const dbB = tenantDb(tenantB.id);

  const prodA = await dbA.product.upsert({
    where: { tenantId_sku: { tenantId: tenantA.id, sku: 'SMOKE-A-1' } },
    update: { name: 'A1' },
    create: { tenantId: tenantA.id, sku: 'SMOKE-A-1', name: 'A1', priceCents: 100 },
  });
  const prodB = await dbB.product.upsert({
    where: { tenantId_sku: { tenantId: tenantB.id, sku: 'SMOKE-B-1' } },
    update: { name: 'B1' },
    create: { tenantId: tenantB.id, sku: 'SMOKE-B-1', name: 'B1', priceCents: 200 },
  });

  let threw = false;
  try {
    await dbA.product.findUnique({ where: { id: prodB.id } });
  } catch {
    threw = true;
  }
  if (!threw) fail('Phase7a: tenant guard did not block missing tenantId query');

  const leak = await dbA.product.findUnique({
    where: { tenantId_id: { tenantId: tenantA.id, id: prodB.id } },
  });
  if (leak) fail('Phase7a: cross-tenant read succeeded');

  const productsA = await dbA.product.findMany({ where: { tenantId: tenantA.id } });
  if (!productsA.find((p) => p.id === prodA.id)) fail('Phase7a: tenant A product not found');
}

async function main() {
  const suite = process.argv[2];
  if (!suite) fail('Pass suite name (phase7a|phase2-3|phase4|phase5|phase6|fulfillment|phase7|worker)');
  try {
    switch (suite) {
      case 'phase7a':
        await suitePhase7a();
        break;
      case 'phase2-3':
        await suitePhase2_3();
        break;
      case 'phase4':
        await suitePhase4();
        break;
      case 'phase5':
        await suitePhase5();
        break;
      case 'phase6':
        await suitePhase6();
        break;
      case 'fulfillment':
        await suiteFulfillment();
        break;
      case 'phase7':
        await suitePhase2_3();
        await suitePhase4();
        await suitePhase5();
        await suitePhase6();
        await suiteFulfillment();
        await suitePhase7();
        break;
      case 'phase7b':
        await suitePhase7a();
        // enqueue test.noop job
        const tenant = await getOrCreateTenant(prisma);
        const job = await prisma.job.upsert({
          where: { tenantId_dedupeKey: { tenantId: tenant.id, dedupeKey: 'test-noop' } },
          update: { status: 'PENDING', attempts: 0, lockedAt: null, nextRunAt: null, payload: {} },
          create: { tenantId: tenant.id, type: 'test.noop', dedupeKey: 'test-noop', payload: {}, maxAttempts: 3 },
        });
        const { processOnce } = await import('../worker/index');
        await processOnce();
        const refreshed = await prisma.job.findUnique({ where: { id: job.id } });
        const run = await prisma.jobRun.findFirst({ where: { jobId: job.id, tenantId: tenant.id } });
        if (!refreshed || refreshed.status !== 'COMPLETED') fail('Phase7b: job not completed');
        if (!run) fail('Phase7b: jobRun missing');
        break;
      case 'phase7c':
        await suitePhase7a();
        const tenantC = await getOrCreateTenant(prisma);
        const connector = await prisma.connector.upsert({
          where: { key: 'mock-shopify' },
          update: { name: 'Mock Shopify' },
          create: { key: 'mock-shopify', name: 'Mock Shopify', type: 'CHANNEL' },
        });
        const version = await prisma.connectorVersion.upsert({
          where: { connectorId_version: { connectorId: connector.id, version: '1.0.0' } },
          update: {},
          create: { connectorId: connector.id, version: '1.0.0' },
        });
        const connection = await prisma.integrationConnection.upsert({
          where: { id: 'smoke-conn-mock-shopify' },
          update: { tenantId: tenantC.id, connectorVersionId: version.id, status: 'ACTIVE' },
          create: { id: 'smoke-conn-mock-shopify', tenantId: tenantC.id, connectorVersionId: version.id, status: 'ACTIVE' },
        });
        const { runSync: runSync7c } = await import('../src/server/integrations/syncEngine');
        await runSync7c({ tenantId: tenantC.id, connectionId: connection.id, scope: 'catalog' });
        await runSync7c({ tenantId: tenantC.id, connectionId: connection.id, scope: 'orders' });
        const cps = await prisma.channelProduct.count({ where: { tenantId: tenantC.id, connectionId: connection.id } });
        const cvs = await prisma.channelVariant.count({ where: { tenantId: tenantC.id, connectionId: connection.id } });
        const cos = await prisma.channelOrder.count({ where: { tenantId: tenantC.id, connectionId: connection.id } });
        if (cps === 0 || cvs === 0 || cos === 0) fail('Phase7c: mappings not created');
        break;
      case 'phase9':
        if (!process.env.ENCRYPTION_KEY) {
          process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
        }
        await suitePhase7a();
        const tenant9 = await getOrCreateTenant(prisma);
        const connector9 = await prisma.connector.upsert({
          where: { key: 'mock-shopify' },
          update: { name: 'Mock Shopify' },
          create: { key: 'mock-shopify', name: 'Mock Shopify', type: 'CHANNEL' },
        });
        const version9 = await prisma.connectorVersion.upsert({
          where: { connectorId_version: { connectorId: connector9.id, version: '1.0.0' } },
          update: {},
          create: { connectorId: connector9.id, version: '1.0.0' },
        });
        const connection9 = await prisma.integrationConnection.upsert({
          where: { id: 'smoke-conn-shopify' },
          update: {
            tenantId: tenant9.id,
            connectorVersionId: version9.id,
            status: 'ACTIVE',
            config: { shopDomain: 'demo.myshopify.com', adminAccessToken: 'test' },
          },
          create: {
            id: 'smoke-conn-shopify',
            tenantId: tenant9.id,
            connectorVersionId: version9.id,
            status: 'ACTIVE',
            config: { shopDomain: 'demo.myshopify.com', adminAccessToken: 'test' },
          },
        });
        // Secrets should be encrypted via service; simulate by encryptJson/decryptJson
        const { encryptJson, decryptJson } = await import('../src/server/security/crypto');
        const enc = encryptJson({ token: 'secret' });
        const dec = decryptJson(enc);
        if (dec.token !== 'secret') fail('Phase9: encryption failed');
        // Use mock runtime via registry
        const { runSync } = await import('../src/server/integrations/syncEngine');
        await runSync({ tenantId: tenant9.id, connectionId: connection9.id, scope: 'catalog' });
        await runSync({ tenantId: tenant9.id, connectionId: connection9.id, scope: 'orders' });
        const mappingCount = await prisma.channelVariant.count({ where: { tenantId: tenant9.id, connectionId: connection9.id } });
        if (mappingCount === 0) fail('Phase9: channel variants missing');
        break;
      case 'worker':
        await suiteWorker();
        break;
      default:
        fail(`Unknown suite ${suite}`);
    }
    console.log('SMOKE PASS');
  } catch (err: any) {
    console.error('SMOKE FAIL', err?.message ?? err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
