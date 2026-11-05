import fs from 'node:fs';
import path from 'node:path';

// Ensure core media assets from repository /assets are present in /public/assets at build time
try {
  const srcDir = path.resolve(process.cwd(), 'assets');
  const destDir = path.resolve(process.cwd(), 'public', 'assets');
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
  // Ignore filesystem write errors in read-only edge environments
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  cleanDistDir: false,
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xyplgugxpmlnjsvlosdg.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/properties', destination: '/stays', permanent: false },
      { source: '/properties/:slug', destination: '/stays/:slug', permanent: false },
      { source: '/productions', destination: '/production', permanent: false },
      { source: '/productions/:slug', destination: '/production/:slug', permanent: false },
      { source: '/guest/trips', destination: '/trips', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/trips/:id', destination: '/guest/trips/:id' },
    ];
  },
};

export default nextConfig;