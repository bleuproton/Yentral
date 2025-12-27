import { PrismaClient } from '@prisma/client';
import { tenantDb } from '../db/tenantDb';

export async function writeAudit(
  tenantId: string,
  actorUserId: string | null,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: any
) {
  const db = tenantDb(tenantId);
  try {
    await db.auditEvent.create({
      data: {
        tenantId,
        actorUserId: actorUserId ?? null,
        action,
        resourceType,
        resourceId,
        metadata,
      },
    });
  } catch {
    // swallow audit errors to avoid blocking business flow
  }
}
