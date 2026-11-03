import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const workerPath = path.join(rootDir, '.open-next', 'worker.js');

if (fs.existsSync(workerPath)) {
  console.log('[cloudflare-build] .open-next/worker.js already exists; skipping duplicate OpenNext build.');
  process.exit(0);
}

const standaloneServerPath = path.join(rootDir, '.next', 'standalone', 'server.js');
const skipNextFlag = fs.existsSync(standaloneServerPath) ? ' --skipNextBuild' : '';

console.log(
  `[cloudflare-build] Building OpenNext Cloudflare worker${
    skipNextFlag ? ' (reusing existing .next/standalone output)' : ''
  }...`
);

execSync(`npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion${skipNextFlag}`, {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
});
