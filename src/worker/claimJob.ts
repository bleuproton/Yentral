import { prisma } from '@/server/db/prisma';
import { JobStatus } from '@prisma/client';

const STALE_LOCK_MS = 5 * 60 * 1000;

export async function claimNextJob() {
  const now = new Date();
  const staleLock = new Date(now.getTime() - STALE_LOCK_MS);

  return prisma.$transaction(async (tx) => {
    const job = await tx.job.findFirst({
      where: {
        status: JobStatus.PENDING,
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
        OR: [{ lockedAt: null }, { lockedAt: { lte: staleLock } }],
      },
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
    if (!job) return null;

    const updated = await tx.job.update({
      where: { id: job.id, status: JobStatus.PENDING },
      data: {
        status: JobStatus.RUNNING,
        lockedAt: now,
        startedAt: now,
        attempts: job.attempts + 1,
      },
    });

    return updated;
  });
}
