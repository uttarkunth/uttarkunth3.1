import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { PRODUCT_CATEGORIES, BRAND } from '@/lib/constants';
import { ProductWaitlistModal } from '@/components/product-waitlist-modal';
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Package,
  Layers,
  ArrowLeft,
  Store,
  Clock,
  HeartHandshake,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  return {
    title: `Himalayan Product — ${BRAND.name}`,
    description: `Authentic mountain product from independent makers in Himachal Pradesh.`,
    alternates: {
      canonical: `/products/${params.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  let product: any = null;
  try {
    const adminClient = createAdminClient();

    // Query product from database (only approved products accessible publicly)
    const { data, error } = await adminClient
      .from('products')
      .select('*, sellers(business_name, bio, valley, state)')
      .eq('slug', params.slug)
      .eq('moderation_status', 'approved')
      .maybeSingle();

    if (!error && data) {
      product = data;
    }
  } catch {
    product = null;
  }

  if (!product) {
    notFound();
  }

  const categoryInfo = PRODUCT_CATEGORIES.find((c) => c.id === product.category);
  const photos = Array.isArray(product.photos) && product.photos.length > 0
    ? product.photos
    : ['https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=800&q=80'];

  const getInventoryBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
            In Stock
          </span>
        );
      case 'made_to_order':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
            Made to Order
          </span>
        );
      case 'sold_out':
        return (
          <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
            Batch Completed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
            Upcoming Batch • Coming Soon
          </span>
        );
      }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-charcoal-muted">
        <Link href="/products" className="hover:text-forest flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Himalayan Products</span>
        </Link>
        <span>/</span>
        <span className="text-forest font-semibold">{categoryInfo?.name || 'Artisan Goods'}</span>
        <span>/</span>
        <span className="truncate max-w-[200px] text-charcoal">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Left Column: Visual Showcase */}
        <div className="space-y-4">
          <div className="relative aspect-4/3 rounded-3xl overflow-hidden bg-forest/5 border border-forest/15 shadow-soft">
            <img
              src={photos[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              {getInventoryBadge(product.inventory_status)}
            </div>
          </div>

          {photos.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {photos.slice(1, 5).map((imgUrl: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-forest/15">
                  <img src={imgUrl} alt={`${product.title} preview ${idx + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Genuine Mountain Provenance Certificate Card */}
          <div className="bg-ivory-warm rounded-3xl p-6 border border-forest/15 space-y-3">
            <div className="flex items-center gap-2 text-forest">
              <ShieldCheck className="w-5 h-5 text-ukorange" />
              <h3 className="font-serif text-base font-bold">Verified Himalayan Provenance</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-charcoal-muted block">Origin Valley:</span>
                <span className="font-semibold text-charcoal flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-ukorange" />
                  {product.origin_valley}, {product.origin_state}
                </span>
              </div>
              <div>
                <span className="text-charcoal-muted block">Craft / Technique:</span>
                <span className="font-semibold text-charcoal mt-0.5 block">{product.craft_type}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-forest/10">
                <span className="text-charcoal-muted block">Natural Materials:</span>
                <span className="font-semibold text-charcoal mt-0.5 block">{product.materials}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Narrative, Maker & Waitlist Action */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              {categoryInfo?.name || 'Artisan Collection'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest leading-tight">
              {product.title}
            </h1>
            <p className="text-xs text-charcoal-muted flex items-center gap-1.5 pt-1">
              <Store className="w-3.5 h-3.5 text-forest" />
              <span>Crafted by <strong>{product.maker_name}</strong></span>
              <span>&bull;</span>
              <span>{product.origin_valley}</span>
            </p>
          </div>

          {/* Fair Value / Direct Settlement Banner */}
          <div className="p-4 bg-warm-canvas rounded-2xl border border-beige space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-charcoal-muted">Fair Artisan Valuation</span>
              {product.price_estimate ? (
                <span className="font-serif text-2xl font-bold text-forest">
                  ₹{Number(product.price_estimate).toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="text-xs font-semibold text-forest">Pricing on Batch Release</span>
              )}
            </div>
            <p className="text-[11px] text-charcoal-muted leading-relaxed">
              <strong>Transparent Direct Model:</strong> Uttarkunth does not collect online product payments. Guests connect directly with verified artisan cooperatives upon batch release.
            </p>
          </div>

          {/* Narrative Overview */}
          <div className="space-y-3 text-sm text-charcoal leading-relaxed">
            <h2 className="font-serif text-lg font-bold text-forest">About This Creation</h2>
            <p className="whitespace-pre-line text-xs sm:text-sm text-charcoal-muted">
              {product.description}
            </p>
          </div>

          {/* Maker Bio */}
          {product.sellers && (
            <div className="p-5 bg-white rounded-2xl border border-forest/15 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center font-serif font-bold text-xs">
                  {product.maker_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif text-sm font-bold text-forest">{product.sellers.business_name || product.maker_name}</h3>
                  <span className="text-[11px] text-charcoal-muted">{product.sellers.valley}, {product.sellers.state}</span>
                </div>
              </div>
              {product.sellers.bio && (
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  {product.sellers.bio}
                </p>
              )}
            </div>
          )}

          {/* Waitlist Modal Launcher */}
          <div className="pt-4 border-t border-forest/10">
            <ProductWaitlistModal
              productId={product.id}
              productTitle={product.title}
              category={product.category}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
