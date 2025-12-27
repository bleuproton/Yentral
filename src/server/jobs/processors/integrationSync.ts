import { Job } from '@prisma/client';
import { runSync } from '@/server/integrations/syncEngine';

export async function integrationSync(job: Job) {
  const payload = (job.payload as any) || {};
  const connectionId = payload.connectionId;
  const scope = payload.scope || 'catalog';
  if (!connectionId) throw new Error('connectionId missing');
  await runSync({ tenantId: job.tenantId, connectionId, scope });
}
