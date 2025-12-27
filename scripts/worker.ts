import { processOnce } from '../worker/index';

const POLL_MS = Number(process.env.WORKER_POLL_MS || 2000);
const ONCE = process.argv.includes('--once');

async function loop() {
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

loop().catch((err) => {
  console.error(err);
  process.exit(1);
});
