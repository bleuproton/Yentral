import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

export function getTenantPrisma(): PrismaClient {
  return prisma;
}

export function withTenantWhere<T extends Record<string, any>>(tenantId: string, where: T = {} as T): T {
  if (!tenantId) throw new Error('tenantId required');
  return { ...(where as any), tenantId };
}

export function ensureCreateTenantId<T extends Record<string, any>>(tenantId: string, data: T): T {
  if (!tenantId) throw new Error('tenantId required');
  if (data && (data as any).tenantId && (data as any).tenantId !== tenantId) {
    throw new Error('Tenant override not allowed');
  }
  return { ...(data as any), tenantId };
}
