'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
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

type RegionFilter = 'all' | 'nearby' | 'Himachal Pradesh' | 'Uttarakhand' | 'Jammu & Kashmir';

export interface DestinationVisualMeta {
  shortLabel: string;
  subLabel: string;
  illustrationSrc: string;
  lat: number;
  lng: number;
}

/**
 * 27 Hand-Illustrated Uttarkunth Destination Icons:
 * • 23 extracted directly from the user's reference sheet (/public/assets/aistudio/image_1f9fb3b9.png)
 * • 4 bespoke generated icons (Dalhousie, Solang, Mandi, Lahaul) in the exact same Uttarkunth palette
 */
export const DESTINATION_VISUALS: Record<string, DestinationVisualMeta> = {
  'kullu-jari': {
    shortLabel: 'Jari',
    subLabel: 'Parvati Heartland',
    illustrationSrc: '/assets/destinations/kullu-jari.png',
    lat: 32.001,
    lng: 77.245,
  },
  manali: {
    shortLabel: 'Manali',
    subLabel: 'Hadimba & Cedars',
    illustrationSrc: '/assets/destinations/manali.png',
    lat: 32.243,
    lng: 77.189,
  },
  kasol: {
    shortLabel: 'Kasol',
    subLabel: 'Parvati Valley',
    illustrationSrc: '/assets/destinations/kasol.png',
    lat: 32.01,
    lng: 77.315,
  },
  kullu: {
    shortLabel: 'Kullu',
    subLabel: 'Valley of Gods',
    illustrationSrc: '/assets/destinations/kullu.png',
    lat: 31.9579,
    lng: 77.1095,
  },
  jibhi: {
    shortLabel: 'Jibhi & Tirthan',
    subLabel: 'Tirthan Valley',
    illustrationSrc: '/assets/destinations/jibhi.png',
    lat: 31.634,
    lng: 77.349,
  },
  shimla: {
    shortLabel: 'Shimla',
    subLabel: 'Pine Heritage Ridge',
    illustrationSrc: '/assets/destinations/shimla.png',
    lat: 31.104,
    lng: 77.173,
  },
  dharamshala: {
    shortLabel: 'Dharamshala',
    subLabel: 'Dhauladhar Crags',
    illustrationSrc: '/assets/destinations/dharamshala.png',
    lat: 32.219,
    lng: 76.323,
  },
  'bir-billing': {
    shortLabel: 'Bir Billing',
    subLabel: 'Glider Thermals',
    illustrationSrc: '/assets/destinations/bir-billing.png',
    lat: 32.046,
    lng: 76.729,
  },
  'spiti-valley': {
    shortLabel: 'Spiti Valley',
    subLabel: 'High Cold Desert',
    illustrationSrc: '/assets/destinations/spiti-valley.png',
    lat: 32.246,
    lng: 78.034,
  },
  chamba: {
    shortLabel: 'Chamba',
    subLabel: 'Ravi River Lore',
    illustrationSrc: '/assets/destinations/chamba.png',
    lat: 32.553,
    lng: 76.126,
  },
  kinnaur: {
    shortLabel: 'Kinnaur',
    subLabel: 'Apple Orchards',
    illustrationSrc: '/assets/destinations/kinnaur.png',
    lat: 31.539,
    lng: 78.275,
  },
  dalhousie: {
    shortLabel: 'Dalhousie',
    subLabel: 'Deodar Meadows',
    illustrationSrc: '/assets/destinations/dalhousie.png',
    lat: 32.538,
    lng: 75.971,
  },
  solang: {
    shortLabel: 'Solang',
    subLabel: 'Alpine Ski Slopes',
    illustrationSrc: '/assets/destinations/solang.png',
    lat: 32.316,
    lng: 77.157,
  },
  mandi: {
    shortLabel: 'Mandi',
    subLabel: 'Carved Stone Temples',
    illustrationSrc: '/assets/destinations/mandi.png',
    lat: 31.708,
    lng: 76.932,
  },
  lahaul: {
    shortLabel: 'Lahaul',
    subLabel: 'High Passes & Stupas',
    illustrationSrc: '/assets/destinations/lahaul.png',
    lat: 32.571,
    lng: 77.032,
  },
  srinagar: {
    shortLabel: 'Srinagar',
    subLabel: 'Dal Lake Shikaras',
    illustrationSrc: '/assets/destinations/srinagar.png',
    lat: 34.083,
    lng: 74.797,
  },
  gulmarg: {
    shortLabel: 'Gulmarg',
    subLabel: 'Gondola & Snow Slopes',
    illustrationSrc: '/assets/destinations/gulmarg.png',
    lat: 34.048,
    lng: 74.38,
  },
  pahalgam: {
    shortLabel: 'Pahalgam',
    subLabel: 'Lidder Pine Valley',
    illustrationSrc: '/assets/destinations/pahalgam.png',
    lat: 34.016,
    lng: 75.315,
  },
  sonamarg: {
    shortLabel: 'Sonamarg',
    subLabel: 'Meadow of Gold',
    illustrationSrc: '/assets/destinations/sonamarg.png',
    lat: 34.303,
    lng: 75.293,
  },
  jammu: {
    shortLabel: 'Jammu',
    subLabel: 'Shivalik Foothills',
    illustrationSrc: '/assets/destinations/jammu.png',
    lat: 32.726,
    lng: 74.857,
  },
  rishikesh: {
    shortLabel: 'Rishikesh',
    subLabel: 'Sacred Ganges',
    illustrationSrc: '/assets/destinations/rishikesh.png',
    lat: 30.086,
    lng: 78.267,
  },
  mussoorie: {
    shortLabel: 'Mussoorie',
    subLabel: 'Mist-Clad Ridges',
    illustrationSrc: '/assets/destinations/mussoorie.png',
    lat: 30.459,
    lng: 78.066,
  },
  nainital: {
    shortLabel: 'Nainital',
    subLabel: 'Emerald Kumaon Lake',
    illustrationSrc: '/assets/destinations/nainital.png',
    lat: 29.391,
    lng: 79.454,
  },
  auli: {
    shortLabel: 'Auli',
    subLabel: 'Nanda Devi Slopes',
    illustrationSrc: '/assets/destinations/auli.png',
    lat: 30.528,
    lng: 79.566,
  },
  chopta: {
    shortLabel: 'Chopta',
    subLabel: 'Tungnath Bugyal',
    illustrationSrc: '/assets/destinations/chopta.png',
    lat: 30.485,
    lng: 79.2,
  },
  mukteshwar: {
    shortLabel: 'Mukteshwar',
    subLabel: 'Kumaon Orchards',
    illustrationSrc: '/assets/destinations/mukteshwar.png',
    lat: 29.472,
    lng: 79.647,
  },
  'jim-corbett': {
    shortLabel: 'Jim Corbett',
    subLabel: 'Foothills Wilderness',
    illustrationSrc: '/assets/destinations/jim-corbett.png',
    lat: 29.53,
    lng: 78.774,
  },
};

export const SIGNATURE_DESTINATION_PRIORITY_ORDER: string[] = [
  'kullu-jari',
  'kasol',
  'manali',
  'kullu',
  'jibhi',
  'spiti-valley',
  'shimla',
  'dharamshala',
  'bir-billing',
  'kinnaur',
  'chamba',
  'dalhousie',
  'solang',
  'mandi',
  'lahaul',
  'srinagar',
  'gulmarg',
  'pahalgam',
  'sonamarg',
  'jammu',
  'rishikesh',
  'mussoorie',
  'nainital',
  'auli',
  'chopta',
  'mukteshwar',
  'jim-corbett',
];

export function getVisualMeta(dest: AtlasDestination): DestinationVisualMeta {
  return (
    DESTINATION_VISUALS[dest.slug] || {
      shortLabel: dest.name.split(' and ')[0] || dest.name,
      subLabel: dest.region,
      illustrationSrc: '/assets/destinations/kullu-jari.png',
      lat: 32.0,
      lng: 77.25,
    }
  );
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function DestinationAtlas({ destinations }: DestinationAtlasProps) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyStatus, setNearbyStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPct, setThumbWidthPct] = useState(32);

  const orderedDestinations = useMemo(() => {
    const base = [...destinations];

    if (regionFilter === 'nearby') {
      const refLat = userCoords?.lat ?? 32.001;
      const refLng = userCoords?.lng ?? 77.245;
      return base
        .map((d) => {
          const meta = getVisualMeta(d);
          const distKm = haversineKm(refLat, refLng, meta.lat, meta.lng);
          return { dest: d, distKm };
        })
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 10)
        .map((item) => item.dest);
    }

    const filtered =
      regionFilter === 'all' ? base : base.filter((d) => d.region === regionFilter);

    return filtered.sort((a, b) => {
      const aCount = a.propertyCount || 0;
      const bCount = b.propertyCount || 0;
      if (aCount !== bCount) return bCount - aCount;
      const aIdx = SIGNATURE_DESTINATION_PRIORITY_ORDER.indexOf(a.slug);
      const bIdx = SIGNATURE_DESTINATION_PRIORITY_ORDER.indexOf(b.slug);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });
  }, [destinations, regionFilter, userCoords]);

  const updateScrollIndicator = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 2) {
      setScrollProgress(0);
      setThumbWidthPct(100);
      return;
    }
    const ratio = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
    const visiblePct = Math.max(22, Math.min(85, Math.round((el.clientWidth / el.scrollWidth) * 100)));
    setThumbWidthPct(visiblePct);
    setScrollProgress(ratio);
  }, []);

  useEffect(() => {
    updateScrollIndicator();
    window.addEventListener('resize', updateScrollIndicator);
    return () => window.removeEventListener('resize', updateScrollIndicator);
  }, [orderedDestinations, updateScrollIndicator]);

  const handleScrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = Math.max(240, Math.round(el.clientWidth * 0.72));
    el.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth',
    });
  };

  const handleToggleNearby = () => {
    if (regionFilter === 'nearby') {
      setRegionFilter('all');
      setNearbyStatus(null);
      return;
    }

    setRegionFilter('nearby');
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setNearbyStatus('Sorted by closest mountain corridors to you');
        },
        () => {
          setNearbyStatus('Showing corridors near Parvati & Kullu Valley');
        },
        { timeout: 4000 }
      );
    } else {
      setNearbyStatus('Showing corridors near Parvati & Kullu Valley');
    }
  };

  const regionPills: Array<{ id: RegionFilter; label: string }> = [
    { id: 'all', label: 'All Valleys' },
    { id: 'Himachal Pradesh', label: 'Himachal' },
    { id: 'Uttarakhand', label: 'Uttarakhand' },
    { id: 'Jammu & Kashmir', label: 'Kashmir' },
  ];

  const thumbPositionClass =
    scrollProgress < 0.15
      ? 'translate-x-0'
      : scrollProgress < 0.35
        ? 'translate-x-[45%]'
        : scrollProgress < 0.65
          ? 'translate-x-[95%]'
          : scrollProgress < 0.85
            ? 'translate-x-[145%]'
            : 'translate-x-[195%]';

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header Row: "Pick a Uttarkunth Destination" Title (matching Featured Stays font & size) + "Show nearby locations" + Regional Pills & Scroll Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
          <h2 className="font-serif text-[22px] sm:text-3xl md:text-4xl lg:text-[42px] font-medium text-[#1F332A] tracking-tight leading-[1.15] sm:leading-tight">
            Pick a Uttarkunth Destination
          </h2>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleToggleNearby}
            className={cn(
              'font-sans inline-flex items-center gap-1.5 text-xs sm:text-[13.5px] font-semibold underline underline-offset-4 transition-colors cursor-pointer',
              regionFilter === 'nearby'
                ? 'text-[#C55B23] decoration-[#C55B23]'
                : 'text-[#4A554E] hover:text-[#1F332A] decoration-[#4A554E]/60 hover:decoration-[#1F332A]'
            )}
          >
            <MapPin className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
            <span>
              {regionFilter === 'nearby' ? 'Showing nearby locations' : 'Show nearby locations'}
            </span>
          </button>
        </div>

        {/* Right Controls: Compact Region Filter Pills + < > Carousel Arrows */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div
            role="tablist"
            aria-label="Filter destinations by Himalayan region"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5"
          >
            {regionPills.map((pill) => {
              const active = regionFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  suppressHydrationWarning
                  aria-selected={active}
                  onClick={() => {
                    setRegionFilter(pill.id);
                    setNearbyStatus(null);
                    if (scrollRef.current) {
                      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                    }
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer whitespace-nowrap',
                    active
                      ? 'bg-[#1F332A] text-[#FFFDF9] shadow-xs'
                      : 'bg-[#EAE2D3]/70 hover:bg-[#DFD5C3] text-[#3F4B44]'
                  )}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-1 shrink-0">
            <button
              type="button"
              onClick={() => handleScrollBy('left')}
              aria-label="Scroll destinations left"
              className="w-8 h-8 rounded-full bg-[#EAE2D3]/85 hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScrollBy('right')}
              aria-label="Scroll destinations right"
              className="w-8 h-8 rounded-full bg-[#EAE2D3]/85 hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {nearbyStatus && (
        <p className="text-[11.5px] sm:text-xs text-[#C55B23] font-medium -mt-2">
          {nearbyStatus}
        </p>
      )}

      {/* 2-Row Horizontal Hand-Illustrated Uttarkunth Destination Grid (Zero Scale Hover) */}
      <div
        ref={scrollRef}
        onScroll={updateScrollIndicator}
        className="grid grid-rows-2 grid-flow-col auto-cols-[calc((100%-1.5rem)/3)] sm:auto-cols-[calc((100%-4.5rem)/4)] lg:auto-cols-[calc((100%-6rem)/5)] gap-x-3 sm:gap-x-6 gap-y-5 sm:gap-y-7 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1 pb-2"
      >
        {orderedDestinations.map((dest) => {
          const meta = getVisualMeta(dest);
          const isLive = (dest.propertyCount || 0) > 0;

          return (
            <Link
              key={dest.id}
              href={`/stays/destinations/${dest.slug}`}
              className="group snap-start flex flex-col items-center text-center select-none cursor-pointer no-underline focus:outline-none"
            >
              {/* Hand-Illustrated Uttarkunth Destination Icon — Zero Scale Hover, Warm Golden-Hour Aura & Horizon Bar Hover */}
              <div className="relative w-[92px] h-[72px] sm:w-[126px] sm:h-[96px] lg:w-[144px] lg:h-[108px] flex items-center justify-center">
                {/* Soft Feathered Uttarkunth Golden-Hour & Terracotta Aura on Hover (No Scale Up/Down) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 bg-[radial-gradient(closest-side_at_50%_50%,rgba(253,226,168,0.85)_0%,rgba(197,91,35,0.22)_52%,rgba(38,61,50,0.08)_80%,rgba(245,240,230,0)_100%)] transition-opacity duration-300"
                />

                <Image
                  src={meta.illustrationSrc}
                  alt={`${meta.shortLabel} — ${meta.subLabel}`}
                  fill
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 132px, 150px"
                  referrerPolicy="no-referrer"
                  className="relative z-10 object-contain transition-[filter] duration-300 group-hover:drop-shadow-[0_6px_12px_rgba(31,51,42,0.16)]"
                />

                {/* Subtle Uttarkunth Terracotta-to-Forest Horizon Accent Bar on Hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 group-hover:w-12 h-[2px] rounded-full bg-gradient-to-r from-[#263D32]/30 via-[#C55B23] to-[#263D32]/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                />

                {isLive && (
                  <span
                    title={`${dest.propertyCount} Approved Stay${dest.propertyCount === 1 ? '' : 's'}`}
                    className="absolute top-0 right-1 z-30 px-1.5 py-0.5 rounded-full bg-[#1F332A] text-[#FDE2A8] border border-[#C55B23]/45 text-[9px] font-bold tracking-tight shadow-xs"
                  >
                    Live
                  </span>
                )}
              </div>

              {/* Destination Name */}
              <span className="mt-1.5 sm:mt-2 font-sans text-[13px] sm:text-[15px] font-semibold text-[#1F332A] group-hover:text-[#C55B23] transition-colors duration-200 leading-tight whitespace-nowrap">
                {meta.shortLabel}
              </span>

              {/* 2–3 Word Signature Description — Visible on Laptop & Tablet (sm+), Hidden on Mobile */}
              <span className="hidden sm:block mt-0.5 font-sans text-[11px] lg:text-[12px] font-normal text-[#5A5246] group-hover:text-[#1F332A] transition-colors duration-200 leading-tight whitespace-nowrap">
                {meta.subLabel}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Centered Scroll Progress Bar */}
      <div className="pt-1 flex items-center justify-center">
        <div
          aria-hidden="true"
          className="relative w-32 sm:w-44 h-[3.5px] rounded-full bg-[#D5C8B3]/65 overflow-hidden"
        >
          <div
            className={cn(
              'h-full rounded-full bg-[#1F332A]/75 transition-transform duration-200 ease-out',
              thumbWidthPct === 100 ? 'w-full translate-x-0' : 'w-1/3',
              thumbWidthPct !== 100 && thumbPositionClass
            )}
          />
        </div>
      </div>
    </div>
  );
}
