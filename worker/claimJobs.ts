import { prisma } from './deps';
import { Job } from '@prisma/client';

export async function claimJobs(limit: number): Promise<Job[]> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.$queryRaw<Job[]>`
      WITH cte AS (
        SELECT id
        FROM "Job"
        WHERE status = 'PENDING'
          AND ( "scheduledAt" IS NULL OR "scheduledAt" <= now() )
          AND ( "nextRunAt" IS NULL OR "nextRunAt" <= now() )
          AND ( "lockedAt" IS NULL )
        ORDER BY priority DESC, "createdAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "Job" j
      SET status = 'RUNNING',
          "lockedAt" = now(),
          "startedAt" = now(),
          attempts = j.attempts + 1
      FROM cte
      WHERE j.id = cte.id
      RETURNING j.*;
    `;
    return claimed;
  });
}
