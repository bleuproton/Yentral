import { execSync } from 'child_process';

type Result = { cmd: string; status: 'OK' | 'CRIT'; details?: string };

const cmds = [
  'npm run phase6:verify',
  'npm run db:health',
  'npm run smoke:phase2-3',
  'npm run smoke:phase4',
  'npm run smoke:phase5',
  'npm run smoke:phase6',
  'npm run smoke:fulfillment',
  'npm run smoke:accounting',
  'npm run smoke:oss',
  'npm run smoke:phase7',
];

function runCmd(cmd: string): Result {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return { cmd, status: 'OK' };
  } catch (err: any) {
    return { cmd, status: 'CRIT', details: err?.message ?? String(err) };
  }
}

function main() {
  const results = cmds.map(runCmd);
  console.log('\n--- Progress Report ---');
  results.forEach((r) => {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${r.cmd}${r.details ? `: ${r.details}` : ''}`);
  });
  const crit = results.filter((r) => r.status === 'CRIT').length;
  console.log(`\nSummary: ${crit} critical, 0 warnings`);
  process.exit(crit > 0 ? 1 : 0);
}

main();
