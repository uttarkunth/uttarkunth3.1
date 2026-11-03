import React, { Suspense } from 'react';
import { BRAND } from '@/lib/constants';
import { SiteWideSearch } from '@/components/site-wide-search';
import { Search, Sparkles } from 'lucide-react';

export const metadata = {
  title: `Search Uttarkunth — Stays, Goods, Films & Community`,
  description: `Search across the 4 pillars of Uttarkunth: verified homestays, artisanal mountain products, independent films, and grassroots community initiatives.`,
};

export default function SearchPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const initialQuery = searchParams?.q || '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Search className="w-3.5 h-3.5 text-ukorange" />
          <span>Unified Discovery</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
          Search the Ecosystem
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
          Find authentic homestays in Parvati Valley, preview curated mountain products, stream independent films, or join community field initiatives.
        </p>
      </div>

      <Suspense fallback={<div className="p-12 text-center text-xs text-charcoal-muted">Loading search...</div>}>
        <SiteWideSearch initialQuery={initialQuery} />
      </Suspense>
    </div>
  );
}
