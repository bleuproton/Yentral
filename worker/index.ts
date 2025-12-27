import { claimJobs } from './claimJobs';
import { processJob } from './processJob';

const POLL_MS = Number(process.env.WORKER_POLL_MS || 2000);
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || 5);
const ONCE = process.argv.includes('--once');

export async function processOnce() {
  const jobs = await claimJobs(CONCURRENCY);
  await Promise.all(jobs.map((j) => processJob(j)));
  return jobs.length > 0;
}

async function main() {
  if (ONCE) {
    await processOnce();
    return;
  }

  let running = true;
  process.on('SIGINT', () => {
    running = false;
  });

  while (running) {
    const didWork = await processOnce();
    if (!didWork) {
      await new Promise((res) => setTimeout(res, POLL_MS));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
