#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import process from "node:process";

function main() {
  if (!process.env.FRESH_DATABASE_URL) {
    console.error("FAIL: FRESH_DATABASE_URL is not set");
    process.exit(1);
  }

  try {
    execSync(`npx prisma migrate deploy`, {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env.FRESH_DATABASE_URL }
    });
    console.log("OK: Fresh migrate deploy succeeded");
  } catch (err: any) {
    console.error(`FAIL: Fresh migrate deploy failed: ${err?.message ?? err}`);
    process.exit(1);
  }
}

main();
