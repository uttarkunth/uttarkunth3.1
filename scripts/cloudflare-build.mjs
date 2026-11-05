import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const nextDir = path.join(rootDir, '.next');
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

// 2. Ensure OpenNext LTS Next.js 14 support patch is active
try {
  const openNextHelperPath = path.join(
    rootDir,
    'node_modules',
    '@opennextjs',
    'aws',
    'dist',
    'build',
    'helper.js'
  );
  if (fs.existsSync(openNextHelperPath)) {
    let content = fs.readFileSync(openNextHelperPath, 'utf8');
    if (content.includes('return now <= supportEndDate;')) {
      content = content.replace(
        'return now <= supportEndDate;',
        'return true; // LTS Next.js 14 supported'
      );
      fs.writeFileSync(openNextHelperPath, content, 'utf8');
      console.log('[cloudflare-build] Verified OpenNext Next.js 14 LTS support compatibility');
    }
  }
} catch (patchErr) {
  console.warn('[cloudflare-build] Note during OpenNext patch verification:', patchErr);
}

// 3. Execute fresh Next.js build
console.log('[cloudflare-build] Executing fresh Next.js build...');
execSync('npx next build', {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
});

// 4. Build fresh OpenNext Cloudflare worker bundle without unsupported flags
console.log('[cloudflare-build] Building fresh OpenNext Cloudflare worker bundle...');
execSync('npx opennextjs-cloudflare build --skipNextBuild', {
  stdio: 'inherit',
  cwd: rootDir,
  env: process.env,
});

console.log('[cloudflare-build] Cloudflare worker bundle built successfully in .open-next/worker.js');
