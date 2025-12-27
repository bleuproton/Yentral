import { prisma } from './prisma';
import { applyTenantGuard } from './tenantGuard';

applyTenantGuard(prisma);

export { prisma };
