import { tenantDb } from '@/server/db/tenantDb';
import { writeAudit } from '@/server/audit/audit';
import { Job, PrismaClient } from '@prisma/client';
import { JobTypes } from '../types';

type Handler = (job: Job, db: PrismaClient) => Promise<void>;

const handlers: Record<string, Handler> = {
  [JobTypes.SYNC_CONNECTION]: async (job, db) => {
    const payload = (job.payload as any) || {};
    const connectionId = payload.connectionId as string | undefined;
    if (!connectionId) throw new Error('connectionId missing in payload');
    await db.integrationConnection.update({
      where: { tenantId_id: { tenantId: job.tenantId, id: connectionId } },
      data: { lastSyncAt: new Date(), lastError: null, status: 'ACTIVE' },
    });
    await writeAudit(job.tenantId, null, 'integration.sync', 'IntegrationConnection', connectionId, { jobId: job.id });
  },
};

export async function runJobHandler(job: Job) {
  const handler = handlers[job.type];
  if (!handler) throw new Error(`No handler for job type ${job.type}`);
  const db = tenantDb(job.tenantId);
  await handler(job, db);
}
