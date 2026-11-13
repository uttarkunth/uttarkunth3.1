'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Destination } from '@/lib/destinations';
import {
  EXPLORE_SPOTLIGHT_PEAK_MS,
  EXPLORE_SPOTLIGHT_FADEOUT_MS,
  consumeExploreSpotlightSession,
} from '@/lib/explore-spotlight';
import {
  UnifiedHeroSearchBar,
  type StayPropertyItem,
  type ProductItem,
  type ProductCategoryItem,
  type ProductionItem,
} from './unified-hero-search';
import { PillarFeatherBloom } from './pillar-feather-bloom';

export interface PillarItem {
  numeral: 'I' | 'II' | 'III' | 'IV';
  id: 'stays' | 'products' | 'productions' | 'community';
  word: string;
  title: string;
  kicker: string;
  subtitle: string;
  description: string;
  highlight: string;
  image: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}

export interface FourPillarsShowcaseProps {
  destinations?: Destination[];
  properties?: StayPropertyItem[];
  products?: ProductItem[];
  productCategories?: readonly ProductCategoryItem[];
  productions?: ProductionItem[];
}

const PILLARS_DATA: PillarItem[] = [
  {
    numeral: 'I',
    id: 'stays',
    word: 'Stays',
    title: 'Uttarkunth Stays',
    kicker: 'Mountain Hospitality',
    subtitle: 'Find Your Place in the Mountains',
    description:
      'Family-stewarded homestays and valley retreats in Jari, Parvati Valley, and across the Himalayas.',
    highlight: '100% Direct Host Payment',
    image: '/assets/uttarkunth-stays-homepage-card.webp',
    imageAlt: 'Uttarkunth Stays — Authentic Himalayan mountain homestays and hospitality',
    href: '/stays',
    ctaLabel: 'Explore',
    secondaryHref: '/stays/partner',
    secondaryLabel: 'Host',
  },
  {
    numeral: 'II',
    id: 'products',
    word: 'Products',
    title: 'Uttarkunth Products',
    kicker: 'Local Craft & Goods',
    subtitle: 'Products With Purpose',
    description:
      'Small-batch harvests, indigenous wool, woodcraft, and botanical goods from mountain makers.',
    highlight: '9 Curated Craft Categories',
    image: '/assets/products-home-page.webp',
    imageAlt: 'Uttarkunth Products — Authentic Himalayan handcrafts and small-batch harvests',
    href: '/products',
    ctaLabel: 'Shop',
    secondaryHref: '/products/sell',
    secondaryLabel: 'Sell',
  },
  {
    numeral: 'III',
    id: 'productions',
    word: 'Productions',
    title: 'Uttarkunth Productions',
    kicker: 'Cinema & Archive',
    subtitle: 'Stories Worth Telling',
    description:
      'Independent ethnographic documentaries and cultural chronicles preserving Himalayan heritage.',
    highlight: 'Original Documentary Archive',
    image: '/assets/productions-home.webp',
    imageAlt: 'Uttarkunth Productions — Himalayan documentary filmmaking and visual storytelling',
    href: '/production',
    ctaLabel: 'Watch',
    secondaryHref: '/production/collaborate',
    secondaryLabel: 'Create',
  },
  {
    numeral: 'IV',
    id: 'community',
    word: 'Community',
    title: 'Uttarkunth Community',
    kicker: 'People & Karmayog',
    subtitle: 'Build Something Meaningful',
    description:
      'Grassroots village stewardship connecting local families, youth, and conscious collaborators.',
    highlight: 'Karmayog Stewardship',
    image: '/assets/community-home-page.webp',
    imageAlt: 'Uttarkunth Community — Grassroots Himalayan village stewardship and collaboration',
    href: '/community',
    ctaLabel: 'Explore',
    secondaryHref: '/community/join',
    secondaryLabel: 'Join',
  },
];

type CardPositionState = 'active' | 'prev' | 'next' | 'hidden-left' | 'hidden-right';
export type SpotlightPhase = 'idle' | 'peak' | 'settling';

export function FourPillarsShowcase({
  destinations = [],
  properties = [],
  products = [],
  productCategories = [],
  productions = [],
}: FourPillarsShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isBarInteracting, setIsBarInteracting] = useState<boolean>(false);
  const [spotlightPhase, setSpotlightPhase] = useState<SpotlightPhase>('idle');
  const hasShownInSessionRef = useRef<boolean>(false);
  const totalCards = PILLARS_DATA.length;
  const activePillar = PILLARS_DATA[currentIndex]?.id ?? 'stays';

  const updateCarousel = useCallback(
    (targetIndex: number) => {
      setCurrentIndex(((targetIndex % totalCards) + totalCards) % totalCards);
    },
    [totalCards]
  );

  // On the first tap of "Explore Uttarkunth" in a new session, both the active carousel card and
  // the search bar smoothly scale up & lighten ('peak'), then slowly fade out the light in sync
  // with scaling back to their exact original position ('settling' -> 'idle').
  useEffect(() => {
    let rafId: number | null = null;
    let peakTimer: ReturnType<typeof setTimeout> | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupTimers = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (peakTimer) {
        clearTimeout(peakTimer);
        peakTimer = null;
      }
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const runCardAndBarTransition = () => {
      setSpotlightPhase('peak');
      peakTimer = setTimeout(() => {
        setSpotlightPhase('settling');
        settleTimer = setTimeout(() => {
          setSpotlightPhase('idle');
        }, EXPLORE_SPOTLIGHT_FADEOUT_MS);
      }, EXPLORE_SPOTLIGHT_PEAK_MS);
    };

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const exploreAnchor = target?.closest?.('a[href="#four-pillars"]');
      if (!exploreAnchor) return;

      const sectionEl = document.getElementById('four-pillars');
      if (!sectionEl) return;

      e.preventDefault();
      cleanupTimers();

      try {
        window.history.replaceState(null, '', '#four-pillars');
      } catch {
        // Ignore history errors
      }

      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Only trigger the scale + light transition on the first tap per session
      const shouldRunSpotlight = consumeExploreSpotlightSession(
        typeof window !== 'undefined' ? window.sessionStorage : null,
        hasShownInSessionRef
      );

      if (!shouldRunSpotlight) {
        return;
      }

      const startTime = performance.now();
      let lastTop = sectionEl.getBoundingClientRect().top;
      let settledFrames = 0;

      const checkScrollArrival = (now: number) => {
        const currentTop = sectionEl.getBoundingClientRect().top;
        const delta = Math.abs(currentTop - lastTop);
        lastTop = currentTop;

        if (Math.abs(currentTop) <= 24 || (now - startTime > 140 && delta < 1)) {
          settledFrames += 1;
        } else {
          settledFrames = 0;
        }

        if (settledFrames >= 3 || now - startTime >= 520) {
          rafId = null;
          runCardAndBarTransition();
          return;
        }

        rafId = requestAnimationFrame(checkScrollArrival);
      };

      rafId = requestAnimationFrame(checkScrollArrival);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      cleanupTimers();
    };
  }, []);

  // Keyboard Left / Right arrow navigation (ignores when typing in form inputs or interacting with search bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isBarInteracting) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        updateCarousel(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        updateCarousel(currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isBarInteracting, updateCarousel]);

  const getCardState = (idx: number): CardPositionState => {
    if (idx === currentIndex) return 'active';
    if (idx === (currentIndex - 1 + totalCards) % totalCards) return 'prev';
    if (idx === (currentIndex + 1) % totalCards) return 'next';
    return idx < currentIndex ? 'hidden-left' : 'hidden-right';
  };

  // Subtle ambient aura transition per active pillar
  const activeAuraClass =
    currentIndex === 0
      ? 'from-[#263D32]/25 via-[#C55B23]/15 to-transparent'
      : currentIndex === 1
        ? 'from-[#C55B23]/22 via-[#D9CCB8]/40 to-transparent'
        : currentIndex === 2
          ? 'from-[#1A2B23]/25 via-[#C55B23]/18 to-transparent'
          : 'from-[#263D32]/22 via-[#C55B23]/20 to-transparent';

  const handleLanternMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      className="relative w-full select-none flex flex-col items-center justify-center"
      aria-roledescription="carousel"
      aria-label="Uttarkunth Four Pillars Portrait Stack Carousel"
    >
      {/* Unbounded 3D Portrait Stack Stage with Soft Color Transitions */}
      <div className="relative w-full max-w-6xl mx-auto h-[312px] sm:h-[372px] flex items-center justify-center px-0 sm:px-4">
        {/* Soft Unbounded Ambient Color Aura (Transitions smoothly with active card) */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[640px] h-[300px] sm:h-[420px] rounded-full bg-radial bg-gradient-to-tr blur-3xl transition-all duration-700',
            activeAuraClass
          )}
        />

        {/* Far-edge Navigation Arrow — Left */}
        <button
          type="button"
          data-carousel-nav="true"
          suppressHydrationWarning
          onClick={() => updateCarousel(currentIndex - 1)}
          aria-label="Previous Pillar Slide"
          className="group absolute -left-1 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF9]/90 hover:bg-[#263D32] text-[#263D32] hover:text-[#FFFDF9] border border-[#D9CCB8] hover:border-[#263D32] shadow-sm backdrop-blur-sm flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </span>
        </button>

        {/* Far-edge Navigation Arrow — Right */}
        <button
          type="button"
          data-carousel-nav="true"
          suppressHydrationWarning
          onClick={() => updateCarousel(currentIndex + 1)}
          aria-label="Next Pillar Slide"
          className="group absolute -right-1 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF9]/90 hover:bg-[#263D32] text-[#263D32] hover:text-[#FFFDF9] border border-[#D9CCB8] hover:border-[#263D32] shadow-sm backdrop-blur-sm flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </span>
        </button>

        {/* 3D Transform Track (perspective: 1000px) */}
        <div
          data-carousel-nav="true"
          className="relative w-full h-full flex items-center justify-center [perspective:1000px]"
        >
          {/* Decorative Pillar Feather Icon Bloom Layer (z-[16]: behind active card z-20, above side cards z-10) */}
          <PillarFeatherBloom activePillar={activePillar} />

          {PILLARS_DATA.map((pillar, idx) => {
            const state = getCardState(idx);
            const isActive = state === 'active';
            const isSide = state === 'prev' || state === 'next';
            const isCardPeak = isActive && spotlightPhase === 'peak';
            const isCardSettling = isActive && spotlightPhase === 'settling';

            // 3D state transforms matching the reference Portrait Stack Carousel
            const positionTransformClass =
              state === 'active'
                ? isCardPeak
                  ? 'z-20 opacity-100 blur-0 brightness-[1.16] [transform:translate3d(0,0,0)_scale(1.045)]'
                  : 'z-20 opacity-100 blur-0 brightness-100 [transform:translate3d(0,0,0)_scale(1)]'
                : state === 'prev'
                  ? 'z-10 opacity-30 blur-[5px] [transform:translate3d(-154px,0,-110px)_scale(0.82)] sm:[transform:translate3d(-336px,0,-120px)_scale(0.82)] cursor-pointer'
                  : state === 'next'
                    ? 'z-10 opacity-30 blur-[5px] [transform:translate3d(154px,0,-110px)_scale(0.82)] sm:[transform:translate3d(336px,0,-120px)_scale(0.82)] cursor-pointer'
                    : state === 'hidden-left'
                      ? 'z-0 opacity-0 blur-[12px] pointer-events-none [transform:translate3d(-440px,0,-200px)_scale(0.7)]'
                      : 'z-0 opacity-0 blur-[12px] pointer-events-none [transform:translate3d(440px,0,-200px)_scale(0.7)]';

            return (
              <article
                key={pillar.id}
                onClick={() => {
                  if (isSide) updateCarousel(idx);
                }}
                aria-hidden={!isActive}
                data-testid={isActive ? 'active-pillar-carousel-card' : undefined}
                data-spotlight={isActive ? spotlightPhase : 'idle'}
                className={cn(
                  'portrait-card absolute w-[216px] sm:w-[292px] h-[300px] sm:h-[358px] rounded-[20px] sm:rounded-[24px] overflow-hidden',
                  'transition-[transform,filter,opacity,border-color,box-shadow] will-change-[transform,filter,opacity]',
                  isCardPeak
                    ? 'duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-[#FFFDF9]/90 shadow-[0_0_46px_rgba(255,253,249,0.52),0_0_24px_rgba(253,226,168,0.45),0_22px_46px_-8px_rgba(16,26,21,0.52)]'
                    : isCardSettling
                      ? 'duration-[850ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] border border-[#F5F0E6]/35 shadow-[0_22px_46px_-8px_rgba(16,26,21,0.58)]'
                      : isActive
                        ? 'duration-600 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] border border-[#F5F0E6]/35 shadow-[0_22px_46px_-8px_rgba(16,26,21,0.58)]'
                        : 'duration-600 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] border border-[#D9CCB8]/25 shadow-[0_14px_30px_-6px_rgba(16,26,21,0.42)]',
                  positionTransformClass
                )}
              >
                {/* Authentic Uploaded Pillar Background Image */}
                <Image
                  src={pillar.image}
                  alt={pillar.imageAlt}
                  fill
                  sizes="340px"
                  className="object-cover object-center"
                />

                {/* Smooth Aesthetic Himalayan Gradient Vignette Overlay */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-[#1A2B23]/30 via-[#1A2B23]/50 to-[#1A2B23]/92 z-10"
                />

                {/* Soft Light Overlay (Lightens up and slowly fades out in sync with scaling back to exact position) */}
                <div
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_50%_35%,rgba(255,253,249,0.34)_0%,rgba(253,226,168,0.18)_52%,rgba(255,253,249,0.06)_100%)] transition-opacity [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
                    isCardPeak
                      ? 'duration-300 opacity-100'
                      : isCardSettling
                        ? 'duration-[850ms] opacity-0'
                        : 'duration-300 opacity-0'
                  )}
                />

                {/* Portrait Card Interior Content — Clean, Simple & Aesthetic (No Viewfinder Lines) */}
                <div className="relative z-20 h-full w-full p-3.5 sm:p-5 flex flex-col justify-between text-center">
                  {/* Center Editorial Word & Subtitle */}
                  <div className="my-auto space-y-1 sm:space-y-1.5 py-1">
                    <span className="text-[10.5px] sm:text-xs font-serif italic text-terracotta-light tracking-wide block">
                      {pillar.subtitle}
                    </span>
                    <h3
                      className={cn(
                        'font-serif font-bold uppercase tracking-[0.14em] text-[#FFFDF9] drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] transition-all duration-500',
                        isActive ? 'text-xl sm:text-3xl blur-0' : 'text-lg sm:text-xl blur-[1px]'
                      )}
                    >
                      {pillar.word}
                    </h3>
                  </div>

                  {/* Bottom Authentic Description & Concise Balanced Action Buttons */}
                  <div
                    className={cn(
                      'space-y-2 sm:space-y-2.5 transition-opacity duration-500',
                      isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    )}
                  >
                    <p className="text-[10.5px] sm:text-xs text-[#F5F0E6]/90 leading-snug sm:leading-relaxed line-clamp-2 px-1">
                      {pillar.description}
                    </p>

                    <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1A2B23]/80 border border-[#F5F0E6]/20 text-[9.5px] sm:text-[10px] font-medium text-[#F5F0E6]">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-terracotta-light shrink-0" />
                      <span>{pillar.highlight}</span>
                    </div>

                    <div className="pt-1.5 sm:pt-2 flex items-center justify-center gap-2">
                      <Link
                        href={pillar.href}
                        tabIndex={isActive ? 0 : -1}
                        onMouseMove={handleLanternMouseMove}
                        className="lantern-btn group flex-1 max-w-[96px] sm:max-w-[116px] bg-[#C85A23]/45 shadow-sm whitespace-nowrap"
                      >
                        <span className="lantern-btn-inner !gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#C55B23] text-[#FFFDF9] text-[10.5px] sm:text-xs font-semibold tracking-wide whitespace-nowrap">
                          <span>{pillar.ctaLabel}</span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                        </span>
                      </Link>

                      <Link
                        href={pillar.secondaryHref}
                        tabIndex={isActive ? 0 : -1}
                        onMouseMove={handleLanternMouseMove}
                        className="lantern-btn group flex-1 max-w-[96px] sm:max-w-[116px] bg-[#C85A23]/30 whitespace-nowrap"
                      >
                        <span className="lantern-btn-inner !gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FFFDF9] text-[#263D32] text-[10.5px] sm:text-xs font-semibold tracking-wide whitespace-nowrap">
                          <span>{pillar.secondaryLabel}</span>
                          <ArrowUpRight className="w-3 h-3 text-terracotta shrink-0" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CONTEXT-AWARE ADAPTIVE HERO SEARCH & ACTION BAR
          • Single component positioned directly beneath the hero carousel
          • Uses the active carousel slide (activePillar) as its single source of truth
      ───────────────────────────────────────────────────────────────────── */}
      <div className="w-full mt-2.5 sm:mt-3 select-text">
        <UnifiedHeroSearchBar
          activePillar={activePillar}
          destinations={destinations}
          properties={properties}
          products={products}
          productCategories={productCategories}
          productions={productions}
          onInteractionChange={setIsBarInteracting}
          spotlightPhase={spotlightPhase}
        />
      </div>
    </div>
  );
}
