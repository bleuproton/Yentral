#!/usr/bin/env tsx
import { ConnectorType, PrismaClient, StockLedgerKind } from "@prisma/client";
import { InventoryService } from "@/domain/inventory/inventory.service";
import { MappingService } from "@/domain/mappings/mapping.service";
import { ChannelCatalogService } from "@/domain/mappings/channel-catalog.service";
import { ChannelOrderService } from "@/domain/mappings/channel-order.service";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-phase2-3" },
    update: {},
    create: { slug: "smoke-phase2-3", name: "Smoke Phase2-3 Tenant" }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-PH23" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-PH23", name: "Smoke Warehouse" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SKU-PH23" } },
    update: {},
    create: { tenantId: tenant.id, sku: "SKU-PH23", name: "Smoke Product", priceCents: 1500 }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SKU-PH23-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "SKU-PH23-V1", ean: "0000000000099" }
  });

  const order = await prisma.order.create({
    data: { tenantId: tenant.id, orderNumber: Math.floor(Date.now() / 1000), currency: "EUR", totalCents: 1500 }
  });
  const orderLine = await prisma.orderLine.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      unitCents: 1500,
      totalCents: 1500
    }
  });

  const connector = await prisma.connector.upsert({
    where: { key: "smoke-ph23-channel" },
    update: { name: "Smoke PH23 Channel", type: ConnectorType.CHANNEL },
    create: { key: "smoke-ph23-channel", name: "Smoke PH23 Channel", type: ConnectorType.CHANNEL }
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
    kind: StockLedgerKind.RECEIPT,
    reason: "smoke"
  });

  const reservation = await inventory.reserveStock({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 1,
    dedupeKey: "ph23-r1"
  });

  await mapping.upsertWarehouseMapping(tenant.id, connection.id, "EXT_LOC_PH23", warehouse.id);
  const whMap = await mapping.resolveWarehouse(tenant.id, connection.id, "EXT_LOC_PH23");

  await catalog.linkVariant(tenant.id, connection.id, "EXT-VAR-PH23", variant.id, "ASIN-PH23", "EXTSKU-PH23", {
    note: "smoke"
  });
  const varMap = await catalog.resolveVariantByExternalId(tenant.id, connection.id, "EXT-VAR-PH23");

  await channelOrders.linkOrder(tenant.id, connection.id, "EXT-ORD-PH23", order.id, { note: "smoke" });
  const ordMap = await channelOrders.resolveOrderByExternalId(tenant.id, connection.id, "EXT-ORD-PH23");

  console.log("OK", {
    tenantId: tenant.id,
    reservationReused: reservation.reused,
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
