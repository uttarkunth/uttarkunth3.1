import fs from 'node:fs';
import path from 'node:path';

// Ensure core media assets from repository /assets are present in /public/assets at build time
try {
  const srcDir = path.resolve(process.cwd(), 'assets');
  const destDir = path.resolve(process.cwd(), 'public', 'assets');
  if (fs.existsSync(srcDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of [
      'gaurav-negi-founder.webp',
      'uttarkunth-hero-video.webm',
      'uttarkunth-stays-homepage-card.webp',
      'products-home-page.webp',
      'productions-home.webp',
      'community-home-page.webp'
    ]) {
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
      { source: '/properties', destination: '/stays', permanent: true },
      { source: '/properties/:slug', destination: '/stays/:slug', permanent: true },
      { source: '/productions', destination: '/production', permanent: true },
      { source: '/productions/:slug', destination: '/production/:slug', permanent: true },
      { source: '/guest/trips', destination: '/trips', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/trips/:id', destination: '/guest/trips/:id' },
      { source: '/stays/:slug', destination: '/properties/:slug' },
    ];
  },
};

export default nextConfig;
