import { PrismaClient } from '@prisma/client';
import basePrisma from '@/lib/prisma';
import { applyTenantGuard } from './tenantGuard';

export const prisma: PrismaClient = basePrisma;
applyTenantGuard(prisma);

export const GLOBAL_MODELS = new Set<string>([
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'Jurisdiction',
  'Connector',
  'ConnectorVersion',
  'Plugin',
  'Tenant',
]);

export type { PrismaClient } from '@prisma/client';

export async function withTx<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => fn(tx as PrismaClient));
}

export function getPrisma(): PrismaClient {
  return prisma;
}
