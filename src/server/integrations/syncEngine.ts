// @ts-nocheck
import { tenantDb } from '../db/tenantDb';
import { getConnectorRuntime } from './registry';
import { writeAuditEvent } from '../audit/auditService';

type Scope = 'catalog' | 'orders' | 'inventory';

export async function runSync(params: { tenantId: string; connectionId: string; scope: Scope }) {
  const { tenantId, connectionId, scope } = params;
  const db = tenantDb(tenantId);
  const connection = await db.integrationConnection.findUnique({
    where: { tenantId_id: { tenantId, id: connectionId } },
    include: { connectorVersion: { include: { connector: true } } },
  });
  if (!connection) throw new Error('Connection not found');

  const runtime = getConnectorRuntime(connection.connectorVersion.connector.key);
  if (!runtime) throw new Error(`Runtime not found for ${connection.connectorVersion.connector.key}`);

  try {
    if (scope === 'catalog') {
      let cursor: string | undefined;
      do {
        const res = await runtime.fetchCatalog({ config: connection.config ?? {}, cursor });
        for (const p of res.products) {
          const product = await db.product.upsert({
            where: { tenantId_sku: { tenantId, sku: p.sku } },
            update: { name: p.name },
            create: { tenantId, sku: p.sku, name: p.name, priceCents: 0, currency: 'EUR' },
          });
          await db.channelProduct.upsert({
            where: {
              tenantId_connectionId_externalId: { tenantId, connectionId, externalId: p.externalId },
            },
            update: { productId: product.id, raw: p.raw ?? null },
            create: { tenantId, connectionId, externalId: p.externalId, productId: product.id, raw: p.raw ?? null },
          });
        }
        for (const v of res.variants) {
          const parentProduct = await db.product.findFirst({
            where: { tenantId, sku: v.productExternalId },
          });
          const productId = parentProduct?.id ?? (await db.product.findFirst({ where: { tenantId } }))?.id;
          if (!productId) continue;
          const variant = await db.productVariant.upsert({
            where: { tenantId_sku: { tenantId, sku: v.sku } },
            update: { productId },
            create: { tenantId, productId, sku: v.sku },
          });
          await db.channelVariant.upsert({
            where: { tenantId_connectionId_externalId: { tenantId, connectionId, externalId: v.externalId } },
            update: { variantId: variant.id, asin: v.asin ?? null, externalSku: v.externalSku ?? null, raw: v.raw ?? v },
            create: {
              tenantId,
              connectionId,
              externalId: v.externalId,
              variantId: variant.id,
              asin: v.asin ?? null,
              externalSku: v.externalSku ?? null,
              raw: v.raw ?? v,
            },
          });
        }
        cursor = res.nextCursor;
      } while (cursor);
    }

    if (scope === 'orders') {
      let cursor: string | undefined;
      do {
        const res = await runtime.fetchOrders({ config: connection.config ?? {}, cursor });
        for (const o of res.orders) {
          const orderNumber = Number.isFinite(Number(o.externalOrderId.replace(/\D/g, '')))
            ? Number(o.externalOrderId.replace(/\D/g, ''))
            : Math.floor(Date.now() / 1000);
          const order = await db.order.upsert({
            where: { tenantId_orderNumber: { tenantId, orderNumber } },
            update: {},
            create: { tenantId, orderNumber, currency: 'EUR', totalCents: 0 },
          });
          for (const item of o.items) {
            const cv = await db.channelVariant.findFirst({
              where: { tenantId, connectionId, externalId: item.externalVariantId },
            });
            const variantId = cv?.variantId;
            const variant = variantId
              ? await db.productVariant.findUnique({ where: { tenantId_id: { tenantId, id: variantId } } })
              : null;
            const productId = variant?.productId;
            if (!productId) continue;
            await db.orderLine.create({
              data: {
                tenantId,
                orderId: order.id,
                productId,
                variantId,
                quantity: item.qty,
                unitCents: 0,
                totalCents: 0,
              },
            });
          }
          await db.channelOrder.upsert({
            where: { tenantId_connectionId_externalOrderId: { tenantId, connectionId, externalOrderId: o.externalOrderId } },
            update: { orderId: order.id, raw: o.raw ?? null },
            create: { tenantId, connectionId, externalOrderId: o.externalOrderId, orderId: order.id, raw: o.raw ?? null },
          });
        }
        cursor = res.nextCursor;
      } while (cursor);
    }

    if (scope === 'inventory') {
      const locs = await runtime.fetchLocations({ config: connection.config ?? {} });
      for (const loc of locs) {
        const wh = await db.warehouse.findFirst({ where: { tenantId, code: loc.externalLocationId } });
        if (wh) {
          await db.warehouseMapping.upsert({
            where: {
              tenantId_connectionId_externalLocationId: {
                tenantId,
                connectionId,
                externalLocationId: loc.externalLocationId,
              },
            },
            update: { warehouseId: wh.id },
            create: { tenantId, connectionId, externalLocationId: loc.externalLocationId, warehouseId: wh.id },
          });
        }
      }
    }

    await db.integrationConnection.updateMany({
      where: { tenantId, id: connectionId },
      data: { lastSyncAt: new Date(), lastError: null },
    });
    await writeAuditEvent({
      tenantId,
      action: 'integration.sync',
      resourceType: 'IntegrationConnection',
      resourceId: connectionId,
      actorUserId: null,
      metadata: { scope },
    });
  } catch (err: any) {
    await db.integrationConnection.updateMany({
      where: { tenantId, id: connectionId },
      data: { lastError: err?.message ?? 'sync failed' },
    });
    throw err;
  }
}
