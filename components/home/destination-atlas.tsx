'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Home,
  Mountain,
  MountainSnow,
  Trees,
  Tent,
  Landmark,
  Castle,
  Wind,
  TrainFront,
  Sunrise,
  Bell,
  Ship,
  Snowflake,
  Footprints,
  Sun,
  Waves,
  CloudSun,
  Sailboat,
  Flower2,
  Apple,
  Bird,
  Compass,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
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

interface DestinationVisualMeta {
  shortLabel: string;
  subLabel: string;
  PrimaryIcon: LucideIcon;
  AccentIcon: LucideIcon;
  warmBlobClass: string;
  accentBlobClass: string;
  lat: number;
  lng: number;
}

const DESTINATION_VISUALS: Record<string, DestinationVisualMeta> = {
  'kullu-jari': {
    shortLabel: 'Jari & Kullu',
    subLabel: 'Parvati Heartland',
    PrimaryIcon: Home,
    AccentIcon: Mountain,
    warmBlobClass: 'bg-[#F5CBA7]/75 -right-1 top-1 w-7 h-9 rounded-t-full rounded-b-md',
    accentBlobClass: 'bg-[#E59866]/55 -left-1.5 bottom-2 w-6 h-6 rounded-full',
    lat: 32.001,
    lng: 77.245,
  },
  kasol: {
    shortLabel: 'Kasol',
    subLabel: 'Parvati Valley',
    PrimaryIcon: Trees,
    AccentIcon: Waves,
    warmBlobClass: 'bg-[#FDE2A8]/80 left-0 top-1 w-8 h-8 rounded-full',
    accentBlobClass: 'bg-[#D98880]/50 right-0 bottom-1.5 w-6 h-7 rounded-t-full',
    lat: 32.01,
    lng: 77.315,
  },
  manali: {
    shortLabel: 'Manali',
    subLabel: 'Cedar & Snow Peaks',
    PrimaryIcon: MountainSnow,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#F5CBA7]/75 right-0 top-0.5 w-7 h-9 rounded-tl-2xl rounded-br-xl',
    accentBlobClass: 'bg-[#E59866]/50 left-0.5 bottom-2 w-6 h-6 rounded-full',
    lat: 32.243,
    lng: 77.189,
  },
  jibhi: {
    shortLabel: 'Jibhi',
    subLabel: 'Tirthan Valley',
    PrimaryIcon: Tent,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#FDE2A8]/80 -right-0.5 top-1 w-7 h-8 rounded-t-full',
    accentBlobClass: 'bg-[#C55B23]/30 -left-1 bottom-2 w-6 h-6 rounded-full',
    lat: 31.634,
    lng: 77.349,
  },
  dharamshala: {
    shortLabel: 'Dharamshala',
    subLabel: 'Dhauladhar Crags',
    PrimaryIcon: Landmark,
    AccentIcon: MountainSnow,
    warmBlobClass: 'bg-[#E59866]/45 left-0 top-1 w-7 h-8 rounded-t-xl',
    accentBlobClass: 'bg-[#FDE2A8]/80 right-0 bottom-2 w-6 h-6 rounded-full',
    lat: 32.219,
    lng: 76.323,
  },
  'spiti-valley': {
    shortLabel: 'Spiti Valley',
    subLabel: 'High Cold Desert',
    PrimaryIcon: Castle,
    AccentIcon: Sparkles,
    warmBlobClass: 'bg-[#F5CBA7]/80 right-0.5 top-0.5 w-7 h-9 rounded-t-full',
    accentBlobClass: 'bg-[#D98880]/45 left-0 bottom-2 w-6 h-6 rounded-full',
    lat: 32.246,
    lng: 78.034,
  },
  'bir-billing': {
    shortLabel: 'Bir Billing',
    subLabel: 'Glider Thermals',
    PrimaryIcon: Wind,
    AccentIcon: Compass,
    warmBlobClass: 'bg-[#FDE2A8]/80 right-0 top-1 w-8 h-8 rounded-full',
    accentBlobClass: 'bg-[#E59866]/50 left-0.5 bottom-1.5 w-6 h-7 rounded-t-full',
    lat: 32.046,
    lng: 76.729,
  },
  shimla: {
    shortLabel: 'Shimla',
    subLabel: 'Pine Heritage Ridge',
    PrimaryIcon: TrainFront,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#D98880]/45 right-0 top-1 w-7 h-9 rounded-t-xl',
    accentBlobClass: 'bg-[#F5CBA7]/80 left-0 bottom-2 w-6 h-6 rounded-full',
    lat: 31.104,
    lng: 77.173,
  },
  dalhousie: {
    shortLabel: 'Dalhousie',
    subLabel: 'Deodar Meadows',
    PrimaryIcon: Sunrise,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#FDE2A8]/85 left-0.5 top-1 w-8 h-7 rounded-full',
    accentBlobClass: 'bg-[#E59866]/45 right-0 bottom-2 w-6 h-7 rounded-t-full',
    lat: 32.538,
    lng: 75.971,
  },
  chamba: {
    shortLabel: 'Chamba',
    subLabel: 'Ravi River Lore',
    PrimaryIcon: Bell,
    AccentIcon: Waves,
    warmBlobClass: 'bg-[#F5CBA7]/75 right-0 top-1 w-7 h-9 rounded-t-full',
    accentBlobClass: 'bg-[#D98880]/45 left-0 bottom-2 w-6 h-6 rounded-full',
    lat: 32.553,
    lng: 76.126,
  },
  srinagar: {
    shortLabel: 'Srinagar',
    subLabel: 'Dal Lake Houseboats',
    PrimaryIcon: Ship,
    AccentIcon: Waves,
    warmBlobClass: 'bg-[#E59866]/45 left-0 top-1 w-7 h-8 rounded-full',
    accentBlobClass: 'bg-[#FDE2A8]/80 right-0 bottom-1.5 w-7 h-7 rounded-t-full',
    lat: 34.083,
    lng: 74.797,
  },
  gulmarg: {
    shortLabel: 'Gulmarg',
    subLabel: 'Alpine Meadow',
    PrimaryIcon: Snowflake,
    AccentIcon: MountainSnow,
    warmBlobClass: 'bg-[#F5CBA7]/75 right-0 top-1 w-7 h-8 rounded-t-full',
    accentBlobClass: 'bg-[#D98880]/45 left-0.5 bottom-2 w-6 h-6 rounded-full',
    lat: 34.048,
    lng: 74.38,
  },
  pahalgam: {
    shortLabel: 'Pahalgam',
    subLabel: 'Lidder Pine Valley',
    PrimaryIcon: Footprints,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#FDE2A8]/80 left-0 top-1 w-7 h-8 rounded-t-full',
    accentBlobClass: 'bg-[#E59866]/50 right-0 bottom-2 w-6 h-6 rounded-full',
    lat: 34.016,
    lng: 75.315,
  },
  sonamarg: {
    shortLabel: 'Sonamarg',
    subLabel: 'Meadow of Gold',
    PrimaryIcon: Sun,
    AccentIcon: MountainSnow,
    warmBlobClass: 'bg-[#FDE2A8]/90 right-0 top-0.5 w-8 h-8 rounded-full',
    accentBlobClass: 'bg-[#E59866]/45 left-0 bottom-2 w-6 h-7 rounded-t-full',
    lat: 34.303,
    lng: 75.293,
  },
  jammu: {
    shortLabel: 'Jammu',
    subLabel: 'Shivalik Foothills',
    PrimaryIcon: Landmark,
    AccentIcon: Sun,
    warmBlobClass: 'bg-[#F5CBA7]/75 left-0 top-1 w-7 h-9 rounded-t-full',
    accentBlobClass: 'bg-[#D98880]/45 right-0 bottom-2 w-6 h-6 rounded-full',
    lat: 32.726,
    lng: 74.857,
  },
  rishikesh: {
    shortLabel: 'Rishikesh',
    subLabel: 'Sacred Ganges',
    PrimaryIcon: Waves,
    AccentIcon: Sunrise,
    warmBlobClass: 'bg-[#FDE2A8]/85 right-0 top-1 w-8 h-8 rounded-full',
    accentBlobClass: 'bg-[#E59866]/50 left-0 bottom-1.5 w-6 h-7 rounded-t-full',
    lat: 30.086,
    lng: 78.267,
  },
  mussoorie: {
    shortLabel: 'Mussoorie',
    subLabel: 'Mist-Clad Ridges',
    PrimaryIcon: CloudSun,
    AccentIcon: Mountain,
    warmBlobClass: 'bg-[#D98880]/45 left-0 top-1 w-7 h-8 rounded-t-full',
    accentBlobClass: 'bg-[#F5CBA7]/80 right-0 bottom-2 w-6 h-6 rounded-full',
    lat: 30.459,
    lng: 78.066,
  },
  nainital: {
    shortLabel: 'Nainital',
    subLabel: 'Emerald Kumaon Lake',
    PrimaryIcon: Sailboat,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#F5CBA7]/80 right-0 top-1 w-7 h-9 rounded-t-full',
    accentBlobClass: 'bg-[#E59866]/45 left-0 bottom-2 w-6 h-6 rounded-full',
    lat: 29.391,
    lng: 79.454,
  },
  auli: {
    shortLabel: 'Auli',
    subLabel: 'Nanda Devi Slopes',
    PrimaryIcon: MountainSnow,
    AccentIcon: Snowflake,
    warmBlobClass: 'bg-[#FDE2A8]/80 left-0 top-1 w-8 h-8 rounded-full',
    accentBlobClass: 'bg-[#D98880]/45 right-0 bottom-2 w-6 h-7 rounded-t-full',
    lat: 30.528,
    lng: 79.566,
  },
  chopta: {
    shortLabel: 'Chopta',
    subLabel: 'Tungnath Bugyal',
    PrimaryIcon: Flower2,
    AccentIcon: Mountain,
    warmBlobClass: 'bg-[#E59866]/50 right-0 top-1 w-7 h-8 rounded-t-full',
    accentBlobClass: 'bg-[#FDE2A8]/80 left-0 bottom-2 w-6 h-6 rounded-full',
    lat: 30.485,
    lng: 79.2,
  },
  mukteshwar: {
    shortLabel: 'Mukteshwar',
    subLabel: 'Kumaon Orchards',
    PrimaryIcon: Apple,
    AccentIcon: Mountain,
    warmBlobClass: 'bg-[#D98880]/50 left-0 top-1 w-7 h-8 rounded-full',
    accentBlobClass: 'bg-[#F5CBA7]/80 right-0 bottom-2 w-6 h-7 rounded-t-full',
    lat: 29.472,
    lng: 79.647,
  },
  'jim-corbett': {
    shortLabel: 'Jim Corbett',
    subLabel: 'Foothills Wilderness',
    PrimaryIcon: Bird,
    AccentIcon: Trees,
    warmBlobClass: 'bg-[#FDE2A8]/80 right-0 top-1 w-7 h-9 rounded-t-full',
    accentBlobClass: 'bg-[#E59866]/45 left-0 bottom-2 w-6 h-6 rounded-full',
    lat: 29.53,
    lng: 78.774,
  },
};

function getVisualMeta(dest: AtlasDestination): DestinationVisualMeta {
  return (
    DESTINATION_VISUALS[dest.slug] || {
      shortLabel: dest.name.split(' and ')[0] || dest.name,
      subLabel: dest.region,
      PrimaryIcon: Mountain,
      AccentIcon: Trees,
      warmBlobClass: 'bg-[#F5CBA7]/75 right-0 top-1 w-7 h-8 rounded-t-full',
      accentBlobClass: 'bg-[#E59866]/45 left-0 bottom-2 w-6 h-6 rounded-full',
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

  // Order destinations so Kullu/Jari & Parvati Valley lead, followed by curated corridors
  const orderedDestinations = useMemo(() => {
    const base = [...destinations];

    if (regionFilter === 'nearby') {
      // Reference point: either visitor's live GPS coordinates or Uttarkunth's Parvati Valley heartland (Jari: 32.001, 77.245)
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
      const priorityOrder = [
        'kullu-jari',
        'kasol',
        'manali',
        'jibhi',
        'dharamshala',
        'spiti-valley',
        'bir-billing',
        'shimla',
        'rishikesh',
        'srinagar',
        'gulmarg',
        'mussoorie',
      ];
      const aIdx = priorityOrder.indexOf(a.slug);
      const bIdx = priorityOrder.indexOf(b.slug);
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
    <div className="space-y-4 sm:space-y-5">
      {/* Header Row: "Pick a Uttarkunth Destination" + "Show nearby locations" + Regional Pills & Scroll Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-serif text-[22px] sm:text-2xl lg:text-[28px] font-bold text-[#1F332A] tracking-tight leading-tight">
            Pick a Uttarkunth Destination
          </h3>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleToggleNearby}
            className={cn(
              'inline-flex items-center gap-1 text-xs sm:text-[13px] font-medium underline underline-offset-4 transition-colors cursor-pointer',
              regionFilter === 'nearby'
                ? 'text-[#C55B23] decoration-[#C55B23] font-semibold'
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
                    'px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer',
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

      {/* 2-Row Horizontal Illustrated Destination Emblem Track */}
      <div
        ref={scrollRef}
        onScroll={updateScrollIndicator}
        className="grid grid-rows-2 grid-flow-col auto-cols-[74px] sm:auto-cols-[112px] lg:auto-cols-[122px] gap-x-3 sm:gap-x-5 gap-y-4 sm:gap-y-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1 pb-2"
      >
        {orderedDestinations.map((dest) => {
          const meta = getVisualMeta(dest);
          const PrimaryIcon = meta.PrimaryIcon;
          const AccentIcon = meta.AccentIcon;
          const hasLiveStays = (dest.propertyCount || 0) > 0;

          return (
            <Link
              key={dest.id}
              href={`/stays/destinations/${dest.slug}`}
              className="group snap-start flex flex-col items-center text-center select-none cursor-pointer no-underline focus:outline-none"
            >
              {/* Handcrafted Himalayan Line-Art & Warm Organic Blob Emblem */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl transition-transform duration-300 ease-out group-hover:-translate-y-1">
                {/* Warm Pastel Amber / Terracotta Organic Shapes (Matching Reference Illustration Vibe) */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute transition-transform duration-300 group-hover:scale-110',
                    meta.warmBlobClass
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute transition-transform duration-300 group-hover:scale-105',
                    meta.accentBlobClass
                  )}
                />

                {/* Secondary Horizon / Peak Accent Icon */}
                <AccentIcon
                  strokeWidth={1.35}
                  className="relative z-10 w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#1F332A]/65 -mr-2 -mt-4 transition-colors duration-200 group-hover:text-[#C55B23]"
                />

                {/* Primary Architectural / Valley Line-Art Icon */}
                <PrimaryIcon
                  strokeWidth={1.5}
                  className="relative z-20 w-7 h-7 sm:w-8 sm:h-8 text-[#1F332A] transition-colors duration-200 group-hover:text-[#C55B23]"
                />

                {/* Fine Illustrated Horizon Baseline */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-1.5 inset-x-2.5 h-[1.5px] rounded-full bg-[#1F332A]/75 group-hover:bg-[#C55B23] transition-colors"
                />

                {/* Live Approved Stay Indicator Dot */}
                {hasLiveStays && (
                  <span
                    title={`${dest.propertyCount} Approved Stay`}
                    className="absolute -top-0.5 -right-0.5 z-30 px-1.5 py-0.5 rounded-full bg-[#1F332A] text-[#FFF8EC] text-[9px] font-bold tracking-tight shadow-xs"
                  >
                    Live
                  </span>
                )}
              </div>

              {/* Destination Name & Subtle Valley Sub-label */}
              <span className="mt-1.5 font-sans text-[12px] sm:text-[13.5px] font-medium text-[#1F332A] group-hover:text-[#C55B23] transition-colors leading-tight whitespace-nowrap">
                {meta.shortLabel}
              </span>
              <span className="hidden sm:block text-[10.5px] text-[#5C5549]/85 leading-tight line-clamp-1 mt-0.5">
                {meta.subLabel}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Centered Scroll Progress Bar (Matching Reference UI) */}
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
