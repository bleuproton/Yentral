import { processOnce } from '@/worker/worker';

async function main() {
  const did = await processOnce();
  if (!did) {
    console.log('No job claimed');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
