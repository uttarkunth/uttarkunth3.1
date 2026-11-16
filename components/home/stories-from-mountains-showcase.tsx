'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Clapperboard,
  Compass,
  Film,
  Mic,
  Play,
  Sparkles,
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

const COLLABORATION_TRACKS = [
  {
    id: 'documentary-filmmakers',
    role: 'Independent Filmmakers & Directors',
    title: 'Ethnographic & Mountain Cinema',
    description:
      'Co-produce field documentaries exploring living Himalayan traditions, ecology, and high-altitude village transitions.',
    icon: Camera,
  },
  {
    id: 'oral-historians',
    role: 'Oral Historians & Writers',
    title: 'Folklore & Dialect Preservation',
    description:
      'Record ancestral verses, temple lore, and spoken histories with village elders across Kullu, Parvati, Spiti, and Kumaon.',
    icon: Mic,
  },
  {
    id: 'visual-storytellers',
    role: 'Cinematographers & Sound Artists',
    title: 'Field Archives & Visual Essays',
    description:
      'Capture authentic acoustic landscapes, seasonal harvests, and artisan craft processes across Himalayan corridors.',
    icon: Compass,
  },
];

export function StoriesFromMountainsShowcase({
  productions,
}: {
  productions: readonly ProductionItemData[] | ProductionItemData[];
}) {
  const leadStory = productions[0];

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
            href="/production/collaborate"
            className="text-xs font-semibold text-[#5C5549] hover:text-[#1F332A] transition-colors no-underline"
          >
            Pitch a Documentary &rarr;
          </Link>
          <Link
            href="/production"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F332A] hover:bg-[#C55B23] text-[#FFFDF9] text-xs font-semibold transition-colors shadow-2xs no-underline"
          >
            <span>Open Screening Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION 1: FEATURED STORIES — Cinematic Spotlight */}
      <div
        data-testid="productions-featured-stories"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* Left Visual Cover Anchor */}
        <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[340px] rounded-[24px] overflow-hidden bg-[#1F332A] border border-[#D9CCB8] shadow-[0_12px_32px_rgba(24,36,29,0.14)] flex flex-col justify-between p-6 sm:p-8 text-[#FFFDF9]">
          <Image
            src="/assets/productions-home.webp"
            alt="Stories From the Mountains — Uttarkunth Featured Documentary Cover"
            fill
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover object-center opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131F19]/95 via-[#131F19]/45 to-black/25" />

          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F332A]/85 backdrop-blur-md border border-white/15 text-[11px] font-bold uppercase tracking-wider text-[#FDE2A8]">
              <Clapperboard className="w-3.5 h-3.5 text-[#C55B23]" />
              Featured Mountain Dispatch
            </span>
            {leadStory && (
              <span className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-[10.5px] font-semibold uppercase tracking-wider text-[#FAF4E8]">
                {leadStory.category}
              </span>
            )}
          </div>

          <div className="relative z-10 space-y-3 pt-10 max-w-xl">
            <span className="text-xs font-serif italic text-[#FDE2A8] block">
              Ethnographic &amp; Cultural Storytelling
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFFDF9] leading-tight">
              {leadStory
                ? `${leadStory.title}: Living Deity & Oracle Traditions of Kullu Valley`
                : 'Documenting the Deities, Oral Traditions, and Transitions of the Himalayas'}
            </h3>
            <p className="text-xs sm:text-sm text-[#FAF4E8]/90 leading-relaxed">
              {leadStory?.description ||
                'Recorded on location across sacred Himalayan hamlets with community elders and local storytellers.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <Link
                href={leadStory ? `/production/${leadStory.slug}` : '/production'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C55B23] hover:bg-[#AD4D1B] text-[#FFFDF9] text-xs font-semibold transition-colors no-underline shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Watch Featured Story</span>
              </Link>
              <Link
                href="/production"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FDE2A8] hover:text-white transition-colors no-underline"
              >
                <span>Browse Archive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Editorial Story Context */}
        <div className="lg:col-span-5 rounded-[24px] bg-[#FFFDF9] border border-[#D9CCB8] p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-[0_8px_22px_rgba(24,36,29,0.06)]">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
              Why We Document
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F332A] leading-snug">
              Stories Rooted in Place, Not Staged for Spectacle
            </h3>
            <p className="text-xs sm:text-[13.5px] text-[#3F3A32] leading-relaxed">
              Every Uttarkunth film begins with listening—sitting beside village elders, temple
              musicians, shepherds, and youth to record the living pulse of Himalayan valleys with
              honesty and respect.
            </p>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[#E5DEC9]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1F332A]">Primary Field Region</span>
              <span className="text-[#5C5549]">Kullu &amp; Parvati Valley, Himachal</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1F332A]">Format</span>
              <span className="text-[#5C5549]">Documentaries &amp; Cultural Monologues</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1F332A]">Access</span>
              <span className="text-[#C55B23] font-semibold">Open Community Screening Room</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: UTTARKUNTH ORIGINALS */}
      <div
        data-testid="productions-uttarkunth-originals"
        className="pt-6 border-t border-[#D5C8B3]/70 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
              In-House Archive
            </span>
            <h3 className="font-serif text-[20px] sm:text-2xl md:text-[28px] font-bold text-[#1F332A] leading-tight">
              Uttarkunth Originals
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5549] font-medium">
              Original documentaries and cultural monologues produced by Uttarkunth
            </p>
          </div>
          <Link
            href="/production"
            className="text-xs font-semibold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
          >
            View all originals &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {productions.map((film, idx) => (
            <article
              key={film.id}
              className="group bg-[#FFFDF9] rounded-[22px] border border-[#D9CCB8] hover:border-[#1F332A]/45 shadow-[0_8px_22px_rgba(24,36,29,0.06)] hover:shadow-[0_14px_30px_rgba(24,36,29,0.12)] transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="px-5 py-2.5 bg-[#1F332A] text-[#FAF4E8] flex items-center justify-between gap-2 text-[10.5px]">
                  <span className="font-mono font-bold text-[#FDE2A8]">
                    ORIGINAL 0{idx + 1} &middot; {film.category.toUpperCase()}
                  </span>
                  <span className="text-[#FAF4E8]/75 uppercase tracking-wider font-semibold">
                    Uttarkunth Original
                  </span>
                </div>

                <div className="p-5 sm:p-6 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#C55B23] font-semibold">
                      <Film className="w-3.5 h-3.5" />
                      <span>Kullu &amp; Parvati Valley Cultural Archive</span>
                    </div>
                    <Link href={`/production/${film.slug}`} className="no-underline block">
                      <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#1F332A] group-hover:text-[#C55B23] transition-colors">
                        {film.title}
                      </h4>
                    </Link>
                    <p className="text-xs sm:text-[13px] text-[#3F3A32] leading-relaxed">
                      {film.description}
                    </p>
                  </div>

                  <Link
                    href={`/production/${film.slug}`}
                    aria-label={`Watch ${film.title} in Screening Room`}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1F332A] group-hover:bg-[#C55B23] text-[#FFFDF9] flex items-center justify-center shrink-0 transition-colors shadow-xs"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </Link>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-3 border-t border-[#E5DEC9] bg-[#FAF6EE]/70 flex items-center justify-between gap-3 text-xs">
                <Link
                  href={`/production/${film.slug}`}
                  className="inline-flex items-center gap-1.5 font-bold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
                >
                  <span>Enter Screening Room</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C55B23]" />
                </Link>
                <a
                  href={film.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#5C5549] hover:text-[#C55B23] transition-colors no-underline"
                >
                  <span>YouTube</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* SECTION 3: CREATORS COLLABORATIONS */}
      <div
        data-testid="productions-creators-collaborations"
        className="pt-6 border-t border-[#D5C8B3]/70 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#C55B23] block">
              Collective Storytelling
            </span>
            <h3 className="font-serif text-[20px] sm:text-2xl md:text-[28px] font-bold text-[#1F332A] leading-tight">
              Creators Collaborations
            </h3>
            <p className="text-xs sm:text-sm text-[#5C5549] font-medium">
              Co-creations with regional filmmakers, folklorists, writers, and visual artists
            </p>
          </div>
          <Link
            href="/production/collaborate"
            className="text-xs font-semibold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
          >
            Join as a Creator &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {COLLABORATION_TRACKS.map((track) => {
            const IconComponent = track.icon;
            return (
              <div
                key={track.id}
                className="rounded-[20px] bg-[#FFFDF9] border border-[#D9CCB8] p-5 space-y-2.5 shadow-[0_6px_16px_rgba(24,36,29,0.04)] flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1F332A]/8 border border-[#1F332A]/15 flex items-center justify-center text-[#C55B23]">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#C55B23] block">
                    {track.role}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-[#1F332A] leading-snug">
                    {track.title}
                  </h4>
                  <p className="text-xs text-[#4A443B] leading-relaxed">{track.description}</p>
                </div>

                <div className="pt-2 border-t border-[#E5DEC9]">
                  <Link
                    href="/production/collaborate"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1F332A] hover:text-[#C55B23] transition-colors no-underline"
                  >
                    <span>Collaborate on this track</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: HAVE A STORY TO TELL? — COLLABORATION CTA */}
      <div
        data-testid="productions-have-a-story-cta"
        className="rounded-[24px] bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#1F332A] text-[#FFFDF9] p-6 sm:p-8 border border-[#C55B23]/40 shadow-[0_14px_34px_rgba(24,36,29,0.16)] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDE2A8]">
            <Sparkles className="w-3.5 h-3.5 text-[#C55B23]" />
            Collaboration CTA
          </span>
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
