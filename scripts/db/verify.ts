#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CheckResult = { name: string; ok: boolean; details?: string };
const failures: CheckResult[] = [];
const warnings: CheckResult[] = [];

function fail(name: string, details: string) {
  failures.push({ name, ok: false, details });
}

function warn(name: string, details: string) {
  warnings.push({ name, ok: false, details });
}

function runDiff(): void {
  if (!process.env.DATABASE_URL) {
    fail("Env", "DATABASE_URL is missing");
    return;
  }
  try {
    execSync(
      `npx prisma migrate diff --from-url "${process.env.DATABASE_URL}" --to-schema-datamodel prisma/schema.prisma --exit-code`,
      { stdio: "pipe" }
    );
  } catch (err: any) {
    const status = err?.status;
    if (status === 2) {
      fail("Schema diff", "Database schema differs from prisma/schema.prisma");
    } else {
      fail("Schema diff", `Failed to run prisma migrate diff: ${err?.message ?? "unknown error"}`);
    }
  }
}

async function checkMigrations(): Promise<void> {
  const localDirs = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => /^\d{8,}_/.test(name));

  const applied = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name
    FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL
  `;
  const appliedNames = new Set(applied.map((r) => r.migration_name));
  const missing = localDirs.filter((name) => !appliedNames.has(name));
  if (missing.length) {
    fail("Migrations", `Not applied: ${missing.join(", ")}`);
  }
}

async function checkTablesAndColumns(): Promise<void> {
  const required: Record<string, string[]> = {
    Tenant: ["id", "slug"],
    User: ["id", "email"],
    Membership: ["id", "userId", "tenantId"],
    Product: ["id", "tenantId", "sku"],
    Order: ["id", "tenantId", "orderNumber"],
    OrderLine: ["id", "tenantId", "orderId", "productId"],
    Job: ["id", "tenantId", "status"],
    Ticket: ["id", "tenantId", "status"],
    IntegrationConnection: ["id", "tenantId", "connectorVersionId"]
  };

  const rows = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `;
  const byTable = new Map<string, Set<string>>();
  rows.forEach((r) => {
    if (!byTable.has(r.table_name)) byTable.set(r.table_name, new Set());
    byTable.get(r.table_name)?.add(r.column_name);
  });

  Object.entries(required).forEach(([table, cols]) => {
    const existing = byTable.get(table);
    if (!existing) {
      fail("Table", `${table} is missing`);
      return;
    }
    const missingCols = cols.filter((c) => !existing.has(c));
    if (missingCols.length) {
      fail("Columns", `${table} missing columns: ${missingCols.join(", ")}`);
    }
  });
}

async function checkTenantUnsafeUniques(): Promise<void> {
  const uniques = await prisma.$queryRaw<{ table_name: string; constraint_name: string; columns: string[] }[]>`
    SELECT
      t.relname as table_name,
      c.conname as constraint_name,
      array_agg(a.attname ORDER BY cols.ord) as columns
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN unnest(c.conkey) WITH ORDINALITY as cols(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = cols.attnum
    WHERE c.contype = 'u'
      AND n.nspname = 'public'
      AND EXISTS (
        SELECT 1 FROM pg_attribute ta WHERE ta.attrelid = t.oid AND ta.attname = 'tenantId'
      )
    GROUP BY t.relname, c.conname;
  `;

  uniques.forEach((u) => {
    const cols = u.columns.map((c) => c.toLowerCase());
    if (!cols.includes("tenantid")) {
      warn("Tenant-unsafe unique", `${u.table_name} -> ${u.constraint_name} (${u.columns.join(", ")})`);
    }
  });
}

async function main() {
  runDiff();
  await checkMigrations();
  await checkTablesAndColumns();
  await checkTenantUnsafeUniques();

  warnings.forEach((w) => console.warn(`WARN: ${w.name} :: ${w.details ?? ""}`));
  failures.forEach((f) => console.error(`FAIL: ${f.name} :: ${f.details ?? ""}`));

  await prisma.$disconnect();
  if (failures.length) {
    process.exit(1);
  } else {
    console.log("DB verify OK");
  }
}

main().catch((err) => {
  console.error("DB verify crashed", err);
  prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
