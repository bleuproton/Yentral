// @ts-nocheck
import { run, RunnerOptions, TaskList } from 'graphile-worker';
import { syncConnection } from './handlers/sync_connection';
import { syncConnectionFull } from './handlers/sync_connection_full';

const tasks: TaskList = {
  sync_connection: async (payload) => {
    await syncConnection(payload as any);
  },
  sync_connection_full: async (payload) => {
    await syncConnectionFull(payload as any);
  },
};

export async function startWorker() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL required for worker');
  const options: RunnerOptions = {
    connectionString,
    taskList: tasks,
    noHandleSignals: false,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  };
  const runner = await run(options);
  await runner.promise;
}
