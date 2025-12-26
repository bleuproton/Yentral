#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CheckResult = { name: string; ok: boolean; details?: string };

function runCmd(name: string, cmd: string): CheckResult {
  try {
    execSync(cmd, { stdio: "pipe" });
    return { name, ok: true };
  } catch (err: any) {
    return { name, ok: false, details: err?.message };
  }
}

async function run() {
  const results: CheckResult[] = [];

  // Environment
  const hasDbUrl = !!process.env.DATABASE_URL;
  results.push({
    name: "Env: DATABASE_URL set",
    ok: hasDbUrl,
    details: hasDbUrl ? undefined : "DATABASE_URL missing"
  });

  // Prisma validate
  results.push(runCmd("Prisma validate", "npx prisma validate"));

  // Prisma migrate status
  results.push(runCmd("Prisma migrate status", "npx prisma migrate status"));

  // Core tables existence
  try {
    const expected = ["Tenant", "Membership", "Product", "Warehouse", "Job"];
    const rows = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(${expected});
    `;
    const found = rows.map((r) => r.table_name);
    const missing = expected.filter((t) => !found.includes(t));
    results.push({
      name: "Core tables exist",
      ok: missing.length === 0,
      details: missing.length ? `Missing: ${missing.join(", ")}` : undefined
    });
  } catch (err: any) {
    results.push({ name: "Core tables exist", ok: false, details: err?.message });
  } finally {
    await prisma.$disconnect();
  }

  // Print checklist
  let allOk = true;
  for (const r of results) {
    const status = r.ok ? "OK" : "FAIL";
    console.log(`${status} - ${r.name}${r.details ? ` :: ${r.details}` : ""}`);
    if (!r.ok) allOk = false;
  }

  if (!allOk) process.exit(1);
}

run().catch((err) => {
  console.error("State check failed", err);
  process.exit(1);
});
