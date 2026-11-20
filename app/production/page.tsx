'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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

export default function ProductionPage() {
  return (
    <div className="space-y-16 py-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. HEADER */}
      <section className="max-w-4xl mx-auto text-center space-y-4 pt-4">
        <h1 className="font-serif text-4xl sm:text-6xl font-medium text-forest leading-tight">
          Himalayan Visual Storytelling &amp; Cinema
        </h1>
        <p className="font-sans font-normal text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Documentaries, indigenous monologues, and temple folklore recorded across high-altitude hamlets. Authentic creative cinema without fictionalization.
        </p>
      </section>

      {/* 2. WATCH UTTARKUNTH ORIGINALS — COMING SOON */}
      <section className="space-y-8" data-testid="productions-coming-soon">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <h2 className="font-serif text-3xl font-medium text-forest mt-1">
              Watch Uttarkunth Originals
            </h2>
          </div>
        </div>

        <div className="py-10 sm:py-16 text-center">
          <p className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium text-[#1F332A] tracking-tight inline-flex items-baseline justify-center">
            <span>Coming Soon</span>
            <span aria-hidden="true" className="inline-flex items-baseline ml-1 text-[#C55B23]">
              <span className="coming-soon-dot" style={{ animationDelay: '0ms' }}>.</span>
              <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '220ms' }}>.</span>
              <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '440ms' }}>.</span>
              <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '660ms' }}>.</span>
            </span>
          </p>
        </div>
      </section>

      {/* 3. CREATOR COLLABORATION DESK */}
      <section className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 text-center space-y-4 shadow-lifted">
        <span className="font-sans text-xs uppercase tracking-widest text-ukorange font-semibold block">
          Creative Collaboration
        </span>
        <h2 className="font-serif text-3xl sm:text-4xl font-medium">
          Filmmaker &amp; Creator Submission Desk
        </h2>
        <p className="font-sans font-normal text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed">
          Are you an independent documentary filmmaker, ethnographer, or mountain storyteller? Submit your pitch, treatment, or completed work for curation on Uttarkunth.
        </p>
        <div className="pt-2">
          <Link
            href="/production/collaborate"
            className="font-sans inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-7 py-3 rounded-full font-semibold text-xs transition-all shadow-lifted"
          >
            <span>Submit a Creative Proposal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

