// ============================================================================
// UTTARKUNTH PRODUCTS MARKETPLACE & SELLER DESK — CORE DOMAIN ENGINE
// Pure, isomorphic domain logic for storefront discovery, discount math,
// stock validation, workspace visibility (Host vs Seller Desk), and RBAC.
// ============================================================================

import {
  normalizeStaffPermission,
  type StaffPermission,
  type StaffRoleSlug,
} from './staff-rbac-shared';

export type CanonicalCategorySlug =
  | 'handcrafted-artisan'
  | 'food-pantry'
  | 'clothing-textiles'
  | 'home-living'
  | 'personal-care'
  | 'sustainable-living';

export interface MarketplaceSubcategory {
  slug: string;
  label: string;
}

export interface MarketplaceCategoryDefinition {
  slug: CanonicalCategorySlug;
  legacyKeys: string[];
  title: string;
  shortTitle: string;
  description: string;
  subcategories: MarketplaceSubcategory[];
}

export const MARKETPLACE_CATEGORIES: ReadonlyArray<MarketplaceCategoryDefinition> = [
  {
    slug: 'handcrafted-artisan',
    legacyKeys: ['handcrafted-artisan', 'crafts', 'art', 'himalayan'],
    title: 'Handcrafted & Artisan',
    shortTitle: 'Handcrafted',
    description:
      'Woodcraft, hand-carved heritage objects, traditional mountain crafts, and loom-woven pieces.',
    subcategories: [
      { slug: 'woodcraft', label: 'Woodcraft' },
      { slug: 'handmade-decor', label: 'Handmade Decor' },
      { slug: 'traditional-crafts', label: 'Traditional Crafts' },
      { slug: 'handwoven-products', label: 'Handwoven Products' },
    ],
  },
  {
    slug: 'food-pantry',
    legacyKeys: ['food-pantry', 'food', 'foods', 'organic'],
    title: 'Food & Pantry',
    shortTitle: 'Food & Pantry',
    description:
      'High-altitude forest honey, heirloom grains, sun-cured spices, preserves, and regional culinary specialities.',
    subcategories: [
      { slug: 'traditional-foods', label: 'Traditional Foods' },
      { slug: 'spices-ingredients', label: 'Spices & Ingredients' },
      { slug: 'honey-natural-produce', label: 'Honey & Natural Produce' },
      { slug: 'regional-specialities', label: 'Regional Specialities' },
    ],
  },
  {
    slug: 'clothing-textiles',
    legacyKeys: ['clothing-textiles', 'textiles', 'wearables'],
    title: 'Clothing & Textiles',
    shortTitle: 'Textiles',
    description:
      'Indigenous sheep-wool shawls, handloom pattus, natural-dyed apparel, and cold-weather accessories.',
    subcategories: [
      { slug: 'woollens', label: 'Woollens' },
      { slug: 'handwoven-textiles', label: 'Handwoven Textiles' },
      { slug: 'clothing', label: 'Clothing' },
      { slug: 'accessories', label: 'Accessories' },
    ],
  },
  {
    slug: 'home-living',
    legacyKeys: ['home-living', 'homeware', 'lifestyle', 'books'],
    title: 'Home & Living',
    shortTitle: 'Home & Living',
    description:
      'Thoughtful home decor, brass and stone kitchenware, and enduring everyday essentials for conscious spaces.',
    subcategories: [
      { slug: 'home-decor', label: 'Home Decor' },
      { slug: 'kitchenware', label: 'Kitchenware' },
      { slug: 'everyday-essentials', label: 'Everyday Essentials' },
    ],
  },
  {
    slug: 'personal-care',
    legacyKeys: ['personal-care', 'cosmetics'],
    title: 'Personal Care',
    shortTitle: 'Personal Care',
    description:
      'Small-batch botanical skincare, cold-pressed mountain oils, herbal soaps, and natural wellness formulations.',
    subcategories: [
      { slug: 'botanical-skincare', label: 'Botanical Skincare' },
      { slug: 'essential-oils-balms', label: 'Essential Oils & Balms' },
      { slug: 'herbal-soaps', label: 'Herbal Soaps' },
      { slug: 'natural-wellness', label: 'Natural Wellness' },
    ],
  },
  {
    slug: 'sustainable-living',
    legacyKeys: ['sustainable-living', 'sustainable', 'other'],
    title: 'Sustainable Living',
    shortTitle: 'Sustainable',
    description:
      'Natural fibre utility goods, upcycled studio objects, and low-footprint essentials rooted in circular craft.',
    subcategories: [
      { slug: 'upcycled-crafts', label: 'Upcycled Crafts' },
      { slug: 'natural-fibre-goods', label: 'Natural Fibre Goods' },
      { slug: 'eco-friendly-essentials', label: 'Eco-Friendly Essentials' },
      { slug: 'zero-waste-living', label: 'Zero-Waste Living' },
    ],
  },
] as const;

export function resolveCanonicalCategory(
  rawCategory: string | null | undefined
): MarketplaceCategoryDefinition | null {
  if (!rawCategory) return null;
  const norm = rawCategory.trim().toLowerCase();
  for (const cat of MARKETPLACE_CATEGORIES) {
    if (cat.slug === norm || cat.legacyKeys.includes(norm)) {
      return cat;
    }
  }
  return null;
}

export function mapCanonicalToDbCategory(
  rawCategory: string | null | undefined
):
  | 'himalayan'
  | 'crafts'
  | 'textiles'
  | 'food'
  | 'lifestyle'
  | 'organic'
  | 'art'
  | 'sustainable'
  | 'other' {
  const norm = String(rawCategory || '').trim().toLowerCase();
  if (norm === 'handcrafted-artisan' || norm === 'crafts') return 'crafts';
  if (norm === 'food-pantry' || norm === 'food' || norm === 'foods') return 'food';
  if (norm === 'clothing-textiles' || norm === 'textiles' || norm === 'wearables') return 'textiles';
  if (norm === 'home-living' || norm === 'homeware' || norm === 'lifestyle') return 'lifestyle';
  if (norm === 'personal-care' || norm === 'cosmetics') return 'organic';
  if (norm === 'sustainable-living' || norm === 'sustainable') return 'sustainable';
  if (
    [
      'himalayan',
      'crafts',
      'textiles',
      'food',
      'lifestyle',
      'organic',
      'art',
      'sustainable',
      'other',
    ].includes(norm)
  ) {
    return norm as any;
  }
  return 'crafts';
}

// ============================================================================
// PART 4.3 & 10.6 — AUTOMATIC DISCOUNT & PRICING CALCULATOR
// ============================================================================

export interface ProductDiscountResult {
  valid: boolean;
  error?: string;
  mrp: number;
  sellingPrice: number;
  discountAmount: number;
  discountPercentage: number;
  hasDiscount: boolean;
  formattedSellingPrice: string;
  formattedMrp: string;
  formattedBadge: string | null;
}

export function formatINR(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '₹0';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function calculateProductDiscount(
  rawMrp: number | string | null | undefined,
  rawSellingPrice: number | string | null | undefined
): ProductDiscountResult {
  const mrp = Number(rawMrp);
  const sellingPrice = Number(rawSellingPrice);

  if (!Number.isFinite(mrp) || mrp <= 0) {
    return {
      valid: false,
      error: 'MRP must be greater than ₹0.',
      mrp: 0,
      sellingPrice: 0,
      discountAmount: 0,
      discountPercentage: 0,
      hasDiscount: false,
      formattedSellingPrice: '₹0',
      formattedMrp: '₹0',
      formattedBadge: null,
    };
  }

  if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
    return {
      valid: false,
      error: 'Selling price must be greater than ₹0.',
      mrp,
      sellingPrice: 0,
      discountAmount: 0,
      discountPercentage: 0,
      hasDiscount: false,
      formattedSellingPrice: '₹0',
      formattedMrp: formatINR(mrp),
      formattedBadge: null,
    };
  }

  if (sellingPrice > mrp) {
    return {
      valid: false,
      error: 'Selling price cannot exceed Maximum Retail Price (MRP).',
      mrp,
      sellingPrice,
      discountAmount: 0,
      discountPercentage: 0,
      hasDiscount: false,
      formattedSellingPrice: formatINR(sellingPrice),
      formattedMrp: formatINR(mrp),
      formattedBadge: null,
    };
  }

  const discountAmount = Math.max(0, mrp - sellingPrice);
  const rawPct = discountAmount > 0 ? (discountAmount / mrp) * 100 : 0;
  const discountPercentage = discountAmount > 0 ? Math.round(rawPct) : 0;
  const hasDiscount = sellingPrice < mrp && discountPercentage > 0;

  return {
    valid: true,
    mrp,
    sellingPrice,
    discountAmount,
    discountPercentage,
    hasDiscount,
    formattedSellingPrice: formatINR(sellingPrice),
    formattedMrp: formatINR(mrp),
    formattedBadge: hasDiscount ? `${discountPercentage}% OFF` : null,
  };
}

// ============================================================================
// PART 10.7 — STOCK & INVENTORY CALCULATIONS
// ============================================================================

export type StockAvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockStateResult {
  availableStock: number;
  lowStockThreshold: number;
  status: StockAvailabilityStatus;
  label: string;
  canPurchase: boolean;
}

export function resolveStockState(
  rawAvailableStock: number | null | undefined,
  rawLowStockThreshold: number | null | undefined = 5,
  fallbackInventoryStatus?: string | null
): StockStateResult {
  const threshold =
    typeof rawLowStockThreshold === 'number' &&
    Number.isFinite(rawLowStockThreshold) &&
    rawLowStockThreshold >= 0
      ? Math.floor(rawLowStockThreshold)
      : 5;

  if (typeof rawAvailableStock === 'number' && Number.isFinite(rawAvailableStock)) {
    const stock = Math.max(0, Math.floor(rawAvailableStock));
    if (stock === 0) {
      return {
        availableStock: 0,
        lowStockThreshold: threshold,
        status: 'out_of_stock',
        label: 'Out of Stock',
        canPurchase: false,
      };
    }
    if (stock <= threshold) {
      return {
        availableStock: stock,
        lowStockThreshold: threshold,
        status: 'low_stock',
        label: `Low Stock (${stock} left)`,
        canPurchase: true,
      };
    }
    return {
      availableStock: stock,
      lowStockThreshold: threshold,
      status: 'in_stock',
      label: 'In Stock',
      canPurchase: true,
    };
  }

  // Fallback when legacy row only has inventory_status
  if (fallbackInventoryStatus === 'sold_out' || fallbackInventoryStatus === 'coming_soon') {
    return {
      availableStock: 0,
      lowStockThreshold: threshold,
      status: 'out_of_stock',
      label: fallbackInventoryStatus === 'coming_soon' ? 'Coming Soon' : 'Out of Stock',
      canPurchase: false,
    };
  }

  return {
    availableStock: 10,
    lowStockThreshold: threshold,
    status: 'in_stock',
    label: fallbackInventoryStatus === 'made_to_order' ? 'Made to Order' : 'In Stock',
    canPurchase: true,
  };
}

export type InventoryAdjustmentReason =
  | 'new_stock_added'
  | 'manual_correction'
  | 'damaged_or_unsellable'
  | 'order_reserved'
  | 'order_cancelled_restock'
  | 'return_restocked';

export function validateStockAdjustment(
  currentStock: number,
  delta: number,
  reason: InventoryAdjustmentReason
): {
  valid: boolean;
  error?: string;
  previousStock: number;
  newStock: number;
  delta: number;
  reason: InventoryAdjustmentReason;
} {
  const prev = Math.max(0, Math.floor(Number(currentStock) || 0));
  const change = Math.trunc(Number(delta) || 0);
  if (change === 0) {
    return {
      valid: false,
      error: 'Stock adjustment quantity cannot be zero.',
      previousStock: prev,
      newStock: prev,
      delta: 0,
      reason,
    };
  }
  const next = prev + change;
  if (next < 0) {
    return {
      valid: false,
      error: `Stock cannot become negative (current: ${prev}, adjustment: ${change}).`,
      previousStock: prev,
      newStock: prev,
      delta: change,
      reason,
    };
  }
  return {
    valid: true,
    previousStock: prev,
    newStock: next,
    delta: change,
    reason,
  };
}

// ============================================================================
// PART 7 — PROFILE & ACCOUNT INTEGRATION: HOST DASHBOARD & SELLER DESK
// ============================================================================

export type SellerAccountLifecycleStatus =
  | 'none'
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'under_review'
  | 'info_requested'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type WorkspaceScenario =
  | 'A_SELLER_ONLY'
  | 'B_HOST_ONLY'
  | 'C_BOTH_HOST_AND_SELLER'
  | 'D_NEITHER'
  | 'E_PENDING_SELLER';

export interface WorkspaceDescriptor {
  id: 'host_dashboard' | 'seller_desk';
  label: string;
  href: string;
  description: string;
  badge: string;
}

export interface UserWorkspaceResolution {
  scenario: WorkspaceScenario;
  showHostDashboard: boolean;
  showSellerDesk: boolean;
  showPendingSellerBanner: boolean;
  sellerLifecycleStatus: SellerAccountLifecycleStatus;
  workspaces: WorkspaceDescriptor[];
  onboardingActions: Array<{
    id: 'become_seller' | 'become_host' | 'view_seller_application';
    label: string;
    href: string;
  }>;
}

export function normalizeSellerLifecycleStatus(
  rawStatus: string | null | undefined
): SellerAccountLifecycleStatus {
  const s = String(rawStatus || '')
    .trim()
    .toLowerCase();
  if (!s) return 'none';
  if (s === 'approved' || s === 'verified') return 'approved';
  if (s === 'draft') return 'draft';
  if (s === 'submitted') return 'submitted';
  if (s === 'pending') return 'pending';
  if (s === 'under_review') return 'under_review';
  if (s === 'info_requested') return 'info_requested';
  if (s === 'rejected') return 'rejected';
  if (s === 'suspended') return 'suspended';
  return 'none';
}

export function resolveUserWorkspaces(input: {
  isHost: boolean;
  sellerStatus?: string | null;
}): UserWorkspaceResolution {
  const isHost = Boolean(input.isHost);
  const sellerLifecycleStatus = normalizeSellerLifecycleStatus(input.sellerStatus);
  const isApprovedSeller = sellerLifecycleStatus === 'approved';
  const isPendingOrDraftSeller =
    sellerLifecycleStatus === 'draft' ||
    sellerLifecycleStatus === 'submitted' ||
    sellerLifecycleStatus === 'pending' ||
    sellerLifecycleStatus === 'under_review' ||
    sellerLifecycleStatus === 'info_requested';

  const workspaces: WorkspaceDescriptor[] = [];

  if (isHost) {
    workspaces.push({
      id: 'host_dashboard',
      label: 'Host Dashboard',
      href: '/account/stays/host',
      description: 'Manage your homestay property, room availability, and guest bookings.',
      badge: 'Verified Host',
    });
  }

  if (isApprovedSeller) {
    workspaces.push({
      id: 'seller_desk',
      label: 'Seller Dashboard',
      href: '/seller/dashboard',
      description: 'Manage your product catalogue, pricing, inventory, verification, and orders.',
      badge: 'Verified Seller',
    });
  }

  let scenario: WorkspaceScenario = 'D_NEITHER';
  if (isHost && isApprovedSeller) {
    scenario = 'C_BOTH_HOST_AND_SELLER';
  } else if (isApprovedSeller && !isHost) {
    scenario = 'A_SELLER_ONLY';
  } else if (isHost && !isApprovedSeller) {
    scenario = 'B_HOST_ONLY';
  } else if (isPendingOrDraftSeller) {
    scenario = 'E_PENDING_SELLER';
  } else {
    scenario = 'D_NEITHER';
  }

  const onboardingActions: UserWorkspaceResolution['onboardingActions'] = [];
  if (!isApprovedSeller) {
    if (isPendingOrDraftSeller || sellerLifecycleStatus === 'rejected') {
      onboardingActions.push({
        id: 'view_seller_application',
        label:
          sellerLifecycleStatus === 'draft'
            ? 'Continue Seller Application Draft'
            : 'Seller Application Status',
        href: '/products/sell',
      });
    } else {
      onboardingActions.push({
        id: 'become_seller',
        label: 'Become a Seller / Partner',
        href: '/products/sell',
      });
    }
  }

  if (!isHost) {
    onboardingActions.push({
      id: 'become_host',
      label: 'Become a Host',
      href: '/stays/list-property',
    });
  }

  return {
    scenario,
    showHostDashboard: isHost,
    showSellerDesk: isApprovedSeller,
    showPendingSellerBanner: isPendingOrDraftSeller,
    sellerLifecycleStatus,
    workspaces,
    onboardingActions,
  };
}

// ============================================================================
// PART 11, 14 & 16 — PRODUCT WORKFLOW & SECURITY GUARDRAILS
// ============================================================================

export type ProductLifecycleStatus =
  | 'draft'
  | 'pending_review'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'unpublished'
  | 'archived';

/**
 * Strips any privileged moderation or verification fields from a seller-initiated
 * product create/update request so a seller can NEVER self-approve, self-publish,
 * or grant themselves a Verified & Authentic badge.
 */
export function sanitizeSellerProductWritePayload<T extends Record<string, any>>(
  rawPayload: T,
  intent: 'save_draft' | 'submit_for_review' = 'submit_for_review'
): Omit<
  T,
  | 'moderation_status'
  | 'published'
  | 'verification_badge_approved'
  | 'reviewed_by'
  | 'reviewed_at'
  | 'review_notes'
> & {
  moderation_status: 'pending' | 'draft';
  published: false;
  verification_badge_approved: false;
} {
  const clone: Record<string, any> = { ...rawPayload };
  delete clone.moderation_status;
  delete clone.published;
  delete clone.verification_badge_approved;
  delete clone.reviewed_by;
  delete clone.reviewed_at;
  delete clone.review_notes;
  delete clone.is_verified;
  delete clone.verified_authentic;

  return {
    ...(clone as any),
    moderation_status: intent === 'save_draft' ? 'draft' : 'pending',
    published: false,
    verification_badge_approved: false,
  };
}

// ============================================================================
// PART 3.4 — STOREFRONT DISCOVERY, SEARCH, FILTER & SORT ENGINE
// ============================================================================

export type ProductSortOption = 'newest' | 'price_asc' | 'price_desc';

export interface MarketplaceFilterCriteria {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  origin?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyDiscounted?: boolean;
  onlyInStock?: boolean;
  sortBy?: ProductSortOption;
}

export function normalizeProductPrices(product: Record<string, any>): {
  mrp: number;
  sellingPrice: number;
  discountPercentage: number;
  hasDiscount: boolean;
} {
  const rawSelling =
    product.selling_price ?? product.price_estimate ?? product.price ?? 0;
  const sellingPrice = Math.max(0, Number(rawSelling) || 0);
  const rawMrp = product.mrp ?? sellingPrice;
  const mrp = Math.max(sellingPrice, Number(rawMrp) || sellingPrice);
  const calc = calculateProductDiscount(mrp, sellingPrice);
  if (!calc.valid) {
    return {
      mrp: sellingPrice,
      sellingPrice,
      discountPercentage: 0,
      hasDiscount: false,
    };
  }
  return {
    mrp: calc.mrp,
    sellingPrice: calc.sellingPrice,
    discountPercentage: calc.discountPercentage,
    hasDiscount: calc.hasDiscount,
  };
}

export function filterAndSortMarketplaceProducts<T extends Record<string, any>>(
  products: T[],
  criteria: MarketplaceFilterCriteria
): T[] {
  if (!Array.isArray(products) || products.length === 0) return [];

  const q = String(criteria.query || '')
    .trim()
    .toLowerCase();
  const catFilter = String(criteria.category || 'all')
    .trim()
    .toLowerCase();
  const subcatFilter = String(criteria.subcategory || 'all')
    .trim()
    .toLowerCase();
  const brandFilter = String(criteria.brand || 'all')
    .trim()
    .toLowerCase();
  const originFilter = String(criteria.origin || 'all')
    .trim()
    .toLowerCase();

  const filtered = products.filter((item) => {
    // 1. Category match
    if (catFilter && catFilter !== 'all') {
      const resolvedCat = resolveCanonicalCategory(item.category);
      const itemCatSlug = resolvedCat?.slug || String(item.category || '').toLowerCase();
      const targetCat = resolveCanonicalCategory(catFilter);
      const targetSlug = targetCat?.slug || catFilter;
      if (itemCatSlug !== targetSlug && String(item.category || '').toLowerCase() !== catFilter) {
        return false;
      }
    }

    // 2. Subcategory match
    if (subcatFilter && subcatFilter !== 'all') {
      const itemSub = String(item.subcategory || item.craft_type || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const rawSub = String(item.subcategory || item.craft_type || '')
        .trim()
        .toLowerCase();
      if (itemSub !== subcatFilter && !rawSub.includes(subcatFilter.replace(/-/g, ' '))) {
        return false;
      }
    }

    // 3. Search query (title, brand_name, maker_name, description, category, origin)
    if (q) {
      const haystack = [
        item.title,
        item.brand_name,
        item.maker_name,
        item.short_description,
        item.description,
        item.craft_type,
        item.subcategory,
        item.origin_valley,
        item.origin_state,
        item.manufacturing_location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // 4. Brand filter
    if (brandFilter && brandFilter !== 'all') {
      const itemBrand = String(item.brand_name || item.maker_name || '')
        .trim()
        .toLowerCase();
      if (itemBrand !== brandFilter) return false;
    }

    // 5. Origin filter
    if (originFilter && originFilter !== 'all') {
      const itemOrigin = [
        item.origin_valley,
        item.origin_state,
        item.manufacturing_location,
        item.dispatch_location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!itemOrigin.includes(originFilter)) return false;
    }

    // 6. Price & Discount filters
    const prices = normalizeProductPrices(item);
    if (
      typeof criteria.minPrice === 'number' &&
      Number.isFinite(criteria.minPrice) &&
      prices.sellingPrice < criteria.minPrice
    ) {
      return false;
    }
    if (
      typeof criteria.maxPrice === 'number' &&
      Number.isFinite(criteria.maxPrice) &&
      criteria.maxPrice > 0 &&
      prices.sellingPrice > criteria.maxPrice
    ) {
      return false;
    }
    if (criteria.onlyDiscounted && !prices.hasDiscount) {
      return false;
    }

    // 7. In-stock filter
    if (criteria.onlyInStock) {
      const stockState = resolveStockState(
        item.available_stock,
        item.low_stock_threshold,
        item.inventory_status
      );
      if (!stockState.canPurchase) return false;
    }

    return true;
  });

  const sortBy: ProductSortOption = criteria.sortBy || 'newest';
  return [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return normalizeProductPrices(a).sellingPrice - normalizeProductPrices(b).sellingPrice;
    }
    if (sortBy === 'price_desc') {
      return normalizeProductPrices(b).sellingPrice - normalizeProductPrices(a).sellingPrice;
    }
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

export function extractLiveSearchSuggestions(
  products: ReadonlyArray<Record<string, any>>,
  query: string,
  limit = 6
): Array<{ type: 'product' | 'brand' | 'category'; label: string; slug?: string }> {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q || !Array.isArray(products) || products.length === 0) return [];

  const results: Array<{ type: 'product' | 'brand' | 'category'; label: string; slug?: string }> =
    [];
  const seen = new Set<string>();

  for (const p of products) {
    const title = String(p.title || '').trim();
    if (title && title.toLowerCase().includes(q) && !seen.has(`p:${title.toLowerCase()}`)) {
      seen.add(`p:${title.toLowerCase()}`);
      results.push({ type: 'product', label: title, slug: p.slug });
      if (results.length >= limit) return results;
    }

    const brand = String(p.brand_name || p.maker_name || '').trim();
    if (brand && brand.toLowerCase().includes(q) && !seen.has(`b:${brand.toLowerCase()}`)) {
      seen.add(`b:${brand.toLowerCase()}`);
      results.push({ type: 'brand', label: brand });
      if (results.length >= limit) return results;
    }
  }

  return results;
}

// ============================================================================
// PART 15.2 — GRANULAR PRODUCTS MARKETPLACE RBAC PERMISSIONS
// ============================================================================

export type MarketplaceGranularPermission =
  | 'seller.applications.view'
  | 'seller.applications.review'
  | 'seller.profiles.view'
  | 'seller.profiles.update'
  | 'products.view'
  | 'products.review'
  | 'products.edit'
  | 'products.approve'
  | 'products.publish'
  | 'products.unpublish'
  | 'products.archive'
  | 'brands.view'
  | 'brands.review'
  | 'brands.verify'
  | 'brands.reject'
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.reorder'
  | 'inventory.view'
  | 'inventory.support'
  | 'orders.view'
  | 'orders.manage'
  | 'returns.review'
  | 'customer.support'
  | 'marketplace.reports.view';

export const MARKETPLACE_TEAM_PERMISSION_KEYS: ReadonlyArray<MarketplaceGranularPermission> = [
  'seller.applications.view',
  'seller.applications.review',
  'seller.profiles.view',
  'seller.profiles.update',
  'products.view',
  'products.review',
  'products.edit',
  'products.approve',
  'products.publish',
  'products.unpublish',
  'products.archive',
  'brands.view',
  'brands.review',
  'brands.verify',
  'brands.reject',
  'categories.view',
  'categories.create',
  'categories.edit',
  'categories.reorder',
  'inventory.view',
  'inventory.support',
  'orders.view',
  'orders.manage',
  'returns.review',
  'customer.support',
  'marketplace.reports.view',
] as const;

export function hasMarketplacePermission(
  actor: {
    isFounder?: boolean;
    roleSlug?: StaffRoleSlug | string | null;
    accountStatus?: string | null;
    grantedPermissions?: ReadonlyArray<string>;
  },
  requiredPermission: MarketplaceGranularPermission | StaffPermission
): boolean {
  if (actor.isFounder || actor.roleSlug === 'founder') {
    return true;
  }
  if (actor.accountStatus && actor.accountStatus !== 'active') {
    return false;
  }
  const granted = new Set(actor.grantedPermissions || []);
  if (granted.has(requiredPermission)) {
    return true;
  }
  const canonical = normalizeStaffPermission(requiredPermission);
  return granted.has(canonical);
}
