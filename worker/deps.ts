import { prisma as basePrisma } from '@/server/db/prisma';
import { tenantDb as baseTenantDb } from '@/server/db/tenantDb';
import { writeAuditEvent as baseWriteAuditEvent } from '@/server/audit/auditService';

export const prisma = basePrisma;
export const tenantDb = baseTenantDb;
export const writeAuditEvent = baseWriteAuditEvent;
export const deps = { prisma, tenantDb, writeAuditEvent };
