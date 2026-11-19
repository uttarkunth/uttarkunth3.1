'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clapperboard,
} from 'lucide-react';

export interface ProductionItemData {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  videoSrc: string;
  youtubeUrl: string;
}

export function StoriesFromMountainsShowcase({
  productions: _productions,
}: {
  productions: readonly ProductionItemData[] | ProductionItemData[];
}) {
  return (
    <div className="space-y-8 sm:space-y-10" data-testid="stories-from-mountains-showcase">
      {/* Pillar Header: Highlighted "Stories From the Mountains" + Section 1 "Featured Stories" */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D9CCB8]/80 pb-3.5 sm:pb-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#2C4639] text-[#FAF4E8] border-l-4 border-[#C55B23] shadow-[0_6px_18px_rgba(31,51,42,0.14)] font-serif text-[17px] sm:text-xl md:text-2xl font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#FDE2A8] ring-2 ring-[#C55B23]/60 shrink-0" />
            Stories From the Mountains
          </span>
          <div className="space-y-0.5">
            <h2 className="font-serif text-[22px] sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-[#1F332A] tracking-tight leading-[1.15] sm:leading-tight">
              Featured Stories
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5549] font-medium">
              Independent mountain films, cultural archives, and visual storytelling
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/production"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F332A] hover:bg-[#C55B23] text-[#FFFDF9] text-xs font-semibold transition-colors shadow-2xs no-underline"
          >
            <span>Open Screening Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION 1: FEATURED STORIES — Coming Soon */}
      <div
        data-testid="productions-featured-stories"
        className="py-5 sm:py-8 text-center"
      >
        <p className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold text-[#1F332A] tracking-tight inline-flex items-baseline justify-center">
          <span>Coming Soon</span>
          <span aria-hidden="true" className="inline-flex items-baseline ml-1 text-[#C55B23]">
            <span className="coming-soon-dot" style={{ animationDelay: '0ms' }}>.</span>
            <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '220ms' }}>.</span>
            <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '440ms' }}>.</span>
            <span className="coming-soon-dot ml-0.5" style={{ animationDelay: '660ms' }}>.</span>
          </span>
        </p>
      </div>

      {/* HAVE A STORY TO TELL? — COLLABORATION CTA */}
      <div
        data-testid="productions-have-a-story-cta"
        className="rounded-[24px] bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#1F332A] text-[#FFFDF9] p-6 sm:p-8 border border-[#C55B23]/40 shadow-[0_14px_34px_rgba(24,36,29,0.16)] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF9] leading-tight">
            Have a Story to Tell?
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF4E8]/85 leading-relaxed">
            Whether it is an untold village legend, an artisan lineage, an ecological shift, or an
            independent mountain documentary—partner with Uttarkunth Productions to bring authentic
            Himalayan stories to light.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/production/collaborate"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#C55B23] hover:bg-[#AD4D1B] text-[#FFFDF9] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm no-underline"
          >
            <Clapperboard className="w-4 h-4" />
            <span>Pitch or Collaborate With Us</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/production"
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-[#FFFDF9] border border-white/20 text-xs font-semibold transition-colors no-underline"
          >
            <span>Explore Productions</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


