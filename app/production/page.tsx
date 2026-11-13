'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND, AUTHENTIC_PRODUCTIONS } from '@/lib/constants';
import {
  Film,
  Clapperboard,
  Play,
  ArrowRight,
  Sparkles,
  X,
  Clock,
  History,
  RotateCcw,
} from 'lucide-react';

export interface Production {
  id: string;
  slug: string;
  title: string;
  category: 'Documentary' | 'Cultural Monologue';
  description: string;
  thumbnail: string;
  videoSrc: string;
  youtubeUrl: string;
}

const AUTHORIZED_PRODUCTIONS = AUTHENTIC_PRODUCTIONS as Production[];

const CATEGORIES = [
  { id: 'all', label: 'All Productions' },
  { id: 'Documentary', label: 'Documentary' },
  { id: 'Cultural Monologue', label: 'Cultural Monologue' },
  { id: 'Feature Film', label: 'Feature Film' },
  { id: 'Short Film', label: 'Short Film' },
];

export default function ProductionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeVideo, setActiveVideo] = useState<Production | null>(null);
  const [watchHistory, setWatchHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('uttarkunth_watch_history');
      if (saved) {
        setWatchHistory(JSON.parse(saved));
      }
    } catch {
      // localStorage may be restricted
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const genreParam = params.get('genre') || params.get('category');
      const queryParam = params.get('q');
      if (genreParam && CATEGORIES.some((c) => c.id === genreParam)) {
        setSelectedCategory(genreParam);
      }
      if (queryParam) {
        setSearchQuery(queryParam);
      }
    } catch {
      // ignore URL parsing errors
    }
  }, []);

  const handlePlay = (prod: Production) => {
    setActiveVideo(prod);
    const updated = [prod.id, ...watchHistory.filter((id) => id !== prod.id)];
    setWatchHistory(updated);
    try {
      localStorage.setItem('uttarkunth_watch_history', JSON.stringify(updated));
    } catch {
      // ignore storage failure
    }
  };

  const filtered = AUTHORIZED_PRODUCTIONS.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  const watchedVideos = AUTHORIZED_PRODUCTIONS.filter((p) => watchHistory.includes(p.id));

  return (
    <div className="space-y-16 py-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. HEADER */}
      <section className="max-w-4xl mx-auto text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-ukblue-deep/10 text-ukblue-deep text-xs font-semibold uppercase tracking-wider">
          <Film className="w-3.5 h-3.5 text-ukorange" />
          Pillar III • Productions &amp; Cinema
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-forest leading-tight">
          Himalayan Visual Storytelling &amp; Cinema
        </h1>
        <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed font-sans">
          Documentaries, indigenous monologues, and temple folklore recorded across high-altitude hamlets. Authentic creative cinema without fictionalization.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/production/collaborate"
            className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-6 py-2.5 rounded-full text-xs font-semibold transition-all shadow-lifted"
          >
            <Clapperboard className="w-4 h-4" />
            <span>Collaborate With Us</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 2. CONTINUE WATCHING / WATCH HISTORY (If Available) */}
      {watchedVideos.length > 0 && (
        <section className="bg-ivory-warm rounded-3xl p-6 sm:p-8 border border-forest/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-forest">
              <History className="w-4 h-4 text-ukorange" />
              <h3 className="font-serif text-lg font-bold">Continue Watching</h3>
            </div>
            <button suppressHydrationWarning
              onClick={() => {
                setWatchHistory([]);
                try {
                  localStorage.removeItem('uttarkunth_watch_history');
                } catch {}
              }}
              className="text-[11px] text-charcoal-muted hover:text-ukorange transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {watchedVideos.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handlePlay(prod)}
                className="p-3 bg-white rounded-2xl border border-forest/10 flex items-center gap-4 cursor-pointer hover:shadow-soft transition-all group"
              >
                <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-forest-dark flex-shrink-0">
                  <Image src={prod.thumbnail} alt={prod.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-ukorange">{prod.category}</span>
                  <h4 className="font-serif text-base font-bold text-forest group-hover:text-ukorange transition-colors">
                    {prod.title}
                  </h4>
                  <span className="text-[11px] text-charcoal-muted block">Click to resume on-site</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. CATEGORY FILTER TABS */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Published Catalogue</span>
            <h2 className="font-serif text-3xl font-bold text-forest mt-1">
              Authorized Video Productions
            </h2>
          </div>
          <span className="text-xs text-charcoal-muted">
            Showing {filtered.length} authorized {filtered.length === 1 ? 'production' : 'productions'}
          </span>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button suppressHydrationWarning
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-forest text-ivory shadow-sm'
                  : 'bg-white border border-forest/15 text-charcoal hover:border-forest/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 4. PRODUCTIONS GRID / EMPTY STATE */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col group"
              >
                <div className="relative aspect-video w-full bg-forest-dark overflow-hidden">
                  <Image
                    src={prod.thumbnail}
                    alt={prod.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Play Button */}
                  <button suppressHydrationWarning
                    onClick={() => handlePlay(prod)}
                    className="absolute inset-0 flex items-center justify-center focus:outline-none"
                    aria-label={`Play ${prod.title}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-ukorange transition-all">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                  </button>

                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                    <span className="font-semibold uppercase tracking-wider text-[11px] bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {prod.category}
                    </span>
                    <span className="text-[11px] text-white/80">Uttarkunth Archive</span>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex flex-col flex-1 justify-between">
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                      {prod.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-forest/10 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button suppressHydrationWarning
                        onClick={() => handlePlay(prod)}
                        className="inline-flex items-center gap-1.5 bg-forest text-ivory px-4 py-2 rounded-full text-xs font-semibold hover:bg-forest-dark transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch On-Site</span>
                      </button>

                      <Link
                        href={`/production/${prod.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:text-ukorange border border-forest/20 px-3.5 py-2 rounded-full hover:border-ukorange transition-all"
                      >
                        <span>Film Details</span>
                      </Link>
                    </div>

                    <a
                      href={prod.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-muted hover:text-ukorange border border-forest/15 px-3.5 py-2 rounded-full hover:border-ukorange transition-all"
                    >
                      <span>YouTube</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Category Empty State (Word-for-Word Directive Mandate) */
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-forest/15 shadow-soft text-center space-y-6 max-w-2xl mx-auto my-6">
            <div className="w-14 h-14 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
              <Film className="w-7 h-7 text-ukorange" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                New stories are on their way.
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                There are currently no published films in the {selectedCategory} category. Independent mountain filmmakers are currently filming and preparing works for review.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/production/collaborate"
                className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-ivory px-6 py-3 rounded-full font-semibold text-xs transition-all shadow-sm"
              >
                <Clapperboard className="w-4 h-4 text-ukorange" />
                <span>Collaborate With Us on a Film</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. ON-SITE VIDEO MODAL PLAYER */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-forest-dark rounded-3xl overflow-hidden max-w-4xl w-full border border-white/20 shadow-2xl space-y-4 p-4 sm:p-6 text-ivory">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <span className="text-[10px] text-ukorange font-bold uppercase tracking-wider block">
                  Now Playing • {activeVideo.category}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-ivory">
                  {activeVideo.title}
                </h3>
              </div>
              <button suppressHydrationWarning
                onClick={() => setActiveVideo(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-ivory transition-colors"
                aria-label="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <video
                src={activeVideo.videoSrc}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-ivory/70 pt-2">
              <p className="max-w-xl">{activeVideo.description}</p>
              <a
                href={activeVideo.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ukorange hover:underline font-semibold whitespace-nowrap ml-4"
              >
                Open on YouTube ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 6. CREATOR COLLABORATION DESK */}
      <section className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-lifted">
        <span className="text-xs uppercase tracking-widest text-ukorange font-bold block">
          Creative Collaboration
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold">
          Filmmaker &amp; Creator Submission Desk
        </h2>
        <p className="text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-sans">
          Are you an independent documentary filmmaker, ethnographer, or mountain storyteller? Submit your pitch, treatment, or completed work for curation on Uttarkunth.
        </p>
        <div className="pt-2">
          <Link
            href="/production/collaborate"
            className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-7 py-3 rounded-full font-semibold text-xs transition-all shadow-lifted"
          >
            <span>Submit a Creative Proposal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
