export interface HomeProductItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  craft_type?: string | null;
  materials?: string | null;
  description?: string | null;
  maker_name: string;
  origin_valley: string;
  origin_state: string;
  photos?: string[] | null;
  price_estimate?: number | null;
  inventory_status?: string | null;
  moderation_status?: string | null;
}

export interface FormattedProductCardData {
  id: string;
  slug: string;
  href: string;
  title: string;
  brandName: string;
  brandDisplayLabel: string;
  regionSmallLabel: string;
  priceFormatted: string;
  categoryLabel: string;
  description: string;
  imageUrl: string;
  inStockLabel: string;
}

export interface FeaturedProductSubgroup {
  key: string;
  title: string;
  subtitle: string;
  products: FormattedProductCardData[];
}

export interface ProductSectionDefinition {
  order: number;
  id:
    | 'featured-products'
    | 'woven-and-worn'
    | 'flavours-of-the-himalayas'
    | 'crafted-by-hand'
    | 'natural-living'
    | 'meet-the-makers';
  heading: string;
  focus: string;
  matchCategories: string[];
}

export const PRODUCTS_SECTION_ORDER: ProductSectionDefinition[] = [
  {
    order: 1,
    id: 'featured-products',
    heading: 'Featured Products',
    focus: 'Curated products from different brands',
    matchCategories: ['all'],
  },
  {
    order: 2,
    id: 'woven-and-worn',
    heading: 'Woven & Worn',
    focus: 'Clothing and textiles',
    matchCategories: ['textiles'],
  },
  {
    order: 3,
    id: 'flavours-of-the-himalayas',
    heading: 'Flavours of the Himalayas',
    focus: 'Food and regional specialties',
    matchCategories: ['food', 'himalayan'],
  },
  {
    order: 4,
    id: 'crafted-by-hand',
    heading: 'Crafted by Hand',
    focus: 'Crafts and handmade products',
    matchCategories: ['crafts', 'art', 'lifestyle'],
  },
  {
    order: 5,
    id: 'natural-living',
    heading: 'Natural Living',
    focus: 'Natural and wellness products',
    matchCategories: ['organic', 'sustainable', 'other'],
  },
  {
    order: 6,
    id: 'meet-the-makers',
    heading: 'Meet the Makers',
    focus: 'Local brands and artisans',
    matchCategories: [],
  },
];

/**
 * Single initial curated product so the dynamic category/origin routing works out-of-the-box
 * (and automatically incorporates any brand/products uploaded by the user in Supabase).
 */
export const INITIAL_CURATED_PRODUCTS: HomeProductItem[] = [
  {
    id: 'uk-curated-parvati-forest-honey',
    slug: 'parvati-wild-multiflora-forest-honey',
    title: 'Parvati Valley Wild Multiflora Honey',
    category: 'food',
    craft_type: 'Small-Batch Apiculture',
    materials: 'Raw unheated high-altitude wildflower nectar',
    description:
      'Harvested sustainably from traditional log hives in upper Kullu & Parvati orchards with zero refined sugar or thermal processing.',
    maker_name: 'Uttarkunth Mountain Collective',
    origin_valley: 'Kullu',
    origin_state: 'Himachal Pradesh',
    photos: ['/assets/products-home-page.webp'],
    price_estimate: 680,
    inventory_status: 'in_stock',
    moderation_status: 'approved',
  },
];

export function formatProductForCard(raw: Record<string, any>): FormattedProductCardData {
  const id = String(raw?.id || raw?.slug || 'product');
  const slug = String(raw?.slug || raw?.id || 'product');
  const title = String(raw?.title || 'Himalayan Product').trim();
  const brandName = String(raw?.maker_name || raw?.brand_name || 'Uttarkunth Artisan').trim();
  const valley = String(raw?.origin_valley || 'Kullu').trim();
  const state = String(raw?.origin_state || 'Himachal Pradesh').trim();
  const regionSmallLabel = [valley, state].filter(Boolean).join(', ');

  const priceNum = Number(raw?.price_estimate);
  const priceFormatted =
    Number.isFinite(priceNum) && priceNum > 0
      ? `₹${priceNum.toLocaleString('en-IN')}`
      : 'Waitlist Open';

  const rawPhotos = Array.isArray(raw?.photos) ? raw.photos.filter(Boolean) : [];
  const imageUrl = rawPhotos[0] || '/assets/products-home-page.webp';

  const catRaw = String(raw?.category || 'himalayan').toLowerCase().trim();
  const categoryMap: Record<string, string> = {
    textiles: 'Woven & Worn',
    food: 'Flavours of the Himalayas',
    himalayan: 'Himalayan Specialty',
    crafts: 'Crafted by Hand',
    art: 'Cultural Craft',
    lifestyle: 'Mountain Living',
    organic: 'Natural Living',
    sustainable: 'Natural & Sustainable',
    other: 'Curated Goods',
  };

  const statusRaw = String(raw?.inventory_status || 'in_stock').toLowerCase();
  const inStockLabel =
    statusRaw === 'in_stock' || statusRaw === 'available'
      ? 'Available'
      : statusRaw === 'low_stock'
        ? 'Limited Batch'
        : 'Small Batch';

  return {
    id,
    slug,
    href: `/products/${slug}`,
    title,
    brandName,
    brandDisplayLabel: `Brand: ${brandName}`,
    regionSmallLabel,
    priceFormatted,
    categoryLabel: categoryMap[catRaw] || 'Himalayan Craft',
    description: String(
      raw?.description ||
        'Small-batch Himalayan product crafted with verified regional provenance.'
    ).trim(),
    imageUrl,
    inStockLabel,
  };
}

/**
 * Dynamically builds regional/brand sub-rows inside "Featured Products" ONLY when products
 * from those brands or valleys exist (e.g., "Uttarkunth Products", "Treasures from Kullu",
 * "From the Valleys of Lahaul and Spiti", etc.).
 */
export function buildFeaturedProductSubgroups(
  products: Record<string, any>[]
): FeaturedProductSubgroup[] {
  const formatted = products.map(formatProductForCard);
  if (formatted.length === 0) return [];

  const groups: FeaturedProductSubgroup[] = [];

  // 1. Uttarkunth Products (if any product is by Uttarkunth or curated in-house)
  const uttarkunthItems = products
    .filter((p) => {
      const maker = String(p?.maker_name || '').toLowerCase();
      return maker.includes('uttarkunth');
    })
    .map(formatProductForCard);

  if (uttarkunthItems.length > 0) {
    groups.push({
      key: 'uttarkunth-products',
      title: 'Uttarkunth Products',
      subtitle: 'In-house & village collective releases',
      products: uttarkunthItems,
    });
  }

  // 2. Treasures from Kullu (only if products from Kullu / Parvati / Jari / Manali exist)
  const kulluItems = products
    .filter((p) => {
      const v = String(p?.origin_valley || '').toLowerCase();
      return v.includes('kullu') || v.includes('parvati') || v.includes('jari') || v.includes('manali');
    })
    .map(formatProductForCard);

  if (kulluItems.length > 0) {
    groups.push({
      key: 'treasures-from-kullu',
      title: 'Treasures from Kullu',
      subtitle: 'Kullu & Parvati Valley provenance',
      products: kulluItems,
    });
  }

  // 3. From the Valleys of Lahaul and Spiti (only if products from Lahaul or Spiti exist)
  const lahaulSpitiItems = products
    .filter((p) => {
      const v = String(p?.origin_valley || '').toLowerCase();
      return v.includes('lahaul') || v.includes('spiti');
    })
    .map(formatProductForCard);

  if (lahaulSpitiItems.length > 0) {
    groups.push({
      key: 'lahaul-and-spiti',
      title: 'From the Valleys of Lahaul and Spiti',
      subtitle: 'High trans-Himalayan craft & harvests',
      products: lahaulSpitiItems,
    });
  }

  // 4. Any other distinct valley origins dynamically added when products exist
  const coveredIds = new Set<string>();
  for (const g of groups) {
    for (const item of g.products) {
      coveredIds.add(item.id);
    }
  }

  const remainingByValley = new Map<string, FormattedProductCardData[]>();
  for (const raw of products) {
    const card = formatProductForCard(raw);
    if (!coveredIds.has(card.id)) {
      const valley = String(raw?.origin_valley || 'Himalayas').trim();
      const existing = remainingByValley.get(valley) || [];
      existing.push(card);
      remainingByValley.set(valley, existing);
    }
  }

  for (const [valley, items] of remainingByValley.entries()) {
    groups.push({
      key: `treasures-from-${valley.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: `Treasures from ${valley}`,
      subtitle: `Verified regional sourcing from ${valley}`,
      products: items,
    });
  }

  return groups;
}

export function getProductsForSection(
  products: Record<string, any>[],
  sectionId: ProductSectionDefinition['id']
): FormattedProductCardData[] {
  const section = PRODUCTS_SECTION_ORDER.find((s) => s.id === sectionId);
  if (!section) return [];
  if (sectionId === 'featured-products') {
    return products.map(formatProductForCard);
  }
  if (sectionId === 'meet-the-makers') {
    return products.map(formatProductForCard);
  }

  return products
    .filter((p) => {
      const cat = String(p?.category || '').toLowerCase().trim();
      return section.matchCategories.includes(cat);
    })
    .map(formatProductForCard);
}

export interface MakerSummary {
  brandName: string;
  regionLabel: string;
  craftFocus: string;
  productCount: number;
  sampleProductHref: string;
}

export function extractMakersFromProducts(products: Record<string, any>[]): MakerSummary[] {
  const map = new Map<string, MakerSummary>();
  for (const p of products) {
    const brandName = String(p?.maker_name || p?.brand_name || 'Uttarkunth Artisan').trim();
    const key = brandName.toLowerCase();
    const valley = String(p?.origin_valley || 'Kullu').trim();
    const state = String(p?.origin_state || 'Himachal Pradesh').trim();
    const regionLabel = [valley, state].filter(Boolean).join(', ');
    const craftFocus = String(p?.craft_type || p?.category || 'Himalayan Craft').trim();
    const slug = String(p?.slug || p?.id || '');

    const existing = map.get(key);
    if (existing) {
      existing.productCount += 1;
    } else {
      map.set(key, {
        brandName,
        regionLabel,
        craftFocus,
        productCount: 1,
        sampleProductHref: slug ? `/products/${slug}` : '/products',
      });
    }
  }
  return Array.from(map.values());
}

export interface CommunityWelcomeCategory {
  id: string;
  category: string;
  welcomes: string;
  highlightBadge?: string;
  highlightNote?: string;
  href: string;
}

export const COMMUNITY_DESCRIPTION_PARAGRAPHS: string[] = [
  "Whether you're an individual, a team, a village or an emerging startup, Uttarkunth welcomes ideas, ventures and collaborations that create meaningful value.",
  'We are a business built on the belief that growth should benefit more than just the business itself. Through sustainable and commercially viable opportunities, we aim to strengthen local livelihoods, encourage entrepreneurship, preserve cultural heritage and contribute to the development of Himalayan communities.',
  'Rooted in our philosophy of Karmayog — putting meaningful action and contribution at the heart of what we do, we believe in building ventures that create value for both people and places.',
  "Let's build opportunities, grow responsibly and move forward together.",
];

export const COMMUNITY_WELCOME_CATEGORIES: CommunityWelcomeCategory[] = [
  {
    id: 'entrepreneurs-startups',
    category: 'Entrepreneurs & Startups',
    welcomes: 'New ventures and business ideas',
    href: '/community/join?track=entrepreneurs',
  },
  {
    id: 'local-businesses-artisans',
    category: 'Local Businesses & Artisans',
    welcomes: 'Products, skills and local enterprises',
    href: '/products/sell',
  },
  {
    id: 'village-initiatives',
    category: 'Village Initiatives',
    welcomes: 'Community-led development projects',
    highlightBadge: 'Living Example · Uttarkunth',
    highlightNote:
      'Uttarkunth itself began as a village-rooted initiative in Jari, Parvati Valley — uniting stays, local craft, cultural stories, and community enterprise.',
    href: '/community/initiatives',
  },
  {
    id: 'creators-filmmakers',
    category: 'Creators & Filmmakers',
    welcomes: 'Creative and cultural collaborations',
    href: '/production/collaborate',
  },
  {
    id: 'property-experience-partners',
    category: 'Property & Experience Partners',
    welcomes: 'Local hospitality and tourism ventures',
    href: '/stays/partner',
  },
  {
    id: 'volunteers-contributors',
    category: 'Volunteers & Contributors',
    welcomes: 'People interested in meaningful initiatives',
    href: '/community/join',
  },
];
