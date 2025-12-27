import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("➡️  Seeding tenant, org, jurisdiction, legal entity, warehouses, connectors, admin user...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: { slug: "demo", name: "Demo Tenant" }
  });
  console.log(`✅ Tenant: ${tenant.slug}`);

  const org = await prisma.organization.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: "Demo Org" } },
    update: {},
    create: { tenantId: tenant.id, name: "Demo Org" }
  });
  console.log(`✅ Organization: ${org.name}`);

  const jurisdictions = [
    // Regionaal
    { code: "EU", countryCode: "EU", currency: "EUR", timezone: "Europe/Brussels" },
    { code: "US", countryCode: "US", currency: "USD", timezone: "America/New_York" },
    { code: "UK", countryCode: "GB", currency: "GBP", timezone: "Europe/London" },
    // EU landen
    { code: "NL", countryCode: "NL", currency: "EUR", timezone: "Europe/Amsterdam" },
    { code: "DE", countryCode: "DE", currency: "EUR", timezone: "Europe/Berlin" },
    { code: "FR", countryCode: "FR", currency: "EUR", timezone: "Europe/Paris" },
    { code: "IT", countryCode: "IT", currency: "EUR", timezone: "Europe/Rome" },
    { code: "ES", countryCode: "ES", currency: "EUR", timezone: "Europe/Madrid" },
    { code: "BE", countryCode: "BE", currency: "EUR", timezone: "Europe/Brussels" },
    { code: "PL", countryCode: "PL", currency: "PLN", timezone: "Europe/Warsaw" },
    // US states basis
    { code: "US-CA", countryCode: "US", currency: "USD", timezone: "America/Los_Angeles" },
    { code: "US-NY", countryCode: "US", currency: "USD", timezone: "America/New_York" },
    { code: "US-TX", countryCode: "US", currency: "USD", timezone: "America/Chicago" }
  ];
  for (const j of jurisdictions) {
    await prisma.jurisdiction.upsert({
      where: { code: j.code },
      update: { countryCode: j.countryCode, currency: j.currency, timezone: j.timezone },
      create: { id: j.code, code: j.code, countryCode: j.countryCode, currency: j.currency, timezone: j.timezone }
    });
    console.log(`✅ Jurisdiction: ${j.code} (${j.currency}, ${j.timezone})`);
  }

  const legalEntities = [
    { code: "EU_ENTITY", name: "EU Entity", jurisdiction: "EU", taxId: "EUOSS" },
    { code: "NL_ENTITY", name: "NL Entity", jurisdiction: "NL", taxId: "NL123456789B01" },
    { code: "DE_ENTITY", name: "DE Entity", jurisdiction: "DE", taxId: "DE123456789" },
    { code: "US_ENTITY", name: "US Entity", jurisdiction: "US", taxId: "US-EIN-1234" }
  ];

  const legalEntityMap = new Map();

  for (const le of legalEntities) {
    const jurisdiction = jurisdictions.find((j) => j.code === le.jurisdiction);
    if (!jurisdiction) continue;
    const created = await prisma.legalEntity.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: le.name } },
      update: { taxId: le.taxId },
      create: {
        tenantId: tenant.id,
        organizationId: org.id,
        jurisdictionId: le.jurisdiction,
        name: le.name,
        taxId: le.taxId
      }
    });
    legalEntityMap.set(le.jurisdiction, created.id);
    console.log(`✅ Legal entity: ${created.name} (${le.jurisdiction})`);
  }

  const taxProfiles = [
    { code: "EU_OSS", legalJurisdiction: "EU", ossEnabled: true },
    { code: "NL_VAT", legalJurisdiction: "NL", ossEnabled: false },
    { code: "DE_VAT", legalJurisdiction: "DE", ossEnabled: false },
    { code: "US_SALES_TAX", legalJurisdiction: "US", ossEnabled: false }
  ];

  for (const tp of taxProfiles) {
    const leId = legalEntityMap.get(tp.legalJurisdiction);
    if (!leId) continue;
    await prisma.taxProfile.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: tp.code } },
      update: { ossEnabled: tp.ossEnabled },
      create: {
        tenantId: tenant.id,
        legalEntityId: leId,
        jurisdictionId: tp.legalJurisdiction,
        code: tp.code,
        ossEnabled: tp.ossEnabled
      }
    });
    console.log(`✅ Tax profile: ${tp.code} (${tp.legalJurisdiction})`);
  }

  const wh1 = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "NL_INTERNAL" } },
    update: {},
    create: { tenantId: tenant.id, code: "NL_INTERNAL", name: "NL Internal" }
  });
  const wh2 = await prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "AMAZON_FBA_EU" } },
    update: {},
    create: { tenantId: tenant.id, code: "AMAZON_FBA_EU", name: "Amazon FBA EU" }
  });
  console.log(`✅ Warehouses: ${wh1.code}, ${wh2.code}`);

  const connectorAmazon = await prisma.connector.upsert({
    where: { key: "amazon-sp-api" },
    update: { name: "Amazon SP-API" },
    create: { key: "amazon-sp-api", name: "Amazon SP-API", type: "CHANNEL", description: "Amazon Selling Partner API" }
  });
  const connectorBol = await prisma.connector.upsert({
    where: { key: "bol-seller" },
    update: { name: "bol.com Seller API" },
    create: { key: "bol-seller", name: "bol.com Seller API", type: "CHANNEL", description: "Bol.com Seller API" }
  });
  console.log("✅ Connectors: Amazon SP-API, bol.com Seller API");

  const versionAmazon = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connectorAmazon.id, version: "1.0.0" } },
    update: {},
    create: { connectorId: connectorAmazon.id, version: "1.0.0" }
  });
  const versionBol = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connectorBol.id, version: "1.0.0" } },
    update: {},
    create: { connectorId: connectorBol.id, version: "1.0.0" }
  });
  console.log("✅ Connector versions: 1.0.0 for both");

  const passwordHash = bcrypt.hashSync("Admin123!", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@yentral.local" },
    update: { password: passwordHash, name: "Demo Admin" },
    create: {
      email: "admin@yentral.local",
      name: "Demo Admin",
      password: passwordHash
    }
  });
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId: tenant.id } },
    update: { role: Role.OWNER },
    create: { userId: user.id, tenantId: tenant.id, role: Role.OWNER }
  });
  console.log("✅ Admin user: admin@yentral.local / Admin123! (role OWNER)");

  console.log("➡️  Seeding customer/order/invoice demo");
  const customer = await prisma.customer.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "customer@yentral.test" } },
    update: { name: "Demo Customer" },
    create: { tenantId: tenant.id, email: "customer@yentral.test", name: "Demo Customer" }
  });
  const product = await prisma.product.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SEED-P1" } },
    update: {},
    create: { tenantId: tenant.id, sku: "SEED-P1", name: "Seed Product", priceCents: 1000 }
  });
  const variant = await prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId: tenant.id, sku: "SEED-P1-V1" } },
    update: {},
    create: { tenantId: tenant.id, productId: product.id, sku: "SEED-P1-V1" }
  });
  const order = await prisma.order.upsert({
    where: { id: "seed-order" },
    update: {},
    create: {
      id: "seed-order",
      tenantId: tenant.id,
      customerId: customer.id,
      orderNumber: 5001,
      currency: "EUR",
      totalCents: 1000
    }
  });
  const orderLine = await prisma.orderLine.upsert({
    where: { id: "seed-orderline" },
    update: {},
    create: {
      id: "seed-orderline",
      tenantId: tenant.id,
      orderId: order.id,
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      unitCents: 1000,
      totalCents: 1000
    }
  });
  await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 1,
      orderId: order.id,
      legalEntityId: legalEntityMap.values().next().value,
      taxProfileId: null,
      status: "DRAFT",
      currency: "EUR",
      subtotalCents: 1000,
      taxCents: 0,
      totalCents: 1000,
      lines: {
        create: [
          {
            orderLineId: orderLine.id,
            description: "Seed line",
            qty: 1,
            unitCents: 1000,
            totalCents: 1000
          }
        ]
      }
    }
  });
  console.log("✅ Seed invoice created");

  console.log("🎉 Seed complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
