import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const openNextDir = path.join(rootDir, '.open-next');

// 1. Clean previous Cloudflare bundle artifacts to guarantee a fresh worker generation
console.log('[cloudflare-build] Cleaning previous Cloudflare build artifacts (.open-next)...');
try {
  if (fs.existsSync(openNextDir)) {
    fs.rmSync(openNextDir, { recursive: true, force: true });
  }
} catch (cleanErr) {
  console.warn('[cloudflare-build] Note during artifact cleaning:', cleanErr);
}

// 2. Build OpenNext Cloudflare worker bundle (OpenNext invokes Next.js build via open-next.config.ts buildCommand)
console.log('[cloudflare-build] Executing OpenNext Cloudflare build...');
execSync('npx @opennextjs/cloudflare build --dangerouslyUseUnsupportedNextVersion', {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
});

console.log('[cloudflare-build] Cloudflare worker bundle built successfully in .open-next/worker.js');
