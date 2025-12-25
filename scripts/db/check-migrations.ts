#!/usr/bin/env tsx
import { readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

type Issue = { ok: boolean; message: string };

async function main() {
  const failures: Issue[] = [];
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const folders = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "_legacy")
    .map((e) => e.name);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const rows = await pool.query<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>(`SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"`);

    const applied = new Map(rows.rows.map((r) => [r.migration_name, r]));

    // Missing migrations
    folders.forEach((folder) => {
      if (!applied.has(folder)) {
        failures.push({ ok: false, message: `Missing applied migration: ${folder}` });
      }
    });

    // Unfinished or rolled back
    rows.rows.forEach((r) => {
      if (!r.finished_at) {
        failures.push({ ok: false, message: `Migration not finished: ${r.migration_name}` });
      }
      if (r.rolled_back_at) {
        failures.push({ ok: false, message: `Migration rolled back: ${r.migration_name}` });
      }
    });
  } catch (err: any) {
    console.error(`FAIL: error reading _prisma_migrations: ${err?.message ?? err}`);
    await pool.end();
    process.exit(1);
  }

  await pool.end();

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f.message}`));
    process.exit(1);
  } else {
    console.log("OK: all migrations applied and clean");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`FAIL: unexpected error ${err?.message ?? err}`);
  process.exit(1);
});
