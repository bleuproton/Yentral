import { claimNextJob } from './claimJob';
import { processJob } from './processJob';

export async function processOnce() {
  const job = await claimNextJob();
  if (!job) return false;
  await processJob(job);
  return true;
}

export async function startLoop(intervalMs = 2000) {
  let running = true;
  const stop = () => {
    running = false;
  };
  process.on('SIGINT', stop);
  while (running) {
    const didWork = await processOnce();
    if (!didWork) {
      await new Promise((res) => setTimeout(res, intervalMs));
    }
  }
}
