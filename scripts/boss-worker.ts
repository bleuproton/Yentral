#!/usr/bin/env tsx
import "dotenv/config";
import { startBoss } from "@/lib/boss";
import { registerProcessors } from "@/jobs/processors";

async function main() {
  const boss = await startBoss();
  await registerProcessors(boss);
  // eslint-disable-next-line no-console
  console.log("pg-boss worker started with queues: sync.job, email.ingest, sla.monitor");

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log("Shutting down pg-boss worker...");
    await boss.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Boss worker failed to start", err);
  process.exit(1);
});
