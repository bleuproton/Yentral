#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const local = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_legacy" && d.name !== "_legacy_migrations")
    .filter((d) => {
      const p = path.join(migrationsRoot, d.name, "migration.sql");
      try {
        const st = statSync(p);
        return st.isFile();
      } catch {
        return false;
      }
    })
    .map((d) => d.name)
    .sort();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const failures = [];
  try {
    const res = await pool.query(
      `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY finished_at`
    );
    const applied = new Map(res.rows.map((r) => [r.migration_name, r]));

    local.forEach((name) => {
      const m = applied.get(name);
      if (!m) {
        failures.push(`Missing migration in DB: ${name}`);
      } else if (!m.finished_at) {
        failures.push(`Migration not finished: ${name}`);
      } else if (m.rolled_back_at) {
        failures.push(`Migration rolled back: ${name}`);
      }
    });

    res.rows.forEach((r) => {
      if (r.rolled_back_at) failures.push(`Migration rolled back: ${r.migration_name}`);
      if (!r.finished_at) failures.push(`Migration unfinished: ${r.migration_name}`);
    });
  } catch (err) {
    failures.push(`Failed to read _prisma_migrations: ${err.message || err}`);
  } finally {
    await pool.end();
  }

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f}`));
    process.exit(1);
  } else {
    console.log("OK: migrations verified");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`FAIL: unexpected error ${err.message || err}`);
  process.exit(1);
});
