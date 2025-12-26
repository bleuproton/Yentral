#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "smoke-phase5" },
    update: {},
    create: { slug: "smoke-phase5", name: "Smoke Phase5" }
  });

  const customer = await prisma.customer.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "c@s.com" } },
    update: { name: "Smoke Customer" },
    create: { tenantId: tenant.id, email: "c@s.com", name: "Smoke Customer" }
  });

  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "P5" } },
    update: {},
    create: { tenantId: tenant.id, sku: "P5", name: "Phase5", priceCents: 1000 }
  });
  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "P5-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "P5-V1" }
  });

  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      orderNumber: Math.floor(Date.now() / 1000),
      currency: "EUR",
      totalCents: 1000
    }
  });
  await prisma.orderLine.create({
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

  // create invoice draft
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 1,
      orderId: order.id,
      legalEntityId: (await prisma.legalEntity.findFirst({ where: { tenantId: tenant.id } }))?.id ?? "",
      taxProfileId: null,
      status: "DRAFT",
      currency: "EUR",
      subtotalCents: 1000,
      taxCents: 0,
      totalCents: 1000
    }
  });
  await prisma.invoiceLine.create({
    data: {
      tenantId: tenant.id,
      invoiceId: invoice.id,
      orderLineId: (await prisma.orderLine.findFirst({ where: { tenantId: tenant.id, orderId: order.id } }))?.id ?? null,
      description: "Line",
      qty: 1,
      unitCents: 1000,
      totalCents: 1000
    }
  });

  const fetched = await prisma.invoice.findFirst({ where: { tenantId: tenant.id, id: invoice.id }, include: { lines: true } });
  console.log("OK", { invoiceId: invoice.id, lines: fetched?.lines?.length ?? 0 });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
