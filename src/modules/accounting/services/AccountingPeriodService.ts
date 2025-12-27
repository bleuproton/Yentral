// @ts-nocheck
import { prisma } from '@/server/db/prisma';
import { withContext } from '@/server/tenant/als';
import { RequestContext } from '@/server/tenant/context';

export class AccountingPeriodService {
  openPeriod(ctx: RequestContext, legalEntityId: string, startDate: Date, endDate: Date) {
    return withContext(ctx, async () => {
      const overlap = await prisma.accountingPeriod.findFirst({
        where: {
          tenantId: ctx.tenantId,
          legalEntityId,
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
        },
      });
      if (overlap) throw new Error('Overlapping period');
      return prisma.accountingPeriod.create({
        data: {
          tenantId: ctx.tenantId,
          legalEntityId,
          startDate,
          endDate,
          status: 'OPEN',
        },
      });
    });
  }

  closePeriod(ctx: RequestContext, periodId: string) {
    return withContext(ctx, async () => {
      return prisma.accountingPeriod.update({
        where: { tenantId_id: { tenantId: ctx.tenantId, id: periodId } },
        data: { status: 'CLOSED', closedAt: new Date(), closedByUserId: ctx.userId ?? null },
      });
    });
  }

  async assertPostingAllowed(ctx: RequestContext, legalEntityId: string, postedAt: Date) {
    return withContext(ctx, async () => {
      const lock = await prisma.postingLock.findFirst({
        where: { tenantId: ctx.tenantId, legalEntityId, lockedFromDate: { lte: postedAt } },
      });
      if (lock) throw new Error('Posting locked');
      const closed = await prisma.accountingPeriod.findFirst({
        where: {
          tenantId: ctx.tenantId,
          legalEntityId,
          status: 'CLOSED',
          startDate: { lte: postedAt },
          endDate: { gte: postedAt },
        },
      });
      if (closed) throw new Error('Period closed');
    });
  }

  listPeriods(ctx: RequestContext, legalEntityId?: string) {
    return withContext(ctx, () =>
      prisma.accountingPeriod.findMany({
        where: { tenantId: ctx.tenantId, ...(legalEntityId ? { legalEntityId } : {}) },
        orderBy: { startDate: 'desc' },
      })
    );
  }
}
