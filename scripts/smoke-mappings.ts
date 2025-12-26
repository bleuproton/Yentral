#!/usr/bin/env node --loader tsx
import { ConnectorType, PrismaClient } from "@prisma/client";
import { MappingService } from "@/server/integrations/MappingService";
import { ChannelCatalogService } from "@/server/integrations/ChannelCatalogService";
import { ChannelOrderService } from "@/server/integrations/ChannelOrderService";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-mappings" },
    update: {},
    create: { slug: "smoke-mappings", name: "Smoke Mappings Tenant" }
  });

  const connector = await prisma.connector.upsert({
    where: { key: "smoke-mapping-connector" },
    update: { name: "Smoke Mapping Connector", type: ConnectorType.CHANNEL },
    create: { key: "smoke-mapping-connector", name: "Smoke Mapping Connector", type: ConnectorType.CHANNEL }
  });
  const version = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: "1.0.0" } },
    update: {},
    create: { connectorId: connector.id, version: "1.0.0" }
  });
  const connection = await prisma.integrationConnection.upsert({
    where: { tenantId_connectorVersionId: { tenantId: tenant.id, connectorVersionId: version.id } },
    update: { status: "ACTIVE" },
    create: { tenantId: tenant.id, connectorVersionId: version.id, status: "ACTIVE", name: "Smoke Conn" }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-MAP" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-MAP", name: "Warehouse Map" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "MAP-PROD" } },
    update: {},
    create: { tenantId: tenant.id, sku: "MAP-PROD", name: "Mapped Product", priceCents: 1200 }
  });
  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "MAP-PROD-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "MAP-PROD-V1" }
  });

  const mappingService = new MappingService();
  const catalogService = new ChannelCatalogService();
  const orderService = new ChannelOrderService();

  await mappingService.upsertWarehouseMapping(tenant.id, connection.id, "EXT-WH-1", warehouse.id);
  const wh = await mappingService.resolveWarehouse(tenant.id, connection.id, "EXT-WH-1");

  await catalogService.linkVariant(tenant.id, connection.id, "EXT-VAR-1", variant.id, "ASIN-1", "EXTSKU-1");
  const vmap = await catalogService.resolveVariantByExternalId(tenant.id, connection.id, "EXT-VAR-1");

  const order = await prisma.order.create({
    data: { tenantId: tenant.id, orderNumber: Math.floor(Date.now() / 1000), currency: "EUR", totalCents: 1200 }
  });
  await orderService.linkOrder(tenant.id, connection.id, "EXT-ORD-1", order.id, { note: "smoke" });
  const omap = await orderService.resolveOrderByExternalId(tenant.id, connection.id, "EXT-ORD-1");

  console.log("OK", {
    tenantId: tenant.id,
    warehouseMapping: wh?.warehouseId,
    variantMapping: vmap?.id,
    orderMapping: omap?.id
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
