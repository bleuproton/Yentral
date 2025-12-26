import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const envOrder = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
];
for (const file of envOrder) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: true });
  }
}

type Finding = { level: 'OK' | 'WARN' | 'CRIT'; message: string };

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');

const GLOBAL_MODELS = new Set([
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'Jurisdiction',
  'Connector',
  'ConnectorVersion',
  'Plugin',
  'PluginVersion',
  'Tenant', // root model, no tenantId expected
]);

function runCmd(cmd: string, findings: Finding[], label: string) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    findings.push({ level: 'OK', message: `${label}: OK` });
  } catch (err: any) {
    findings.push({ level: 'CRIT', message: `${label}: FAILED (${err.message ?? err})` });
  }
}

function parseModels(schema: string) {
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/gms;
  const models: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = modelRegex.exec(schema))) {
    models[match[1]] = match[2];
  }
  return models;
}

function checkTenantFields(models: Record<string, string>): Finding[] {
  const findings: Finding[] = [];
  for (const [name, block] of Object.entries(models)) {
    if (GLOBAL_MODELS.has(name)) continue;
    const hasTenantId = /\btenantId\b/.test(block);
    if (!hasTenantId) {
      findings.push({ level: 'CRIT', message: `Model ${name} missing tenantId` });
      continue;
    }
    const hasTenantRel = /\bTenant\b/.test(block);
    if (!hasTenantRel) {
      findings.push({ level: 'WARN', message: `Model ${name} has tenantId but no Tenant relation` });
    }
    const uniqueMatches = block.match(/@@unique\s*\(([^)]*)\)/gms) || [];
    for (const u of uniqueMatches) {
      if (!u.includes('tenantId')) {
        findings.push({ level: 'WARN', message: `Model ${name} unique without tenantId: ${u.trim()}` });
      }
    }
    const lines = block.split('\n');
    for (const line of lines) {
      if (line.includes('@unique')) {
        const field = line.trim().split(/\s+/)[0];
        if (field !== 'id' && field !== 'tenantId' && !line.includes('tenantId')) {
          findings.push({ level: 'WARN', message: `Model ${name} field unique without tenantId: ${field}` });
        }
      }
    }
    const rels = block.match(/@relation\([^)]+references:\s*\[([^\]]+)\][^)]+\)/gms) || [];
    const relationLineRegex = /(\w+)\s+([\w\[\]\?]+)\s+@relation\(([^)]*)\)/g;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relationLineRegex.exec(block))) {
      const targetRaw = relMatch[2];
      const relationArgs = relMatch[3];
      const target = targetRaw.replace(/[?\[\]]/g, '');
      if (GLOBAL_MODELS.has(target)) continue;
      const hasFieldsClause = /fields:\s*\[/.test(relationArgs);
      const hasRefsClause = /references:\s*\[/.test(relationArgs);
      if (!hasFieldsClause || !hasRefsClause) continue; // handled on the other side of the relation
      const hasTenantField = /fields:\s*\[[^\]]*tenantId[^\]]*\]/.test(relationArgs);
      const hasTenantRef = /references:\s*\[[^\]]*tenantId[^\]]*\]/.test(relationArgs);
      if (!hasTenantField || !hasTenantRef) {
        findings.push({
          level: 'WARN',
          message: `Model ${name} relation potentially cross-tenant (${target}): ${relationArgs.trim()}`,
        });
      }
    }
  }
  return findings;
}

function checkMigrations(): Finding[] {
  const findings: Finding[] = [];
  if (!fs.existsSync(migrationsDir)) {
    return [{ level: 'CRIT', message: 'prisma/migrations not found' }];
  }
  const entries = fs.readdirSync(migrationsDir);
  const migrationNameRegex = /^\d{14}_.+/;
  for (const entry of entries) {
    const full = path.join(migrationsDir, entry);
    const stat = fs.statSync(full);
    if (stat.isFile()) continue;
    if (!stat.isDirectory()) continue;
    if (!migrationNameRegex.test(entry)) continue; // ignore non-migration entries
    const migrationFile = path.join(full, 'migration.sql');
    if (!fs.existsSync(migrationFile)) {
      findings.push({ level: 'CRIT', message: `Missing migration.sql in ${entry}` });
    } else {
      const extras = fs.readdirSync(full).filter((f) => f !== 'migration.sql');
      if (extras.length > 0) {
        findings.push({ level: 'WARN', message: `Extra files in migration folder ${entry}: ${extras.join(', ')}` });
      }
    }
  }
  return findings;
}

async function main() {
  const findings: Finding[] = [];
  if (!fs.existsSync(schemaPath)) {
    console.error('schema.prisma not found');
    process.exit(1);
  }
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const models = parseModels(schema);

  findings.push(...checkTenantFields(models));
  findings.push(...checkMigrations());

  runCmd('npx prisma validate', findings, 'prisma validate');
  runCmd('npx prisma migrate status', findings, 'prisma migrate status');
  runCmd('npx prisma generate', findings, 'prisma generate');

  if (process.env.DATABASE_URL) {
    try {
      execSync('npx prisma db pull --print', { stdio: 'ignore' });
      findings.push({ level: 'OK', message: 'prisma db pull --print: OK' });
    } catch (err: any) {
      findings.push({ level: 'WARN', message: `prisma db pull --print failed (${err.message ?? err})` });
    }
    try {
      const prisma = new PrismaClient();
      const rows = await execPrismaMigrations(prisma);
      const dbMigrations = rows.map((r) => r.migration_name);
      const fsMigrations = listFsMigrations();
      const notApplied = fsMigrations.filter((m) => !dbMigrations.includes(m));
      const missingLocal = dbMigrations.filter((m) => !fsMigrations.includes(m));
      const rolledBack = rows.filter((r) => r.rolled_back_at !== null);
      if (notApplied.length > 0) {
        findings.push({ level: 'WARN', message: `Migrations not applied: ${notApplied.join(', ')}` });
      }
      if (missingLocal.length > 0) {
        findings.push({ level: 'WARN', message: `Migrations present in DB but missing locally: ${missingLocal.join(', ')}` });
      }
      if (rolledBack.length > 0) {
        findings.push({ level: 'WARN', message: `Rolled back migrations in DB: ${rolledBack.map((r) => r.migration_name).join(', ')}` });
      }
      await prisma.$disconnect();
    } catch (err: any) {
      findings.push({ level: 'WARN', message: `DB migration check failed (${err.message ?? err})` });
    }
  } else {
    findings.push({ level: 'WARN', message: 'DATABASE_URL not set; skipped db pull check' });
  }

  const critCount = findings.filter((f) => f.level === 'CRIT').length;
  const warnCount = findings.filter((f) => f.level === 'WARN').length;

  console.log('\n--- Phase 6 Verification Report ---');
  for (const f of findings) {
    const icon = f.level === 'OK' ? '✅' : f.level === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${f.level}] ${f.message}`);
  }
  console.log(`\nSummary: ${critCount} critical, ${warnCount} warnings`);

  process.exit(critCount > 0 ? 1 : 0);
}

main();

// Helpers
function listFsMigrations(): string[] {
  if (!fs.existsSync(migrationsDir)) return [];
  const migrationNameRegex = /^\d{14}_.+/;
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => {
      const p = path.join(migrationsDir, f);
      return fs.statSync(p).isDirectory() && migrationNameRegex.test(f) && fs.existsSync(path.join(p, 'migration.sql'));
    })
    .sort();
}

async function execPrismaMigrations(prisma: PrismaClient) {
  return prisma.$queryRaw<
    { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; applied_steps_count: bigint | number }[]
  >`SELECT migration_name, finished_at, rolled_back_at, applied_steps_count
     FROM "_prisma_migrations"
     ORDER BY started_at`;
}
