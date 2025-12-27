// @ts-nocheck
import { PrismaClient, FlowRunStatus } from '@prisma/client';
import { getNode } from '@/modules/automations/nodes';
import { tenantDb } from '@/server/db/tenantDb';

const prisma = new PrismaClient();

type FlowDef = { nodes: Array<{ id: string; key: string; config?: any }>; edges?: Array<{ from: string; to: string }> };

async function fetchPending(limit = 5) {
  return prisma.flowRun.findMany({
    where: { status: FlowRunStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

async function runNode(tenantId: string, runId: string, node: any, input: any) {
  const db = tenantDb(tenantId);
  const step = await db.flowRunStep.create({
    data: {
      tenantId,
      flowRunId: runId,
      nodeId: node.id,
      status: 'RUNNING',
      input,
      startedAt: new Date(),
    },
  });
  try {
    const impl = getNode(node.key);
    if (!impl) throw new Error(`Node not found ${node.key}`);
    const output = await impl.run({ tenantId, config: node.config ?? {}, input });
    await db.flowRunStep.update({
      where: { tenantId_id: { tenantId, id: step.id } },
      data: { status: 'COMPLETED', finishedAt: new Date(), output },
    });
    return output;
  } catch (err: any) {
    await db.flowRunStep.update({
      where: { tenantId_id: { tenantId, id: step.id } },
      data: { status: 'FAILED', finishedAt: new Date(), error: err?.message ?? 'error' },
    });
    throw err;
  }
}

async function processRun(run: any) {
  const db = tenantDb(run.tenantId);
  const flow = await db.flow.findUnique({ where: { tenantId_id: { tenantId: run.tenantId, id: run.flowId } } });
  if (!flow || !flow.definition) {
    await db.flowRun.update({
      where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
      data: { status: FlowRunStatus.FAILED, error: 'No definition', finishedAt: new Date() },
    });
    return;
  }
  const def: FlowDef = flow.definition as any;
  const nodes = def.nodes || [];
  let currentInput = run.triggerPayload ?? run.input ?? {};
  await db.flowRun.update({
    where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
    data: { status: FlowRunStatus.RUNNING, startedAt: new Date() },
  });
  try {
    for (const node of nodes) {
      currentInput = await runNode(run.tenantId, run.id, node, currentInput);
    }
    await db.flowRun.update({
      where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
      data: { status: FlowRunStatus.COMPLETED, finishedAt: new Date(), output: currentInput },
    });
  } catch (err: any) {
    await db.flowRun.update({
      where: { tenantId_id: { tenantId: run.tenantId, id: run.id } },
      data: { status: FlowRunStatus.FAILED, finishedAt: new Date(), error: err?.message ?? 'failed' },
    });
  }
}

export async function processOnce() {
  const runs = await fetchPending(5);
  for (const run of runs) {
    await processRun(run);
  }
  return runs.length > 0;
}

async function main() {
  const ONCE = process.argv.includes('--once');
  if (ONCE) {
    await processOnce();
    return;
  }
  while (true) {
    const worked = await processOnce();
    if (!worked) await new Promise((res) => setTimeout(res, 2000));
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
