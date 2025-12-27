import { startLoop } from '@/worker/worker';

async function main() {
  const interval = Number(process.env.WORKER_POLL_MS || 2000);
  await startLoop(interval);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
