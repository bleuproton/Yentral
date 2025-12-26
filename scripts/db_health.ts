import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const envOrder = ['.env', '.env.local', '.env.development', '.env.development.local'];
for (const file of envOrder) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: true });
  }
}

type Finding = { level: 'OK' | 'WARN' | 'CRIT'; message: string };

const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
const migrationNameRegex = /^\d{14}_.+/;

function listFsMigrations() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => {
      const p = path.join(migrationsDir, f);
      return fs.statSync(p).isDirectory() && migrationNameRegex.test(f) && fs.existsSync(path.join(p, 'migration.sql'));
    })
    .sort();
}

function findLooseSql(): string[] {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isFile() && f.endsWith('.sql'));
}

async function main() {
  const findings: Finding[] = [];

  if (!process.env.DATABASE_URL) {
    console.error('CRIT: DATABASE_URL not set. Set it before running db:health.');
    process.exit(1);
  }

  const loose = findLooseSql();
  if (loose.length > 0) {
    findings.push({ level: 'CRIT', message: `Loose SQL files in migrations root: ${loose.join(', ')}` });
  }

  const fsMigrations = listFsMigrations();
  let dbMigrations: string[] = [];
  let failed: string[] = [];
  let rolledBack: string[] = [];

  try {
    const prisma = new PrismaClient();
    const rows = await prisma.$queryRaw<
      { migration_name: string; started_at: Date | null; finished_at: Date | null; rolled_back_at: Date | null; logs: string | null }[]
    >`SELECT migration_name, started_at, finished_at, rolled_back_at, logs FROM "_prisma_migrations" ORDER BY started_at`;
    dbMigrations = rows.map((r) => r.migration_name);
    failed = rows.filter((r) => r.finished_at === null && r.rolled_back_at === null).map((r) => r.migration_name);
    rolledBack = rows.filter((r) => r.rolled_back_at !== null).map((r) => r.migration_name);
    await prisma.$disconnect();
  } catch (err: any) {
    findings.push({ level: 'CRIT', message: `Failed to query _prisma_migrations (${err.message ?? err})` });
  }

  const missingLocal = dbMigrations.filter((m) => !fsMigrations.includes(m));
  const pending = fsMigrations.filter((m) => !dbMigrations.includes(m));

  if (failed.length > 0) {
    findings.push({ level: 'CRIT', message: `Failed migrations (not finished): ${failed.join(', ')}` });
  }
  if (rolledBack.length > 0) {
    findings.push({
      level: 'WARN',
      message: `Rolled-back migrations in DB: ${rolledBack.join(', ')}. Options: A) dev only: npx prisma migrate reset --force (data loss). B) careful: npx prisma migrate resolve --applied <name> if DB state is correct.`,
    });
  }
  if (missingLocal.length > 0) {
    findings.push({ level: 'WARN', message: `Migrations present in DB but missing locally: ${missingLocal.join(', ')}` });
  }
  if (pending.length > 0) {
    findings.push({ level: 'WARN', message: `Pending migrations not applied: ${pending.join(', ')}` });
  }

  // Drift check
  try {
    const shadow = process.env.SHADOW_DATABASE_URL
      ? ` --shadow-database-url ${process.env.SHADOW_DATABASE_URL}`
      : '';
    const diff = execSync(
      `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script${shadow}`,
      { encoding: 'utf8' }
    ).trim();
    if (diff.length > 0 && diff !== '-- This is an empty migration.') {
      findings.push({ level: 'WARN', message: 'Drift or pending schema changes detected by migrate diff' });
    }
  } catch (err: any) {
    findings.push({
      level: 'WARN',
      message: `Drift check failed (${err.message ?? err}). Hint: set SHADOW_DATABASE_URL for diff.`,
    });
  }

  const latestFs = fsMigrations[fsMigrations.length - 1] ?? 'none';
  const latestDb = dbMigrations[dbMigrations.length - 1] ?? 'none';

  console.log('--- DB Health Report ---');
  console.log(`Latest FS migration: ${latestFs}`);
  console.log(`Latest DB migration: ${latestDb}`);
  findings.forEach((f) => {
    const icon = f.level === 'OK' ? '✅' : f.level === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${f.level}] ${f.message}`);
  });

  const crit = findings.some((f) => f.level === 'CRIT');
  process.exit(crit ? 1 : 0);
}

main();
