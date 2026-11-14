'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Quote,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  computeReviewsTrustSummary,
  formatReviewDateLabel,
  getReviewerInitials,
  normalizeAndSortRecentReviews,
  type PublicReviewItem,
} from '@/lib/reviews';

interface RecentReviewsCarouselProps {
  reviews: PublicReviewItem[];
  properties?: any[];
}

export function RecentReviewsCarousel({
  reviews: initialReviews,
  properties = [],
}: RecentReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const normalizedReviews = useMemo(
    () => normalizeAndSortRecentReviews(initialReviews, properties, 12),
    [initialReviews, properties]
  );

  const summary = useMemo(
    () => computeReviewsTrustSummary(normalizedReviews),
    [normalizedReviews]
  );

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el || normalizedReviews.length === 0) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const currentLeft = Math.max(0, el.scrollLeft);

    setCanScrollLeft(currentLeft > 8);
    setCanScrollRight(maxScroll - currentLeft > 8);

    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardStep = firstCard ? firstCard.offsetWidth + 16 : 320;
    const computedIdx = Math.min(
      normalizedReviews.length - 1,
      Math.max(0, Math.round(currentLeft / Math.max(1, cardStep)))
    );
    setActiveIndex(computedIdx);
  }, [normalizedReviews.length]);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

  const scrollToIndex = useCallback(
    (targetIdx: number) => {
      const el = scrollRef.current;
      if (!el || normalizedReviews.length === 0) return;

      const clamped = Math.max(0, Math.min(normalizedReviews.length - 1, targetIdx));
      const cards = Array.from(el.children) as HTMLElement[];
      const targetCard = cards[clamped];

      if (targetCard) {
        const left = targetCard.offsetLeft - el.offsetLeft;
        el.scrollTo({ left, behavior: 'smooth' });
      }
      setActiveIndex(clamped);
    },
    [normalizedReviews.length]
  );

  const handleStep = (direction: 'prev' | 'next') => {
    const nextIdx =
      direction === 'next'
        ? activeIndex + 1 >= normalizedReviews.length
          ? 0
          : activeIndex + 1
        : activeIndex - 1 < 0
          ? normalizedReviews.length - 1
          : activeIndex - 1;
    scrollToIndex(nextIdx);
  };

  if (normalizedReviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-5" data-testid="recent-reviews-carousel">
      {/* Header Row: Kicker, "Recent Reviews" Title, Trust Summary Badges, and Carousel Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.16em] text-[#C55B23]">
              Verified Guest Reflections
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1F332A]/10 border border-[#1F332A]/15 text-[#1F332A] text-[10.5px] font-semibold">
              <ShieldCheck className="w-3 h-3 text-[#C55B23]" />
              <span>100% Completed Stays</span>
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-serif text-[22px] sm:text-2xl lg:text-[28px] font-bold text-[#1F332A] tracking-tight leading-tight">
              Recent Reviews
            </h3>

            <div className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#1F332A]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDE2A8]/70 border border-[#E59866]/45 text-[#1F332A]">
                <Star className="w-3.5 h-3.5 fill-[#C55B23] text-[#C55B23]" />
                <span>{summary.averageRatingFormatted}</span>
              </span>
              <span className="text-[#5C5549] font-normal">
                ({summary.totalReviews} verified guest {summary.totalReviews === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Slide Counter + Prev/Next Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <span className="text-[11.5px] sm:text-xs font-medium text-[#5C5549] tabular-nums">
            Showing {activeIndex + 1} of {normalizedReviews.length}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleStep('prev')}
              aria-label="Previous review"
              className={cn(
                'w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#D5C8B3] bg-[#FFFDF9] hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer shadow-2xs',
                !canScrollLeft && activeIndex === 0 && 'opacity-75'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => handleStep('next')}
              aria-label="Next review"
              className={cn(
                'w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#D5C8B3] bg-[#FFFDF9] hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] flex items-center justify-center transition-colors cursor-pointer shadow-2xs',
                !canScrollRight && activeIndex === normalizedReviews.length - 1 && 'opacity-75'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Snap Carousel Track */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        role="region"
        aria-label="Recent guest reviews carousel"
        className="flex items-stretch gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1"
      >
        {normalizedReviews.map((review, idx) => {
          const propertyName = review.properties?.name || 'Uttarkunth Mountain Stay';
          const propertySlug = review.properties?.slug || 'yash-home-stay';
          const locality = [review.properties?.village, review.properties?.district]
            .filter(Boolean)
            .join(', ') || 'Jari, Kullu';
          const dateLabel = formatReviewDateLabel(review.created_at);
          const initials = getReviewerInitials(review.reviewer_name);
          const starCount = Math.max(1, Math.min(5, Math.round(review.rating)));

          return (
            <article
              key={review.id}
              data-testid={`review-card-${idx}`}
              className="group w-[86vw] max-w-[330px] sm:w-[320px] sm:max-w-none md:w-[340px] lg:w-[360px] shrink-0 snap-start rounded-[22px] border border-[#D5C8B3]/90 hover:border-[#C55B23]/55 bg-[#FFFDF9]/95 hover:bg-[#FFFDF9] p-4 sm:p-5 shadow-[0_8px_24px_-10px_rgba(31,51,42,0.09)] hover:shadow-[0_14px_30px_-10px_rgba(31,51,42,0.15)] transition-all duration-300 flex flex-col justify-between gap-4"
            >
              {/* Top Section: Rating Stars + Verified Booking Pill + Comment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="inline-flex items-center gap-1"
                    aria-label={`Rated ${starCount} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, starIdx) => (
                      <Star
                        key={starIdx}
                        className={cn(
                          'w-3.5 h-3.5 sm:w-4 sm:h-4',
                          starIdx < starCount
                            ? 'fill-[#C55B23] text-[#C55B23]'
                            : 'fill-transparent text-[#D5C8B3]'
                        )}
                      />
                    ))}
                    <span className="ml-1 text-xs font-bold text-[#1F332A] tabular-nums">
                      {starCount}.0
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAE2D3]/75 text-[#1F332A] text-[10.5px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-[#C55B23] shrink-0" />
                    <span>Verified Guest</span>
                  </span>
                </div>

                {/* Review Comment Body */}
                <div className="relative">
                  <Quote
                    aria-hidden="true"
                    className="w-4 h-4 text-[#C55B23]/35 mb-1"
                  />
                  <p className="font-sans text-[13px] sm:text-[13.5px] text-[#29251F] leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>
              </div>

              {/* Bottom Section: Reviewer Identity + Linked Stay Attribution */}
              <div className="pt-3 border-t border-[#E5DEC9] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#1F332A] text-[#FFF8EC] font-serif text-xs font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-[13px] font-semibold text-[#1F332A] truncate">
                        {review.reviewer_name}
                      </p>
                      <p className="text-[11px] text-[#5C5549]">
                        Stayed &middot; {dateLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Linked Property Pill */}
                <Link
                  href={`/stays/${propertySlug}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F5F0E6]/85 hover:bg-[#EAE2D3]/85 border border-[#E5DEC9] transition-colors text-inherit no-underline group/stay"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
                    <span className="text-[11.5px] sm:text-xs font-semibold text-[#1F332A] group-hover/stay:text-[#C55B23] transition-colors truncate">
                      {propertyName}
                    </span>
                    <span className="text-[11px] text-[#5C5549] truncate">
                      &middot; {locality}
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#5C5549] group-hover/stay:text-[#C55B23] shrink-0 transition-transform group-hover/stay:translate-x-0.5 group-hover/stay:-translate-y-0.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Interactive Carousel Dots & Platform Integrity Note */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div
          role="tablist"
          aria-label="Select review slide"
          className="flex items-center justify-center gap-1.5"
        >
          {normalizedReviews.map((rev, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={rev.id}
                type="button"
                role="tab"
                suppressHydrationWarning
                aria-selected={isActive}
                aria-label={`Go to review ${idx + 1} by ${rev.reviewer_name}`}
                onClick={() => scrollToIndex(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                  isActive
                    ? 'w-6 bg-[#1F332A]'
                    : 'w-2 bg-[#D5C8B3] hover:bg-[#C55B23]/70'
                )}
              />
            );
          })}
        </div>

        <p className="text-[11px] text-[#5C5549] text-center sm:text-right">
          Reviews are submitted by guests after completed stays and verified before publication.
        </p>
      </div>
    </div>
  );
}
