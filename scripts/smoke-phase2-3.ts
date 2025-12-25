#!/usr/bin/env tsx
import { ConnectorType, PrismaClient } from "@prisma/client";
import { InventoryService } from "@/server/services/InventoryService";
import { MappingService } from "@/server/services/MappingService";
import { ChannelCatalogService } from "@/server/services/ChannelCatalogService";
import { ChannelOrderService } from "@/server/services/ChannelOrderService";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-tenant" },
    update: {},
    create: { slug: "demo-tenant", name: "Demo Tenant" }
  });

  const organization = await prisma.organization.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Demo Org" } },
    update: {},
    create: { tenantId: tenant.id, name: "Demo Org" }
  });

  const jurisdiction = await prisma.jurisdiction.upsert({
    where: { code: "EU" },
    update: {},
    create: { code: "EU", countryCode: "EU", currency: "EUR", timezone: "Europe/Brussels" }
  });

  const legalEntity = await prisma.legalEntity.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Demo Legal" } },
    update: {},
    create: {
      tenantId: tenant.id,
      organizationId: organization.id,
      jurisdictionId: jurisdiction.id,
      name: "Demo Legal",
      taxId: "NL123456789B01"
    }
  });

  await prisma.taxProfile.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "EU-OSS" } },
    update: {},
    create: {
      tenantId: tenant.id,
      legalEntityId: legalEntity.id,
      jurisdictionId: jurisdiction.id,
      code: "EU-OSS",
      ossEnabled: true
    }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH1" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH1", name: "Demo Warehouse" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SKU-1" } },
    update: {},
    create: { tenantId: tenant.id, sku: "SKU-1", name: "Demo Product", priceCents: 1000 }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SKU-1-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "SKU-1-V1", ean: "0000000000011" }
  });

  const order = await prisma.order.create({
    data: { tenantId: tenant.id, orderNumber: Math.floor(Date.now() / 1000), currency: "EUR", totalCents: 2000 }
  });
  const orderLine = await prisma.orderLine.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      unitCents: 1000,
      totalCents: 2000
    }
  });

  const connector = await prisma.connector.upsert({
    where: { key: "demo-channel" },
    update: { name: "Demo Channel", type: ConnectorType.CHANNEL },
    create: { key: "demo-channel", name: "Demo Channel", type: ConnectorType.CHANNEL }
  });
  const connectorVersion = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: "1.0.0" } },
    update: {},
    create: { connectorId: connector.id, version: "1.0.0" }
  });
  const connection = await prisma.integrationConnection.upsert({
    where: { tenantId_connectorVersionId: { tenantId: tenant.id, connectorVersionId: connectorVersion.id } },
    update: { status: "ACTIVE" },
    create: { tenantId: tenant.id, connectorVersionId: connectorVersion.id, status: "ACTIVE", name: "Demo Conn" }
  });

  const inventory = new InventoryService();
  const mapping = new MappingService();
  const catalog = new ChannelCatalogService();
  const orders = new ChannelOrderService();

  await inventory.adjustStock({
    tenantId: tenant.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qtyDelta: 10,
    reason: "seed"
  });

  const res1 = await inventory.reserveStock({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 2,
    dedupeKey: "r1"
  });
  const res2 = await inventory.reserveStock({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 2,
    dedupeKey: "r1"
  });
  await inventory.consumeReservation(tenant.id, res1.reservation.id);

  await mapping.upsertWarehouseMapping(tenant.id, connection.id, "EXT_LOC_1", warehouse.id);
  const resolvedWh = await mapping.resolveWarehouse(tenant.id, connection.id, "EXT_LOC_1");

  await catalog.linkVariant(tenant.id, connection.id, "EXT-VAR-1", variant.id, "ASIN1", "EXTSKU1", { demo: true });
  const resolvedVar = await catalog.resolveVariantByExternalId(tenant.id, connection.id, "EXT-VAR-1");

  await orders.linkOrder(tenant.id, connection.id, "EXT-ORD-1", order.id, { items: [{ variantId: variant.id }] });
  const resolvedOrder = await orders.resolveOrderByExternalId(tenant.id, connection.id, "EXT-ORD-1");

  console.log("OK", {
    tenantId: tenant.id,
    warehouseId: resolvedWh?.warehouseId,
    variantMapping: resolvedVar?.id,
    orderMapping: resolvedOrder?.id,
    reservationReused: res2.reused
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
