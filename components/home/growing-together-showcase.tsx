'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  COMMUNITY_DESCRIPTION_PARAGRAPHS,
  COMMUNITY_WELCOME_CATEGORIES,
} from '@/lib/home-pillars';
import {
  ArrowRight,
  Briefcase,
  Clapperboard,
  Heart,
  Home,
  Mountain,
  Sparkles,
  Store,
  Trees,
  Users,
} from 'lucide-react';

function getCategoryIcon(id: string) {
  const iconClass = 'w-4 h-4 text-[#C55B23] shrink-0';
  switch (id) {
    case 'entrepreneurs-startups':
      return <Briefcase className={iconClass} />;
    case 'local-businesses-artisans':
      return <Store className={iconClass} />;
    case 'village-initiatives':
      return <Mountain className={iconClass} />;
    case 'creators-filmmakers':
      return <Clapperboard className={iconClass} />;
    case 'property-experience-partners':
      return <Home className={iconClass} />;
    default:
      return <Users className={iconClass} />;
  }
}

export function GrowingTogetherShowcase() {
  return (
    <div className="space-y-8 sm:space-y-10" data-testid="growing-together-showcase">
      {/* Pillar Header: Highlighted "Growing Together" */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D9CCB8]/80 pb-3.5 sm:pb-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#2C4639] text-[#FAF4E8] border-l-4 border-[#C55B23] shadow-[0_6px_18px_rgba(31,51,42,0.14)] font-serif text-[17px] sm:text-xl md:text-2xl font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-[#FDE2A8] ring-2 ring-[#C55B23]/60 shrink-0" />
            Growing Together
          </span>
          <h2 className="font-serif text-[22px] sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-[#1F332A] tracking-tight leading-[1.15] sm:leading-tight">
            People, Purpose &amp; Karmayog in the Himalayas
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/community/join"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F332A] hover:bg-[#C55B23] text-[#FFFDF9] text-xs font-semibold transition-colors shadow-2xs no-underline"
          >
            <Heart className="w-3.5 h-3.5 text-[#FDE2A8]" />
            <span>Join Our Mission</span>
          </Link>
          <Link
            href="/community"
            className="text-xs sm:text-sm font-semibold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
          >
            Explore Community &rarr;
          </Link>
        </div>
      </div>

      {/* Editorial Description + Visual Plate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left: 4-Paragraph Karmayog & Community Narrative */}
        <div className="lg:col-span-7 rounded-[24px] bg-[#FFFDF9] border border-[#D9CCB8] p-6 sm:p-8 flex flex-col justify-between space-y-5 shadow-[0_8px_22px_rgba(24,36,29,0.05)]">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C55B23]">
              <Sparkles className="w-3.5 h-3.5" />
              Philosophy of Karmayog
            </span>

            <div className="space-y-3.5">
              {COMMUNITY_DESCRIPTION_PARAGRAPHS.map((paragraph, index) => {
                const isClosingLine = index === COMMUNITY_DESCRIPTION_PARAGRAPHS.length - 1;
                return (
                  <p
                    key={index}
                    className={
                      isClosingLine
                        ? 'font-serif text-lg sm:text-xl font-bold italic text-[#1F332A] pt-1'
                        : 'text-xs sm:text-[14px] text-[#3F3A32] leading-relaxed'
                    }
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Highlighted Callout: Uttarkunth as a Living Village Initiative */}
          <div
            data-testid="uttarkunth-village-initiative-callout"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF6EE] via-[#F5EFE2] to-[#EBF1EA] border border-[#C55B23]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#C55B23]">
                <Mountain className="w-3.5 h-3.5" />
                Village Initiative Spotlight
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1F332A]">
                Uttarkunth — Born as a Village Initiative in Jari, Parvati Valley
              </h3>
              <p className="text-xs text-[#4A443B] leading-relaxed">
                Uttarkunth itself is a village-born initiative proving how a mountain hamlet can
                connect authentic homestays, local makers, documentary storytelling, and youth
                livelihoods.
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1F332A] hover:bg-[#C55B23] text-[#FFFDF9] text-xs font-semibold transition-colors shrink-0 no-underline self-start sm:self-center"
            >
              <span>Our Story</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Community Cover Image Plate */}
        <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[360px] rounded-[24px] overflow-hidden bg-[#1F332A] border border-[#D9CCB8] shadow-[0_12px_32px_rgba(24,36,29,0.12)] flex flex-col justify-end p-6 sm:p-8 text-[#FFFDF9]">
          <Image
            src="/assets/community-home-page.webp"
            alt="Growing Together — Uttarkunth Himalayan Community & Village Collaboration"
            fill
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131F19]/92 via-[#131F19]/35 to-black/20" />

          <div className="relative z-10 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F332A]/85 border border-white/15 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#FDE2A8]">
              <Trees className="w-3.5 h-3.5 text-[#C55B23]" />
              <span>Jari &middot; Parvati &amp; Kullu Valleys</span>
            </div>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF9] leading-snug">
              &ldquo;When mountain youth and village families lead, conservation and livelihood move
              together.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 6 Participation Categories Grid: Category | What it welcomes */}
      <div className="pt-6 border-t border-[#D5C8B3]/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
              Open Collaboration Pathways
            </span>
            <h3 className="font-serif text-[20px] sm:text-2xl md:text-[28px] font-bold text-[#1F332A] leading-tight">
              Who We Welcome &amp; Collaborate With
            </h3>
          </div>
          <span className="text-xs text-[#5C5549] font-medium">
            6 Pathways for Individuals, Teams, Villages &amp; Emerging Startups
          </span>
        </div>

        <div
          data-testid="community-welcome-categories-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {COMMUNITY_WELCOME_CATEGORIES.map((item) => {
            const isVillageInitiative = item.id === 'village-initiatives';
            return (
              <Link
                key={item.id}
                href={item.href}
                data-testid={`community-category-${item.id}`}
                className={`group rounded-[22px] p-5 border transition-all duration-300 flex flex-col justify-between space-y-3.5 no-underline text-inherit ${
                  isVillageInitiative
                    ? 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#EBF2EA] border-[#C55B23]/55 shadow-[0_10px_24px_rgba(197,91,35,0.10)]'
                    : 'bg-[#FFFDF9] border-[#D9CCB8] hover:border-[#1F332A]/45 shadow-[0_6px_18px_rgba(24,36,29,0.05)] hover:shadow-[0_12px_26px_rgba(24,36,29,0.10)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#1F332A]/8 border border-[#1F332A]/15 flex items-center justify-center">
                      {getCategoryIcon(item.id)}
                    </div>
                    {item.highlightBadge && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#1F332A] text-[#FDE2A8] text-[10px] font-bold tracking-wide">
                        {item.highlightBadge}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5549] block">
                      Category
                    </span>
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-[#1F332A] group-hover:text-[#C55B23] transition-colors leading-snug">
                      {item.category}
                    </h4>
                  </div>

                  <div className="pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
                      What it welcomes
                    </span>
                    <p className="text-xs sm:text-[13.5px] font-semibold text-[#2E2A24] mt-0.5">
                      {item.welcomes}
                    </p>
                  </div>

                  {item.highlightNote && (
                    <p className="text-[11.5px] text-[#3F3A32] bg-[#FFFDF9]/90 border border-[#D9CCB8] rounded-xl p-2.5 leading-relaxed">
                      {item.highlightNote}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-[#E5DEC9] flex items-center justify-between text-xs font-bold text-[#1F332A] group-hover:text-[#C55B23] transition-colors">
                  <span>Connect &amp; Participate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* WANT TO BE A PART OF UTTARKUNTH COMMUNITY? — COMMUNITY CTA */}
      <div
        data-testid="community-want-to-be-part-cta"
        className="rounded-[24px] bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#1F332A] text-[#FFFDF9] p-6 sm:p-8 border border-[#C55B23]/40 shadow-[0_14px_34px_rgba(24,36,29,0.16)] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FFFDF9] leading-tight">
            Want to Be a Part of Uttarkunth Community?
          </h3>
          <p className="text-xs sm:text-sm text-[#FAF4E8]/85 leading-relaxed">
            Whether you are an entrepreneur, local artisan, village initiative, filmmaker, homestay
            partner, or contributor—collaborate with Uttarkunth to build responsible livelihoods and
            lasting value for Himalayan people and places.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/community/join"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#C55B23] hover:bg-[#AD4D1B] text-[#FFFDF9] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm no-underline"
          >
            <Heart className="w-4 h-4" />
            <span>Join Our Mission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-[#FFFDF9] border border-white/20 text-xs font-semibold transition-colors no-underline"
          >
            <span>Explore Community</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


