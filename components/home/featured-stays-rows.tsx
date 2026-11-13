'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PropertyImage } from '@/components/property-image';
import { getPropertyPhotoList } from '@/lib/property-images';
import { groupPropertiesByLocation, type StayLocationGroup } from '@/lib/stays-grouping';
import { formatINR } from '@/lib/utils';
import {
  FAVOURITES_UPDATED_EVENT,
  isEcosystemItemSaved,
  toggleSavedEcosystemItem,
} from '@/lib/favourites';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Image as ImageIcon, Star } from 'lucide-react';

function StayRowCard({ property }: { property: any }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const photos = getPropertyPhotoList(property.cover_photo, property.photos).slice(0, 5);

  const lowestPrice =
    Array.isArray(property.rooms) && property.rooms.length > 0
      ? Math.min(...property.rooms.map((r: any) => Number(r.base_price) || 900))
      : 900;

  const twoNightPrice = lowestPrice * 2;
  const locality = property.village || property.district || 'Jari';

  useEffect(() => {
    const syncSaved = () => {
      setIsSaved(isEcosystemItemSaved('stays', property.slug || property.id));
    };
    syncSaved();
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
    return () => window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
  }, [property.id, property.slug]);

  return (
    <Link
      href={`/stays/${property.slug}`}
      className="group w-[calc(50%-7px)] min-w-[154px] max-w-[200px] sm:w-[224px] sm:max-w-none md:w-[236px] lg:w-[246px] shrink-0 snap-start flex flex-col cursor-pointer text-inherit no-underline select-none"
    >
      {/* Square-ish Rounded Image Frame matching Reference UI */}
      <div
        className="relative aspect-[20/19] w-full rounded-[20px] overflow-hidden bg-[#1F332A] shadow-[0_6px_18px_rgba(24,36,29,0.09)] group-hover:shadow-[0_12px_26px_rgba(24,36,29,0.15)] transition-all duration-300"
        onMouseLeave={() => setPhotoIndex(0)}
      >
        {photos.length > 0 ? (
          <PropertyImage
            src={photos[photoIndex] || photos[0]}
            alt={`${property.name} in ${locality}`}
            fill
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 240px, 260px"
            transformWidth={520}
            transformHeight={494}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#1F332A] text-[#FAF6EE]/70">
            <ImageIcon className="w-7 h-7" />
            <span className="text-[11px] font-medium">Photos coming soon</span>
          </div>
        )}

        {/* Subtle Top Scrim for Badge & Heart Contrast */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/25 to-transparent"
        />

        {/* Desktop Hover Photo Scrubber Zones */}
        {photos.length > 1 && (
          <div className="hidden sm:flex absolute inset-0 z-10">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-full"
                onMouseEnter={() => setPhotoIndex(idx)}
              />
            ))}
          </div>
        )}

        {/* Top-Left "Guest favourite" Pill Badge */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 pointer-events-none">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FFFDF9]/92 backdrop-blur-md text-[#1F332A] text-[10px] sm:text-[11px] font-semibold tracking-tight shadow-[0_2px_8px_rgba(0,0,0,0.14)]">
            Guest favourite
          </span>
        </div>

        {/* Top-Right Wishlist Heart Button */}
        <button
          suppressHydrationWarning
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const result = toggleSavedEcosystemItem({
              id: property.slug || property.id,
              category: 'stays',
              title: property.name,
              subtitle: `${property.village || 'Jari'}, ${property.district || 'Kullu'}`,
              href: `/stays/${property.slug}`,
              meta: `${formatINR(lowestPrice)} / night`,
            });
            setIsSaved(result.saved);
          }}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90 hover:scale-110"
          aria-label={`Save ${property.name}`}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] ${
              isSaved
                ? 'fill-[#C55B23] text-[#C55B23]'
                : 'fill-black/35 text-white stroke-[2]'
            }`}
          />
        </button>

        {/* Subtle Bottom Dots Indicator when multiple photos exist */}
        {photos.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={` rounded-full transition-all duration-200 ${
                  idx === photoIndex
                    ? 'w-1.5 h-1.5 bg-white shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/55'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compact 2-Line Metadata Below Image (Matching Reference UI/UX) */}
      <div className="pt-2.5 px-0.5 space-y-0.5">
        <h3 className="font-sans text-[13.5px] sm:text-[15px] font-semibold text-[#1F332A] group-hover:text-[#C55B23] transition-colors leading-snug line-clamp-1">
          {property.name} in {locality}
        </h3>
        <p className="text-[12px] sm:text-[13px] text-[#5C5549] font-normal flex items-center gap-1 tabular-nums">
          <span>{formatINR(twoNightPrice)} for 2 nights</span>
          <span aria-hidden="true">&middot;</span>
          <span className="inline-flex items-center gap-0.5 text-[#1F332A] font-medium">
            <Star className="w-3 h-3 fill-current text-[#1F332A]" />
            <span>5.0</span>
          </span>
        </p>
      </div>
    </Link>
  );
}

function SeeAllStaysCard({ group }: { group: StayLocationGroup }) {
  // Prepare 3 photos for the stacked Polaroid collage inside "See all"
  const rawPhotos = group.collagePhotos;
  const p1 = rawPhotos[0] || '/assets/stays-card.webp';
  const p2 = rawPhotos[1] || rawPhotos[0] || '/assets/stays-card.webp';
  const p3 = rawPhotos[2] || rawPhotos[1] || rawPhotos[0] || '/assets/stays-card.webp';

  return (
    <Link
      href={group.href}
      aria-label={`See all ${group.title}`}
      className="group w-[calc(50%-7px)] min-w-[154px] max-w-[200px] sm:w-[224px] sm:max-w-none md:w-[236px] lg:w-[246px] shrink-0 snap-start flex flex-col cursor-pointer text-inherit no-underline select-none"
    >
      <div className="relative aspect-[20/19] w-full rounded-[20px] bg-[#FAF6EE]/95 group-hover:bg-[#FFFDF9] border border-[#E5DEC9] group-hover:border-[#C55B23]/45 shadow-[0_6px_18px_rgba(24,36,29,0.06)] group-hover:shadow-[0_12px_26px_rgba(24,36,29,0.12)] transition-all duration-300 flex flex-col items-center justify-center p-4">
        {/* 3-Photo Stacked Polaroid Collage matching Mobile & Desktop Reference */}
        <div className="relative w-28 h-24 sm:w-32 sm:h-28 flex items-center justify-center">
          {/* Back-Top Thumbnail */}
          <div className="absolute -top-1 left-4 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-[#FFFDF9] shadow-md -rotate-6 transition-transform duration-300 group-hover:-rotate-12 group-hover:-translate-y-0.5 bg-[#1F332A]">
            <PropertyImage
              src={p2}
              alt=""
              fill
              sizes="80px"
              transformWidth={160}
              transformHeight={160}
              className="object-cover"
            />
          </div>

          {/* Back-Right Thumbnail */}
          <div className="absolute top-1.5 right-2.5 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-[#FFFDF9] shadow-md rotate-6 transition-transform duration-300 group-hover:rotate-12 group-hover:translate-x-0.5 bg-[#1F332A]">
            <PropertyImage
              src={p3}
              alt=""
              fill
              sizes="80px"
              transformWidth={160}
              transformHeight={160}
              className="object-cover"
            />
          </div>

          {/* Front-Left Hero Thumbnail */}
          <div className="relative z-10 translate-y-2 -translate-x-3 w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-xl overflow-hidden border-2 border-[#FFFDF9] shadow-[0_6px_14px_rgba(0,0,0,0.18)] -rotate-3 transition-transform duration-300 group-hover:scale-105 bg-[#1F332A]">
            <PropertyImage
              src={p1}
              alt=""
              fill
              sizes="90px"
              transformWidth={180}
              transformHeight={180}
              className="object-cover"
            />
          </div>
        </div>

        <span className="mt-2 font-sans text-[13.5px] sm:text-[15px] font-semibold text-[#1F332A] group-hover:text-[#C55B23] transition-colors">
          See all
        </span>
      </div>
    </Link>
  );
}

function LocationStaysRow({ group }: { group: StayLocationGroup }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -520 : 520;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Row Header: Location Title + Circular Arrow (Left on Desktop, Right on Mobile) + Desktop Scroll Controls */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={group.href}
          className="group/header inline-flex items-center gap-2 sm:gap-2.5 text-inherit no-underline"
        >
          <h2 className="font-serif text-xl sm:text-2xl lg:text-[28px] font-bold text-[#1F332A] group-hover/header:text-[#C55B23] tracking-tight transition-colors">
            {group.title}
          </h2>
          <span className="hidden sm:inline-flex w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EAE2D3]/90 group-hover/header:bg-[#C55B23] text-[#1F332A] group-hover/header:text-white items-center justify-center transition-colors shadow-2xs">
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </span>
        </Link>

        {/* Mobile Right Circular Arrow Button (Matching Mobile Reference Image 2) */}
        <Link
          href={group.href}
          aria-label={`Explore ${group.title}`}
          className="sm:hidden w-8 h-8 rounded-full bg-[#EAE2D3]/90 hover:bg-[#C55B23] text-[#1F332A] hover:text-white flex items-center justify-center transition-colors shadow-2xs shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Desktop Carousel Navigation Buttons (< >) + Host Link */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/stays/partner"
            className="mr-2 text-xs font-semibold text-[#5C5549] hover:text-[#1F332A] transition-colors"
          >
            Partner as a Host &rarr;
          </Link>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label={`Scroll ${group.title} left`}
            className="w-8 h-8 rounded-full bg-[#EAE2D3]/85 hover:bg-[#DFD5C3] text-[#1F332A] flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label={`Scroll ${group.title} right`}
            className="w-8 h-8 rounded-full bg-[#EAE2D3]/85 hover:bg-[#DFD5C3] text-[#1F332A] flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Track */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3.5 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-1"
      >
        {group.properties.map((property: any) => (
          <StayRowCard key={property.id || property.slug} property={property} />
        ))}
        <SeeAllStaysCard group={group} />
      </div>
    </div>
  );
}

export function FeaturedStaysRows({ properties }: { properties: any[] }) {
  const groups = groupPropertiesByLocation(properties);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {groups.map((group) => (
        <LocationStaysRow key={group.key} group={group} />
      ))}
    </div>
  );
}
