import { randomUUID } from 'crypto';
import { prisma } from '@/server/db/prisma';
import { withContext } from '@/server/tenant/als';

async function ensureTenant() {
  const existing = await prisma.tenant.findFirst();
  if (existing) return existing;
  return prisma.tenant.create({
    data: {
      name: 'Smoke Tenant 7A',
      slug: `smoke-tenant-7a-${randomUUID().slice(0, 8)}`,
    },
  });
}

async function main() {
  const tenant = await ensureTenant();

  await withContext({ tenantId: tenant.id }, async () => {
    await prisma.product.findMany(); // should succeed with tenant guard in place
  });

  // simple second run to ensure idempotence
  await withContext({ tenantId: tenant.id }, async () => {
    await prisma.product.findMany({ where: { tenantId: tenant.id } });
  });

  // eslint-disable-next-line no-console
  console.log('SMOKE PASS phase7a');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error('SMOKE FAIL phase7a', err);
    await prisma.$disconnect();
    process.exit(1);
  });
