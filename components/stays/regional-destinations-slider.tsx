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

  if (slug === 'kullu-jari' || slug === 'kullu-and-jari' || lowerName === 'kullu and jari') {
    return 'Jari';
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
  return undefined;
}

export function RegionalDestinationsSlider({
  regionTitle,
  destinations,
}: RegionalDestinationsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -360 : 360;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!destinations || destinations.length === 0) {
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
        {destinations.map((d) => {
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

              {/* Bottom Gradient Scrim for Destination Name Legibility */}
              <div
                aria-hidden="true"
                className={
                  cardImage
                    ? 'pointer-events-none absolute inset-x-0 bottom-0 h-22 bg-gradient-to-t from-[#121E18]/92 via-[#121E18]/50 to-transparent'
                    : 'pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FFFDF9]/95 via-[#FFFDF9]/82 to-transparent'
                }
              />

              {/* ONLY Single Destination Name at Bottom with Larger Cormorant Garamond Typography */}
              <div className="relative z-10 w-full px-2.5 pb-3 pt-2 text-center">
                <h4
                  className={`font-serif text-[18px] sm:text-[20px] lg:text-[21px] font-medium leading-tight tracking-tight transition-colors duration-200 line-clamp-1 ${
                    cardImage
                      ? 'text-[#FFFDF9] group-hover:text-[#FDE2A8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
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
