// @ts-nocheck
import Boss from "pg-boss";
import { env } from "./env";

let bossInstance: Boss | null = null;

export function createBoss() {
  if (bossInstance) return bossInstance;

  bossInstance = new Boss({
    connectionString: env.DATABASE_URL,
    schema: env.PG_BOSS_SCHEMA || "pgboss",
    deleteCompletedDays: 7,
    deleteFailedDays: 14,
    monitorState: true,
    retentionMinutes: 60 * 24 * 3 // keep finished/failed for 3 days
  });

  return bossInstance;
}

export async function startBoss() {
  const boss = createBoss();
  await boss.start();
  return boss;
}
