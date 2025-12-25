#!/usr/bin/env tsx
import { StockLedgerKind } from "@prisma/client";
import prisma from "@/server/db/prisma";
import { InventoryService } from "@/server/services/inventoryService";
import { OrderStatus } from "@prisma/client";

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");

  const product =
    (await prisma.product.findFirst({ where: { tenantId: tenant.id } })) ||
    (await prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: "SMOKE-PROD",
        name: "Smoke Product",
        priceCents: 1000,
        currency: "USD",
        status: "ACTIVE"
      }
    }));

  const variant =
    (await prisma.productVariant.findFirst({ where: { tenantId: tenant.id, productId: product.id } })) ||
    (await prisma.productVariant.create({
      data: {
        tenantId: tenant.id,
        productId: product.id,
        sku: "SMOKE-VAR",
        ean: "0000000000000"
      }
    }));

  const warehouse =
    (await prisma.warehouse.findFirst({ where: { tenantId: tenant.id } })) ||
    (await prisma.warehouse.create({
      data: { tenantId: tenant.id, code: "SMOKE_WH", name: "Smoke Warehouse" }
    }));

  const order =
    (await prisma.order.findFirst({ where: { tenantId: tenant.id } })) ||
    (await prisma.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber: 99999,
        status: OrderStatus.PENDING,
        currency: "USD",
        totalCents: 0
      }
    }));

  const orderLine =
    (await prisma.orderLine.findFirst({ where: { tenantId: tenant.id, orderId: order.id } })) ||
    (await prisma.orderLine.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
        unitCents: 1000,
        totalCents: 1000
      }
    }));

  const service = new InventoryService();

  console.log("Adjust +10 onHand");
  await service.adjustStock(tenant.id, warehouse.id, variant.id, 10, StockLedgerKind.RECEIPT);

  console.log("Reserve 3");
  const reserve = await service.reserveStock(tenant.id, orderLine.id, warehouse.id, variant.id, 3);
  console.log("Reservation", reserve.reservation?.id ?? reserve);

  console.log("Consume reservation");
  if ("reservation" in reserve) {
    await service.consumeReservation(tenant.id, reserve.reservation.id);
  }

  const snapshot = await prisma.stockSnapshot.findMany({ where: { tenantId: tenant.id, variantId: variant.id } });
  console.log("Snapshots", snapshot);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
