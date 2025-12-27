import { Job } from '@prisma/client';
import { tenantDb } from '@/server/db/tenantDb';
import { writeAuditEvent } from '@/server/audit/auditService';

export async function integrationSync(job: Job) {
  const payload = (job.payload as any) || {};
  const connectionId = payload.connectionId;
  if (!connectionId) throw new Error('connectionId missing');
  const db = tenantDb(job.tenantId);
  await db.integrationConnection.updateMany({
    where: { tenantId: job.tenantId, id: connectionId },
    data: { lastSyncAt: new Date(), lastError: null },
  });
  await writeAuditEvent({
    tenantId: job.tenantId,
    action: 'integration.sync',
    resourceType: 'IntegrationConnection',
    resourceId: connectionId,
    actorUserId: null,
    metadata: { jobId: job.id },
  });
}
