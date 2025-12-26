#!/usr/bin/env node
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const errors = [];

function err(msg) {
  errors.push(msg);
}

async function checkAppliedMigrations() {
  const requiredTokens = [
    "tenant_safety_phase1",
    "phase2_variants_inventory",
    "phase2_variants_stock",
    "phase3_channel_mappings"
  ];
  const rows = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL
  `;
  const names = rows.map((r) => r.migration_name);
  requiredTokens.forEach((token) => {
    if (!names.some((n) => n.includes(token))) {
      err(`Missing applied migration containing token: ${token}`);
    }
  });
}

async function checkSchemaArtifacts() {
  // ProductVariant table
  const pv = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='ProductVariant'
  `;
  if (pv.length === 0) err("Table ProductVariant is missing");

  // OrderLine.variantId column
  const olVariant = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='OrderLine' AND column_name='variantId'
  `;
  if (olVariant.length === 0) err("OrderLine.variantId column is missing");

  // StockLedger.kind column not null
  const slKind = await prisma.$queryRaw`
    SELECT is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='StockLedger' AND column_name='kind'
  `;
  if (slKind.length === 0) {
    err("StockLedger.kind column is missing");
  } else if (slKind[0].is_nullable === "YES") {
    err("StockLedger.kind should be NOT NULL");
  }

  // StockSnapshot.updatedAt column
  const ssUpdated = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='StockSnapshot' AND column_name='updatedAt'
  `;
  if (ssUpdated.length === 0) err("StockSnapshot.updatedAt column is missing");

  // StockReservation table
  const sr = await prisma.$queryRaw`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='StockReservation'
  `;
  if (sr.length === 0) err("Table StockReservation is missing");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    err("DATABASE_URL is not set");
    return;
  }
  await checkAppliedMigrations();
  await checkSchemaArtifacts();
}

main()
  .catch((e) => {
    err(`Unexpected error: ${e?.message ?? e}`);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
    if (errors.length) {
      errors.forEach((m) => console.error(`FAIL: ${m}`));
      process.exit(1);
    } else {
      console.log("Migration check OK");
      process.exit(0);
    }
  });
