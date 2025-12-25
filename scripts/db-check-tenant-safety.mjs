#!/usr/bin/env node
import "dotenv/config";
import { Pool } from "pg";

const tenantTables = [
  "Tenant",
  "Membership",
  "Product",
  "ProductVariant",
  "Order",
  "OrderLine",
  "StockLedger",
  "StockSnapshot",
  "StockReservation",
  "Warehouse",
  "IntegrationConnection",
  "WarehouseMapping",
  "ChannelProduct",
  "ChannelVariant",
  "ChannelOrder",
  "Job",
  "JobRun",
  "Ticket",
  "AuditEvent",
  "Organization",
  "LegalEntity",
  "TaxProfile"
];

const tenantUniques = [
  { table: "Product", cols: ["tenantId", "sku"] },
  { table: "ProductVariant", cols: ["tenantId", "sku"] },
  { table: "Order", cols: ["tenantId", "orderNumber"] },
  { table: "StockSnapshot", cols: ["tenantId", "warehouseId", "variantId"] },
  { table: "StockReservation", cols: ["tenantId", "dedupeKey"] },
  { table: "WarehouseMapping", cols: ["tenantId", "connectionId", "externalLocationId"] },
  { table: "ChannelVariant", cols: ["tenantId", "connectionId", "externalId"] },
  { table: "ChannelVariant", cols: ["tenantId", "connectionId", "variantId"] },
  { table: "ChannelOrder", cols: ["tenantId", "connectionId", "externalOrderId"] },
  { table: "ChannelOrder", cols: ["tenantId", "connectionId", "orderId"] }
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const failures = [];

  try {
    // Tenant column check
    const colRows = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`
    );
    const cols = new Map();
    colRows.rows.forEach((r) => {
      if (!cols.has(r.table_name)) cols.set(r.table_name, new Set());
      cols.get(r.table_name).add(r.column_name);
    });
    tenantTables.forEach((t) => {
      if (!cols.get(t)?.has("tenantId")) {
        failures.push(`Missing tenantId on table ${t}`);
      }
    });

    // Unique index check
    const uniqRows = await pool.query(
      `SELECT
         cls.relname as table_name,
         idx.relname as index_name,
         array_agg(att.attname ORDER BY ord.n) as columns
       FROM pg_index i
       JOIN pg_class idx ON idx.oid = i.indexrelid
       JOIN pg_class cls ON cls.oid = i.indrelid
       JOIN pg_namespace ns ON ns.oid = cls.relnamespace
       JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS ord(attnum, n) ON true
       JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attnum = ord.attnum
       WHERE ns.nspname = 'public' AND i.indisunique = true
       GROUP BY cls.relname, idx.relname`
    );
    const uniqByTable = new Map();
    uniqRows.rows.forEach((r) => {
      if (!uniqByTable.has(r.table_name)) uniqByTable.set(r.table_name, []);
      uniqByTable.get(r.table_name).push(r.columns.map((c) => c.toLowerCase()));
    });
    tenantUniques.forEach((u) => {
      const target = u.cols.map((c) => c.toLowerCase());
      const found = uniqByTable
        .get(u.table)
        ?.some((cols) => cols.length === target.length && cols.every((c, i) => c === target[i]));
      if (!found) failures.push(`Missing unique (${u.cols.join(",")}) on ${u.table}`);
    });
  } catch (err) {
    failures.push(`DB check failed: ${err.message || err}`);
  } finally {
    await pool.end();
  }

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f}`));
    process.exit(1);
  } else {
    console.log("OK: tenantId columns and tenant uniques present");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`FAIL: unexpected error ${err.message || err}`);
  process.exit(1);
});
