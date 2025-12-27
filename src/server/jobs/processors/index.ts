import { Job } from '@prisma/client';
import { integrationSync } from './integrationSync';
import { mailboxSync } from './mailboxSync';
import { tenantDb } from '@/server/db/tenantDb';
import { writeAuditEvent } from '@/server/audit/auditService';

type Processor = (job: Job, correlationId?: string) => Promise<void>;

const registry: Record<string, Processor> = {
  'integration.sync': integrationSync,
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
};

export function getProcessor(type: string): Processor | undefined {
  return registry[type];
}
