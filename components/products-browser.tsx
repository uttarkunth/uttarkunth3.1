'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { ProductWaitlistModal } from '@/components/product-waitlist-modal';
import {
  Package,
  Store,
  Clock,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface ProductsBrowserProps {
  products: any[];
}

export function ProductsBrowser({ products }: ProductsBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.maker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.origin_valley?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.craft_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCategory = PRODUCT_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-12">
      {/* Category Pills & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              Curated Mountain Sourcing
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest mt-0.5">
              Product Categories
            </h2>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input suppressHydrationWarning
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weaves, honey, wood..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-forest/20 bg-white focus:outline-hidden focus:ring-2 focus:ring-forest/30"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button suppressHydrationWarning
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-forest text-white shadow-xs'
                : 'bg-white border border-forest/15 text-charcoal hover:border-forest/40'
            }`}
          >
            All Categories ({PRODUCT_CATEGORIES.length})
          </button>
          {PRODUCT_CATEGORIES.map((cat) => (
            <button suppressHydrationWarning
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'bg-white border border-forest/15 text-charcoal hover:border-forest/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Approved Products */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group bg-white rounded-3xl overflow-hidden border border-forest/15 shadow-soft hover:shadow-lifted hover:border-forest/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-4/3 overflow-hidden bg-forest/5 relative">
                  {p.photos?.[0] ? (
                    <img
                      src={p.photos[0]}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-forest/40">
                      <Package className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/90 backdrop-blur-xs text-forest text-[11px] font-bold rounded-full">
                    {p.inventory_status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange block">
                    {p.category}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-forest group-hover:text-ukorange transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                  <p className="text-xs text-charcoal-muted flex items-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-ukorange" />
                    <span>{p.origin_valley}, {p.origin_state}</span>
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-forest/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-muted block">Maker</span>
                  <span className="text-xs font-semibold text-charcoal">{p.maker_name}</span>
                </div>
                <div className="text-right">
                  {p.price_estimate ? (
                    <span className="font-serif text-base font-bold text-forest">
                      ₹{Number(p.price_estimate).toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-ukorange">Waitlist</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State / Coming Soon with Zero Fake Products */
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-forest/15 shadow-soft text-center space-y-6 max-w-3xl mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
            <Package className="w-8 h-8 text-ukorange" />
          </div>

          <div className="space-y-3">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              {activeCategory
                ? `No products currently listed in ${activeCategory.name}`
                : 'Our Curated Collection is Coming Soon'}
            </h3>
            <p className="text-sm text-charcoal-muted leading-relaxed max-w-xl mx-auto">
              {activeCategory
                ? `${activeCategory.description} Items will appear here as independent weavers, beekeepers, and village cooperatives complete our verification and curation inspection.`
                : 'We are onboarding independent mountain weavers, walnut orchardists, high-altitude beekeepers, and ethical makers. Every item must pass rigorous provenance and purity checks before listing.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products/sell"
              className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-6 py-3 rounded-full font-semibold text-xs transition-all shadow-xs"
            >
              <Store className="w-4 h-4 text-ukorange" />
              <span>Are you a Maker? Apply to Sell</span>
            </Link>

            <ProductWaitlistModal
              productTitle={activeCategory ? `${activeCategory.name} Batch Preview` : 'Himalayan Collection Early Preview'}
              category={activeCategory?.id || 'all'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
