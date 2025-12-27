#!/usr/bin/env ts-node --esm
import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

type Issue = { ok: boolean; message: string };
const failures: Issue[] = [];
const passes: string[] = [];

const expectedTables = [
  "Tenant",
  "User",
  "Membership",
  "Product",
  "Order",
  "OrderLine",
  "ProductVariant",
  "StockLedger",
  "StockSnapshot",
  "StockReservation",
  "IntegrationConnection",
  "WarehouseMapping",
  "ChannelProduct",
  "ChannelVariant",
  "ChannelOrder",
  "Job",
  "JobRun",
  "Ticket",
  "AuditEvent",
  "Warehouse",
  "Organization",
  "LegalEntity",
  "TaxProfile",
  "Jurisdiction",
  "Connector",
  "ConnectorVersion",
  "Plugin",
  "PluginInstallation"
];

const tenantAllowedMissing = new Set([
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Connector",
  "ConnectorVersion",
  "Plugin",
  "Jurisdiction"
]);

type UniqueCheck = { table: string; columns: string[]; label?: string };
const uniqueChecks: UniqueCheck[] = [
  { table: "Product", columns: ["tenantId", "sku"] },
  { table: "ProductVariant", columns: ["tenantId", "sku"] },
  { table: "Order", columns: ["tenantId", "orderNumber"] },
  { table: "StockSnapshot", columns: ["tenantId", "warehouseId", "variantId"] },
  { table: "StockReservation", columns: ["tenantId", "dedupeKey"] },
  { table: "WarehouseMapping", columns: ["tenantId", "connectionId", "externalLocationId"] },
  { table: "ChannelVariant", columns: ["tenantId", "connectionId", "externalId"] },
  { table: "ChannelVariant", columns: ["tenantId", "connectionId", "variantId"], label: "ChannelVariant(variant)" },
  { table: "ChannelOrder", columns: ["tenantId", "connectionId", "externalOrderId"] },
  { table: "ChannelOrder", columns: ["tenantId", "connectionId", "orderId"], label: "ChannelOrder(order)" }
];

function pass(msg: string) {
  passes.push(msg);
}

function fail(message: string) {
  failures.push({ ok: false, message });
}

function runCmd(name: string, cmd: string) {
  try {
    execSync(cmd, { stdio: "inherit" });
    pass(`${name} OK`);
  } catch (err: any) {
    fail(`${name} failed: ${err?.message ?? err}`);
  }
}

function checkFiles() {
  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const entries = readdirSync(migrationsRoot, { withFileTypes: true });
  const loose = entries.filter((e) => e.isFile() && e.name.endsWith(".sql"));
  if (loose.length) {
    fail(`Loose .sql files in prisma/migrations: ${loose.map((e) => e.name).join(", ")}`);
  } else {
    pass("No loose .sql files");
  }

  const dirs = entries.filter((e) => e.isDirectory() && /^\d{8,}_/.test(e.name));
  dirs.forEach((d) => {
    const files = readdirSync(path.join(migrationsRoot, d.name)).filter((f) => statSync(path.join(migrationsRoot, d.name, f)).isFile());
    const sqlFiles = files.filter((f) => f === "migration.sql");
    if (sqlFiles.length !== 1 || files.length !== 1) {
      fail(`Migration folder ${d.name} must contain exactly one migration.sql (found files: ${files.join(", ") || "none"})`);
    }
  });
}

async function checkDb(pool: any) {
  const tablesRows = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  const tables = new Set(tablesRows.rows.map((r: any) => r.table_name));
  expectedTables.forEach((t) => {
    if (!tables.has(t)) fail(`Missing table: ${t}`);
  });

  const colsRows = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`
  );
  const columnsByTable = new Map<string, Set<string>>();
  colsRows.rows.forEach((r: any) => {
    if (!columnsByTable.has(r.table_name)) columnsByTable.set(r.table_name, new Set());
    columnsByTable.get(r.table_name)!.add(r.column_name);
  });

  expectedTables.forEach((t) => {
    if (!tenantAllowedMissing.has(t)) {
      const cols = columnsByTable.get(t);
      if (!cols || !cols.has("tenantId")) {
        fail(`Table ${t} missing tenantId`);
      }
    }
  });

  const uniquesRows = await pool.query(
    `
    SELECT
      cls.relname AS table_name,
      idx.relname AS index_name,
      ARRAY_AGG(att.attname ORDER BY ord.n) AS columns
    FROM pg_index i
    JOIN pg_class idx ON idx.oid = i.indexrelid
    JOIN pg_class cls ON cls.oid = i.indrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS ord(attnum, n) ON true
    JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = ord.attnum
    WHERE ns.nspname = 'public'
      AND i.indisunique = true
    GROUP BY cls.relname, idx.relname
    `
  );
  const uniquesByTable = new Map<string, string[][]>();
  uniquesRows.rows.forEach((r: any) => {
    if (!uniquesByTable.has(r.table_name)) uniquesByTable.set(r.table_name, []);
    uniquesByTable.get(r.table_name)!.push(r.columns.map((c: any) => c.toLowerCase()));
  });

  uniqueChecks.forEach((uc) => {
    const list = uniquesByTable.get(uc.table);
    const target = uc.columns.map((c) => c.toLowerCase());
    const found = list?.some((cols) => cols.length === target.length && cols.every((c, i) => c === target[i]));
    if (!found) {
      fail(`Missing unique index ${uc.label ?? ""} on ${uc.table} (${uc.columns.join(", ")})`.trim());
    }
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    fail("DATABASE_URL is not set");
  }
  if (!process.env.SHADOW_DATABASE_URL) {
    fail("SHADOW_DATABASE_URL is required for drift check (set it)");
  }

  checkFiles();

  runCmd("prisma validate", "npx prisma validate");
  runCmd("prisma migrate status", "npx prisma migrate status");
  if (process.env.SHADOW_DATABASE_URL) {
    runCmd(
      "prisma migrate diff",
      `npx prisma migrate diff --from-migrations --to-schema-datamodel prisma/schema.prisma --exit-code`
    );
  }

  if (process.env.DATABASE_URL) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      await checkDb(pool);
    } catch (err: any) {
      fail(`Database checks failed: ${err?.message ?? err}`);
    } finally {
      await pool.end();
    }
  }

  passes.forEach((p) => console.log(`PASS: ${p}`));
  failures.forEach((f) => console.error(`FAIL: ${f.message}`));

  if (failures.length) {
    process.exit(1);
  } else {
    console.log("Migration check OK");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FAIL: unexpected error", err);
  process.exit(1);
});
