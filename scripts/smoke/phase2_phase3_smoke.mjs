#!/usr/bin/env node --loader tsx
import { PrismaClient, ConnectorType } from "@prisma/client";
import { InventoryService } from "../../src/domain/inventory/inventory.service.ts";
import { MappingService } from "../../src/domain/mappings/mapping.service.ts";
import { ChannelCatalogService } from "../../src/domain/mappings/channel-catalog.service.ts";
import { ChannelOrderService } from "../../src/domain/mappings/channel-order.service.ts";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-tenant" },
    update: {},
    create: { slug: "smoke-tenant", name: "Smoke Tenant" }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH_SMOKE" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH_SMOKE", name: "Smoke Warehouse" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SMOKE-PROD" } },
    update: {},
    create: { tenantId: tenant.id, sku: "SMOKE-PROD", name: "Smoke Product", priceCents: 1000 }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SMOKE-PROD-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "SMOKE-PROD-V1", ean: "0000000000123" }
  });

  const order = await prisma.order.create({
    data: { tenantId: tenant.id, orderNumber: Math.floor(Date.now() / 1000), currency: "EUR", totalCents: 1000 }
  });
  const orderLine = await prisma.orderLine.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      unitCents: 1000,
      totalCents: 1000
    }
  });

  const connector = await prisma.connector.upsert({
    where: { key: "smoke-channel" },
    update: { name: "Smoke Channel", type: ConnectorType.CHANNEL },
    create: { key: "smoke-channel", name: "Smoke Channel", type: ConnectorType.CHANNEL }
  });
  const connectorVersion = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: "1.0.0" } },
    update: {},
    create: { connectorId: connector.id, version: "1.0.0" }
  });
  const connection = await prisma.integrationConnection.upsert({
    where: { tenantId_connectorVersionId: { tenantId: tenant.id, connectorVersionId: connectorVersion.id } },
    update: { status: "ACTIVE" },
    create: { tenantId: tenant.id, connectorVersionId: connectorVersion.id, status: "ACTIVE", name: "Smoke Conn" }
  });

  const inventory = new InventoryService();
  const mapping = new MappingService();
  const catalog = new ChannelCatalogService();
  const channelOrders = new ChannelOrderService();

  await inventory.adjustStock({
    tenantId: tenant.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qtyDelta: 5,
    kind: "RECEIPT",
    reason: "smoke"
  });

  await inventory.reserveStock({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 1,
    dedupeKey: "smoke-r1"
  });
  await inventory.consumeReservation(tenant.id, (await prisma.stockReservation.findFirst({ where: { tenantId: tenant.id, dedupeKey: "smoke-r1" } }))?.id || "");

  await mapping.upsertWarehouseMapping(tenant.id, connection.id, "EXT_LOC_SMOKE", warehouse.id);
  const whMap = await mapping.resolveWarehouse(tenant.id, connection.id, "EXT_LOC_SMOKE");

  await catalog.linkVariant(tenant.id, connection.id, "EXT-VAR-SMOKE", variant.id, "ASIN-SMOKE", "EXTSKU-SMOKE");
  const varMap = await catalog.resolveVariantByExternalId(tenant.id, connection.id, "EXT-VAR-SMOKE");

  await channelOrders.linkOrder(tenant.id, connection.id, "EXT-ORD-SMOKE", order.id, { note: "smoke" });
  const ordMap = await channelOrders.resolveOrderByExternalId(tenant.id, connection.id, "EXT-ORD-SMOKE");

  console.log("OK", {
    tenantId: tenant.id,
    warehouseId: whMap?.warehouseId,
    variantMapId: varMap?.id,
    orderMapId: ordMap?.id
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
