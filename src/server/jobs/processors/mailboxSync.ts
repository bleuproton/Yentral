import { Job } from '@prisma/client';
import { tenantDb } from '@/server/db/tenantDb';
import { writeAuditEvent } from '@/server/audit/auditService';

export async function mailboxSync(job: Job) {
  const payload = (job.payload as any) || {};
  const mailboxId = payload.mailboxId;
  if (!mailboxId) throw new Error('mailboxId missing');
  const db = tenantDb(job.tenantId);
  await db.mailbox.updateMany({
    where: { tenantId: job.tenantId, id: mailboxId },
    data: { lastSyncAt: new Date(), lastError: null },
  });
  await writeAuditEvent({
    tenantId: job.tenantId,
    action: 'mailbox.sync',
    resourceType: 'Mailbox',
    resourceId: mailboxId,
    actorUserId: null,
    metadata: { jobId: job.id },
  });
}
