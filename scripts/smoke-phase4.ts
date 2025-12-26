#!/usr/bin/env node --loader tsx
import { PrismaClient, StockLedgerKind } from "@prisma/client";
import { InventoryService } from "@/server/inventory/InventoryService";
import { FulfillmentService } from "@/_legacy/services/fulfillment/FulfillmentService";
import { ReturnsService } from "@/_legacy/services/returns/ReturnsService";

const prisma = new PrismaClient();
const inventory = new InventoryService();
const fulfillment = new FulfillmentService();
const returnsService = new ReturnsService();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-phase4" },
    update: {},
    create: { slug: "smoke-phase4", name: "Smoke Phase4 Tenant" }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-P4" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-P4", name: "WH Phase4" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "P4-PROD" } },
    update: {},
    create: { tenantId: tenant.id, sku: "P4-PROD", name: "P4 Product", priceCents: 1500 }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "P4-PROD-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "P4-PROD-V1" }
  });

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: Math.floor(Date.now() / 1000),
      currency: "EUR",
      totalCents: 3000
    }
  });

  const orderLine = await prisma.orderLine.create({
    data: {
      tenantId: tenant.id,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      unitCents: 1500,
      totalCents: 3000
    }
  });

  await inventory.adjustStock({
    tenantId: tenant.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qtyDelta: 5,
    kind: StockLedgerKind.RECEIPT,
    reason: "seed"
  });

  await inventory.reserve({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 2,
    dedupeKey: "p4-r1"
  });

  const shipment = await fulfillment.createShipment(tenant.id, null, {
    orderId: order.id,
    warehouseId: warehouse.id,
    lines: [{ orderLineId: orderLine.id, qty: 2 }]
  });
  await fulfillment.markShipmentShipped(tenant.id, null, shipment.id, { carrier: "DHL" });

  const ret = await returnsService.createReturn(tenant.id, null, {
    orderId: order.id,
    reason: "test",
    lines: [{ orderLineId: orderLine.id, variantId: variant.id, qty: 1 }]
  });
  await returnsService.approveReturn(tenant.id, null, ret.id);
  await returnsService.receiveReturn(tenant.id, null, {
    returnId: ret.id,
    restockWarehouseId: warehouse.id
  });
  await returnsService.refundReturn(tenant.id, null, ret.id);

  const ledger = await prisma.stockLedger.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" } });
  const snapshot = await prisma.stockSnapshot.findMany({ where: { tenantId: tenant.id, variantId: variant.id } });
  const reservations = await prisma.stockReservation.findMany({ where: { tenantId: tenant.id } });

  console.log(
    "OK",
    JSON.stringify(
      {
        shipmentId: shipment.id,
        returnId: ret.id,
        ledger: ledger.map((l) => ({ kind: l.kind, qtyDelta: l.qtyDelta, refType: l.refType })),
        snapshot,
        reservations: reservations.map((r) => ({ id: r.id, status: r.status, qty: r.qty }))
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
