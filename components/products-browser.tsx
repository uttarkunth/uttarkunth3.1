'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  Store,
  Layers,
  Tag,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import {
  MARKETPLACE_CATEGORIES,
  extractLiveSearchSuggestions,
  filterAndSortMarketplaceProducts,
  resolveCanonicalCategory,
  type ProductSortOption,
} from '@/lib/marketplace';
import {
  ProductCard,
  type MarketplaceProductItem,
} from '@/components/products/product-card';

interface ProductsBrowserProps {
  products?: MarketplaceProductItem[];
  initialCategory?: string;
  initialQuery?: string;
}

export function ProductsBrowser({
  products = [],
  initialCategory = 'all',
  initialQuery = '',
}: ProductsBrowserProps) {
  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (!initialCategory || initialCategory === 'all') return 'all';
    const resolved = resolveCanonicalCategory(initialCategory);
    return resolved ? resolved.slug : initialCategory;
  });
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSortOption>('newest');
  const [searchFocused, setSearchFocused] = useState(false);

  // Extract real brands and origins strictly from approved products in DB
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    for (const p of safeProducts) {
      const b = String(p.brand_name || p.maker_name || '').trim();
      if (b) set.add(b);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [safeProducts]);

  const availableOrigins = useMemo(() => {
    const set = new Set<string>();
    for (const p of safeProducts) {
      const v = String(p.origin_valley || '').trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [safeProducts]);

  // Count approved products per canonical category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of MARKETPLACE_CATEGORIES) {
      counts[cat.slug] = 0;
    }
    for (const p of safeProducts) {
      const resolved = resolveCanonicalCategory(p.category);
      if (resolved) {
        counts[resolved.slug] = (counts[resolved.slug] || 0) + 1;
      }
    }
    return counts;
  }, [safeProducts]);

  // Live search suggestions strictly from real approved products
  const searchSuggestions = useMemo(
    () => extractLiveSearchSuggestions(safeProducts, searchQuery, 6),
    [safeProducts, searchQuery]
  );

  // Filtered and sorted products
  const filteredProducts = useMemo(
    () =>
      filterAndSortMarketplaceProducts(safeProducts, {
        query: searchQuery,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        brand: selectedBrand,
        origin: selectedOrigin,
        onlyDiscounted,
        onlyInStock,
        sortBy,
      }),
    [
      safeProducts,
      searchQuery,
      selectedCategory,
      selectedSubcategory,
      selectedBrand,
      selectedOrigin,
      onlyDiscounted,
      onlyInStock,
      sortBy,
    ]
  );

  const activeCategoryDef = useMemo(
    () =>
      selectedCategory !== 'all'
        ? MARKETPLACE_CATEGORIES.find((c) => c.slug === selectedCategory) || null
        : null,
    [selectedCategory]
  );

  const hasAnyApprovedProducts = safeProducts.length > 0;
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    selectedSubcategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedOrigin !== 'all' ||
    onlyDiscounted ||
    onlyInStock;

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSelectedBrand('all');
    setSelectedOrigin('all');
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setSortBy('newest');
  };

  return (
    <div className="space-y-12 sm:space-y-14">
      {/* ====================================================================
          DIV 1: HIMALAYAN PRODUCTS SANCTUARY HEADER & SEARCH BAR
          Modeled directly after the homepage's first two golden-hour divs
      ==================================================================== */}
      <section className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/75 bg-[linear-gradient(135deg,rgba(255,253,249,0.92)_0%,rgba(244,236,220,0.94)_50%,rgba(229,236,227,0.86)_100%)] p-6 sm:p-10 lg:p-12 shadow-[0_24px_60px_-20px_rgba(31,51,42,0.16)] backdrop-blur-md">
        {/* Subtle top highlight border */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#263D32] via-[#C55B23] to-[#263D32] opacity-80" />

        {/* Ambient golden-hour glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-[#C55B23]/[0.13] blur-[90px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[#263D32]/[0.13] blur-[90px]"
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[3.4rem] font-medium tracking-tight text-[#1F332A] leading-[1.12]">
              Himalayan Products
            </h1>
            <p className="font-sans font-normal mx-auto max-w-2xl text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#4E4A43]">
              Discover thoughtful products, regional craftsmanship and responsible
              brands from the Himalayan community.
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/seller/dashboard"
                data-testid="hero-seller-dashboard-cta"
                className="font-sans inline-flex items-center gap-2 rounded-xl bg-[#1F332A] px-4 py-2.5 text-xs font-semibold text-[#FFFDF9] shadow-xs hover:bg-[#C55B23] transition-colors"
              >
                <Store className="h-3.5 w-3.5 text-[#FDE2A8]" />
                <span>Seller Dashboard — Manage Inventory &amp; Sales</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/products/sell"
                className="font-sans inline-flex items-center gap-1.5 rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-4 py-2.5 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] transition-colors"
              >
                <span>Become a Seller / Partner</span>
              </Link>
            </div>
          </div>

          {/* Search Bar (Part 3.1) */}
          <div className="relative mx-auto max-w-2xl pt-2 text-left">
            <div className="relative flex items-center rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9]/95 shadow-[0_12px_30px_-14px_rgba(31,51,42,0.16)] transition-all focus-within:border-[#C55B23] focus-within:ring-2 focus-within:ring-[#C55B23]/20">
              <Search className="ml-4 h-5 w-5 shrink-0 text-[#5C5549]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Search products, brands or makers..."
                aria-label="Search products, brands or makers"
                data-testid="marketplace-search-input"
                className="w-full bg-transparent px-3.5 py-3.5 sm:py-4 text-sm sm:text-base text-[#1F332A] placeholder:text-[#7A7265] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  data-testid="marketplace-search-clear"
                  className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5C5549] hover:bg-[#EFE7D8] hover:text-[#1F332A] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Live Search Suggestions Populated Strictly From Real Approved Products */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] shadow-xl"
                data-testid="marketplace-search-suggestions"
              >
                {searchSuggestions.length > 0 ? (
                  <ul className="divide-y divide-[#E5DEC9]/70 py-1.5">
                    {searchSuggestions.map((item, idx) => (
                      <li key={`${item.type}-${item.label}-${idx}`}>
                        {item.type === 'product' && item.slug ? (
                          <Link
                            href={`/products/${item.slug}`}
                            className="flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm text-[#1F332A] hover:bg-[#FAF3E6]"
                          >
                            <span className="font-medium">{item.label}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C55B23]">
                              Product
                            </span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSearchQuery(item.label)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs sm:text-sm text-[#1F332A] hover:bg-[#FAF3E6]"
                          >
                            <span className="font-medium">{item.label}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5C5549]">
                              Brand / Maker
                            </span>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-xs text-[#5C5549]">
                    {hasAnyApprovedProducts
                      ? `No approved products or brands matching "${searchQuery}".`
                      : `Our product catalogue is currently in its Coming Soon curation phase. No listings match "${searchQuery}" yet.`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====================================================================
          DIV 2: DYNAMIC CATEGORY & SUBCATEGORY ARCHITECTURE (Part 3.2 & 3.3)
          Styled with the homepage's second-div sanctuary aesthetic
      ==================================================================== */}
      <section
        aria-label="Product Categories"
        className="space-y-5"
        data-testid="marketplace-categories-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
          <div>
            <span className="font-sans text-[11px] font-semibold tracking-[0.2em] text-[#8E3D13] uppercase">
              Curated Departments
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-[#1F332A]">
              Explore by Craft &amp; Category
            </h2>
          </div>

          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory('all');
              }}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] px-3.5 py-2 text-xs font-semibold text-[#1F332A] hover:border-[#C55B23] hover:text-[#C55B23] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>View All Categories</span>
            </button>
          )}
        </div>

        {/* 6 Canonical Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {MARKETPLACE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const count = categoryCounts[cat.slug] || 0;

            return (
              <div
                key={cat.slug}
                onClick={() => {
                  if (isSelected) {
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                  } else {
                    setSelectedCategory(cat.slug);
                    setSelectedSubcategory('all');
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (isSelected) {
                      setSelectedCategory('all');
                      setSelectedSubcategory('all');
                    } else {
                      setSelectedCategory(cat.slug);
                      setSelectedSubcategory('all');
                    }
                  }
                }}
                data-testid={`category-card-${cat.slug}`}
                className={`group cursor-pointer rounded-[22px] border p-5 sm:p-6 transition-all duration-300 ${
                  isSelected
                    ? 'border-[#C55B23] bg-[linear-gradient(145deg,#1D3027_0%,#263E33_54%,#2D463A_100%)] text-[#F8F3E8] shadow-[0_18px_40px_-18px_rgba(31,51,42,0.35)]'
                    : 'border-[#D5C8B3]/80 bg-[linear-gradient(145deg,rgba(255,253,249,0.92)_0%,rgba(244,236,220,0.88)_100%)] text-[#1F332A] hover:-translate-y-0.5 hover:border-[#C55B23]/60 hover:shadow-[0_16px_34px_-16px_rgba(31,51,42,0.16)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3
                      className={`font-serif text-lg sm:text-xl font-medium ${
                        isSelected ? 'text-[#FFFDF9]' : 'text-[#1F332A] group-hover:text-[#C55B23]'
                      }`}
                    >
                      {cat.title}
                    </h3>
                    <p
                      className={`font-sans font-normal mt-1.5 text-xs leading-relaxed ${
                        isSelected ? 'text-[#E7DFC8]/90' : 'text-[#5C5549]'
                      }`}
                    >
                      {cat.description}
                    </p>
                  </div>
                  {count > 0 && (
                    <span
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                        isSelected
                          ? 'bg-[#C55B23] text-white'
                          : 'bg-[#1F332A]/10 text-[#1F332A]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>

                {/* Subcategory Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-current/10">
                  {cat.subcategories.map((sub) => {
                    const isSubSelected =
                      isSelected && selectedSubcategory === sub.slug;
                    return (
                      <button
                        key={sub.slug}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(cat.slug);
                          setSelectedSubcategory(
                            isSubSelected ? 'all' : sub.slug
                          );
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          isSubSelected
                            ? 'bg-[#C55B23] text-white font-semibold'
                            : isSelected
                            ? 'bg-white/10 text-[#FDE2A8] hover:bg-white/20'
                            : 'bg-[#EFE7D8]/90 text-[#4E4A43] hover:bg-[#E2D5BE] hover:text-[#1F332A]'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          PART 3.4: FILTER & SORT CONTROLS (ONLY SHOWN WHEN PRODUCTS EXIST)
      ==================================================================== */}
      {hasAnyApprovedProducts && (
        <section
          aria-label="Filter and Sort Products"
          className="rounded-2xl border border-[#D5C8B3]/80 bg-[#FFFDF9]/90 p-4 sm:p-5 shadow-sm"
          data-testid="marketplace-filters-bar"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F332A]">
                <SlidersHorizontal className="h-4 w-4 text-[#C55B23]" />
                <span>Refine ({filteredProducts.length}):</span>
              </div>

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  aria-label="Filter by Brand"
                  className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-2 text-xs font-medium text-[#1F332A] focus:border-[#C55B23] focus:outline-none"
                >
                  <option value="all">All Brands &amp; Makers</option>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand.toLowerCase()}>
                      {brand}
                    </option>
                  ))}
                </select>
              )}

              {/* Origin Filter */}
              {availableOrigins.length > 0 && (
                <select
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  aria-label="Filter by Origin Valley"
                  className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-2 text-xs font-medium text-[#1F332A] focus:border-[#C55B23] focus:outline-none"
                >
                  <option value="all">All Himalayan Origins</option>
                  {availableOrigins.map((origin) => (
                    <option key={origin} value={origin.toLowerCase()}>
                      {origin}
                    </option>
                  ))}
                </select>
              )}

              {/* Discounted Toggle */}
              <button
                type="button"
                onClick={() => setOnlyDiscounted((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  onlyDiscounted
                    ? 'border-[#C55B23] bg-[#C55B23] text-white'
                    : 'border-[#D5C8B3] bg-[#FAF4E8] text-[#1F332A] hover:border-[#C55B23]'
                }`}
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Special Offers</span>
              </button>

              {/* In-Stock Toggle */}
              <button
                type="button"
                onClick={() => setOnlyInStock((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  onlyInStock
                    ? 'border-[#1F332A] bg-[#1F332A] text-[#F8F3E8]'
                    : 'border-[#D5C8B3] bg-[#FAF4E8] text-[#1F332A] hover:border-[#1F332A]'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>In Stock Only</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-[#C55B23] underline underline-offset-4 hover:text-[#1F332A]"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="marketplace-sort" className="text-xs font-medium text-[#5C5549]">
                Sort by:
              </label>
              <select
                id="marketplace-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
                className="rounded-xl border border-[#D5C8B3] bg-[#FAF4E8] px-3 py-2 text-xs font-semibold text-[#1F332A] focus:border-[#C55B23] focus:outline-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          PART 3.5: LIVE PRODUCT GRID OR DYNAMIC COMING SOON STATE
      ==================================================================== */}
      {hasAnyApprovedProducts && filteredProducts.length > 0 ? (
        <section
          aria-label="Approved Himalayan Products"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
          data-testid="marketplace-products-grid"
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id || product.slug} product={product} />
          ))}
        </section>
      ) : hasAnyApprovedProducts && filteredProducts.length === 0 ? (
        <section
          className="rounded-[26px] border border-[#D5C8B3]/80 bg-[#FFFDF9]/90 p-10 sm:p-14 text-center space-y-4"
          data-testid="marketplace-no-filter-matches"
        >
          <Layers className="mx-auto h-9 w-9 text-[#C55B23]" />
          <h3 className="font-serif text-2xl font-medium text-[#1F332A]">
            No Matching Products Found
          </h3>
          <p className="font-sans font-normal mx-auto max-w-md text-sm text-[#5C5549]">
            No approved listings match your current search or category filter.
            Reset your filters to view all available Himalayan products.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F332A] px-5 py-2.5 text-xs font-semibold text-[#F8F3E8] hover:bg-[#C55B23] transition-colors"
          >
            <span>Reset Filters</span>
          </button>
        </section>
      ) : (
        /* Dynamic Coming Soon State when 0 approved products exist */
        <section
          className="space-y-10"
          data-testid="products-coming-soon"
        >
          {/* Open, unboxed big responsive Coming Soon.... with animated dots */}
          <div className="py-6 sm:py-10 text-center space-y-4">
            {activeCategoryDef && (
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#8E3D13]">
                {activeCategoryDef.title} Collection
              </p>
            )}
            <p className="font-serif text-3xl sm:text-5xl md:text-6xl font-medium text-[#1F332A] tracking-tight inline-flex items-baseline justify-center">
              <span>Coming Soon</span>
              <span aria-hidden="true" className="inline-flex items-baseline ml-1 text-[#C55B23]">
                <span className="coming-soon-dot" style={{ animationDelay: '0ms' }}>.</span>
                <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '220ms' }}>.</span>
                <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '440ms' }}>.</span>
                <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '660ms' }}>.</span>
              </span>
            </p>
            <p className="font-sans font-normal mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-[#4E4A43]">
              Something meaningful is taking shape. We are bringing together
              thoughtful products, Himalayan makers and responsible brands. Our
              product collection is coming soon.
            </p>
          </div>

          {/* Maker, Seller & Brand Invitation Sanctuary Banner (Modeled on Homepage Div 2) */}
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[32px] border border-[#2B4438] bg-[linear-gradient(145deg,#1D3027_0%,#263E33_54%,#2D463A_100%)] p-6 sm:p-10 text-[#F8F3E8] shadow-[0_24px_60px_-20px_rgba(31,51,42,0.3)]">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <span className="font-sans inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[#FDE2A8] uppercase">
                  <Store className="h-3.5 w-3.5 text-[#FDE2A8]" />
                  <span>Uttarkunth Seller &amp; Brand Onboarding</span>
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#FFFDF9] leading-snug">
                  Are you a maker, seller or brand?
                </h2>
                <p className="font-sans font-normal text-xs sm:text-sm leading-relaxed text-[#E7DFC8]/90">
                  Register your workshop, cooperative, or Himalayan brand on
                  Uttarkunth. Approved sellers receive access to the Seller Desk
                  to manage products, MRP &amp; discounts, stock levels, brand
                  verification, and direct seller-fulfilled orders.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-[#FDE2A8]/90">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#FDE2A8]" />
                    <span>Verified &amp; Authentic Provenance</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[#FDE2A8]" />
                    <span>Direct Delivery by Respective Seller / Brand</span>
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-end xl:items-center justify-end gap-3">
                <Link
                  href="/products/sell"
                  data-testid="become-seller-partner-cta"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C55B23] px-6 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#AE4D1B] transition-all"
                >
                  <span>Become a Seller / Partner</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/seller/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#FDE2A8]/35 bg-white/10 px-5 py-3.5 text-xs sm:text-sm font-semibold text-[#FFFDF9] hover:bg-white/15 transition-all"
                >
                  <span>Open Seller Desk</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
