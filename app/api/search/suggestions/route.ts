import { NextRequest, NextResponse } from 'next/server';
import {
  AUTHENTIC_PRODUCTIONS,
  EXISTING_PROPERTIES,
  PRODUCT_CATEGORIES,
} from '@/lib/constants';
import {
  CURATED_DESTINATIONS,
  filterPropertiesForDestination,
  getActiveDestinations,
} from '@/lib/destinations.server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import {
  unifiedClientSearchHandler,
  type SearchableServiceType,
  type StayPropertyItem,
  type ProductItem,
  type ProductCategoryItem,
  type ProductionItem,
} from '@/lib/smart-suggestions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawCategory = (searchParams.get('category') || 'stays').toLowerCase();
  const activeCategory: SearchableServiceType =
    rawCategory === 'products'
      ? 'products'
      : rawCategory === 'productions'
        ? 'productions'
        : 'stays';

  const query = searchParams.get('q') || '';
  const propertyTypes = (searchParams.get('propertyTypes') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const categories = (searchParams.get('categories') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const genres = (searchParams.get('genres') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let destinations = CURATED_DESTINATIONS;
  let properties: StayPropertyItem[] = EXISTING_PROPERTIES;
  let products: ProductItem[] = [];
  const productCategories: ProductCategoryItem[] = PRODUCT_CATEGORIES.filter(
    (c) => c.id !== 'other'
  ).map((c) => ({ ...c }));
  const productions: ProductionItem[] = AUTHENTIC_PRODUCTIONS.map((p) => ({ ...p }));

  try {
    destinations = await getActiveDestinations();
  } catch {
    destinations = CURATED_DESTINATIONS;
  }

  try {
    const supabase = createPublicServerSupabaseClient();

    if (activeCategory === 'stays') {
      const { data: liveProps, error } = await supabase
        .from('properties')
        .select(
          'id, slug, name, description, village, district, state, property_type, published, moderation_status'
        )
        .eq('published', true)
        .eq('moderation_status', 'approved')
        .limit(20);

      if (!error && liveProps && liveProps.length > 0) {
        properties = liveProps;
      }
    } else if (activeCategory === 'products') {
      const { data: liveProducts, error } = await supabase
        .from('products')
        .select('id, slug, title, category, description, origin_valley, origin_state, maker_name')
        .eq('moderation_status', 'approved')
        .limit(20);

      if (!error && liveProducts && liveProducts.length > 0) {
        products = liveProducts;
      }
    }
  } catch {
    // Graceful fallback to curated static datasets
  }

  const destinationsWithCounts = destinations.map((d) => ({
    ...d,
    propertyCount: filterPropertiesForDestination(properties, d).length,
  }));

  const availableGenres = Array.from(
    new Set(productions.map((p) => p.category).filter(Boolean))
  );

  const { liveSuggestions } = unifiedClientSearchHandler({
    activeCategory,
    query,
    filters: {
      propertyTypes,
      categories,
      genres,
    },
    recentSearches: [],
    destinations: destinationsWithCounts,
    properties,
    products,
    productCategories,
    productions,
    availableGenres,
  });

  return NextResponse.json({
    category: activeCategory,
    query,
    suggestions: liveSuggestions,
    counts: {
      total: liveSuggestions.length,
      destinations: liveSuggestions.filter((s) => s.kind === 'destination').length,
      properties: liveSuggestions.filter((s) => s.kind === 'property').length,
      productCategories: liveSuggestions.filter((s) => s.kind === 'product-category').length,
      products: liveSuggestions.filter((s) => s.kind === 'product').length,
      genres: liveSuggestions.filter((s) => s.kind === 'genre').length,
      films: liveSuggestions.filter((s) => s.kind === 'film').length,
    },
    timestamp: Date.now(),
  });
}
