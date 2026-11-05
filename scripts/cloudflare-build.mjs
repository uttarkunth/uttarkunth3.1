import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const workerPath = path.join(rootDir, '.open-next', 'worker.js');

if (process.env.SKIP_OPENNEXT_REBUILD === 'true' && fs.existsSync(workerPath)) {
  console.log(
    '[cloudflare-build] SKIP_OPENNEXT_REBUILD=true and .open-next/worker.js exists; reusing existing worker bundle.'
  );
  process.exit(0);
}

const standaloneServerPath = path.join(rootDir, '.next', 'standalone', 'server.js');
const shouldRunNextBuild =
  process.env.FORCE_NEXT_BUILD === 'true' || !fs.existsSync(standaloneServerPath);

if (shouldRunNextBuild) {
  console.log('[cloudflare-build] Running next build...');
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: rootDir,
    env: process.env,
  });
} else {
  console.log('[cloudflare-build] Using freshly built .next/standalone output...');
}

console.log('[cloudflare-build] Building fresh OpenNext Cloudflare worker bundle...');

execSync(
  'npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion --skipNextBuild',
  {
    stdio: 'inherit',
    cwd: rootDir,
    env: process.env,
  }
);