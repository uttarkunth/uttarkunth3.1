'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Luggage,
  ShoppingBag,
  Film,
  Heart,
  ArrowRight,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import {
  PRODUCT_CATEGORIES,
  AUTHENTIC_PRODUCTIONS,
  COMMUNITY_INITIATIVES,
} from '@/lib/constants';

interface SearchItem {
  id: string;
  pillar: 'stays' | 'products' | 'productions' | 'community';
  title: string;
  subtitle: string;
  description: string;
  url: string;
  meta?: string;
}

export function SiteWideSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedPillar, setSelectedPillar] = useState<'all' | 'stays' | 'products' | 'productions' | 'community'>('all');
  const [liveProperties, setLiveProperties] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.properties)) {
          setLiveProperties(data.properties);
        }
      })
      .catch(() => {});
  }, []);

  // Build searchable index from official curated constants and live properties
  const searchableIndex: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];

    // Stays from live database
    liveProperties.forEach((prop) => {
      items.push({
        id: `stay-${prop.id}`,
        pillar: 'stays',
        title: prop.name,
        subtitle: `${prop.village || ''}, ${prop.district || ''}, ${prop.state || ''}`,
        description: prop.description || '',
        url: `/stays/${prop.slug}`,
        meta: `₹${prop.rooms?.[0]?.base_price || 900}/night • Direct Host Settlement`,
      });
    });

    // Destinations
    items.push({
      id: 'dest-jari',
      pillar: 'stays',
      title: 'Jari, Parvati Valley',
      subtitle: 'Gateway to Malana & Sacred Pine Forests',
      description: 'Quiet Himalayan village known for pristine apple orchards, local homestays, and alpine hiking routes.',
      url: '/stays?destination=Jari',
      meta: 'Destination Hub',
    });

    // Products
    PRODUCT_CATEGORIES.forEach((cat) => {
      items.push({
        id: `prod-${cat.id}`,
        pillar: 'products',
        title: cat.name,
        subtitle: 'Authentic Himalayan Harvests & Handcrafts',
        description: cat.description,
        url: `/products`,
        meta: 'Scheduled Launch Q1 2027',
      });
    });

    // Productions
    AUTHENTIC_PRODUCTIONS.forEach((prod) => {
      items.push({
        id: `film-${prod.id}`,
        pillar: 'productions',
        title: prod.title,
        subtitle: `${prod.category} • Uttarkunth Productions`,
        description: prod.description,
        url: `/production/${prod.slug}`,
        meta: 'Watch Film Stream',
      });
    });

    // Creative Pitch
    items.push({
      id: 'film-collaborate',
      pillar: 'productions',
      title: 'Filmmaker Co-Production & Grants',
      subtitle: 'Creative Pitches & Documentary Support',
      description: 'Submit mountain documentary proposals for funding, on-ground village access, and digital archiving.',
      url: '/production/collaborate',
      meta: 'Pitch a Film',
    });

    // Community Initiatives
    COMMUNITY_INITIATIVES.forEach((init) => {
      items.push({
        id: `init-${init.id}`,
        pillar: 'community',
        title: init.title,
        subtitle: `${init.category} • ${init.valley}`,
        description: `${init.tagline} ${init.description}`,
        url: `/community/initiatives/${init.slug}`,
        meta: init.status,
      });
    });

    return items;
  }, [liveProperties]);

  // Filtered results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchableIndex;

    return searchableIndex.filter((item) => {
      const matchesPillar = selectedPillar === 'all' || item.pillar === selectedPillar;
      if (!matchesPillar) return false;

      const inTitle = item.title.toLowerCase().includes(q);
      const inSubtitle = item.subtitle.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inMeta = item.meta?.toLowerCase().includes(q);

      return inTitle || inSubtitle || inDesc || inMeta;
    });
  }, [query, selectedPillar, searchableIndex]);

  const getPillarIcon = (pillar: string) => {
    switch (pillar) {
      case 'stays':
        return <Luggage className="w-4 h-4 text-forest" />;
      case 'products':
        return <ShoppingBag className="w-4 h-4 text-amber-700" />;
      case 'productions':
        return <Film className="w-4 h-4 text-ukorange" />;
      case 'community':
        return <Heart className="w-4 h-4 text-ukblue-deep" />;
      default:
        return <Sparkles className="w-4 h-4 text-forest" />;
    }
  };

  const getPillarBadge = (pillar: string) => {
    switch (pillar) {
      case 'stays':
        return <span className="px-2 py-0.5 bg-forest/10 text-forest text-[10px] font-bold rounded-full">Stay</span>;
      case 'products':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">Goods</span>;
      case 'productions':
        return <span className="px-2 py-0.5 bg-ukorange/15 text-ukorange text-[10px] font-bold rounded-full">Film</span>;
      case 'community':
        return <span className="px-2 py-0.5 bg-ukblue-deep/10 text-ukblue-deep text-[10px] font-bold rounded-full">Community</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-forest/50 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          suppressHydrationWarning
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stays, products, films, or community initiatives (e.g. Jari, honey, Kath-Kuni, devta)..."
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-forest/20 text-sm text-charcoal bg-white shadow-soft focus:ring-2 focus:ring-ukorange/30 focus:border-forest outline-none transition-all"
        />
        {query && (
          <button
            suppressHydrationWarning
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-forest"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pillar Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          suppressHydrationWarning
          onClick={() => setSelectedPillar('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPillar === 'all'
              ? 'bg-forest text-white shadow-xs'
              : 'bg-white hover:bg-ivory border border-forest/15 text-charcoal-muted'
          }`}
        >
          All Results ({filteredResults.length})
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setSelectedPillar('stays')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPillar === 'stays'
              ? 'bg-forest text-white shadow-xs'
              : 'bg-white hover:bg-ivory border border-forest/15 text-charcoal-muted'
          }`}
        >
          Stays &amp; Destinations
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setSelectedPillar('products')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPillar === 'products'
              ? 'bg-forest text-white shadow-xs'
              : 'bg-white hover:bg-ivory border border-forest/15 text-charcoal-muted'
          }`}
        >
          Himalayan Goods
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setSelectedPillar('productions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPillar === 'productions'
              ? 'bg-forest text-white shadow-xs'
              : 'bg-white hover:bg-ivory border border-forest/15 text-charcoal-muted'
          }`}
        >
          Productions &amp; Films
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setSelectedPillar('community')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedPillar === 'community'
              ? 'bg-forest text-white shadow-xs'
              : 'bg-white hover:bg-ivory border border-forest/15 text-charcoal-muted'
          }`}
        >
          Community Initiatives
        </button>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-forest/15 text-center space-y-2">
            <Search className="w-8 h-8 text-forest/30 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-forest">No results found for &ldquo;{query}&rdquo;</h3>
            <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
              Try searching for &lsquo;Jari&rsquo;, &lsquo;homestay&rsquo;, &lsquo;honey&rsquo;, &lsquo;Kath-Kuni&rsquo;, or &lsquo;devta&rsquo;.
            </p>
          </div>
        ) : (
          filteredResults.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="block p-5 bg-white rounded-2xl border border-forest/15 shadow-soft hover:shadow-lifted hover:border-forest/40 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getPillarIcon(item.pillar)}
                    {getPillarBadge(item.pillar)}
                    <span className="text-[11px] font-semibold text-charcoal-muted">
                      {item.subtitle}
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-forest group-hover:text-terracotta transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2 max-w-2xl">
                    {item.description}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-forest/10">
                  {item.meta && (
                    <span className="text-[11px] font-semibold text-ukorange bg-ukorange/10 px-2.5 py-0.5 rounded-full">
                      {item.meta}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-forest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
