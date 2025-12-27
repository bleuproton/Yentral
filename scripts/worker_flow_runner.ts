// @ts-nocheck
import { PrismaClient, FlowRunStatus } from '@prisma/client';
import { tenantDb } from '@/server/db/tenantDb';

const prisma = new PrismaClient();

async function fetchPending(limit = 5) {
  return prisma.$queryRawUnsafe(
    `SELECT id, "tenantId" FROM "FlowRun" WHERE status = 'PENDING' ORDER BY "createdAt" ASC LIMIT $1`,
    limit
  );
}

async function processRun(run: any) {
  const db = tenantDb(run.tenantId);
  const start = new Date();
  await db.flowRun.update({
    where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
    data: { status: FlowRunStatus.RUNNING, startedAt: start },
  });
  try {
    // TODO: execute flow nodes; for now echo input to output
    const current = await db.flowRun.findUnique({ where: { tenantId_id: { tenantId: run.tenantId, id: run.id } } });
    await db.flowRun.update({
      where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
      data: { status: FlowRunStatus.COMPLETED, finishedAt: new Date(), output: current?.input ?? {} },
    });
    await db.flowRunLog.create({
      data: { tenantId: run.tenantId, runId: run.id, level: 'info', message: 'Flow completed' },
    });
  } catch (err: any) {
    await db.flowRun.update({
      where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
      data: { status: FlowRunStatus.FAILED, finishedAt: new Date(), error: err?.message ?? 'failed' },
    });
    await db.flowRunLog.create({
      data: { tenantId: run.tenantId, runId: run.id, level: 'error', message: err?.message ?? 'failed' },
    });
  }
}

async function loop() {
  while (true) {
    const runs: any[] = await fetchPending(5);
    if (runs.length === 0) {
      await new Promise((res) => setTimeout(res, 2000));
      continue;
    }
    for (const run of runs) {
      await processRun(run);
    }
  }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  loop().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { processRun };
