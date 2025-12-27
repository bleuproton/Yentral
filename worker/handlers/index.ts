import { Job } from '@prisma/client';
import { tenantDb, writeAuditEvent } from '../deps';
import { JobTypes } from '../types';

type Handler = (job: Job) => Promise<void>;

const handlers: Record<string, Handler> = {
  [JobTypes.SYNC_CATALOG]: syncConnection,
  [JobTypes.SYNC_CONNECTION]: syncConnection,
  [JobTypes.SYNC_ORDERS]: syncConnection,
};

async function syncConnection(job: Job) {
  const payload = (job.payload as any) || {};
  const connectionId = payload.connectionId;
  if (!connectionId) throw new Error('connectionId missing');
  const db = tenantDb(job.tenantId);
  await db.integrationConnection.update({
    where: { tenantId_id: { tenantId: job.tenantId, id: connectionId } },
    data: { lastSyncAt: new Date(), lastError: null },
  });
  await writeAuditEvent({
    tenantId: job.tenantId,
    actorUserId: null,
    action: 'integration.sync',
    resourceType: 'IntegrationConnection',
    resourceId: connectionId,
    metadata: { jobId: job.id },
  });
}

export function runJobHandler(job: Job) {
  const handler = handlers[job.type];
  if (!handler) throw new Error(`No handler for job type ${job.type}`);
  return handler(job);
}
