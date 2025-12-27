#!/usr/bin/env ts-node
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

type Issue = { ok: boolean; message: string };

const criticalTables = [
  "ProductVariant",
  "StockLedger",
  "StockSnapshot",
  "StockReservation",
  "IntegrationConnection",
  "WarehouseMapping",
  "ChannelProduct",
  "ChannelVariant",
  "ChannelOrder"
];

const criticalColumns: { table: string; column: string }[] = [
  { table: "OrderLine", column: "tenantId" },
  { table: "OrderLine", column: "variantId" },
  { table: "StockLedger", column: "kind" },
  { table: "IntegrationConnection", column: "lastSyncAt" }
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  const failures: Issue[] = [];

  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const localMigrations = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_legacy" && d.name !== "_legacy_migrations")
    .filter((d) => {
      const migPath = path.join(migrationsRoot, d.name, "migration.sql");
      return statSync(migPath, { throwIfNoEntry: false as any })?.isFile?.() ?? false;
    })
    .map((d) => d.name)
    .sort();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const migRows = await pool.query(
      `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY finished_at`
    );

    const appliedNames = migRows.rows.map((r: any) => r.migration_name);

    // Missing applied
    localMigrations.forEach((name) => {
      const match = migRows.rows.find((r: any) => r.migration_name === name && r.finished_at);
      if (!match) failures.push({ ok: false, message: `Not applied or unfinished: ${name}` });
    });

    // Failed/rolled back
    migRows.rows.forEach((r: any) => {
      if (!r.finished_at) failures.push({ ok: false, message: `Migration not finished: ${r.migration_name}` });
      if (r.rolled_back_at) failures.push({ ok: false, message: `Migration rolled back: ${r.migration_name}` });
    });

    // Order check: applied order must follow local order prefix
    const localOrder = localMigrations.join("|");
    const appliedOrder = appliedNames.filter((n: any) => localMigrations.includes(n)).join("|");
    if (!appliedOrder.startsWith(localOrder)) {
      failures.push({ ok: false, message: "Applied migration order deviates from local order" });
    }

    // Table existence
    const tableRows = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
    const tableSet = new Set(tableRows.rows.map((r: any) => r.table_name));
    criticalTables.forEach((t) => {
      if (!tableSet.has(t)) failures.push({ ok: false, message: `Missing table: ${t}` });
    });

    // Column existence
    const colRows = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`
    );
    const colsByTable = new Map<string, Set<string>>();
    colRows.rows.forEach((r: any) => {
      if (!colsByTable.has(r.table_name)) colsByTable.set(r.table_name, new Set());
      colsByTable.get(r.table_name)!.add(r.column_name);
    });
    criticalColumns.forEach(({ table, column }) => {
      if (!colsByTable.get(table)?.has(column)) failures.push({ ok: false, message: `Missing column ${table}.${column}` });
    });
  } catch (err: any) {
    failures.push({ ok: false, message: `DB check error: ${err?.message ?? err}` });
  } finally {
    await pool.end();
  }

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f.message}`));
    process.exit(1);
  } else {
    console.log("OK: migrations applied and schema checks passed");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`FAIL: unexpected error ${err?.message ?? err}`);
  process.exit(1);
});
