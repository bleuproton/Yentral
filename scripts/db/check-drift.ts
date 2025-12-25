#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import process from "node:process";

function main() {
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }
  if (!process.env.SHADOW_DATABASE_URL) {
    console.error("FAIL: SHADOW_DATABASE_URL is required for drift check");
    process.exit(1);
  }

  try {
    const output = execSync(
      `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "${process.env.DATABASE_URL}" --shadow-database-url "${process.env.SHADOW_DATABASE_URL}"`,
      { encoding: "utf8" }
    );
    if (output.trim().length > 0) {
      console.error("FAIL: Drift detected between schema.prisma and database:");
      console.error(output.trim());
      process.exit(1);
    }
    console.log("OK: No drift detected");
  } catch (err: any) {
    console.error(`FAIL: drift check command failed: ${err?.message ?? err}`);
    process.exit(1);
  }
}

main();
