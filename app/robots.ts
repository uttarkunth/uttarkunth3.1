import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/constants';

const SITE_URL = BRAND.officialDomain.replace(/\\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/staff',
        '/account',
        '/host',
        '/guest',
        '/trips',
        '/api/',
        '/login',
        '/signup',
        '/register',
        '/forgot-password',
        '/search',
        '/preview',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
