import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductWaitlistModal } from '@/components/product-waitlist-modal';
import {
  calculateProductDiscount,
  formatINR,
  resolveCanonicalCategory,
  resolveStockState,
} from '@/lib/marketplace';
import {
  MapPin,
  ShieldCheck,
  Package,
  ArrowLeft,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Layers,
  Tag,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product: any = null;
  let variants: any[] = [];

  try {
    const adminClient = createAdminClient();

    // Query product from database (only approved products accessible publicly)
    const { data, error } = await adminClient
      .from('products')
      .select('*, sellers(business_name, bio, valley, state, status, verification_status)')
      .eq('slug', params.slug)
      .eq('moderation_status', 'approved')
      .maybeSingle();

    if (!error && data) {
      product = data;

      // Load product variants if table exists
      try {
        const { data: varData } = await (adminClient.from('product_variants' as any) as any)
          .select('*')
          .eq('product_id', data.id)
          .eq('is_active', true);
        if (Array.isArray(varData)) {
          variants = varData;
        }
      } catch {
        variants = [];
      }
    }
  } catch {
    product = null;
  }

  if (!product) {
    notFound();
  }

  const categoryDef = resolveCanonicalCategory(product.category);
  const photos =
    Array.isArray(product.photos) && product.photos.length > 0
      ? product.photos
      : [];

  const rawSelling = product.selling_price ?? product.price_estimate ?? 0;
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

  const brandName = (
    product.brand_name ||
    product.sellers?.business_name ||
    product.maker_name ||
    'Himalayan Seller'
  ).trim();

  const isSellerVerified =
    product.sellers?.status === 'approved' ||
    product.sellers?.verification_status === 'approved';
  const isProductVerifiedAuthentic = Boolean(product.verification_badge_approved);

  return (
    <div className="relative overflow-hidden py-10 pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(244,230,204,0.85)_30%,rgba(235,216,186,0.7)_65%,#F5F0E6_100%)]"
      />

      <div className="relative z-10 mx-auto max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-[#5C5549]"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-1 font-medium text-[#1F332A] hover:text-[#C55B23] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Himalayan Products</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1F332A]">
            {categoryDef?.title || 'Artisan Collection'}
          </span>
          {product.subcategory && (
            <>
              <span>/</span>
              <span>{product.subcategory}</span>
            </>
          )}
          <span>/</span>
          <span className="truncate max-w-[240px] text-[#4E4A43]">
            {product.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Image Gallery & Provenance / Origin Card (5.2) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[26px] border border-[#D5C8B3] bg-[#EFE7D8] shadow-[0_20px_50px_-20px_rgba(31,51,42,0.18)]">
              {photos[0] ? (
                <img
                  src={photos[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <Package className="h-10 w-10 text-[#1F332A]/40" />
                  <span className="mt-2 font-serif text-sm font-semibold text-[#1F332A]">
                    {product.title}
                  </span>
                </div>
              )}

              {/* Top badges */}
              <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                {discount.valid && discount.hasDiscount && discount.formattedBadge && (
                  <span className="rounded-xl bg-[#C55B23] px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {discount.formattedBadge}
                  </span>
                )}
                {stockState.status === 'in_stock' && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-[#FFFDF9]/95 px-3 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{stockState.label}</span>
                  </span>
                )}
                {stockState.status === 'low_stock' && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50/95 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                    <span>{stockState.label}</span>
                  </span>
                )}
                {stockState.status === 'out_of_stock' && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-stone-100/95 px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm">
                    <span>{stockState.label}</span>
                  </span>
                )}
              </div>
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {photos.slice(1, 5).map((imgUrl: string, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-square overflow-hidden rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9]"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.title} view ${idx + 2}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Part 5.2: Separate Brand & Product Origin Details */}
            <div className="rounded-[24px] border border-[#D5C8B3]/80 bg-[linear-gradient(135deg,rgba(255,253,249,0.94)_0%,rgba(244,236,220,0.92)_100%)] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#D5C8B3]/60 pb-3">
                <div className="flex items-center gap-2 text-[#1F332A]">
                  <ShieldCheck className="h-5 w-5 text-[#C55B23]" />
                  <h2 className="font-serif text-lg font-bold">
                    Brand &amp; Product Origin
                  </h2>
                </div>
                {product.sku && (
                  <span className="rounded-lg bg-[#EFE7D8] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#4E4A43]">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                  <dt className="text-[#7A7265]">Brand / Manufacturer</dt>
                  <dd className="mt-0.5 font-semibold text-[#1F332A]">{brandName}</dd>
                </div>
                <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                  <dt className="text-[#7A7265]">Product Maker</dt>
                  <dd className="mt-0.5 font-semibold text-[#1F332A]">
                    {product.maker_name}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                  <dt className="text-[#7A7265]">Country of Origin</dt>
                  <dd className="mt-0.5 font-semibold text-[#1F332A]">
                    {product.country_of_origin || 'India'}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                  <dt className="text-[#7A7265]">Manufacturing Location</dt>
                  <dd className="mt-0.5 font-semibold text-[#1F332A] flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#C55B23] shrink-0" />
                    <span>
                      {product.manufacturing_location ||
                        `${product.origin_valley}, ${product.origin_state}`}
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                  <dt className="text-[#7A7265]">Material Sourcing Location</dt>
                  <dd className="mt-0.5 font-semibold text-[#1F332A]">
                    {product.sourcing_location ||
                      `${product.origin_valley}, ${product.origin_state}`}
                  </dd>
                </div>
                <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                  <dt className="text-[#7A7265]">Seller Dispatch Location</dt>
                  <dd className="mt-0.5 font-semibold text-[#1F332A]">
                    {product.dispatch_location ||
                      `${product.origin_valley}, ${product.origin_state}`}
                  </dd>
                </div>
              </dl>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                {product.materials && (
                  <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                    <span className="text-[#7A7265] block">Materials / Composition</span>
                    <span className="mt-0.5 font-semibold text-[#1F332A] block">
                      {product.materials}
                    </span>
                  </div>
                )}
                {product.ingredients && (
                  <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3">
                    <span className="text-[#7A7265] block">Ingredients</span>
                    <span className="mt-0.5 font-semibold text-[#1F332A] block">
                      {product.ingredients}
                    </span>
                  </div>
                )}
                {(product.dimensions || product.weight) && (
                  <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-3 sm:col-span-2">
                    <span className="text-[#7A7265] block">Dimensions &amp; Weight</span>
                    <span className="mt-0.5 font-semibold text-[#1F332A] block">
                      {[product.dimensions, product.weight].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Pricing, Variants, Badges & Direct Fulfilment */}
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-[26px] border border-[#D5C8B3]/80 bg-[linear-gradient(135deg,rgba(255,253,249,0.95)_0%,rgba(244,236,220,0.92)_100%)] p-6 sm:p-8 shadow-[0_20px_50px_-20px_rgba(31,51,42,0.14)] space-y-6">
              {/* Brand, Title & Authenticity Badges (Part 5.1 & 5.3) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C55B23]">
                    {brandName}
                  </span>
                  {isSellerVerified && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/20 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Verified Seller</span>
                    </span>
                  )}
                  {isProductVerifiedAuthentic && (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[#C55B23]/30 bg-[#1F332A] px-2.5 py-0.5 text-[11px] font-semibold text-[#FDE2A8]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#FDE2A8]" />
                      <span>Verified &amp; Authentic Product</span>
                    </span>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1F332A] leading-tight">
                  {product.title}
                </h1>

                {product.short_description && (
                  <p className="text-sm leading-relaxed text-[#4E4A43]">
                    {product.short_description}
                  </p>
                )}
              </div>

              {/* Pricing & Automatic Discount Display */}
              <div className="rounded-2xl border border-[#D5C8B3] bg-[#FFFDF9] p-5 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-3">
                    {sellingPrice > 0 ? (
                      <>
                        <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1F332A]">
                          {discount.formattedSellingPrice}
                        </span>
                        {discount.hasDiscount && (
                          <>
                            <span className="text-sm font-medium text-[#7A7265] line-through">
                              MRP {discount.formattedMrp}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#C55B23] px-2.5 py-1 text-xs font-bold text-white">
                              <Tag className="h-3 w-3" />
                              <span>
                                Save {formatINR(discount.discountAmount)} (
                                {discount.discountPercentage}% OFF)
                              </span>
                            </span>
                          </>
                        )}
                      </>
                    ) : (
                      <span className="font-serif text-xl font-bold text-[#1F332A]">
                        Price on Batch Release
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-[#5C5549]">
                    Inclusive of applicable taxes (INR)
                  </span>
                </div>
              </div>

              {/* Product Variants (if any) */}
              {variants.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F332A]">
                    Available Variants &amp; Options
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        className="rounded-xl border border-[#D5C8B3] bg-[#FFFDF9] p-3 text-xs"
                      >
                        <span className="font-semibold text-[#1F332A] block">
                          {v.variant_name}
                        </span>
                        {v.selling_price && (
                          <span className="mt-0.5 font-serif text-sm font-bold text-[#C55B23] block">
                            {formatINR(Number(v.selling_price))}
                          </span>
                        )}
                        <span className="mt-0.5 text-[10px] text-[#5C5549] block">
                          {v.available_stock > 0
                            ? `${v.available_stock} available`
                            : 'Out of stock'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Narrative & Specifications */}
              <div className="space-y-3 border-t border-[#D5C8B3]/60 pt-5">
                <h2 className="font-serif text-lg font-bold text-[#1F332A]">
                  Product Details &amp; Craftsmanship
                </h2>
                <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-[#4E4A43]">
                  {product.description}
                </p>
                {product.specifications && (
                  <div className="rounded-xl border border-[#E5DEC9] bg-[#FFFDF9] p-4 text-xs text-[#4E4A43] space-y-1">
                    <span className="font-semibold text-[#1F332A] block">
                      Technical Specifications
                    </span>
                    <p className="whitespace-pre-line">{product.specifications}</p>
                  </div>
                )}
              </div>

              {/* Action / Order Inquiry Launcher */}
              <div className="pt-2">
                <ProductWaitlistModal
                  productId={product.id}
                  productTitle={product.title}
                  category={product.category}
                />
              </div>
            </div>

            {/* Part 5.4: Mandatory Delivery & Fulfilment Explanation */}
            <div className="rounded-[24px] border border-[#2B4438] bg-[linear-gradient(145deg,#1D3027_0%,#263E33_54%,#2D463A_100%)] p-6 sm:p-7 text-[#F8F3E8] shadow-md space-y-4">
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-[#FDE2A8]" />
                <h2 className="font-serif text-lg font-bold text-[#FFFDF9]">
                  Direct Seller Delivery &amp; Fulfilment
                </h2>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-[#E7DFC8]/95">
                Every product on Uttarkunth is delivered directly by its respective
                seller or brand. The seller or brand manages packaging, dispatch and
                physical delivery using its own delivery arrangements. Uttarkunth
                provides the marketplace for product discovery and seller
                connections and does not undertake physical product fulfilment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <span className="text-[#FDE2A8] block font-semibold">
                    Dispatch Location
                  </span>
                  <span className="mt-0.5 block text-[#FFFDF9]">
                    {product.dispatch_location ||
                      `${product.origin_valley}, ${product.origin_state}`}
                  </span>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <span className="text-[#FDE2A8] block font-semibold">
                    Delivery Mode &amp; Timeline
                  </span>
                  <span className="mt-0.5 block text-[#FFFDF9]">
                    {product.delivery_method || 'Direct Seller Courier'} &bull;{' '}
                    {product.estimated_dispatch_days || '2–4 business days dispatch'}
                  </span>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <span className="text-[#FDE2A8] block font-semibold">
                    Shipping Charges &amp; Tracking
                  </span>
                  <span className="mt-0.5 block text-[#FFFDF9]">
                    {Number(product.shipping_charges) > 0
                      ? `${formatINR(Number(product.shipping_charges))} standard shipping`
                      : 'Free / Seller-Included Shipping'}{' '}
                    &bull;{' '}
                    {product.tracking_available !== false
                      ? 'Tracking provided on dispatch'
                      : 'Direct dispatch confirmation'}
                  </span>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                  <span className="text-[#FDE2A8] block font-semibold flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    <span>Return / Replacement Policy</span>
                  </span>
                  <span className="mt-0.5 block text-[#FFFDF9]">
                    {product.return_policy ||
                      '7-day replacement for transit damage or verified defect; managed directly by seller.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
