import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

// 1. Ensure tsconfig.json exists (protects @/* path aliases if accidentally deleted)
const tsconfigPath = path.join(rootDir, 'tsconfig.json');
if (!fs.existsSync(tsconfigPath)) {
  const defaultTsconfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      allowImportingTsExtensions: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
  fs.writeFileSync(tsconfigPath, JSON.stringify(defaultTsconfig, null, 2) + '\n', 'utf8');
  console.log('[postinstall] Restored missing tsconfig.json');
}

// 2. Copy static media from /assets to /public/assets if needed
try {
  const srcDir = path.join(rootDir, 'assets');
  const destDir = path.join(rootDir, 'public', 'assets');
  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of ['gaurav-negi-founder.webp', 'uttarkunth-hero-video.webm']) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      if (fs.existsSync(srcFile) && !fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  }
} catch {
  // Ignore errors in read-only environments
}

// 3. Patch @opennextjs/aws helper.js so Next.js 14.2.35 builds without requiring CLI flag
try {
  const helperPath = path.join(rootDir, 'node_modules', '@opennextjs', 'aws', 'dist', 'build', 'helper.js');
  if (fs.existsSync(helperPath)) {
    let content = fs.readFileSync(helperPath, 'utf8');
    if (content.includes('14: "2023-10-26"')) {
      content = content.replace('14: "2023-10-26"', '14: "2026-10-26"');
      fs.writeFileSync(helperPath, content, 'utf8');
      console.log('[postinstall] Configured @opennextjs/aws compatibility for Next.js 14.2.x');
    }
  }
} catch {
  // Ignore if node_modules is not writable
}
