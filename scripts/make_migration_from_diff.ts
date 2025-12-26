import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const envOrder = ['.env', '.env.local', '.env.development', '.env.development.local'];
for (const file of envOrder) {
  const full = path.join(process.cwd(), file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full, override: true });
  }
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: migrate:make -- <name>');
    process.exit(1);
  }
  let diff = '';
  try {
    const shadow = process.env.SHADOW_DATABASE_URL
      ? ` --shadow-database-url ${process.env.SHADOW_DATABASE_URL}`
      : '';
    diff = execSync(
      `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script${shadow}`,
      { encoding: 'utf8' }
    );
  } catch (err: any) {
    console.error(`Failed to run prisma migrate diff: ${err.message ?? err}`);
    process.exit(1);
  }
  if (diff.trim().length === 0) {
    console.log('No changes detected; no migration created.');
    process.exit(0);
  }
  const ts = timestamp();
  const folder = path.join(process.cwd(), 'prisma', 'migrations', `${ts}_${name}`);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'migration.sql'), diff, 'utf8');
  console.log(`Migration created: prisma/migrations/${ts}_${name}/migration.sql`);
}

main();
