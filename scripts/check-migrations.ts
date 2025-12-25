#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

type Result = { ok: boolean; message: string };
const failures: Result[] = [];

function fail(message: string) {
  failures.push({ ok: false, message });
}

function checkLooseSql(root: string) {
  const entries = readdirSync(root, { withFileTypes: true });
  const loose = entries.filter((e) => e.isFile() && e.name.endsWith(".sql"));
  if (loose.length) {
    fail(`Loose .sql files in prisma/migrations: ${loose.map((e) => e.name).join(", ")}`);
  }
}

function checkMigrationFolders(root: string) {
  const dirs = readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory());
  dirs
    .filter((d) => /^\d{8,}_/.test(d.name))
    .forEach((d) => {
      const files = readdirSync(path.join(root, d.name)).filter((f) => statSync(path.join(root, d.name, f)).isFile());
      const sqlFiles = files.filter((f) => f.endsWith(".sql"));
      if (sqlFiles.length !== 1 || sqlFiles[0] !== "migration.sql") {
        fail(`Migration folder ${d.name} must contain exactly one migration.sql (found: ${files.join(", ") || "none"})`);
      }
    });
}

function runCmd(name: string, cmd: string) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (err: any) {
    fail(`${name} failed: ${err?.message ?? err}`);
  }
}

function runDiff() {
  try {
    execSync(
      `npx prisma migrate diff --from-migrations --to-schema-datamodel prisma/schema.prisma --exit-code`,
      { stdio: "inherit" }
    );
  } catch (err: any) {
    fail(`Drift check failed (diff not clean or command error): ${err?.message ?? err}`);
  }
}

function main() {
  const root = path.join(process.cwd(), "prisma", "migrations");
  checkLooseSql(root);
  checkMigrationFolders(root);
  runCmd("prisma validate", "npx prisma validate");
  runCmd("prisma migrate status", "npx prisma migrate status");
  runDiff();

  if (failures.length) {
    failures.forEach((f) => console.error(`FAIL: ${f.message}`));
    process.exit(1);
  } else {
    console.log("Migration check OK");
  }
}

main();
