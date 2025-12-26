#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const REQUIRED_UNIQUES = [
  "Product",
  "ProductVariant",
  "Order",
  "OrderLine",
  "Warehouse",
  "IntegrationConnection",
  "Shipment",
  "Return"
];

const BUSINESS_TABLES_REQUIRE_TENANT = [
  "Product",
  "ProductVariant",
  "Order",
  "OrderLine",
  "Warehouse",
  "IntegrationConnection",
  "StockLedger",
  "StockSnapshot",
  "StockReservation",
  "Shipment",
  "ShipmentLine",
  "Return",
  "ReturnLine",
  "ChannelProduct",
  "ChannelVariant",
  "ChannelOrder",
  "WarehouseMapping",
  "Job",
  "JobRun",
  "Ticket",
  "Organization",
  "LegalEntity",
  "TaxProfile"
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const failures = [];

  // A) migrations
  try {
    const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
    const folders = fs
      .readdirSync(migrationsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "_legacy")
      .map((d) => d.name)
      .sort();

    const { rows } = await client.query(
      `SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name ASC`
    );
    const applied = new Map(rows.map((r) => [r.migration_name, r]));

    folders.forEach((folder) => {
      const rec = applied.get(folder);
      if (!rec) failures.push(`PENDING migration: ${folder}`);
      else if (!rec.finished_at) failures.push(`UNFINISHED migration: ${folder}`);
      else if (rec.rolled_back_at) failures.push(`ROLLED_BACK migration: ${folder}`);
    });
    rows.forEach((r) => {
      if (r.finished_at === null || r.rolled_back_at !== null) {
        failures.push(`FAILED applied migration: ${r.migration_name}`);
      }
    });
  } catch (err) {
    failures.push(`Migration check error: ${err.message || err}`);
  }

  // B1) foreign keys tenant-scoped
  try {
    const fkRows = await client.query(`
      SELECT
        con.conname AS constraint_name,
        child.relname AS child_table,
        array_agg(child_att.attname ORDER BY u.conkey_ordinality) AS child_cols,
        parent.relname AS parent_table,
        array_agg(parent_att.attname ORDER BY f.confkey_ordinality) AS parent_cols
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = child.relnamespace AND nsp.nspname = 'public'
      JOIN pg_class parent ON parent.oid = con.confrelid
      JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, conkey_ordinality) ON TRUE
      JOIN pg_attribute child_att ON child_att.attrelid = child.oid AND child_att.attnum = u.attnum
      JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS f(attnum, confkey_ordinality) ON TRUE
      JOIN pg_attribute parent_att ON parent_att.attrelid = parent.oid AND parent_att.attnum = f.attnum
      WHERE con.contype = 'f'
      GROUP BY con.conname, child.relname, parent.relname
    `);

    const badTenantFks = [];
    for (const r of fkRows.rows) {
      const childHasTenant = r.child_cols.includes("tenantId");
      const fkHasTenant = r.child_cols.includes("tenantId") && r.parent_cols.includes("tenantId");
      if (childHasTenant && !fkHasTenant) {
        badTenantFks.push(`${r.child_table}.${r.constraint_name} -> ${r.parent_table} (${r.child_cols.join(",")} -> ${r.parent_cols.join(",")})`);
      }
    }
    if (badTenantFks.length) failures.push(`Non-tenant-scoped FKs: ${badTenantFks.join("; ")}`);
  } catch (err) {
    failures.push(`FK check error: ${err.message || err}`);
  }

  // B2) tables missing tenantId
  try {
    const colRows = await client.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`
    );
    const colsByTable = new Map();
    colRows.rows.forEach((r) => {
      if (!colsByTable.has(r.table_name)) colsByTable.set(r.table_name, new Set());
      colsByTable.get(r.table_name).add(r.column_name);
    });
    const missingTenant = BUSINESS_TABLES_REQUIRE_TENANT.filter(
      (t) => !colsByTable.get(t)?.has("tenantId")
    );
    if (missingTenant.length) failures.push(`Tables missing tenantId: ${missingTenant.join(", ")}`);
  } catch (err) {
    failures.push(`tenantId check error: ${err.message || err}`);
  }

  // B3) unique ([tenantId,id]) presence
  try {
    const uniqRows = await client.query(`
      SELECT
        cls.relname as table_name,
        array_agg(att.attname ORDER BY ord.n) as columns
      FROM pg_index i
      JOIN pg_class idx ON idx.oid = i.indexrelid
      JOIN pg_class cls ON cls.oid = i.indrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS ord(attnum, n) ON TRUE
      JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = ord.attnum
      WHERE ns.nspname='public' AND i.indisunique = true
      GROUP BY cls.relname, i.indexrelid
    `);
    const uniqMap = new Map();
    uniqRows.rows.forEach((r) => {
      if (!uniqMap.has(r.table_name)) uniqMap.set(r.table_name, []);
      uniqMap.get(r.table_name).push(r.columns.map((c) => c.toLowerCase()));
    });
    const missingUniques = [];
    for (const t of REQUIRED_UNIQUES) {
      const target = ["tenantid", "id"];
      const found =
        uniqMap
          .get(t)
          ?.some((cols) => cols.length === 2 && cols[0] === target[0] && cols[1] === target[1]) ?? false;
      if (!found) missingUniques.push(t);
    }
    if (missingUniques.length) failures.push(`Missing @@unique([tenantId,id]) on: ${missingUniques.join(", ")}`);
  } catch (err) {
    failures.push(`unique check error: ${err.message || err}`);
  }

  // B4) StockReservation FKs tenant-scoped
  try {
    const resFk = await client.query(`
      SELECT con.conname,
             array_agg(child_att.attname ORDER BY u.conkey_ordinality) AS child_cols,
             array_agg(parent_att.attname ORDER BY f.confkey_ordinality) AS parent_cols,
             parent.relname as parent_table
      FROM pg_constraint con
      JOIN pg_class child ON child.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = child.relnamespace AND nsp.nspname = 'public'
      JOIN pg_class parent ON parent.oid = con.confrelid
      JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, conkey_ordinality) ON TRUE
      JOIN pg_attribute child_att ON child_att.attrelid = child.oid AND child_att.attnum = u.attnum
      JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS f(attnum, confkey_ordinality) ON TRUE
      JOIN pg_attribute parent_att ON parent_att.attrelid = parent.oid AND parent_att.attnum = f.attnum
      WHERE con.contype='f' AND child.relname='StockReservation'
      GROUP BY con.conname, parent.relname
    `);
    const badRes = resFk.rows.filter(
      (r) =>
        !r.child_cols.includes("tenantId") ||
        !r.parent_cols.includes("tenantId") ||
        r.child_cols.length !== r.parent_cols.length
    );
    if (badRes.length) {
      failures.push(
        `StockReservation FKs not tenant-scoped: ${badRes
          .map((r) => `${r.conname} (${r.child_cols.join(",")} -> ${r.parent_table}:${r.parent_cols.join(",")})`)
          .join("; ")}`
      );
    }
  } catch (err) {
    failures.push(`StockReservation FK check error: ${err.message || err}`);
  }

  await client.end();

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f}`));
    process.exit(1);
  } else {
    console.log("OK: migrations applied, tenant safety checks passed");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`FAIL: unexpected error ${err.message || err}`);
  process.exit(1);
});
