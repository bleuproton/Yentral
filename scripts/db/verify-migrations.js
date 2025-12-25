#!/usr/bin/env node
import "dotenv/config";
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
    const byName = new Map();
    res.rows.forEach((r) => {
      if (!byName.has(r.migration_name)) byName.set(r.migration_name, []);
      byName.get(r.migration_name).push(r);
    });

    local.forEach((name) => {
      const rowsFor = byName.get(name) || [];
      const hasApplied = rowsFor.some((r) => r.finished_at && !r.rolled_back_at);
      const hasUnfinished = rowsFor.some((r) => !r.finished_at && !r.rolled_back_at);
      const hasRolled = rowsFor.some((r) => r.rolled_back_at);

      if (!rowsFor.length) {
        failures.push(`Missing migration in DB: ${name}`);
        return;
      }
      if (!hasApplied) failures.push(`Migration not applied: ${name}`);
      if (hasUnfinished) failures.push(`Migration not finished: ${name}`);
      if (hasRolled && !hasApplied) failures.push(`Migration rolled back: ${name}`);
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
