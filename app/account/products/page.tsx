import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductInterestForm } from '@/components/product-interest-form';
import { ShoppingBag, Sparkles, ShieldCheck, HeartHandshake, ArrowRight, Store } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountProductsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/products');
  }

  const meta = user.user_metadata || {};
  const registeredCategories = (meta.product_waitlist_categories as string[]) || [];

  const adminClient = createAdminClient();
  const { data: seller } = await adminClient
    .from('sellers')
    .select('user_id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const isSeller = Boolean(seller);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Himalayan Goods</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">My Products & Purchases</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Track handcrafted mountain goods, batch waitlists, and artisan cooperative collections
        </p>
      </div>

      {/* Launching 2027 Announcement Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6 text-forest" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                Scheduled for Q1 2027
              </span>
              <span className="text-xs font-semibold text-charcoal-muted">Curated Himalayan Marketplace</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-forest">
              Handcrafted Treasures Born in the Mountains
            </h2>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-2xl">
              Uttarkunth connects mindful consumers with indigenous craftspeople across Himachal Pradesh and Uttarakhand. We are currently verifying batches with master weavers, high-altitude beekeepers, and village cooperatives.
            </p>
          </div>
        </div>

        {/* 4 Pillars of Product Authenticity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="font-serif text-sm font-bold text-forest block">100% Genuine Provenance</span>
            <span className="text-xs text-charcoal-muted block leading-relaxed">
              Every woolen textile, honey jar, and wooden craft is traced to its village maker and valley of origin.
            </span>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="font-serif text-sm font-bold text-forest block">Fair Artisan Revenue</span>
            <span className="text-xs text-charcoal-muted block leading-relaxed">
              Direct settlement with artisans ensures the lion&apos;s share of revenue remains in the Himalayan villages.
            </span>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="font-serif text-sm font-bold text-forest block">Zero Synthetic Materials</span>
            <span className="text-xs text-charcoal-muted block leading-relaxed">
              Strict avoidance of acrylics or chemical adulteration. Pure wool, wild honey, and natural botanical dyes.
            </span>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1">
            <span className="font-serif text-sm font-bold text-forest block">No Artificial Shortages</span>
            <span className="text-xs text-charcoal-muted block leading-relaxed">
              We never fabricate inventory counts or fake flash sales. Products are released only when verified.
            </span>
          </div>
        </div>

        {/* Interactive Interest Form */}
        <div className="pt-4 border-t border-forest/10">
          <ProductInterestForm initialCategories={registeredCategories} userEmail={user.email} />
        </div>
      </div>

      {/* Artisan Collective Callout */}
      <div className="bg-forest text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Artisan Collective</span>
          <h3 className="font-serif text-xl font-bold">Are you a Himalayan producer or maker?</h3>
          <p className="text-xs text-white/80 leading-relaxed">
            Apply to sell your handcrafted woolens, mountain honey, organic teas, or cedar crafts on Uttarkunth.
          </p>
        </div>

        {isSeller ? (
          <Link
            href="/account/products/seller"
            className="px-5 py-2.5 bg-ukorange hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <Store className="w-4 h-4" />
            <span>Open Seller Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            href="/products/sell"
            className="px-5 py-2.5 bg-ukorange hover:bg-terracotta-dark text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Apply as Maker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
