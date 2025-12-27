// @ts-nocheck
import { startWorker } from './worker';

startWorker().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker failed', err);
  process.exit(1);
});
