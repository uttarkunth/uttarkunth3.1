'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PRODUCTS_SECTION_ORDER,
  INITIAL_CURATED_PRODUCTS,
  buildFeaturedProductSubgroups,
  getProductsForSection,
  extractMakersFromProducts,
  type FormattedProductCardData,
} from '@/lib/home-pillars';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  MapPin,
  Package,
  Sparkles,
  Store,
} from 'lucide-react';

function HomeProductCard({ product }: { product: FormattedProductCardData }) {
  return (
    <Link
      href="/products"
      data-testid={`home-product-card-${product.slug}`}
      className="group bg-[#FFFDF9] rounded-[22px] border border-[#D9CCB8] hover:border-[#C55B23]/65 shadow-[0_8px_22px_rgba(24,36,29,0.07)] hover:shadow-[0_14px_30px_rgba(24,36,29,0.13)] transition-all duration-300 overflow-hidden flex flex-col justify-between no-underline text-inherit"
    >
      <div>
        {/* Product Image Frame */}
        <div className="relative aspect-[16/11] w-full bg-[#1F332A] overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            referrerPolicy="no-referrer"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20"
          />

          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full bg-[#1F332A]/90 backdrop-blur-md text-[#FFFDF9] text-[10.5px] font-semibold tracking-wide border border-white/15">
              {product.categoryLabel}
            </span>
          </div>

          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFFDF9]/92 text-[#1F332A] text-[10px] font-bold tracking-wide shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-[#C55B23]" />
              {product.inStockLabel}
            </span>
          </div>
        </div>

        {/* Product Card Body: Title -> Prominent Brand Name -> Smaller Region -> Price */}
        <div className="p-4 sm:p-5 space-y-2">
          <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1F332A] group-hover:text-[#C55B23] transition-colors leading-snug">
            {product.title}
          </h4>

          {/* Clearly Visible Brand Name */}
          <div className="pt-0.5">
            <span
              data-testid={`product-brand-${product.slug}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F332A]/8 border border-[#1F332A]/15 text-[12.5px] sm:text-[13.5px] font-bold text-[#1F332A]"
            >
              <Store className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
              <span>{product.brandDisplayLabel}</span>
            </span>
          </div>

          {/* Region in Smaller Text */}
          <p
            data-testid={`product-region-${product.slug}`}
            className="text-[11px] sm:text-[11.5px] text-[#5C5549] font-medium flex items-center gap-1 pt-0.5"
          >
            <MapPin className="w-3 h-3 text-[#C55B23] shrink-0" />
            <span>{product.regionSmallLabel}</span>
          </p>

          <p className="text-xs text-[#4A443B] line-clamp-2 leading-relaxed pt-0.5">
            {product.description}
          </p>
        </div>
      </div>

      {/* Price & Action Footer */}
      <div className="px-4 sm:px-5 py-3.5 border-t border-[#E5DEC9] bg-[#FAF6EE]/65 flex items-center justify-between gap-2">
        <span
          data-testid={`product-price-${product.slug}`}
          className="font-serif text-xl sm:text-2xl font-bold text-[#1F332A] tabular-nums"
        >
          {product.priceFormatted}
        </span>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1F332A] group-hover:text-[#C55B23] transition-colors">
          <span>Explore Product</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function TreasuresOfHimalayasShowcase({
  products,
}: {
  products?: Record<string, any>[];
}) {
  // Use live approved products when present, otherwise use the single curated product
  const activeProducts =
    Array.isArray(products) && products.length > 0 ? products : INITIAL_CURATED_PRODUCTS;

  const featuredSubgroups = buildFeaturedProductSubgroups(activeProducts);
  const makers = extractMakersFromProducts(activeProducts);
  const categorySections = PRODUCTS_SECTION_ORDER.filter(
    (s) => s.id !== 'featured-products' && s.id !== 'meet-the-makers'
  );

  return (
    <div className="space-y-8 sm:space-y-10" data-testid="treasures-of-himalayas-showcase">
      {/* Pillar Header: Highlighted "Treasures of the Himalayas" + Section 1 "Featured Products" */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D9CCB8]/80 pb-3.5 sm:pb-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#2C4639] text-[#FAF4E8] border-l-4 border-[#C55B23] shadow-[0_6px_18px_rgba(31,51,42,0.14)] font-serif text-[17px] sm:text-xl md:text-2xl font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#FDE2A8] ring-2 ring-[#C55B23]/60 shrink-0" />
            Treasures of the Himalayas
          </span>
          <div className="space-y-0.5">
            <h2 className="font-serif text-[22px] sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-[#1F332A] tracking-tight leading-[1.15] sm:leading-tight">
              Featured Products
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5549] font-medium">
              Curated products from different brands
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/products/sell"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C55B23] hover:bg-[#AD4D1B] text-[#FFFDF9] text-xs font-semibold transition-colors shadow-2xs no-underline"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Sell Your Products</span>
          </Link>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
          >
            Explore all products &rarr;
          </Link>
        </div>
      </div>

      {/* SECTION 1: FEATURED PRODUCTS — Dynamic Sub-Rows (Only shown for regions/brands that have products) */}
      <div className="space-y-7">
        {featuredSubgroups.map((group) => (
          <div key={group.key} className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-[19px] sm:text-2xl font-bold text-[#1F332A] tracking-tight">
                  {group.title}
                </h3>
                <p className="text-[11.5px] sm:text-xs text-[#5C5549]">{group.subtitle}</p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline shrink-0"
              >
                <span>See all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {group.products.map((product) => (
                <HomeProductCard key={`${group.key}-${product.id}`} product={product} />
              ))}

              {/* Subtle Brand Onboarding Card Alongside Active Featured Product */}
              <div className="rounded-[22px] border border-dashed border-[#C55B23]/45 bg-[#FAF6EE]/80 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C55B23]/12 text-[#C55B23] text-[10.5px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Regional Provenance
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1F332A]">
                    More Himalayan Valleys Opening as Brands Join
                  </h4>
                  <p className="text-xs text-[#5C5549] leading-relaxed">
                    Regional collections such as <strong>From the Valleys of Lahaul and Spiti</strong>,{' '}
                    <strong>Kinnaur</strong>, and <strong>Uttarakhand</strong> appear automatically
                    on the home page as verified products from those valleys are approved.
                  </p>
                </div>
                <Link
                  href="/products/sell"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C55B23] hover:text-[#1F332A] transition-colors no-underline"
                >
                  <span>Onboard Your Himalayan Brand</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTIONS 2–5: ORDERED CATEGORY SECTIONS (Woven & Worn, Flavours of the Himalayas, Crafted by Hand, Natural Living) */}
      <div className="pt-6 border-t border-[#D5C8B3]/70 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categorySections.map((section) => {
            const matchingProducts = getProductsForSection(activeProducts, section.id);

            return (
              <div
                key={section.id}
                data-testid={`product-section-${section.id}`}
                className="rounded-[22px] border border-[#D9CCB8] bg-[#FFFDF9]/90 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-[0_6px_18px_rgba(24,36,29,0.05)]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-[#E5DEC9] pb-3">
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
                        Section 0{section.order}
                      </span>
                      <h3 className="font-serif text-[20px] sm:text-2xl font-bold text-[#1F332A] leading-tight mt-0.5">
                        {section.heading}
                      </h3>
                      <p className="text-xs text-[#5C5549] font-medium mt-0.5">
                        {section.focus}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#1F332A]/8 text-[#1F332A] text-[11px] font-semibold shrink-0">
                      {matchingProducts.length}{' '}
                      {matchingProducts.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>

                  {matchingProducts.length > 0 ? (
                    <div className="space-y-3 pt-1">
                      {matchingProducts.map((prod) => (
                        <Link
                          key={prod.id}
                          href="/products"
                          className="group/item flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF6EE] hover:bg-[#F2ECE0] border border-[#E5DEC9] transition-colors no-underline text-inherit"
                        >
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#1F332A] shrink-0">
                            <Image
                              src={prod.imageUrl}
                              alt={prod.title}
                              fill
                              sizes="80px"
                              referrerPolicy="no-referrer"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h4 className="font-serif text-base sm:text-lg font-bold text-[#1F332A] group-hover/item:text-[#C55B23] transition-colors truncate">
                              {prod.title}
                            </h4>
                            <p className="text-xs font-bold text-[#1F332A] truncate">
                              {prod.brandDisplayLabel}
                            </p>
                            <p className="text-[11px] text-[#5C5549] truncate">
                              {prod.regionSmallLabel}
                            </p>
                            <p className="font-serif text-sm font-bold text-[#C55B23] pt-0.5">
                              {prod.priceFormatted}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-[#FAF6EE]/80 border border-[#E5DEC9]/90 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[#1F332A]">
                          Curating verified {section.focus.toLowerCase()}
                        </p>
                        <p className="text-[11px] text-[#5C5549]">
                          Approved products in this category appear here automatically.
                        </p>
                      </div>
                      <Package className="w-5 h-5 text-[#C55B23]/70 shrink-0" />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <Link
                    href="/products"
                    className="font-semibold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
                  >
                    Browse {section.heading} &rarr;
                  </Link>
                  <Link
                    href="/products/sell"
                    className="font-medium text-[#5C5549] hover:text-[#1F332A] transition-colors no-underline"
                  >
                    List a product
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 6: MEET THE MAKERS (Local brands and artisans) */}
      <div
        data-testid="product-section-meet-the-makers"
        className="pt-6 border-t border-[#D5C8B3]/70 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
              Section 06
            </span>
            <h3 className="font-serif text-[20px] sm:text-2xl md:text-[28px] font-bold text-[#1F332A] leading-tight">
              Meet the Makers
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5549] font-medium">
              Local brands and artisans
            </p>
          </div>
          <Link
            href="/products/sell"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
          >
            <span>Register as a Himalayan Maker or Brand</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {makers.map((maker) => (
            <div
              key={maker.brandName}
              className="md:col-span-7 rounded-[22px] bg-[#FFFDF9] border border-[#D9CCB8] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-[0_6px_18px_rgba(24,36,29,0.05)]"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1F332A] text-[#FDE2A8] text-[10.5px] font-bold uppercase tracking-wider">
                    <Award className="w-3 h-3 text-[#C55B23]" />
                    Verified Maker &amp; Brand
                  </span>
                  <span className="text-[11px] font-semibold text-[#5C5549]">
                    {maker.productCount} {maker.productCount === 1 ? 'Curated Release' : 'Curated Releases'}
                  </span>
                </div>
                <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#1F332A]">
                  {maker.brandName}
                </h4>
                <p className="text-xs text-[#5C5549] font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C55B23]" />
                  <span>{maker.regionLabel}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span>{maker.craftFocus}</span>
                </p>
                <p className="text-xs sm:text-[13px] text-[#3F3A32] leading-relaxed pt-1">
                  Working directly with mountain families, small-batch producers, and indigenous
                  craftspeople to bring authentic Himalayan harvests and handmade goods with full
                  maker attribution.
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-xs">
                <span className="text-[#5C5549] font-medium">100% Transparent Brand Attribution</span>
                <Link
                  href="/products"
                  className="font-bold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
                >
                  View Maker Catalog &rarr;
                </Link>
              </div>
            </div>
          ))}

          <div className="md:col-span-5 rounded-[22px] bg-[#1F332A] text-[#FAF4E8] p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FDE2A8] block">
                Artisan &amp; Brand Desk
              </span>
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#FFFDF9] leading-snug">
                Are You a Local Himalayan Brand or Artisan?
              </h4>
              <p className="text-xs text-[#FAF4E8]/85 leading-relaxed">
                Showcase your handloom weaves, regional foods, woodcraft, or wellness formulations
                under your own brand name with clear valley provenance.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/products/sell"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#C55B23] hover:bg-[#AD4D1B] text-[#FFFDF9] text-xs font-semibold transition-colors no-underline"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Apply to Showcase Your Brand</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
