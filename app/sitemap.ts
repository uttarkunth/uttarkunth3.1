import type { MetadataRoute } from 'next';
import { BRAND, AUTHENTIC_PRODUCTIONS, COMMUNITY_INITIATIVES } from '@/lib/constants';
import { CURATED_DESTINATIONS } from '@/lib/destinations';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';

const SITE_URL = BRAND.officialDomain;

const sitemapEntry = (
  path: string,
  priority: number,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']> = 'monthly',
): MetadataRoute.Sitemap[number] => ({
  url: `${SITE_URL}${path}`,
  priority,
  changeFrequency,
});

/**
 * Public search-engine sitemap.
 *
 * Only canonical, public-facing URLs belong here. Private account, host,
 * guest, staff and admin routes are deliberately excluded.
 *
 * Database queries use the public Supabase client only. This metadata route
 * must not depend on request cookies, request headers, or a service-role
 * fallback. Every catalogue lookup is isolated so an unavailable table or
 * environment variable cannot prevent the static public URLs from rendering.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    sitemapEntry('/', 1, 'weekly'),
    sitemapEntry('/about', 0.9, 'monthly'),
    sitemapEntry('/contact', 0.7, 'monthly'),
    sitemapEntry('/stays', 0.9, 'daily'),
    sitemapEntry('/products', 0.8, 'weekly'),
    sitemapEntry('/production', 0.8, 'weekly'),
    sitemapEntry('/community', 0.8, 'weekly'),
    sitemapEntry('/community/initiatives', 0.7, 'monthly'),
    sitemapEntry('/community/stories', 0.7, 'weekly'),
    sitemapEntry('/community/join', 0.6, 'monthly'),
    sitemapEntry('/stays/partner', 0.6, 'monthly'),
    sitemapEntry('/products/sell', 0.6, 'monthly'),
    sitemapEntry('/production/collaborate', 0.6, 'monthly'),
    sitemapEntry('/privacy', 0.3, 'yearly'),
    sitemapEntry('/terms', 0.3, 'yearly'),
    sitemapEntry('/booking-policy', 0.4, 'yearly'),
    sitemapEntry('/cancellation-policy', 0.4, 'yearly'),
  ];

  const destinationEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from('destinations')
      .select('slug')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    const slugs = !error && data?.length
      ? data.map((destination) => destination.slug)
      : CURATED_DESTINATIONS.map((destination) => destination.slug);

    for (const slug of new Set(slugs.filter(Boolean))) {
      destinationEntries.push(
        sitemapEntry(`/stays/destinations/${encodeURIComponent(slug)}`, 0.65, 'monthly'),
      );
    }
  } catch {
    for (const destination of CURATED_DESTINATIONS) {
      destinationEntries.push(
        sitemapEntry(
          `/stays/destinations/${encodeURIComponent(destination.slug)}`,
          0.65,
          'monthly',
        ),
      );
    }
  }

  const propertyEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from('properties')
      .select('slug, updated_at')
      .eq('published', true)
      .eq('moderation_status', 'approved');

    if (!error && data) {
      for (const property of data) {
        if (!property.slug) continue;
        const entry = sitemapEntry(`/stays/${encodeURIComponent(property.slug)}`, 0.8, 'weekly');
        if (property.updated_at) entry.lastModified = new Date(property.updated_at);
        propertyEntries.push(entry);
      }
    }
  } catch {
    // Static public pages and destination pages remain available.
  }

  const productEntries: MetadataRoute.Sitemap = [];
  try {
    // RLS must expose only approved products to the public client.
    // If public read access is unavailable, omit product details rather than
    // using a privileged service-role client in this public metadata route.
    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('moderation_status', 'approved');

    if (!error && data) {
      for (const product of data) {
        if (!product.slug) continue;
        const entry = sitemapEntry(`/products/${encodeURIComponent(product.slug)}`, 0.7, 'weekly');
        if (product.updated_at) entry.lastModified = new Date(product.updated_at);
        productEntries.push(entry);
      }
    }
  } catch {
    // Keep the sitemap available if the public product catalogue is unavailable.
  }

  const productionEntries = AUTHENTIC_PRODUCTIONS
    .filter((production) => Boolean(production.slug))
    .map((production) =>
      sitemapEntry(`/production/${encodeURIComponent(production.slug)}`, 0.65, 'monthly'),
    );

  const initiativeEntries = COMMUNITY_INITIATIVES
    .filter((initiative) => Boolean(initiative.slug))
    .map((initiative) =>
      sitemapEntry(
        `/community/initiatives/${encodeURIComponent(initiative.slug)}`,
        0.55,
        'monthly',
      ),
    );

  // De-duplicate paths while keeping the first (highest-priority) entry.
  const uniqueEntries = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const entry of [
    ...staticEntries,
    ...destinationEntries,
    ...propertyEntries,
    ...productEntries,
    ...productionEntries,
    ...initiativeEntries,
  ]) {
    if (!uniqueEntries.has(entry.url)) uniqueEntries.set(entry.url, entry);
  }

  return Array.from(uniqueEntries.values());
}

/** Refresh database-driven listings at most once per hour. */
export const revalidate = 3600;
