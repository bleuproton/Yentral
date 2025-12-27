import { Job } from '@prisma/client';
import { integrationSync } from './integrationSync';
import { mailboxSync } from './mailboxSync';
import { writeAuditEvent } from '@/server/audit/auditService';
import { tenantDb } from '@/server/db/tenantDb';

type Processor = (job: Job, correlationId?: string) => Promise<void>;

const registry: Record<string, Processor> = {
  'integration.sync': integrationSync,
  // alias for legacy uppercase sync jobs
  SYNC_CONNECTION: integrationSync,
  'mailbox.sync': mailboxSync,
  'test.noop': async (job: Job) => {
    await writeAuditEvent({
      tenantId: job.tenantId,
      action: 'job.test.noop',
      resourceType: 'Job',
      resourceId: job.id,
      actorUserId: null,
      metadata: {},
    });
  },
  'vat.rebuild': async (job: Job) => {
    await writeAuditEvent({
      tenantId: job.tenantId,
      action: 'vat.rebuild',
      resourceType: 'Job',
      resourceId: job.id,
    });
  },
  'oss.export': async (job: Job) => {
    await writeAuditEvent({
      tenantId: job.tenantId,
      action: 'oss.export',
      resourceType: 'Job',
      resourceId: job.id,
    });
  },
  SMOKE_TEST: async (job: Job) => {
    if (!job.tenantId) throw new Error('tenantId required');
    await writeAuditEvent({
      tenantId: job.tenantId,
      action: 'SMOKE_TEST',
      resourceType: 'Job',
      resourceId: job.id,
      actorUserId: null,
      metadata: { ok: true },
    });
  },
};

export function getProcessor(type: string): Processor | undefined {
  return registry[type];
}
