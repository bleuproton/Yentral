#!/usr/bin/env node --loader tsx
import { PrismaClient, ConnectorType } from "@prisma/client";
import { InventoryService } from "../../src/domain/inventory/inventory.service.ts";
import { FulfillmentService } from "../../src/domain/fulfillment/fulfillment.service.ts";
import { MappingService } from "../../src/domain/mappings/mapping.service.ts";
import { ChannelCatalogService } from "../../src/domain/mappings/channel-catalog.service.ts";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-tenant-fulfillment" },
    update: {},
    create: { slug: "smoke-tenant-fulfillment", name: "Smoke Tenant Fulfillment" }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH_FF" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH_FF", name: "Fulfillment Warehouse" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "FUL-PROD" } },
    update: {},
    create: { tenantId: tenant.id, sku: "FUL-PROD", name: "Fulfillment Product", priceCents: 2500 }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "FUL-PROD-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "FUL-PROD-V1" }
  });

  const order = await prisma.order.create({
    data: { tenantId: tenant.id, orderNumber: Math.floor(Date.now() / 1000), currency: "EUR", totalCents: 2500 }
  });
  const orderLine = await prisma.orderLine.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      unitCents: 1250,
      totalCents: 2500
    }
  });

  const connector = await prisma.connector.upsert({
    where: { key: "fulfillment-channel" },
    update: { name: "Fulfillment Channel", type: ConnectorType.CHANNEL },
    create: { key: "fulfillment-channel", name: "Fulfillment Channel", type: ConnectorType.CHANNEL }
  });
  const connectorVersion = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: "1.0.0" } },
    update: {},
    create: { connectorId: connector.id, version: "1.0.0" }
  });
  const connection = await prisma.integrationConnection.upsert({
    where: { tenantId_connectorVersionId: { tenantId: tenant.id, connectorVersionId: connectorVersion.id } },
    update: { status: "ACTIVE" },
    create: { tenantId: tenant.id, connectorVersionId: connectorVersion.id, status: "ACTIVE", name: "Fulfillment Conn" }
  });

  const inventory = new InventoryService();
  const fulfillment = new FulfillmentService();
  const mapping = new MappingService();
  const catalog = new ChannelCatalogService();

  await inventory.adjustStock({
    tenantId: tenant.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qtyDelta: 10,
    kind: "RECEIPT",
    reason: "smoke-phase4"
  });

  await inventory.reserveStock({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 2,
    dedupeKey: "ff-rsv-1"
  });

  const shipment = await fulfillment.createShipment({
    tenantId: tenant.id,
    orderId: order.id,
    warehouseId: warehouse.id,
    lines: [{ orderLineId: orderLine.id, variantId: variant.id, qty: 2 }],
    carrier: "DHL",
    trackingNo: "TRACK-FF-1"
  });
  await fulfillment.confirmShipment(tenant.id, shipment.id, { trackingNo: shipment.trackingNo, carrier: shipment.carrier });

  const ret = await fulfillment.receiveReturn({
    tenantId: tenant.id,
    orderId: order.id,
    warehouseId: warehouse.id,
    lines: [{ orderLineId: orderLine.id, variantId: variant.id, qty: 1 }],
    reason: "Smoke return"
  });

  await mapping.upsertWarehouseMapping(tenant.id, connection.id, "EXT_LOC_FF", warehouse.id);
  await catalog.linkVariant(tenant.id, connection.id, "EXT-VAR-FF", variant.id);

  console.log(
    "OK",
    JSON.stringify(
      {
        tenantId: tenant.id,
        shipmentId: shipment.id,
        returnId: ret.id,
        warehouseId: warehouse.id,
        variantId: variant.id
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
