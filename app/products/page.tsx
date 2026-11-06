import React from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductsBrowser } from '@/components/products-browser';
import { BRAND } from '@/lib/constants';
import {
  Clock,
  Store,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Himalayan Products & Artisan Goods — ${BRAND.name}`,
  description: `Pure regional harvests, handloom shawls, wild honey, and traditional handicrafts direct from Himalayan village makers.`,
};

export default async function ProductsPage() {
  let products: any[] = [];
  try {
    const adminClient = createAdminClient();

    // Query only approved products for public marketplace
    const { data: approvedProducts } = await adminClient
      .from('products')
      .select('*, sellers(business_name, valley, state)')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    products = approvedProducts || [];
  } catch {
    products = [];
  }

  return (
    <div className="space-y-16 py-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. Header & Coming Soon Banner */}
      <section className="max-w-4xl mx-auto text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ukorange/10 text-ukorange text-xs font-semibold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          Pillar II • Himalayan Products
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-forest leading-tight">
          Discover Something Meaningful.
        </h1>

        <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed font-sans">
          We&rsquo;re building a growing collection of valuable products from independent makers, local creators and responsible businesses. Zero mass production. Pure mountain provenance.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/products/sell"
            className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-7 py-3 rounded-full font-semibold text-xs transition-all shadow-lifted"
          >
            <Store className="w-4 h-4" />
            <span>Sell Your Products With Us</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/contact?subject=Product%20Catalogue%20Enquiry"
            className="inline-flex items-center gap-2 bg-forest/5 hover:bg-forest/10 text-forest border border-forest/15 px-6 py-3 rounded-full font-semibold text-xs transition-all"
          >
            Join Early Patron Notification List
          </Link>
        </div>
      </section>

      {/* 2. Interactive Product Browser */}
      <section>
        <ProductsBrowser products={products} />
      </section>

      {/* 3. Ethical Sourcing & Workflow */}
      <section className="bg-ivory-warm rounded-3xl p-8 sm:p-12 border border-forest/20 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-ukorange">
            Ethical Commerce Workflow
          </span>
          <h3 className="font-serif text-3xl font-bold text-forest">
            How Mountain Producers Join Uttarkunth
          </h3>
          <p className="text-xs text-charcoal-muted">
            Our transparent 5-step approval process ensures that every item is genuine, ethically priced, and traceable to its maker.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-forest/10 space-y-2">
            <div className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">1</div>
            <h4 className="font-serif text-sm font-bold text-forest">Sign In</h4>
            <p className="text-[11px] text-charcoal-muted">Seller signs in using their unified Uttarkunth account identity.</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-forest/10 space-y-2">
            <div className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">2</div>
            <h4 className="font-serif text-sm font-bold text-forest">Submit</h4>
            <p className="text-[11px] text-charcoal-muted">Submit product details, harvest origin, photographs, and pricing.</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-forest/10 space-y-2">
            <div className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">3</div>
            <h4 className="font-serif text-sm font-bold text-forest">Review</h4>
            <p className="text-[11px] text-charcoal-muted">Our curation team inspects sourcing authenticity, ethics, and purity.</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-forest/10 space-y-2">
            <div className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">4</div>
            <h4 className="font-serif text-sm font-bold text-forest">Publish</h4>
            <p className="text-[11px] text-charcoal-muted">Admin approves and publishes the product to its assigned category.</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-forest/10 space-y-2">
            <div className="w-7 h-7 rounded-full bg-forest text-white text-xs font-bold flex items-center justify-center">5</div>
            <h4 className="font-serif text-sm font-bold text-forest">Direct Patronage</h4>
            <p className="text-[11px] text-charcoal-muted">Guests connect directly with the maker without middlemen.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
