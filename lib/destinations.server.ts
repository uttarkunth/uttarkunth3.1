import {
  CURATED_DESTINATIONS,
  filterPropertiesForDestination,
  getCanonicalDestinationSlug,
  getNearbyPropertiesForDestination,
  type Destination,
} from '@/lib/destinations';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

/**
 * Fetch all active destinations from Supabase (with safe fallback to CURATED_DESTINATIONS)
 */
export async function getActiveDestinations(): Promise<Destination[]> {
  try {
    const supabase: any = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : createServerSupabaseClient();
    const { data, error } = await supabase
      .from('destinations')
      .select('id, slug, name, region, tagline, description, match_terms, featured, active, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return CURATED_DESTINATIONS;
    }

    return data.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      region: d.region as any,
      tagline: d.tagline || '',
      description: d.description || '',
      matchTerms: d.match_terms || [],
      featured: d.featured || false,
    }));
  } catch {
    return CURATED_DESTINATIONS;
  }
}

/**
 * Get destination by slug with alias resolution
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const normalized = (slug || '').toLowerCase().trim();
  const all = await getActiveDestinations();
  const direct = all.find((d) => d.slug === normalized);
  if (direct) return direct;

  // Handle common aliases
  if (normalized === 'kasol-and-parvati-valley' || normalized === 'parvati-valley') {
    return all.find((d) => d.slug === 'kasol') || null;
  }
  if (normalized === 'kullu' || normalized === 'jari') {
    return all.find((d) => d.slug === 'kullu-jari') || null;
  }
  if (normalized === 'jibhi-and-tirthan-valley' || normalized === 'tirthan') {
    return all.find((d) => d.slug === 'jibhi') || null;
  }
  if (normalized === 'dharamshala-and-mcleod-ganj' || normalized === 'mcleodganj') {
    return all.find((d) => d.slug === 'dharamshala') || null;
  }
  if (normalized === 'spiti') {
    return all.find((d) => d.slug === 'spiti-valley') || null;
  }

  return null;
}
