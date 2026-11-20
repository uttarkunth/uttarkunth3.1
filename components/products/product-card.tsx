'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  MapPin,
  ArrowUpRight,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import {
  calculateProductDiscount,
  resolveCanonicalCategory,
  resolveStockState,
} from '@/lib/marketplace';

export interface MarketplaceProductItem {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  sku?: string | null;
  brand_name?: string | null;
  maker_name: string;
  origin_valley: string;
  origin_state: string;
  country_of_origin?: string | null;
  manufacturing_location?: string | null;
  sourcing_location?: string | null;
  dispatch_location?: string | null;
  craft_type?: string | null;
  materials?: string | null;
  photos?: string[] | null;
  mrp?: number | null;
  selling_price?: number | null;
  price_estimate?: number | null;
  discount_percentage?: number | null;
  available_stock?: number | null;
  low_stock_threshold?: number | null;
  inventory_status?: string | null;
  verification_badge_approved?: boolean | null;
  delivery_method?: string | null;
  estimated_dispatch_days?: string | null;
}

interface ProductCardProps {
  product: MarketplaceProductItem;
  previewMode?: boolean;
}

export function ProductCard({ product, previewMode = false }: ProductCardProps) {
  const rawSelling =
    product.selling_price ?? product.price_estimate ?? 0;
  const sellingPrice = Math.max(0, Number(rawSelling) || 0);
  const rawMrp =
    product.mrp && Number(product.mrp) >= sellingPrice
      ? Number(product.mrp)
      : sellingPrice;

  const discount = calculateProductDiscount(rawMrp, sellingPrice);
  const stockState = resolveStockState(
    product.available_stock,
    product.low_stock_threshold,
    product.inventory_status
  );
  const categoryDef = resolveCanonicalCategory(product.category);
  const brandLabel = (product.brand_name || product.maker_name || 'Artisan Maker').trim();
  const primaryPhoto =
    Array.isArray(product.photos) && product.photos.length > 0 && product.photos[0]
      ? product.photos[0]
      : null;
  const isVerifiedAuthentic = Boolean(product.verification_badge_approved);

  const cardInner = (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#D5C8B3]/80 bg-[linear-gradient(155deg,#FFFDF9_0%,#FAF4E8_60%,#F2ECE1_100%)] shadow-[0_14px_34px_-16px_rgba(31,51,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C55B23]/55 hover:shadow-[0_24px_48px_-18px_rgba(31,51,42,0.2)]"
      data-testid={`product-card-${product.slug || product.id}`}
    >
      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#1F332A] via-[#C55B23] to-[#D4A359]" />

      {/* Product Visual Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFE7D8]">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#EFE7D8] to-[#E3D7C3] p-6 text-center">
            <span className="font-serif text-sm font-semibold text-[#1F332A]/70">
              {brandLabel}
            </span>
            <span className="mt-1 text-[11px] text-[#5C5549]">
              Genuine Product Photograph
            </span>
          </div>
        )}

        {/* Top-left badges: Automatic Discount Badge & Category */}
        <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5">
          {discount.valid && discount.hasDiscount && discount.formattedBadge && (
            <span
              className="rounded-lg bg-[#C55B23] px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm"
              data-testid="product-discount-badge"
            >
              {discount.formattedBadge}
            </span>
          )}
          {categoryDef && (
            <span className="rounded-lg border border-white/25 bg-[#1F332A]/85 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-[#F8F3E8] uppercase backdrop-blur-md">
              {product.subcategory || categoryDef.shortTitle}
            </span>
          )}
        </div>

        {/* Top-right Verified & Authentic badge (only when approved by Uttarkunth) */}
        {isVerifiedAuthentic && (
          <div
            className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-lg border border-[#FDE2A8]/40 bg-[#1F332A]/90 px-2.5 py-1 text-[10px] font-semibold text-[#FDE2A8] shadow-sm backdrop-blur-md"
            data-testid="product-verified-badge"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#FDE2A8]" />
            <span>Verified &amp; Authentic</span>
          </div>
        )}

        {/* Bottom-left Stock Status Pill */}
        <div className="absolute bottom-3 left-3.5">
          {stockState.status === 'in_stock' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-800/20 bg-[#FFFDF9]/95 px-2.5 py-1 text-[10px] font-semibold text-emerald-900 shadow-sm backdrop-blur-sm">
              <PackageCheck className="h-3 w-3 text-emerald-700" />
              <span>{stockState.label}</span>
            </span>
          )}
          {stockState.status === 'low_stock' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-700/25 bg-amber-50/95 px-2.5 py-1 text-[10px] font-semibold text-amber-900 shadow-sm backdrop-blur-sm">
              <AlertCircle className="h-3 w-3 text-amber-700" />
              <span>{stockState.label}</span>
            </span>
          )}
          {stockState.status === 'out_of_stock' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-stone-400/40 bg-stone-100/95 px-2.5 py-1 text-[10px] font-semibold text-stone-700 shadow-sm backdrop-blur-sm">
              <span>{stockState.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div className="space-y-2.5">
          {/* Brand Name & Origin */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold tracking-[0.12em] text-[#8E3D13] uppercase">
            <span className="truncate" data-testid="product-brand-name">
              {brandLabel}
            </span>
            {product.origin_valley && (
              <span className="inline-flex shrink-0 items-center gap-1 font-normal tracking-normal text-[#5C5549] normal-case">
                <MapPin className="h-3 w-3 text-[#C55B23]" />
                <span>{product.origin_valley}</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug text-[#1F332A] transition-colors group-hover:text-[#C55B23] line-clamp-2">
            {product.title}
          </h3>

          {/* Short Description */}
          {(product.short_description || product.description) && (
            <p className="text-xs leading-relaxed text-[#5C5549] line-clamp-2">
              {product.short_description || product.description}
            </p>
          )}
        </div>

        {/* Pricing, MRP Strikethrough & Fulfilment Notice */}
        <div className="mt-5 space-y-3 border-t border-[#D5C8B3]/60 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              {sellingPrice > 0 ? (
                <>
                  <span
                    className="font-serif text-2xl font-bold text-[#1F332A]"
                    data-testid="product-selling-price"
                  >
                    {discount.formattedSellingPrice}
                  </span>
                  {discount.hasDiscount && (
                    <span
                      className="text-xs font-medium text-[#7A7265] line-through"
                      data-testid="product-mrp-strikethrough"
                    >
                      {discount.formattedMrp}
                    </span>
                  )}
                  {discount.hasDiscount && discount.formattedBadge && (
                    <span className="text-xs font-bold text-[#C55B23]">
                      ({discount.formattedBadge})
                    </span>
                  )}
                </>
              ) : (
                <span className="font-serif text-base font-bold text-[#1F332A]">
                  Price on Release
                </span>
              )}
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F332A] transition-colors group-hover:text-[#C55B23]">
              <span>View</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>

          {/* Mandatory Seller/Brand Direct Fulfilment Note */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#D5C8B3]/60 bg-[#FAF3E6]/85 px-3 py-1.5 text-[11px] text-[#4E4A43]">
            <Truck className="h-3.5 w-3.5 shrink-0 text-[#C55B23]" />
            <span className="truncate">
              Delivered directly by {brandLabel}
            </span>
          </div>
        </div>
      </div>
    </article>
  );

  if (previewMode) {
    return cardInner;
  }

  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      {cardInner}
    </Link>
  );
}
