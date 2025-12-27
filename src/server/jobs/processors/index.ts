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
  EXPORT_VAT_OSS: async (job: Job) => exportReport(job),
  EXPORT_GL: async (job: Job) => exportReport(job),
  EXPORT_INVOICES: async (job: Job) => exportReport(job),
};

async function exportReport(job: Job) {
  if (!job.tenantId) throw new Error('tenantId required');
  const payload: any = job.payload || {};
  const reportId = payload.reportExportId;
  if (!reportId) throw new Error('reportExportId required');
  const db = tenantDb(job.tenantId);
  await db.reportExport.updateMany({
    where: { tenantId: job.tenantId, id: reportId },
    data: {
      status: 'COMPLETED',
      outputUrl: `generated://${job.type}/${reportId}`,
      meta: { jobId: job.id, type: job.type },
    },
  });
  await writeAuditEvent({
    tenantId: job.tenantId,
    action: 'report.export.completed',
    resourceType: 'ReportExport',
    resourceId: reportId,
  });
}

export function getProcessor(type: string): Processor | undefined {
  return registry[type];
}
