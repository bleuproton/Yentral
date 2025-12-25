#!/usr/bin/env node
import { readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const errors = [];

function addError(message) {
  errors.push(message);
}

function checkLooseSqlFiles() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const entries = readdirSync(migrationsDir, { withFileTypes: true });
  const looseSql = entries.filter((e) => e.isFile() && e.name.endsWith(".sql"));
  if (looseSql.length) {
    addError(`Loose .sql files detected in prisma/migrations: ${looseSql.map((e) => e.name).join(", ")}`);
  }
}

function getLocalMigrations() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const entries = readdirSync(migrationsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => /^\d{8,}_/.test(name));
}

async function getDbMigrations() {
  const rows = await prisma.$queryRaw`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
  `;
  return rows.map((r) => ({
    name: r.migration_name,
    finished: r.finished_at,
    rolledBack: r.rolled_back_at
  }));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    addError("DATABASE_URL is not set");
    reportAndExit();
    return;
  }

  checkLooseSqlFiles();
  const local = getLocalMigrations();
  let dbMigrations = [];

  try {
    dbMigrations = await getDbMigrations();
  } catch (err) {
    addError(`Failed to read _prisma_migrations: ${err?.message ?? err}`);
    reportAndExit();
    return;
  }

  const unfinished = dbMigrations.filter((m) => !m.finished || m.rolledBack);
  if (unfinished.length) {
    addError(
      `Unfinished/rolled-back migrations in DB: ${unfinished
        .map((m) => `${m.name}${m.rolledBack ? " (rolled back)" : ""}`)
        .join(", ")}`
    );
  }

  const dbNames = new Set(dbMigrations.map((m) => m.name));
  const missingInDb = local.filter((name) => !dbNames.has(name));
  if (missingInDb.length) {
    addError(`Local migrations not applied in DB: ${missingInDb.join(", ")}`);
  }

  const localSet = new Set(local);
  const missingLocally = dbMigrations.filter((m) => !localSet.has(m.name)).map((m) => m.name);
  if (missingLocally.length) {
    addError(`DB has migrations not present locally: ${missingLocally.join(", ")}`);
  }

  reportAndExit();
}

function reportAndExit() {
  if (errors.length) {
    errors.forEach((msg) => console.error(`FAIL: ${msg}`));
    prisma
      .$disconnect()
      .catch(() => undefined)
      .finally(() => process.exit(1));
  } else {
    console.log("Migrations OK");
    prisma
      .$disconnect()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  }
}

main().catch((err) => {
  console.error("FAIL: unexpected error", err);
  prisma
    .$disconnect()
    .catch(() => undefined)
    .finally(() => process.exit(1));
});
