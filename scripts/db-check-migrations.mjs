#!/usr/bin/env node
import "dotenv/config";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const failures = [];
  try {
    const res = await pool.query(
      `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY started_at`
    );
    res.rows.forEach((r) => {
      if (!r.finished_at) failures.push(`Migration not finished: ${r.migration_name}`);
      if (r.rolled_back_at) failures.push(`Migration rolled back: ${r.migration_name}`);
    });
  } catch (err) {
    failures.push(`Error reading _prisma_migrations: ${err.message || err}`);
  } finally {
    await pool.end();
  }

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f}`));
    process.exit(1);
  } else {
    console.log("OK: migrations are all finished and not rolled back");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`FAIL: unexpected error ${err.message || err}`);
  process.exit(1);
});
