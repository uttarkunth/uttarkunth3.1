import {
  CURATED_DESTINATIONS,
  filterPropertiesForDestination,
  getCanonicalDestinationSlug,
  getNearbyPropertiesForDestination,
  type Destination,
} from '@/lib/destinations';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: lib/destinations.server.ts cannot be imported in client code.');
}

export {
  CURATED_DESTINATIONS,
  filterPropertiesForDestination,
  getCanonicalDestinationSlug,
  getNearbyPropertiesForDestination,
  type Destination,
};

function resolveCanonicalCuratedSlug(rawSlug: string, rawName?: string): string {
  const s = (rawSlug || '').toLowerCase().trim();
  const n = (rawName || '').toLowerCase().trim();
  if (s === 'kasol-and-parvati-valley' || s === 'parvati-valley' || n.startsWith('kasol')) {
    return 'kasol';
  }
  if (
    s === 'kullu-and-jari' ||
    s === 'kullu-jari' ||
    s === 'jari' ||
    s === 'kullu' ||
    n === 'kullu and jari' ||
    n === 'kullu jari' ||
    n === 'kullu'
  ) {
    return 'kullu-jari';
  }
  if (s === 'jibhi-and-tirthan-valley' || s === 'tirthan' || n.startsWith('jibhi')) {
    return 'jibhi';
  }
  if (s === 'dharamshala-and-mcleod-ganj' || s === 'mcleodganj' || n.startsWith('dharamshala')) {
    return 'dharamshala';
  }
  if (s === 'dalhousie-and-khajjiar' || n.startsWith('dalhousie')) {
    return 'dalhousie';
  }
  if (s === 'spiti') {
    return 'spiti-valley';
  }
  return s;
}

/**
 * Fetch all active destinations from Supabase (with safe fallback to CURATED_DESTINATIONS)
 */
export async function getActiveDestinations(): Promise<Destination[]> {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasValidServiceKey =
      Boolean(serviceKey) &&
      !serviceKey!.includes('your_') &&
      !serviceKey!.includes('placeholder') &&
      serviceKey!.length > 40;

    const supabase: any = hasValidServiceKey
      ? createAdminClient()
      : createPublicServerSupabaseClient();
    const { data, error } = await supabase
      .from('destinations')
      .select('id, slug, name, region, tagline, description, match_terms, featured, active, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return CURATED_DESTINATIONS;
    }

    const seenCanonicalSlugs = new Set<string>();
    const dbMapped: Destination[] = [];

    for (const d of data) {
      const canonicalSlug = resolveCanonicalCuratedSlug(d.slug, d.name);
      if (canonicalSlug === 'jim-corbett' || canonicalSlug === 'corbett') continue;
      if (seenCanonicalSlugs.has(canonicalSlug)) continue;
      seenCanonicalSlugs.add(canonicalSlug);

      const curatedMatch = CURATED_DESTINATIONS.find((c) => c.slug === canonicalSlug);
      dbMapped.push({
        id: d.id,
        slug: curatedMatch?.slug || d.slug,
        name: curatedMatch?.name || d.name,
        region: (curatedMatch?.region || d.region) as any,
        tagline: d.tagline || curatedMatch?.tagline || '',
        description: d.description || curatedMatch?.description || '',
        matchTerms: d.match_terms || curatedMatch?.matchTerms || [],
        image: d.image || curatedMatch?.image,
        featured: d.featured ?? curatedMatch?.featured ?? false,
      });
    }

    const missingCurated = CURATED_DESTINATIONS.filter(
      (d) => !seenCanonicalSlugs.has(d.slug)
    );
    return [...dbMapped, ...missingCurated];
  } catch {
    return CURATED_DESTINATIONS;
  }
}

/**
 * Get destination by slug with alias resolution
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const normalized = resolveCanonicalCuratedSlug(slug);
  const all = await getActiveDestinations();
  const direct = all.find((d) => d.slug === normalized || d.slug === slug);
  if (direct) return direct;

  const curatedDirect = CURATED_DESTINATIONS.find(
    (d) => d.slug === normalized || d.slug === slug
  );
  if (curatedDirect) return curatedDirect;

  return null;
}
