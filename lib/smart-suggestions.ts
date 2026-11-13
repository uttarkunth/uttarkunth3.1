import type { Destination } from '@/lib/destinations';

export type PillarCategory = 'stays' | 'products' | 'productions' | 'community';
export type SearchableServiceType = 'stays' | 'products' | 'productions';

export interface StayPropertyItem {
  id: string;
  slug: string;
  name: string;
  village?: string | null;
  district?: string | null;
  state?: string | null;
  description?: string | null;
  property_type?: string | null;
  rooms?: Array<{ base_price?: number | null; max_guests?: number | null }>;
}

export interface ProductItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  origin_valley?: string | null;
  origin_state?: string | null;
  maker_name?: string | null;
}

export interface ProductCategoryItem {
  id: string;
  name: string;
  description: string;
}

export interface ProductionItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  thumbnail?: string;
  videoSrc?: string;
  youtubeUrl?: string;
}

export interface ProductionGenreCatalogItem {
  id: string;
  name: string;
  shortName: string;
  subLabel: string;
  description: string;
  keywords: string[];
}

export interface RecentSearchEntry {
  id: string;
  service: SearchableServiceType;
  query: string;
  subtitle?: string;
  targetUrl?: string;
  filters?: {
    destination?: string;
    propertyTypes?: string[];
    categories?: string[];
    genres?: string[];
  };
  timestamp: number;
}

export interface SuggestionItem {
  id: string;
  kind:
    | 'recent'
    | 'destination'
    | 'property'
    | 'property-type'
    | 'product-category'
    | 'product'
    | 'genre'
    | 'film';
  title: string;
  shortTitle?: string;
  subtitle: string;
  description?: string;
  matchedSnippet?: string;
  meta?: string;
  score?: number;
  valueToPopulate: string;
  directUrl?: string;
  destinationSlug?: string;
  propertyType?: string;
  categoryId?: string;
  genreName?: string;
  recentEntry?: RecentSearchEntry;
}

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Curated Production Genres for Uttarkunth Productions smart suggestions
 */
export const PRODUCTION_GENRES_CATALOG: readonly ProductionGenreCatalogItem[] = [
  {
    id: 'documentary',
    name: 'Documentary',
    shortName: 'Documentary',
    subLabel: 'Ethnographic Films',
    description: 'In-depth ethnographic documentaries chronicling deity traditions, village life, and mountain ecology.',
    keywords: ['documentary', 'documentaries', 'ethnographic', 'deity', 'oracle', 'kullu', 'aaj ka devta', 'films'],
  },
  {
    id: 'cultural-monologue',
    name: 'Cultural Monologue',
    shortName: 'Cultural Monologue',
    subLabel: 'Ritual & Oral Lore',
    description: 'Intimate first-person cultural monologues exploring ritual transitions and oral memory in sacred hamlets.',
    keywords: ['cultural', 'monologue', 'ritual', 'oral', 'lore', 'ruk gayi gupt bali', 'tradition', 'voice'],
  },
  {
    id: 'ethnographic-archive',
    name: 'Ethnographic Archive',
    shortName: 'Ethnographic Archive',
    subLabel: 'Living Heritage',
    description: 'Archival field recordings preserving Kath-Kuni architecture, pastoral routes, and Pahari dialects.',
    keywords: ['archive', 'ethnographic', 'heritage', 'history', 'kath-kuni', 'pastoral', 'field recording'],
  },
  {
    id: 'visual-essay',
    name: 'Visual Essay & Folklore',
    shortName: 'Visual & Folklore',
    subLabel: 'Mountain Cinema',
    description: 'Poetic visual essays, folk ballads, and seasonal mountain storytelling from Parvati and Tirthan valleys.',
    keywords: ['visual essay', 'folklore', 'cinema', 'ballads', 'music', 'storytelling', 'short film', 'parvati'],
  },
] as const;

/**
 * Designer-curated labels for Destination cards (StayVista-inspired compact cards)
 */
export const DESTINATION_CARD_LABELS: Record<string, { shortName: string; subLabel: string }> = {
  manali: { shortName: 'Manali', subLabel: 'Kullu Valley' },
  kasol: { shortName: 'Kasol', subLabel: 'Parvati Valley' },
  'kullu-jari': { shortName: 'Kullu & Jari', subLabel: 'Parvati Valley' },
  jibhi: { shortName: 'Jibhi', subLabel: 'Tirthan Valley' },
  shimla: { shortName: 'Shimla', subLabel: 'Himachal' },
  dharamshala: { shortName: 'Dharamshala', subLabel: 'McLeod Ganj' },
  'bir-billing': { shortName: 'Bir Billing', subLabel: 'Kangra Valley' },
  'spiti-valley': { shortName: 'Spiti Valley', subLabel: 'Trans-Himalaya' },
  dalhousie: { shortName: 'Dalhousie', subLabel: 'Khajjiar' },
  chamba: { shortName: 'Chamba', subLabel: 'Ravi Valley' },
  srinagar: { shortName: 'Srinagar', subLabel: 'Kashmir' },
  gulmarg: { shortName: 'Gulmarg', subLabel: 'Kashmir' },
  pahalgam: { shortName: 'Pahalgam', subLabel: 'Lidder Valley' },
  sonamarg: { shortName: 'Sonamarg', subLabel: 'Kashmir' },
  jammu: { shortName: 'Jammu', subLabel: 'Foothills' },
  rishikesh: { shortName: 'Rishikesh', subLabel: 'Uttarakhand' },
  mussoorie: { shortName: 'Mussoorie', subLabel: 'Garhwal Hills' },
  nainital: { shortName: 'Nainital', subLabel: 'Kumaon' },
  auli: { shortName: 'Auli', subLabel: 'Garhwal' },
  chopta: { shortName: 'Chopta', subLabel: 'Tungnath' },
  mukteshwar: { shortName: 'Mukteshwar', subLabel: 'Kumaon' },
  'jim-corbett': { shortName: 'Jim Corbett', subLabel: 'Uttarakhand' },
};

/**
 * Designer-curated labels for Product Category cards
 */
export const PRODUCT_CATEGORY_CARD_META: Record<
  string,
  { shortName: string; subLabel: string; keywords: string[] }
> = {
  himalayan: {
    shortName: 'Products',
    subLabel: 'Himalayan Harvests',
    keywords: ['himalayan', 'alpine', 'wellness', 'harvests', 'mountain goods'],
  },
  crafts: {
    shortName: 'Crafts',
    subLabel: 'Handmade Wood & Stone',
    keywords: ['crafts', 'handmade', 'woodcraft', 'carving', 'stone', 'pottery', 'bamboo', 'artisan'],
  },
  textiles: {
    shortName: 'Fashion',
    subLabel: 'Handloom & Wool',
    keywords: ['fashion', 'clothing', 'textiles', 'shawl', 'pattu', 'wool', 'handloom', 'weaving', 'apparel'],
  },
  food: {
    shortName: 'Food',
    subLabel: 'Local Produce',
    keywords: ['food', 'produce', 'honey', 'walnuts', 'apples', 'flour', 'spices', 'tea', 'ghee', 'pantry'],
  },
  lifestyle: {
    shortName: 'Home',
    subLabel: 'Slow-Living Decor',
    keywords: ['home', 'lifestyle', 'decor', 'homeware', 'pine needle', 'scents', 'incense', 'living'],
  },
  organic: {
    shortName: 'Organic',
    subLabel: 'Wildcrafted Herbs',
    keywords: ['organic', 'natural', 'herbs', 'botanicals', 'tisanes', 'herbal', 'chemical-free', 'tea'],
  },
  art: {
    shortName: 'Art',
    subLabel: 'Culture & Folk',
    keywords: ['art', 'cultural', 'folk', 'painting', 'brass', 'temple art', 'heritage'],
  },
  sustainable: {
    shortName: 'Eco',
    subLabel: 'Sustainable Craft',
    keywords: ['sustainable', 'eco', 'zero-plastic', 'bamboo', 'reusable', 'green'],
  },
  other: {
    shortName: 'Curated',
    subLabel: 'Ethical Makers',
    keywords: ['curated', 'ethical', 'valuable', 'provenance'],
  },
};

export function getDestinationCardMeta(dest: Destination) {
  const mapped = DESTINATION_CARD_LABELS[dest.slug];
  if (mapped) {
    return {
      shortName: mapped.shortName,
      subLabel:
        typeof dest.propertyCount === 'number' && dest.propertyCount > 0
          ? `${dest.propertyCount} ${dest.propertyCount === 1 ? 'Stay' : 'Stays'} · ${mapped.subLabel}`
          : mapped.subLabel,
    };
  }
  const shortRegion =
    dest.region === 'Himachal Pradesh'
      ? 'Himachal'
      : dest.region === 'Jammu & Kashmir'
        ? 'Kashmir'
        : dest.region;
  return {
    shortName: dest.name.split(' and ')[0],
    subLabel: shortRegion,
  };
}

export function getProductCategoryCardMeta(cat: ProductCategoryItem) {
  const key = cat.id.toLowerCase();
  const mapped = PRODUCT_CATEGORY_CARD_META[key];
  if (mapped) return mapped;
  const lowerName = cat.name.toLowerCase();
  if (lowerName.includes('craft'))
    return { shortName: 'Crafts', subLabel: 'Handmade Goods', keywords: ['craft', 'handmade'] };
  if (lowerName.includes('cloth') || lowerName.includes('textile'))
    return { shortName: 'Fashion', subLabel: 'Handloom & Wool', keywords: ['fashion', 'wool'] };
  if (lowerName.includes('food'))
    return { shortName: 'Food', subLabel: 'Local Produce', keywords: ['food', 'honey'] };
  if (lowerName.includes('home') || lowerName.includes('lifestyle'))
    return { shortName: 'Home', subLabel: 'Slow Living', keywords: ['home', 'decor'] };
  if (lowerName.includes('organic'))
    return { shortName: 'Organic', subLabel: 'Natural Herbs', keywords: ['organic', 'herbs'] };
  if (lowerName.includes('art'))
    return { shortName: 'Art', subLabel: 'Folk & Culture', keywords: ['art', 'folk'] };
  if (lowerName.includes('sustain'))
    return { shortName: 'Eco', subLabel: 'Eco Essentials', keywords: ['eco', 'sustainable'] };
  return { shortName: cat.name.split(' ')[0], subLabel: 'Mountain Goods', keywords: [] };
}

export function getGenreCardMeta(genre: string): ProductionGenreCatalogItem {
  const lower = genre.toLowerCase().trim();
  const found = PRODUCTION_GENRES_CATALOG.find(
    (g) =>
      g.id === lower ||
      g.name.toLowerCase() === lower ||
      g.shortName.toLowerCase() === lower
  );
  if (found) return found;
  return {
    id: lower.replace(/\s+/g, '-'),
    name: genre,
    shortName: genre,
    subLabel: 'Uttarkunth Originals',
    description: `${genre} films and archival visual stories from the Himalayas.`,
    keywords: [lower, 'originals', 'films'],
  };
}

/**
 * Tokenizes a user search query into unique, non-empty lowercase tokens sorted longest-first
 */
export function tokenizeSearchQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return Array.from(
    new Set(
      trimmed
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
    )
  ).sort((a, b) => b.length - a.length);
}

/**
 * Pure text segmentation helper for highlighting query matches in suggestion titles, subtitles, and snippets
 */
export function segmentHighlightedText(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) {
    return [{ text, highlighted: false }];
  }

  const escapedTokens = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
  const parts = text.split(regex).filter((p) => p.length > 0);
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  return parts.map((part) => ({
    text: part,
    highlighted: lowerTokens.includes(part.toLowerCase()),
  }));
}

/**
 * Scores a candidate item against the user's search query.
 * Prioritizes exact and prefix matches on primary titles, then word-boundary matches, then secondary fields.
 */
export function scoreSearchMatch(
  query: string,
  primaryFields: Array<string | null | undefined>,
  secondaryFields: Array<string | null | undefined> = []
): { matched: boolean; score: number; matchedSnippet?: string } {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { matched: true, score: 1 };
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const cleanPrimary = primaryFields.filter((f): f is string => Boolean(f && f.trim()));
  const cleanSecondary = secondaryFields.filter((f): f is string => Boolean(f && f.trim()));

  const combinedHaystack = [...cleanPrimary, ...cleanSecondary].join(' ').toLowerCase();
  const everyTokenMatches = tokens.every((tok) => combinedHaystack.includes(tok));

  if (!everyTokenMatches) {
    return { matched: false, score: 0 };
  }

  let score = 10;
  const primaryLower = cleanPrimary.map((p) => p.toLowerCase());

  // 1. Exact or prefix match on primary fields
  if (primaryLower.some((p) => p === q)) {
    score += 100;
  } else if (primaryLower.some((p) => p.startsWith(q))) {
    score += 85;
  } else if (
    primaryLower.some((p) =>
      p.split(/[\s,&·-]+/).some((word) => word.startsWith(q))
    )
  ) {
    score += 72;
  } else if (primaryLower.some((p) => p.includes(q))) {
    score += 58;
  }

  // 2. Per-token bonus in primary fields
  const allTokensInPrimary = tokens.every((tok) =>
    primaryLower.some((p) => p.includes(tok))
  );
  if (allTokensInPrimary) {
    score += 20;
  }

  // 3. Check if match came from a secondary field (e.g. valley, tagline, matchTerm, keyword)
  let matchedSnippet: string | undefined;
  if (!allTokensInPrimary) {
    for (const sec of cleanSecondary) {
      const secLower = sec.toLowerCase();
      if (tokens.some((tok) => secLower.includes(tok))) {
        score += secLower.startsWith(q) ? 35 : 22;
        matchedSnippet = sec.length > 56 ? `${sec.slice(0, 53)}...` : sec;
        break;
      }
    }
  }

  return { matched: true, score, matchedSnippet };
}

/**
 * Unified smart-suggestions engine for Stays (Destinations + Properties),
 * Products (Categories + Products), and Productions (Genres + Originals).
 */
export function unifiedClientSearchHandler({
  activeCategory,
  query,
  filters,
  recentSearches,
  destinations,
  properties,
  products,
  productCategories,
  productions,
  availableGenres,
}: {
  activeCategory: SearchableServiceType;
  query: string;
  filters: {
    propertyTypes: string[];
    categories: string[];
    genres: string[];
  };
  recentSearches: RecentSearchEntry[];
  destinations: Destination[];
  properties: StayPropertyItem[];
  products: ProductItem[];
  productCategories: ProductCategoryItem[];
  productions: ProductionItem[];
  availableGenres?: string[];
}): {
  matchingRecents: RecentSearchEntry[];
  liveSuggestions: SuggestionItem[];
  navigableItems: SuggestionItem[];
} {
  const isTyping = query.trim().length > 0;

  // 1. Filter & rank Recent Searches for the active category
  const matchingRecents = recentSearches.filter((item) => {
    const res = scoreSearchMatch(query, [item.query], [item.subtitle]);
    return res.matched;
  });

  // 2. Build & rank Category-Specific Smart Suggestions
  let liveSuggestions: SuggestionItem[] = [];

  if (activeCategory === 'stays') {
    const selectedTypesNorm = filters.propertyTypes.map((t) =>
      t.toLowerCase().replace(/s$/, '')
    );

    // A. Destinations for Stays
    const destItems: SuggestionItem[] = destinations
      .map((d): SuggestionItem | null => {
        const cardMeta = getDestinationCardMeta(d);
        const match = scoreSearchMatch(
          query,
          [cardMeta.shortName, d.name, cardMeta.subLabel],
          [d.region, d.tagline, ...(d.matchTerms || []), d.description]
        );
        if (!match.matched) return null;

        // If user matched a specific sub-village in matchTerms (e.g., "tosh", "pulga", "landour"), surface it in subtitle
        const matchedSubTerm = isTyping
          ? (d.matchTerms || []).find((term) =>
              tokenizeSearchQuery(query).some((tok) =>
                term.toLowerCase().includes(tok.toLowerCase()) &&
                !cardMeta.shortName.toLowerCase().includes(tok.toLowerCase()) &&
                !cardMeta.subLabel.toLowerCase().includes(tok.toLowerCase())
              )
            )
          : undefined;

        const formattedSubTerm = matchedSubTerm
          ? matchedSubTerm
              .split(/\s+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          : undefined;

        return {
          id: `dest-${d.slug}`,
          kind: 'destination',
          title: d.name,
          shortTitle: cardMeta.shortName,
          subtitle: formattedSubTerm
            ? `${formattedSubTerm} · ${cardMeta.subLabel}`
            : cardMeta.subLabel,
          description: d.tagline,
          matchedSnippet: match.matchedSnippet,
          score: match.score + (d.featured ? 3 : 0),
          meta:
            typeof d.propertyCount === 'number' && d.propertyCount > 0
              ? `${d.propertyCount} ${d.propertyCount === 1 ? 'Stay' : 'Stays'}`
              : d.region === 'Himachal Pradesh'
                ? 'Himachal'
                : d.region === 'Jammu & Kashmir'
                  ? 'Kashmir'
                  : 'Uttarakhand',
          valueToPopulate: d.name,
          destinationSlug: d.slug,
          directUrl: `/stays/destinations/${d.slug}`,
        };
      })
      .filter((item): item is SuggestionItem => item !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 22);

    // B. Properties / Homestays for Stays
    const propItems: SuggestionItem[] = properties
      .map((p): SuggestionItem | null => {
        if (selectedTypesNorm.length > 0) {
          const rawType =
            p.property_type && p.property_type.toLowerCase() !== 'other'
              ? p.property_type
              : 'homestay';
          const pTypeNorm = rawType.toLowerCase().replace(/s$/, '');
          const matchesType = selectedTypesNorm.some(
            (st) => pTypeNorm.includes(st) || st.includes(pTypeNorm)
          );
          if (!matchesType) return null;
        }

        const match = scoreSearchMatch(
          query,
          [p.name, p.village, p.district],
          [p.state, p.property_type, p.description]
        );
        if (!match.matched) return null;

        return {
          id: `prop-${p.id}`,
          kind: 'property',
          title: p.name,
          shortTitle: p.name,
          subtitle: [p.village, p.district].filter(Boolean).join(', ') || 'Himalayas',
          description: p.description || undefined,
          matchedSnippet: match.matchedSnippet,
          score: match.score,
          meta:
            p.property_type && p.property_type.toLowerCase() !== 'other'
              ? p.property_type
              : 'Homestay',
          valueToPopulate: p.name,
          directUrl: `/stays/${p.slug}`,
        };
      })
      .filter((item): item is SuggestionItem => item !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);

    liveSuggestions =
      selectedTypesNorm.length > 0 ? [...propItems, ...destItems] : [...destItems, ...propItems];
  } else if (activeCategory === 'products') {
    const selectedCats = filters.categories.map((c) => c.toLowerCase());

    // A. Product Categories for Products
    const catItems: SuggestionItem[] = productCategories
      .map((cat): SuggestionItem | null => {
        const cardMeta = getProductCategoryCardMeta(cat);
        if (
          selectedCats.length > 0 &&
          !selectedCats.includes(cat.id.toLowerCase()) &&
          !selectedCats.includes(cat.name.toLowerCase())
        ) {
          return null;
        }

        const match = scoreSearchMatch(
          query,
          [cardMeta.shortName, cat.name, cardMeta.subLabel],
          [cat.description, cat.id, ...(cardMeta.keywords || [])]
        );
        if (!match.matched) return null;

        // If user typed a keyword from description/keywords (e.g. "honey", "shawl", "woodcraft"), show it in subtitle
        const matchedKeyword = isTyping
          ? (cardMeta.keywords || []).find((kw) =>
              tokenizeSearchQuery(query).some(
                (tok) =>
                  kw.toLowerCase().includes(tok.toLowerCase()) &&
                  !cardMeta.shortName.toLowerCase().includes(tok.toLowerCase()) &&
                  !cardMeta.subLabel.toLowerCase().includes(tok.toLowerCase())
              )
            )
          : undefined;

        const formattedKw = matchedKeyword
          ? matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1)
          : undefined;

        return {
          id: `pcat-${cat.id}`,
          kind: 'product-category',
          title: cat.name,
          shortTitle: cardMeta.shortName,
          subtitle: formattedKw ? `${formattedKw} · ${cardMeta.subLabel}` : cardMeta.subLabel,
          description: cat.description,
          matchedSnippet: match.matchedSnippet,
          score: match.score,
          meta: 'Category',
          valueToPopulate: cat.name,
          categoryId: cat.id,
          directUrl: `/products?category=${encodeURIComponent(cat.id)}`,
        };
      })
      .filter((item): item is SuggestionItem => item !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    // B. Individual Products
    const prodItems: SuggestionItem[] = products
      .map((prod): SuggestionItem | null => {
        if (selectedCats.length > 0) {
          const prodCat = (prod.category || '').toLowerCase();
          if (!selectedCats.some((sc) => prodCat.includes(sc) || sc.includes(prodCat))) {
            return null;
          }
        }

        const match = scoreSearchMatch(
          query,
          [prod.title, prod.category],
          [prod.description, prod.origin_valley, prod.origin_state, prod.maker_name]
        );
        if (!match.matched) return null;

        return {
          id: `prod-${prod.id}`,
          kind: 'product',
          title: prod.title,
          shortTitle: prod.title,
          subtitle:
            [prod.maker_name, prod.origin_valley, prod.origin_state].filter(Boolean).join(' · ') ||
            prod.category,
          description: prod.description || undefined,
          matchedSnippet: match.matchedSnippet,
          score: match.score,
          meta: 'Product',
          valueToPopulate: prod.title,
          directUrl: `/products/${prod.slug}`,
        };
      })
      .filter((item): item is SuggestionItem => item !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);

    liveSuggestions = [...catItems, ...prodItems];
  } else {
    // productions (Genres + Uttarkunth Originals)
    const selectedGenres = filters.genres.map((g) => g.toLowerCase());

    // Build unified genre catalog combining PRODUCTION_GENRES_CATALOG + any extra genres from productions
    const genreMap = new Map<string, ProductionGenreCatalogItem>();
    PRODUCTION_GENRES_CATALOG.forEach((g) => {
      genreMap.set(g.name.toLowerCase(), g);
    });
    (availableGenres || []).forEach((gName) => {
      const key = gName.toLowerCase();
      if (!genreMap.has(key)) {
        genreMap.set(key, getGenreCardMeta(gName));
      }
    });
    productions.forEach((film) => {
      if (film.category) {
        const key = film.category.toLowerCase();
        if (!genreMap.has(key)) {
          genreMap.set(key, getGenreCardMeta(film.category));
        }
      }
    });

    // When the user types in Productions search bar, surface matching Genre smart suggestions
    // (When idle with empty query, top Genre filter pills already exist so we avoid duplicate cards)
    const genreItems: SuggestionItem[] = isTyping
      ? Array.from(genreMap.values())
          .map((gItem): SuggestionItem | null => {
            if (
              selectedGenres.length > 0 &&
              !selectedGenres.includes(gItem.name.toLowerCase()) &&
              !selectedGenres.includes(gItem.shortName.toLowerCase())
            ) {
              return null;
            }
            const match = scoreSearchMatch(
              query,
              [gItem.shortName, gItem.name, gItem.subLabel],
              [gItem.description, ...gItem.keywords]
            );
            if (!match.matched) return null;

            return {
              id: `genre-${gItem.id}`,
              kind: 'genre',
              title: gItem.name,
              shortTitle: gItem.shortName,
              subtitle: gItem.subLabel,
              description: gItem.description,
              matchedSnippet: match.matchedSnippet,
              score: match.score,
              meta: 'Genre',
              valueToPopulate: gItem.name,
              genreName: gItem.name,
              directUrl: `/production?genre=${encodeURIComponent(gItem.name)}`,
            };
          })
          .filter((item): item is SuggestionItem => item !== null)
          .sort((a, b) => (b.score || 0) - (a.score || 0))
      : [];

    // Uttarkunth Originals / Film items
    const filmItems: SuggestionItem[] = productions
      .map((film): SuggestionItem | null => {
        if (
          selectedGenres.length > 0 &&
          !selectedGenres.includes((film.category || '').toLowerCase())
        ) {
          return null;
        }
        const match = scoreSearchMatch(
          query,
          [film.title, film.category],
          [film.description, 'uttarkunth originals', 'kullu', 'parvati valley']
        );
        if (!match.matched) return null;

        return {
          id: `film-${film.id}`,
          kind: 'film',
          title: film.title,
          shortTitle: film.title,
          subtitle: film.category,
          description: film.description,
          matchedSnippet: match.matchedSnippet,
          score: match.score,
          meta: 'Original',
          valueToPopulate: film.title,
          directUrl: `/production/${film.slug}`,
        };
      })
      .filter((item): item is SuggestionItem => item !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    liveSuggestions = [...genreItems, ...filmItems];
  }

  const recentSuggestionItems: SuggestionItem[] = matchingRecents.map((r) => ({
    id: r.id,
    kind: 'recent',
    title: r.query,
    shortTitle: r.query,
    subtitle: r.subtitle || 'Recent Search',
    meta: 'Recent',
    valueToPopulate: r.query,
    recentEntry: r,
  }));

  return {
    matchingRecents,
    liveSuggestions,
    navigableItems: [...recentSuggestionItems, ...liveSuggestions],
  };
}

export interface CommunitySearchCatalogItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  directUrl: string;
  keywords: string[];
}

export interface GlobalSearchSuggestionItem {
  id: string;
  pillar: PillarCategory;
  pillarBadge: 'Stays' | 'Products' | 'Productions' | 'Community';
  title: string;
  subtitle: string;
  directUrl: string;
  score: number;
}

export const COMMUNITY_SEARCH_CATALOG: readonly CommunitySearchCatalogItem[] = [
  {
    id: 'comm-jari-flagship',
    title: 'Jari Flagship Village Model',
    subtitle: 'Parvati Valley, Kullu · Community Hub',
    description:
      'Flagship village development model in Jari, Kullu uniting homestay hospitality, local youth skill training, and cultural preservation.',
    directUrl: '/community',
    keywords: ['jari', 'kullu', 'parvati valley', 'village', 'flagship', 'community', 'model', 'himachal'],
  },
  {
    id: 'comm-youth-skill',
    title: 'Rural Youth Skill Development',
    subtitle: 'Community Initiative · Field Residency',
    description:
      'Training mountain youth in hospitality management, digital literacy, storytelling, and local entrepreneurship.',
    directUrl: '/community/participate',
    keywords: ['youth', 'skill', 'training', 'education', 'employment', 'community', 'participate', 'volunteer'],
  },
  {
    id: 'comm-cultural-preservation',
    title: 'Cultural Preservation & Oral Archives',
    subtitle: 'Community Initiative · Heritage',
    description:
      'Documenting Kath-Kuni architecture, local Pahari dialects, folk music, and oral temple histories across Himalayan valleys.',
    directUrl: '/community/participate',
    keywords: ['culture', 'cultural', 'preservation', 'kath-kuni', 'heritage', 'archive', 'pahari', 'community'],
  },
  {
    id: 'comm-sustainable-tourism',
    title: 'Sustainable Tourism & Trail Stewardship',
    subtitle: 'Community Initiative · Ecology',
    description:
      'Supporting eco-homestay hosts with waste management, plastic-free valley campaigns, and responsible trekking guidelines.',
    directUrl: '/community/participate',
    keywords: ['sustainable', 'eco', 'waste', 'trail', 'stewardship', 'trekking', 'environment', 'community'],
  },
  {
    id: 'comm-partner-onboarding',
    title: 'Local Producer & Homestay Onboarding',
    subtitle: 'Partner With Us · Ecosystem Mission',
    description:
      'Connecting village artisans, farmers, and homestay hosts directly to ethical markets without middlemen.',
    directUrl: '/community/join',
    keywords: ['partner', 'onboarding', 'artisan', 'farmer', 'host', 'join', 'mission', 'uttarkunth'],
  },
  {
    id: 'comm-about-uttarkunth',
    title: 'About Uttarkunth — Learn by Doing • Grow by Serving',
    subtitle: 'Uttarkunth Ecosystem & Philosophy',
    description:
      'Discover how Stays, Products, Productions, and Community work together for self-reliant Himalayan villages.',
    directUrl: '/about',
    keywords: ['uttarkunth', 'about', 'mission', 'philosophy', 'nitish', 'ecosystem', 'himalayas'],
  },
] as const;

/**
 * Global Ecosystem Search handler for Homepage (/) and Community (/community).
 * Searches across Stays, Products, Productions, Community initiatives, and Uttarkunth information.
 * Categorizes matching results by pillar ONLY when matching content actually exists in that pillar.
 */
export function globalEcosystemSearchHandler({
  query,
  destinations,
  properties,
  products,
  productCategories,
  productions,
  communityItems = COMMUNITY_SEARCH_CATALOG,
}: {
  query: string;
  destinations: Destination[];
  properties: StayPropertyItem[];
  products: ProductItem[];
  productCategories: ProductCategoryItem[];
  productions: ProductionItem[];
  communityItems?: readonly CommunitySearchCatalogItem[];
}): GlobalSearchSuggestionItem[] {
  const trimmed = query.trim();

  if (!trimmed) {
    const defaults: GlobalSearchSuggestionItem[] = [];
    const jariDest = destinations.find((d) => d.slug === 'kullu-jari') || destinations[0];
    const manaliDest = destinations.find((d) => d.slug === 'manali') || destinations[1];

    if (jariDest) {
      const meta = getDestinationCardMeta(jariDest);
      defaults.push({
        id: `global-stay-${jariDest.slug}`,
        pillar: 'stays',
        pillarBadge: 'Stays',
        title: `${meta.shortName} Stays`,
        subtitle: meta.subLabel,
        directUrl: `/stays/destinations/${jariDest.slug}`,
        score: 95,
      });
    }
    if (manaliDest && manaliDest.slug !== jariDest?.slug) {
      const meta = getDestinationCardMeta(manaliDest);
      defaults.push({
        id: `global-stay-${manaliDest.slug}`,
        pillar: 'stays',
        pillarBadge: 'Stays',
        title: `${meta.shortName} Stays`,
        subtitle: meta.subLabel,
        directUrl: `/stays/destinations/${manaliDest.slug}`,
        score: 92,
      });
    }
    if (productCategories[0]) {
      defaults.push({
        id: `global-prodcat-${productCategories[0].id}`,
        pillar: 'products',
        pillarBadge: 'Products',
        title: productCategories[0].name,
        subtitle: 'Authentic Himalayan Goods',
        directUrl: `/products?category=${encodeURIComponent(productCategories[0].id)}`,
        score: 88,
      });
    }
    if (productions[0]) {
      defaults.push({
        id: `global-film-${productions[0].id}`,
        pillar: 'productions',
        pillarBadge: 'Productions',
        title: productions[0].title,
        subtitle: `${productions[0].category} · Uttarkunth Originals`,
        directUrl: `/production/${productions[0].slug}`,
        score: 86,
      });
    }
    if (communityItems[0]) {
      defaults.push({
        id: `global-comm-${communityItems[0].id}`,
        pillar: 'community',
        pillarBadge: 'Community',
        title: communityItems[0].title,
        subtitle: communityItems[0].subtitle,
        directUrl: communityItems[0].directUrl,
        score: 85,
      });
    }
    if (communityItems[1]) {
      defaults.push({
        id: `global-comm-${communityItems[1].id}`,
        pillar: 'community',
        pillarBadge: 'Community',
        title: communityItems[1].title,
        subtitle: communityItems[1].subtitle,
        directUrl: communityItems[1].directUrl,
        score: 82,
      });
    }
    return defaults;
  }

  const results: GlobalSearchSuggestionItem[] = [];

  // 1. STAYS: Destinations + Approved Properties
  for (const d of destinations) {
    const meta = getDestinationCardMeta(d);
    const match = scoreSearchMatch(
      trimmed,
      [`${meta.shortName} Stays`, meta.shortName, d.name, meta.subLabel],
      [d.region, d.tagline, ...(d.matchTerms || []), d.description, 'stays', 'homestay', 'retreat']
    );
    if (match.matched) {
      results.push({
        id: `global-dest-${d.slug}`,
        pillar: 'stays',
        pillarBadge: 'Stays',
        title: `${meta.shortName} Stays`,
        subtitle: `${meta.subLabel} · Verified Homestays & Retreats`,
        directUrl: `/stays/destinations/${d.slug}`,
        score: match.score + (d.featured ? 4 : 0),
      });
    }
  }

  for (const p of properties) {
    const match = scoreSearchMatch(
      trimmed,
      [p.name, p.village, p.district],
      [p.state, p.property_type, p.description, 'stays', 'homestay']
    );
    if (match.matched) {
      results.push({
        id: `global-prop-${p.id}`,
        pillar: 'stays',
        pillarBadge: 'Stays',
        title: p.name,
        subtitle: `${[p.village, p.district].filter(Boolean).join(', ') || 'Himalayas'} · Homestay`,
        directUrl: `/stays/${p.slug}`,
        score: match.score + 2,
      });
    }
  }

  // 2. PRODUCTS: Product Categories + Approved Products (only when matching content exists)
  for (const cat of productCategories) {
    const meta = getProductCategoryCardMeta(cat);
    const match = scoreSearchMatch(
      trimmed,
      [cat.name, meta.shortName, meta.subLabel],
      [cat.description, ...(meta.keywords || []), 'products', 'goods']
    );
    if (match.matched) {
      results.push({
        id: `global-pcat-${cat.id}`,
        pillar: 'products',
        pillarBadge: 'Products',
        title: cat.name,
        subtitle: `${meta.subLabel} · Himalayan Marketplace`,
        directUrl: `/products?category=${encodeURIComponent(cat.id)}`,
        score: match.score,
      });
    }
  }

  for (const prod of products) {
    const match = scoreSearchMatch(
      trimmed,
      [prod.title, prod.category],
      [prod.description, prod.origin_valley, prod.origin_state, prod.maker_name]
    );
    if (match.matched) {
      results.push({
        id: `global-prod-${prod.id}`,
        pillar: 'products',
        pillarBadge: 'Products',
        title: prod.title,
        subtitle:
          [prod.maker_name, prod.origin_valley, prod.origin_state].filter(Boolean).join(' · ') ||
          prod.category,
        directUrl: `/products/${prod.slug}`,
        score: match.score + 2,
      });
    }
  }

  // 3. PRODUCTIONS: Genres + Authentic Films (only when matching content exists)
  for (const genre of PRODUCTION_GENRES_CATALOG) {
    const match = scoreSearchMatch(
      trimmed,
      [genre.name, genre.shortName, genre.subLabel],
      [genre.description, ...genre.keywords]
    );
    if (match.matched) {
      results.push({
        id: `global-genre-${genre.id}`,
        pillar: 'productions',
        pillarBadge: 'Productions',
        title: `${genre.name} Films`,
        subtitle: `${genre.subLabel} · Uttarkunth Productions`,
        directUrl: `/production?genre=${encodeURIComponent(genre.name)}`,
        score: match.score,
      });
    }
  }

  for (const film of productions) {
    const match = scoreSearchMatch(
      trimmed,
      [film.title, film.category],
      [film.description, 'kullu', 'jari', 'parvati valley', 'documentary', 'films', 'stories']
    );
    if (match.matched) {
      results.push({
        id: `global-film-${film.id}`,
        pillar: 'productions',
        pillarBadge: 'Productions',
        title: film.title,
        subtitle: `${film.category} · Original Film`,
        directUrl: `/production/${film.slug}`,
        score: match.score + 3,
      });
    }
  }

  // 4. COMMUNITY & UTTARKUNTH MISSION: (only when matching content exists)
  for (const comm of communityItems) {
    const match = scoreSearchMatch(
      trimmed,
      [comm.title, comm.subtitle],
      [comm.description, ...comm.keywords]
    );
    if (match.matched) {
      results.push({
        id: `global-comm-${comm.id}`,
        pillar: 'community',
        pillarBadge: 'Community',
        title: comm.title,
        subtitle: comm.subtitle,
        directUrl: comm.directUrl,
        score: match.score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 12);
}
