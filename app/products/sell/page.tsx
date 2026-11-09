import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { SellerApplicationForm } from '@/components/seller-application-form';
import { Store, CheckCircle2, ArrowRight, ShieldCheck, Mail, Sparkles } from 'lucide-react';

export const metadata = {
  title: `Sell Your Products — ${BRAND.name}`,
  description: `Partner with ${BRAND.name} to distribute Himalayan artisanal goods, honey, oils, and handicrafts.`,
  alternates: {
    canonical: '/products/sell',
  },
};

export default function SellProductsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ukorange/10 text-ukorange text-xs font-semibold uppercase tracking-wider">
          <Store className="w-3.5 h-3.5" />
          Maker Partnership
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          Sell Your Himalayan Products
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto">
          We invite mountain weavers, beekeepers, herbalists, and local food makers to connect with conscious customers across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft space-y-2">
          <ShieldCheck className="w-6 h-6 text-ukorange" />
          <h3 className="font-serif text-lg font-bold text-forest">Fair Pricing</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Zero exploitative middle-layer markups. Producers set sustainable rates that honor their craft and heritage.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft space-y-2">
          <CheckCircle2 className="w-6 h-6 text-forest" />
          <h3 className="font-serif text-lg font-bold text-forest">Verified Authenticity</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Every product is tested, tasted, or evaluated for genuine Himalayan origin, pure ingredients, and ethical sourcing.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft space-y-2">
          <Store className="w-6 h-6 text-ukblue-deep" />
          <h3 className="font-serif text-lg font-bold text-forest">Ecosystem Exposure</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Showcased directly to conscious guests booking mountain stays and community supporters nationwide.
          </p>
        </div>
      </div>

      {/* Interactive Seller Application Form */}
      <SellerApplicationForm />

      {/* Manual / Direct Contact Alternative */}
      <div className="bg-ivory-warm rounded-3xl p-6 sm:p-8 border border-forest/15 space-y-4">
        <h3 className="font-serif text-lg font-bold text-forest">Direct Curation Inquiries</h3>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          Prefer discussing your cooperative or artisan guild directly? You can also email our sourcing team with sample catalogs, harvest certifications, or high-altitude farm details.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Mail className="w-4 h-4 text-ukorange" />
          <a
            href={`mailto:${BRAND.email}?subject=Artisan%20Cooperative%20Application`}
            className="text-xs font-semibold text-forest hover:text-ukorange"
          >
            {BRAND.email}
          </a>
        </div>
      </div>
    </div>
  );
}
