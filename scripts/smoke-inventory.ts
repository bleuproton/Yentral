#!/usr/bin/env node --loader tsx
import { PrismaClient, StockLedgerKind } from "@prisma/client";
import { InventoryService } from "@/server/inventory/InventoryService";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-inventory" },
    update: {},
    create: { slug: "smoke-inventory", name: "Smoke Inventory Tenant" }
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "WH-INV" } },
    update: {},
    create: { tenantId: tenant.id, code: "WH-INV", name: "Inventory Warehouse" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "INV-PROD" } },
    update: {},
    create: { tenantId: tenant.id, sku: "INV-PROD", name: "Inventory Product", priceCents: 1000 }
  });

  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "INV-PROD-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "INV-PROD-V1" }
  });

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: Math.floor(Date.now() / 1000),
      currency: "EUR",
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

  const inventory = new InventoryService();

  console.log("Adjust +10 RECEIPT");
  await inventory.adjustStock({
    tenantId: tenant.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qtyDelta: 10,
    kind: StockLedgerKind.RECEIPT,
    reason: "seed"
  });

  console.log("Reserve 3");
  const res = await inventory.reserve({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 3,
    dedupeKey: "smoke-inv-1"
  });

  console.log("Release 1");
  await inventory.releaseReservation({ tenantId: tenant.id, reservationId: res.reservation.id });

  console.log("Consume remaining (creates new res first)");
  const res2 = await inventory.reserve({
    tenantId: tenant.id,
    orderLineId: orderLine.id,
    warehouseId: warehouse.id,
    variantId: variant.id,
    qty: 2
  });
  await inventory.consumeReservation({ tenantId: tenant.id, reservationId: res2.reservation.id });

  const snapshot = await inventory.getAvailability({
    tenantId: tenant.id,
    warehouseId: warehouse.id,
    variantId: variant.id
  });
  const reservations = await prisma.stockReservation.findMany({ where: { tenantId: tenant.id } });

  console.log("Snapshot", snapshot);
  console.log("Reservations", reservations.map((r) => ({ id: r.id, status: r.status, qty: r.qty })));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
