// @ts-nocheck
import { prisma } from '../db';
import { withContext } from '../tenant/als';
import { RequestContext } from '../tenant/context';
import { getConnector } from '@/connectors/registry';

export class SyncService {
  async runConnectionSync(
    ctx: RequestContext,
    connectionId: string,
    opts: { catalog?: boolean; orders?: boolean; inventory?: boolean } = { catalog: true, orders: true, inventory: true }
  ) {
    return withContext(ctx, async () => {
      const connection = await prisma.integrationConnection.findUnique({
        where: { tenantId_id: { tenantId: ctx.tenantId, id: connectionId } },
        include: { connectorVersion: { include: { connector: true } } },
      });
      if (!connection) throw new Error('Connection not found');

      const connector = getConnector(connection.connectorVersion.connector.key as any);
      const config = connection.config ?? {};

      if (opts.catalog) {
        const cat = await connector.pullCatalogDelta(config, null);
        for (const item of cat.items) {
          const product = await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: ctx.tenantId, sku: item.sku } },
          update: { name: item.name },
          create: { tenantId: ctx.tenantId, sku: item.sku, name: item.name, priceCents: 0, currency: 'EUR' },
        });
          await prisma.channelProduct.upsert({
            where: { tenantId_connectionId_externalId: { tenantId: ctx.tenantId, connectionId, externalId: item.externalId } },
            update: { productId: product.id, raw: item.raw ?? null },
            create: { tenantId: ctx.tenantId, connectionId, externalId: item.externalId, productId: product.id, raw: item.raw ?? null },
          });
          for (const v of item.variants) {
            const variant = await prisma.productVariant.upsert({
              where: { tenantId_sku: { tenantId: ctx.tenantId, sku: v.sku } },
              update: { productId: product.id },
              create: { tenantId: ctx.tenantId, productId: product.id, sku: v.sku },
            });
            await prisma.channelVariant.upsert({
              where: { tenantId_connectionId_externalId: { tenantId: ctx.tenantId, connectionId, externalId: v.externalId } },
              update: { variantId: variant.id, raw: v },
              create: {
                tenantId: ctx.tenantId,
                connectionId,
                externalId: v.externalId,
                variantId: variant.id,
                asin: (v as any).asin ?? null,
                externalSku: v.sku ?? null,
                raw: v,
              },
            });
          }
        }
      }

      if (opts.orders) {
        const ord = await connector.pullOrdersDelta(config, null);
        for (const o of ord.items) {
          const orderNumber =
            Number.isFinite(Number(o.externalOrderId.replace(/\D/g, '')))
              ? Number(o.externalOrderId.replace(/\D/g, ''))
              : Math.floor(Date.now() / 1000);
          const order = await prisma.order.upsert({
            where: { tenantId_orderNumber: { tenantId: ctx.tenantId, orderNumber } },
            update: {},
            create: { tenantId: ctx.tenantId, orderNumber, currency: 'EUR', totalCents: 0 },
          });
          await prisma.channelOrder.upsert({
            where: { tenantId_connectionId_externalOrderId: { tenantId: ctx.tenantId, connectionId, externalOrderId: o.externalOrderId } },
            update: { orderId: order.id, raw: o.raw ?? null },
            create: { tenantId: ctx.tenantId, connectionId, externalOrderId: o.externalOrderId, orderId: order.id, raw: o.raw ?? null },
          });
        }
      }

      if (opts.inventory) {
        const inv = await connector.pullInventoryDelta(config, null);
        let warehouseId: string;
        const existingWh = await prisma.warehouse.findFirst({ where: { tenantId: ctx.tenantId } });
        if (existingWh) {
          warehouseId = existingWh.id;
        } else {
          const wh = await prisma.warehouse.create({
            data: { tenantId: ctx.tenantId, code: 'WH-DEFAULT', name: 'Default Warehouse' },
          });
          warehouseId = wh.id;
        }
        for (const i of inv.items) {
          const cv = await prisma.channelVariant.findFirst({
            where: { tenantId: ctx.tenantId, connectionId, externalId: i.externalVariantId },
          });
          if (!cv) continue;
          await prisma.stockSnapshot.upsert({
            where: { tenantId_warehouseId_variantId: { tenantId: ctx.tenantId, warehouseId, variantId: cv.variantId } },
            update: { available: i.available, onHand: i.available, reserved: 0 },
            create: {
              tenantId: ctx.tenantId,
              warehouseId,
              variantId: cv.variantId,
              available: i.available,
              onHand: i.available,
              reserved: 0,
            },
          });
        }
      }

      await prisma.integrationConnection.updateMany({
        where: { tenantId: ctx.tenantId, id: connectionId },
        data: { lastSyncAt: new Date(), lastError: null },
      });
      await prisma.auditEvent.create({
        data: {
          tenantId: ctx.tenantId,
          action: 'integration.sync',
          resourceType: 'IntegrationConnection',
          resourceId: connectionId,
          actorUserId: ctx.userId ?? null,
          metadata: {},
        },
      });
    });
  }
}
