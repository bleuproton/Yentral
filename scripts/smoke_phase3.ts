import { ConnectorType } from "@prisma/client";
import { prisma } from "../src/server/db/prisma";
import { MappingService } from "../src/server/services/mappingService";
import { ChannelCatalogService } from "../src/server/services/channelCatalogService";
import { ChannelOrderService } from "../src/server/services/channelOrderService";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-channel" },
    update: {},
    create: { slug: "demo-channel", name: "Demo Channel Tenant" }
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

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH_DEMO" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH_DEMO", name: "Demo Warehouse" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SKU-DEMO-1" } },
    update: {},
    create: {
      tenantId: tenant.id,
      sku: "SKU-DEMO-1",
      name: "Demo Product",
      priceCents: 1000,
      description: "Demo product for channel smoke",
      status: "ACTIVE"
    }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SKU-DEMO-1-V1" } },
    update: {},
    create: {
      tenantId: tenant.id,
      productId: product.id,
      sku: "SKU-DEMO-1-V1",
      ean: "0000000000011"
    }
  });

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: Math.floor(Date.now() / 1000),
      status: "PENDING",
      currency: "USD",
      totalCents: 1000
    }
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

  const connection =
    (await prisma.integrationConnection.findFirst({
      where: { tenantId: tenant.id, connectorVersionId: connectorVersion.id }
    })) ??
    (await prisma.integrationConnection.create({
      data: {
        tenantId: tenant.id,
        connectorVersionId: connectorVersion.id,
        status: "ACTIVE",
        name: "Demo Channel Connection"
      }
    }));

  const mappingService = new MappingService();
  const catalogService = new ChannelCatalogService();
  const channelOrderService = new ChannelOrderService();

  const mapping = await mappingService.upsertWarehouseMapping(tenant.id, connection.id, "EXT_LOC_1", warehouse.id);
  const resolvedWarehouse = await mappingService.resolveWarehouse(tenant.id, connection.id, "EXT_LOC_1");

  const channelProduct = await catalogService.linkProduct(tenant.id, connection.id, "EXT-PROD-1", product.id);
  const channelVariant = await catalogService.linkVariant(
    tenant.id,
    connection.id,
    "EXT-VAR-1",
    variant.id,
    "ASIN0001",
    "EXTSKU-001"
  );

  const channelOrder = await channelOrderService.linkOrder(tenant.id, connection.id, "EXT-ORDER-1", order.id, {
    externalStatus: "CREATED",
    items: [{ externalId: "EXT-VAR-1", orderLineId: orderLine.id }]
  });

  console.log("Warehouse mapping created:", mapping);
  console.log("Warehouse mapping resolved:", resolvedWarehouse);
  console.log("Channel product linked:", channelProduct);
  console.log("Channel variant linked:", channelVariant);
  console.log("Channel order linked:", channelOrder);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
