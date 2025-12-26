import { PrismaClient, Prisma } from '@prisma/client';

export async function getOrCreateTenant(prisma: PrismaClient) {
  return prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: { name: 'Demo Tenant' },
    create: { slug: 'demo', name: 'Demo Tenant' },
  });
}

export async function getOrCreateJurisdiction(prisma: PrismaClient, code: string) {
  return prisma.jurisdiction.upsert({
    where: { code },
    update: {},
    create: {
      code,
      countryCode: code.slice(0, 2) || 'XX',
      currency: code.startsWith('US') ? 'USD' : 'EUR',
      timezone: 'UTC',
    },
  });
}

export async function getOrCreateOrganization(prisma: PrismaClient, tenantId: string, name: string) {
  return prisma.organization.upsert({
    where: { tenantId_name: { tenantId, name } },
    update: {},
    create: { tenantId, name },
  });
}

export async function getOrCreateLegalEntity(
  prisma: PrismaClient,
  tenantId: string,
  organizationId: string,
  jurisdictionId: string,
  name: string
) {
  return prisma.legalEntity.upsert({
    where: { tenantId_name: { tenantId, name } },
    update: { organizationId, jurisdictionId },
    create: { tenantId, organizationId, jurisdictionId, name },
  });
}

export async function getOrCreateTaxProfile(
  prisma: PrismaClient,
  tenantId: string,
  legalEntityId: string,
  jurisdictionId: string,
  code: string
) {
  return prisma.taxProfile.upsert({
    where: { tenantId_code: { tenantId, code } },
    update: { legalEntityId, jurisdictionId },
    create: { tenantId, legalEntityId, jurisdictionId, code },
  });
}

export async function getOrCreateWarehouse(prisma: PrismaClient, tenantId: string, code: string) {
  return prisma.warehouse.upsert({
    where: { tenantId_code: { tenantId, code } },
    update: { name: code },
    create: { tenantId, code, name: code },
  });
}

export async function getOrCreateProduct(prisma: PrismaClient, tenantId: string, sku: string) {
  return prisma.product.upsert({
    where: { tenantId_sku: { tenantId, sku } },
    update: { name: sku },
    create: { tenantId, sku, name: sku, priceCents: 1000 },
  });
}

export async function getOrCreateVariant(prisma: PrismaClient, tenantId: string, productId: string, sku: string) {
  return prisma.productVariant.upsert({
    where: { tenantId_sku: { tenantId, sku } },
    update: { productId },
    create: { tenantId, productId, sku },
  });
}

export async function getOrCreateCustomer(prisma: PrismaClient, tenantId: string, email: string) {
  return prisma.customer.upsert({
    where: { tenantId_email: { tenantId, email } },
    update: { name: 'Smoke Customer' },
    create: { tenantId, email, name: 'Smoke Customer' },
  });
}

export async function getOrCreateConnectorAndVersion(prisma: PrismaClient, key: string, version: string) {
  const connector = await prisma.connector.upsert({
    where: { key },
    update: { name: key },
    create: { key, name: key, type: 'CHANNEL' },
  });
  const connectorVersion = await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version } },
    update: {},
    create: { connectorId: connector.id, version },
  });
  return { connector, version: connectorVersion };
}

export async function getOrCreateConnection(
  prisma: PrismaClient,
  tenantId: string,
  connectorVersionId: string,
  name: string
) {
  return prisma.integrationConnection.upsert({
    where: { id: `smoke-conn-${name}` },
    update: { tenantId, connectorVersionId, name, status: 'ACTIVE' },
    create: { id: `smoke-conn-${name}`, tenantId, connectorVersionId, name, status: 'ACTIVE' },
  });
}
