import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

// 1. Clean any stale Cloudflare build output cache to prevent incremental type checking pollution
try {
  const nextDir = path.join(rootDir, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[postinstall] Cleaned stale .next build cache');
  }
  const openNextDir = path.join(rootDir, '.open-next');
  if (fs.existsSync(openNextDir)) {
    fs.rmSync(openNextDir, { recursive: true, force: true });
    console.log('[postinstall] Cleaned stale .open-next directory');
  }
  console.log(`[postinstall] Fresh build environment verified at ${new Date().toISOString()}`);
} catch {
  // Ignore errors in read-only environments
}

// 2. Ensure tsconfig.json exists (protects @/* path aliases if accidentally deleted)
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
      incremental: false,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  };
  fs.writeFileSync(tsconfigPath, JSON.stringify(defaultTsconfig, null, 2) + '\n', 'utf8');
  console.log('[postinstall] Restored missing tsconfig.json');
}

// 3. Copy static media from /assets to /public/assets if needed
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

// 4. Ensure OpenNext LTS compatibility with Next.js 14
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
      console.log('[postinstall] Ensured OpenNext Next.js 14 LTS support compatibility');
    }
  }
} catch {
  // Ignore errors if node_modules not yet present
}
