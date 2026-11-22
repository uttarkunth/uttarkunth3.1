'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Destination } from '@/lib/destinations';

interface RegionalDestinationsSliderProps {
  regionTitle: string;
  destinations: Destination[];
}

function getSingleDestinationName(dest: Destination): string {
  const slug = (dest.slug || '').toLowerCase().trim();
  const name = (dest.name || '').trim();
  const lowerName = name.toLowerCase();

  if (
    slug === 'kullu-jari' ||
    slug === 'kullu-and-jari' ||
    slug === 'jari' ||
    lowerName === 'kullu and jari' ||
    lowerName === 'kullu jari' ||
    lowerName === 'jari'
  ) {
    return 'Kullu Jari';
  }
  if (slug === 'kasol' || slug === 'kasol-and-parvati-valley' || lowerName.startsWith('kasol')) {
    return 'Kasol';
  }
  if (slug === 'jibhi' || slug === 'jibhi-and-tirthan-valley' || lowerName.startsWith('jibhi')) {
    return 'Jibhi';
  }
  if (
    slug === 'dharamshala' ||
    slug === 'dharamshala-and-mcleod-ganj' ||
    lowerName.startsWith('dharamshala')
  ) {
    return 'Dharamshala';
  }
  if (
    slug === 'dalhousie' ||
    slug === 'dalhousie-and-khajjiar' ||
    lowerName.startsWith('dalhousie')
  ) {
    return 'Dalhousie';
  }
  return name;
}

function getDestinationCardImage(dest: Destination): string | undefined {
  if (dest.image) return dest.image;
  const slug = (dest.slug || '').toLowerCase().trim();
  if (slug === 'manali') return '/assets/destinations/manali-card.webp';
  if (slug === 'kasol' || slug === 'kasol-and-parvati-valley') {
    return '/assets/destinations/kasol-card.webp';
  }
  if (slug === 'kullu-jari' || slug === 'kullu-and-jari' || slug === 'jari') {
    return '/assets/destinations/jari-card.webp';
  }
  if (slug === 'jibhi' || slug === 'jibhi-and-tirthan-valley') {
    return '/assets/destinations/jibhi-card.webp';
  }
  if (slug === 'shimla') {
    return '/assets/destinations/shimla-card.webp';
  }
  if (slug === 'dharamshala' || slug === 'dharamshala-and-mcleod-ganj') {
    return '/assets/destinations/dharamshala-card.webp';
  }
  if (slug === 'bir-billing' || slug === 'bir') {
    return '/assets/destinations/bir-billing-card.webp';
  }
  if (slug === 'spiti-valley' || slug === 'spiti') {
    return '/assets/destinations/spiti-valley-card.webp';
  }
  if (slug === 'dalhousie' || slug === 'dalhousie-and-khajjiar') {
    return '/assets/destinations/dalhousie-card.webp';
  }
  if (slug === 'kinnaur') {
    return '/assets/destinations/kinnaur-card.webp';
  }
  if (slug === 'lahaul') {
    return '/assets/destinations/lahaul-card.webp';
  }
  if (slug === 'solang' || slug === 'solang-valley') {
    return '/assets/destinations/solang-card.webp';
  }
  if (slug === 'chamba') {
    return '/assets/destinations/chamba-card.webp';
  }
  if (slug === 'mandi') {
    return '/assets/destinations/mandi-card.webp';
  }
  if (slug === 'srinagar') {
    return '/assets/destinations/srinagar-card.webp';
  }
  if (slug === 'gulmarg') {
    return '/assets/destinations/gulmarg-card.webp';
  }
  if (slug === 'pahalgam') {
    return '/assets/destinations/pahalgam-card.webp';
  }
  if (slug === 'sonamarg' || slug === 'sonmarg') {
    return '/assets/destinations/sonamarg-card.webp';
  }
  if (slug === 'jammu') {
    return '/assets/destinations/jammu-card.webp';
  }
  if (slug === 'rishikesh') {
    return '/assets/destinations/rishikesh-card.webp';
  }
  if (slug === 'mussoorie' || slug === 'musoorie') {
    return '/assets/destinations/mussoorie-card.webp';
  }
  if (slug === 'nainital') {
    return '/assets/destinations/nainital-card.webp';
  }
  if (slug === 'auli') {
    return '/assets/destinations/auli-card.webp';
  }
  if (slug === 'chopta') {
    return '/assets/destinations/chopta-card.webp';
  }
  if (slug === 'mukteshwar') {
    return '/assets/destinations/mukteshwar-card.webp';
  }
  return undefined;
}

export function RegionalDestinationsSlider({
  regionTitle,
  destinations,
}: RegionalDestinationsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleDestinations = (destinations || []).filter((d) => {
    const slug = (d.slug || '').toLowerCase().trim();
    const name = (d.name || '').toLowerCase().trim();
    return (
      slug !== 'kullu' &&
      name !== 'kullu' &&
      slug !== 'jim-corbett' &&
      slug !== 'corbett' &&
      name !== 'jim corbett'
    );
  });

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -360 : 360;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (visibleDestinations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Regional Header + Horizontal Slide Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-[#D9CCB8]/80 pb-2.5 sm:pb-3">
        <h3 className="font-serif text-[21px] sm:text-2xl lg:text-[26px] font-medium text-[#1F332A] tracking-tight">
          {regionTitle}
        </h3>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label={`Slide ${regionTitle} destinations left`}
            className="w-8 h-8 rounded-full bg-[#EAE2D3]/85 hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label={`Slide ${regionTitle} destinations right`}
            className="w-8 h-8 rounded-full bg-[#EAE2D3]/85 hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontally Slidable Track of Small, Simple, Photo-Ready Destination Cards */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1"
      >
        {visibleDestinations.map((d) => {
          const displayName = getSingleDestinationName(d);
          const cardImage = getDestinationCardImage(d);

          return (
            <Link
              key={d.id}
              href={`/stays/destinations/${d.slug}`}
              data-testid={`stays-destination-card-${d.slug}`}
              aria-label={displayName}
              className="group relative w-[132px] sm:w-[152px] lg:w-[166px] h-[160px] sm:h-[182px] lg:h-[196px] shrink-0 snap-start rounded-[20px] overflow-hidden border border-[#D5C8B3]/90 hover:border-[#C55B23] bg-[#FFFDF9] shadow-[0_8px_22px_-10px_rgba(31,51,42,0.16)] hover:shadow-[0_14px_28px_-10px_rgba(31,51,42,0.24)] transition-all duration-300 flex flex-col justify-end select-none no-underline"
            >
              {/* Photo Slot (renders destination WebP photo when added, or clean Himalayan slate-and-mist canvas ready for photo) */}
              {cardImage ? (
                <Image
                  src={cardImage}
                  alt={displayName}
                  fill
                  sizes="(max-width: 640px) 136px, 168px"
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(165deg,#FBF7EE_0%,#EFE6D5_52%,#E2D6C1_100%)] group-hover:bg-[linear-gradient(165deg,#FFFDF9_0%,#F3EAD8_52%,#E6D8C0_100%)] transition-colors duration-300"
                >
                  {/* Subtle Himalayan Ridge Watermark Inside Photo Area */}
                  <svg
                    viewBox="0 0 240 160"
                    preserveAspectRatio="none"
                    className="absolute inset-x-0 bottom-9 w-full h-20 opacity-[0.22] group-hover:opacity-[0.32] transition-opacity duration-300"
                  >
                    <path
                      d="M0,120 L48,68 L88,98 L142,42 L192,94 L240,58 L240,160 L0,160 Z"
                      fill="#263D32"
                    />
                    <path
                      d="M0,136 C56,108 110,128 168,102 C202,88 222,104 240,112 L240,160 L0,160 Z"
                      fill="#C55B23"
                      fillOpacity="0.55"
                    />
                  </svg>
                </div>
              )}

              {/* Bottom Dark Fade Scrim for Clear Destination Name Legibility Over Bright / White Photos */}
              <div
                aria-hidden="true"
                className={
                  cardImage
                    ? 'pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(10,18,14,0.92)_0%,rgba(10,18,14,0.72)_38%,rgba(10,18,14,0.32)_70%,rgba(10,18,14,0)_100%)]'
                    : 'pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FFFDF9]/95 via-[#FFFDF9]/80 to-transparent'
                }
              />

              {/* ONLY Single Destination Name at Bottom with Larger Cormorant Garamond Typography */}
              <div className="relative z-10 w-full px-2.5 pb-3 pt-2 text-center">
                <h4
                  className={`font-serif text-[18px] sm:text-[20px] lg:text-[21px] font-medium leading-tight tracking-tight transition-colors duration-200 line-clamp-1 ${
                    cardImage
                      ? 'text-[#FFFDF9] group-hover:text-[#FDE2A8] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]'
                      : 'text-[#1F332A] group-hover:text-[#C55B23]'
                  }`}
                >
                  {displayName}
                </h4>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
