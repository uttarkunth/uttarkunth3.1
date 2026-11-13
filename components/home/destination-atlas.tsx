'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Compass, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AtlasDestination {
  id: string;
  slug: string;
  name: string;
  region: 'Himachal Pradesh' | 'Jammu & Kashmir' | 'Uttarakhand';
  tagline?: string;
  description?: string;
  propertyCount?: number;
}

interface DestinationAtlasProps {
  destinations: AtlasDestination[];
}

type RegionFilter = 'featured' | 'all' | 'Himachal Pradesh' | 'Uttarakhand' | 'Jammu & Kashmir';

export function DestinationAtlas({ destinations }: DestinationAtlasProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('featured');

  const counts = useMemo(() => {
    return {
      all: destinations.length,
      himachal: destinations.filter((d) => d.region === 'Himachal Pradesh').length,
      uttarakhand: destinations.filter((d) => d.region === 'Uttarakhand').length,
      jk: destinations.filter((d) => d.region === 'Jammu & Kashmir').length,
    };
  }, [destinations]);

  const visibleDestinations = useMemo(() => {
    if (regionFilter === 'featured') {
      // Prioritize destinations with live properties first, then curated representation across regions
      const sorted = [...destinations].sort(
        (a, b) => (b.propertyCount || 0) - (a.propertyCount || 0)
      );
      return sorted.slice(0, 8);
    }
    if (regionFilter === 'all') {
      return destinations;
    }
    return destinations.filter((d) => d.region === regionFilter);
  }, [destinations, regionFilter]);

  const filterTabs: Array<{ id: RegionFilter; label: string; count?: number }> = [
    { id: 'featured', label: 'Featured Corridors', count: 8 },
    { id: 'Himachal Pradesh', label: 'Himachal Pradesh', count: counts.himachal },
    { id: 'Uttarakhand', label: 'Uttarakhand', count: counts.uttarakhand },
    { id: 'Jammu & Kashmir', label: 'Jammu & Kashmir', count: counts.jk },
    { id: 'all', label: 'Complete Directory', count: counts.all },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Interactive Regional Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-warm-surface p-3 sm:p-4 rounded-2xl border border-beige/90 shadow-editorial-sm">
        <div
          role="tablist"
          aria-label="Filter Himalayan destinations by region"
          className="flex flex-wrap items-center gap-1.5"
        >
          {filterTabs.map((tab) => {
            const active = regionFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                suppressHydrationWarning
                aria-selected={active}
                onClick={() => setRegionFilter(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ease-editorial',
                  active
                    ? 'bg-forest text-warm-surface shadow-xs'
                    : 'text-charcoal-muted hover:text-forest hover:bg-warm-canvas/80'
                )}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-bold tabular-nums rounded-md',
                      active ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <Link
          href="/stays#destinations"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-forest hover:text-terracotta transition-colors px-2 shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-terracotta" />
          <span>Full Stays Atlas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Editorial Destination Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleDestinations.map((dest, idx) => {
          const hasLiveStays = (dest.propertyCount || 0) > 0;
          return (
            <Link
              key={dest.id}
              href={`/stays/destinations/${dest.slug}`}
              className={cn(
                'p-5 rounded-2xl border transition-all duration-300 ease-editorial flex flex-col justify-between group space-y-4',
                hasLiveStays
                  ? 'bg-forest text-warm-surface border-forest shadow-editorial-md hover:bg-forest-dark'
                  : 'bg-warm-surface text-charcoal border-beige/90 shadow-editorial-sm hover:border-forest/40 hover:shadow-editorial-md'
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-[0.14em]',
                      hasLiveStays ? 'text-terracotta-light' : 'text-terracotta'
                    )}
                  >
                    {dest.region}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10px] tabular-nums',
                      hasLiveStays ? 'text-warm-canvas/60' : 'text-charcoal-light'
                    )}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <h4
                  className={cn(
                    'font-serif text-xl sm:text-2xl font-bold transition-colors leading-snug',
                    hasLiveStays
                      ? 'text-warm-surface group-hover:text-terracotta-light'
                      : 'text-forest group-hover:text-terracotta'
                  )}
                >
                  {dest.name}
                </h4>

                {dest.tagline && (
                  <p
                    className={cn(
                      'text-xs line-clamp-2 leading-relaxed',
                      hasLiveStays ? 'text-warm-canvas/80' : 'text-charcoal-muted'
                    )}
                  >
                    {dest.tagline}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  'pt-3 border-t flex items-center justify-between text-xs font-semibold',
                  hasLiveStays
                    ? 'border-white/15 text-warm-canvas'
                    : 'border-beige/80 text-forest group-hover:text-terracotta'
                )}
              >
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <MapPin
                    className={cn(
                      'w-3.5 h-3.5',
                      hasLiveStays ? 'text-terracotta-light' : 'text-terracotta'
                    )}
                  />
                  {hasLiveStays
                    ? `${dest.propertyCount} Approved ${
                        dest.propertyCount === 1 ? 'Stay' : 'Stays'
                      }`
                    : 'Explore Corridor'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
