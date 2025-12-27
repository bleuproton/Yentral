import { tenantDb } from '../db/tenantDb';

export async function writeAuditEvent(params: {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
}) {
  const db = tenantDb(params.tenantId);
  try {
    await db.auditEvent.create({
      data: {
        tenantId: params.tenantId,
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata,
      },
    });
  } catch {
    // best-effort
  }
}

export const recordAudit = writeAuditEvent;
