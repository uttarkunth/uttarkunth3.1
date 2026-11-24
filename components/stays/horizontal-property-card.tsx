'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PropertyImage } from '@/components/property-image';
import { PropertyQuickViewModal } from '@/components/stays/property-quick-view-modal';
import { getPropertyPhotoList } from '@/lib/property-images';
import {
  formatPropertyTypeLabel,
  type AmenityIconCategory,
} from '@/lib/property-quick-view';
import {
  computePropertyRatingSummary,
  formatCardAmenities,
  getPropertyStartingRate,
  type BoundingBoxRect,
} from '@/lib/stays-card-transition';
import {
  FAVOURITES_UPDATED_EVENT,
  isEcosystemItemSaved,
  toggleSavedEcosystemItem,
} from '@/lib/favourites';
import { formatINR } from '@/lib/utils';
import {
  Building2,
  Car,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Compass,
  Droplets,
  Eye,
  Flame,
  Heart,
  MapPin,
  Mountain,
  PawPrint,
  Shirt,
  Star,
  Sun,
  Utensils,
  Wifi,
} from 'lucide-react';

function MinimalAmenityIcon({ category }: { category: AmenityIconCategory }) {
  const iconProps = {
    strokeWidth: 1.75,
    className: 'w-3 h-3 md:w-3.5 md:h-3.5 text-[#263D32] shrink-0',
  };
  switch (category) {
    case 'wifi':
      return <Wifi {...iconProps} />;
    case 'mountain':
      return <Mountain {...iconProps} />;
    case 'meals':
      return <Utensils {...iconProps} />;
    case 'tea':
      return <Coffee {...iconProps} />;
    case 'parking':
      return <Car {...iconProps} />;
    case 'balcony':
      return <Sun {...iconProps} />;
    case 'kitchen':
      return <ChefHat {...iconProps} />;
    case 'laundry':
      return <Shirt {...iconProps} />;
    case 'pet':
      return <PawPrint {...iconProps} />;
    case 'water':
      return <Droplets {...iconProps} />;
    case 'hike':
      return <Compass {...iconProps} />;
    case 'bonfire':
      return <Flame {...iconProps} />;
    default:
      return <CheckCircle2 {...iconProps} />;
  }
}

export interface HorizontalPropertyCardProps {
  property: Record<string, any>;
}

export function HorizontalPropertyCard({ property }: HorizontalPropertyCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [heartPopKey, setHeartPopKey] = useState(0);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewOriginRect, setQuickViewOriginRect] = useState<BoundingBoxRect | null>(null);

  const photos = getPropertyPhotoList(property?.cover_photo, property?.photos);
  const totalPhotos = photos.length;
  const activePhoto = totalPhotos > 0 ? photos[photoIndex % totalPhotos] : null;

  const startingRate = getPropertyStartingRate(property);
  const { desktopAmenities } = formatCardAmenities(
    property?.amenities,
    3,
    3
  );
  const ratingSummary = computePropertyRatingSummary(property);

  const propertyTypeLabel = formatPropertyTypeLabel(property?.property_type);

  const locationParts = [property?.village, property?.district, property?.state]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  const locationText =
    locationParts.length > 0 ? locationParts.slice(0, 2).join(', ') : 'Jari, Kullu';

  const propertySlug = String(property?.slug || property?.id || 'stay');
  const propertyId = String(property?.id || property?.slug || 'stay');
  const detailHref = `/stays/${propertySlug}`;

  useEffect(() => {
    const syncSaved = () => {
      setIsSaved(isEcosystemItemSaved('stays', propertySlug));
    };
    syncSaved();
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
    return () => {
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
    };
  }, [propertySlug]);

  const measureLiveCtaRect = useCallback((): BoundingBoxRect | null => {
    if (!ctaRef.current) return quickViewOriginRect;
    const r = ctaRef.current.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return quickViewOriginRect;
    return {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    };
  }, [quickViewOriginRect]);

  const handleToggleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleSavedEcosystemItem({
      id: propertySlug,
      category: 'stays',
      title: property?.name || 'Mountain Stay',
      subtitle: locationText,
      href: detailHref,
      meta: startingRate ? `${formatINR(startingRate)} / night` : undefined,
    });
    setIsSaved(result.saved);
    setHeartPopKey((k) => k + 1);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (totalPhotos <= 1) return;
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (totalPhotos <= 1) return;
    setPhotoIndex((prev) => (prev + 1) % totalPhotos);
  };

  const handleOpenQuickView = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const btn = ctaRef.current || e.currentTarget;
    const rect = btn.getBoundingClientRect();
    setQuickViewOriginRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = useCallback(() => {
    setIsQuickViewOpen(false);
  }, []);

  const handleCardSurfaceClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('a, button, [role="dialog"]')) {
      return;
    }
    router.push(detailHref);
  };

  const rawDescription =
    typeof property?.description === 'string' ? property.description.trim() : '';

  return (
    <>
      <article
        ref={cardRef}
        onClick={handleCardSurfaceClick}
        data-testid={`stays-result-card-${propertySlug}`}
        data-uk-property-card={propertySlug}
        data-uk-property-id={propertyId}
        className="uk-tactile-card group relative z-10 bg-[#FFFDF9] rounded-[20px] md:rounded-[24px] border border-[#D9CCB8] hover:border-[#C55B23]/45 p-3 sm:p-3.5 md:p-4 lg:p-5 flex flex-row items-stretch gap-3 sm:gap-3.5 md:grid md:grid-cols-[256px_1fr_204px] lg:grid-cols-[296px_1fr_224px] md:gap-5 lg:gap-6 cursor-pointer"
      >
        {/* ─────────────────────────────────────────────────────────────────────
            1. LEFT — PROPERTY PHOTOGRAPHY
            • Mobile: Compact ~106px–118px wide rounded frame with bottom-left Guest favourite tag
            • Desktop: Refined rounded 4:3 / 16:11 editorial frame with top-left Guest favourite tag
        ───────────────────────────────────────────────────────────────────── */}
        <div className="relative w-[104px] sm:w-[118px] min-h-[116px] md:w-full md:h-[192px] lg:h-[204px] rounded-[14px] md:rounded-[16px] bg-[#263D32] overflow-hidden shrink-0 self-stretch md:self-center">
          <Link
            href={detailHref}
            aria-label={`View ${property.name}`}
            className="relative block w-full h-full"
          >
            {activePhoto ? (
              <PropertyImage
                src={activePhoto}
                alt={`${property.name} — photo ${photoIndex + 1}`}
                fill
                sizes="(max-width: 767px) 128px, (max-width: 1024px) 270px, 310px"
                transformWidth={640}
                transformHeight={440}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-[#F5F0E6] flex flex-col items-center justify-center p-3 text-center text-[#263D32]">
                <Building2 className="w-7 h-7 md:w-9 md:h-9 text-[#263D32]/40 mb-1" />
                <span className="font-serif text-xs md:text-base font-medium line-clamp-1">
                  {property.name}
                </span>
              </div>
            )}

            {/* Subtle Top & Bottom Scrim for Badge & Heart Contrast */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/25 to-transparent"
            />
            <div
              aria-hidden="true"
              className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/35 to-transparent"
            />
          </Link>

          {/* Homepage-Style "Guest favourite" Pill Badge */}
          {ratingSummary.isGuestFavourite && (
            <div
              data-testid={`stays-card-guest-favourite-${propertySlug}`}
              className="absolute bottom-1.5 left-1.5 md:bottom-auto md:top-2.5 md:left-2.5 z-20 pointer-events-none"
            >
              <span className="inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-[#1A2B23]/65 backdrop-blur-md border border-[#FFFDF9]/25 text-[#FFF8EC] text-[9.5px] md:text-[11px] font-semibold tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.22)]">
                Guest favourite
              </span>
            </div>
          )}

          {/* Favourite Button — Accessible Touch Target */}
          <button
            key={heartPopKey}
            type="button"
            data-testid={`stays-card-favourite-button-${propertySlug}`}
            onClick={handleToggleHeart}
            aria-label={
              isSaved ? `Remove ${property.name} from saved stays` : `Save ${property.name}`
            }
            aria-pressed={isSaved}
            className="absolute top-0.5 right-0.5 md:top-1.5 md:right-1.5 z-20 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center cursor-pointer focus:outline-none"
          >
            <span
              className={`w-7 h-7 md:w-8 md:h-8 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xs transition-colors duration-200 ${
                heartPopKey > 0 ? 'animate-uk-heart-pop' : ''
              } ${
                isSaved
                  ? 'bg-[#C55B23] border-[#C55B23] text-[#FFFDF9]'
                  : 'bg-[#18261F]/45 hover:bg-[#18261F]/70 border-white/25 text-[#FFFDF9]'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-transform ${
                  isSaved ? 'fill-[#FFFDF9] text-[#FFFDF9]' : 'text-[#FFFDF9]'
                }`}
              />
            </span>
          </button>

          {/* Subtle Desktop Image Navigation Arrows on Hover */}
          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                aria-label={`Previous photo of ${property.name}`}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#1A2B23]/65 hover:bg-[#1A2B23]/90 text-[#FFFDF9] border border-[#FFFDF9]/20 backdrop-blur-xs items-center justify-center opacity-0 group-hover:opacity-95 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                aria-label={`Next photo of ${property.name}`}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#1A2B23]/65 hover:bg-[#1A2B23]/90 text-[#FFFDF9] border border-[#FFFDF9]/20 backdrop-blur-xs items-center justify-center opacity-0 group-hover:opacity-95 focus-visible:opacity-100 transition-opacity duration-200 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            2 & 3. CENTRE (PROPERTY INFORMATION) & RIGHT (PRICING + QUICK VIEW)
            • Mobile: Stacked compact column on right of image with full wrapping amenities and lower [Green Rate Badge | Eye Quick View Button] row
            • Desktop (md:contents): Dissolves into Column 2 (Centre) and Column 3 (Right)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 md:contents">
          {/* 2. CENTRE — PROPERTY INFORMATION */}
          <div className="flex flex-col justify-between min-w-0 md:py-0.5">
            <div className="space-y-0.5 md:space-y-1.5 min-w-0">
              {/* Category Label ("Homestay") + Genuine Rating Indicator */}
              <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-sans font-semibold uppercase tracking-[0.1em] text-[#665E52]">
                <span data-testid={`stays-card-category-${propertySlug}`} className="truncate">
                  {propertyTypeLabel}
                </span>
                {ratingSummary.hasGenuineReviews && ratingSummary.averageRatingLabel && (
                  <>
                    <span aria-hidden="true" className="text-[#B8AC99]">
                      &middot;
                    </span>
                    <span
                      data-testid={`stays-card-rating-${propertySlug}`}
                      className="inline-flex items-center gap-0.5 text-[#29251F] font-semibold normal-case tracking-normal shrink-0"
                    >
                      <Star className="w-3 h-3 fill-[#C55B23] text-[#C55B23] shrink-0" />
                      <span>{ratingSummary.averageRatingLabel}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Editorial Property Name in Cormorant Garamond */}
              <h3 className="font-serif font-semibold text-[18px] sm:text-[20px] md:text-[26px] lg:text-[28px] text-[#29251F] group-hover:text-[#263D32] transition-colors leading-[1.15] tracking-tight line-clamp-1">
                <Link
                  href={detailHref}
                  className="hover:underline focus:outline-none"
                >
                  {property.name}
                </Link>
              </h3>

              {/* Location with Small Map-Pin Icon & Manrope */}
              <div className="flex items-center gap-1 font-sans text-[11.5px] md:text-[13px] font-medium text-[#5C5549] truncate">
                <MapPin
                  strokeWidth={1.75}
                  className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#C55B23] shrink-0"
                />
                <span className="truncate">{locationText}</span>
              </div>

              {/* Desktop Only: Short 1–2 Line Property Description */}
              {rawDescription.length > 0 && (
                <p className="hidden md:block font-sans font-normal text-[13.5px] text-[#5C5549] md:line-clamp-2 leading-relaxed pt-0.5 max-w-[54ch]">
                  {rawDescription}
                </p>
              )}
            </div>

            {/* Amenities:
                • Mobile (< md): Compact icon-only circular badges (Meals, Mountain View, Hot Water, Wi-Fi, etc.) in a single row so the mobile card height stays compact and balanced
                • Desktop (md+): Icon + text pills */}
            {desktopAmenities.length > 0 && (
              <div
                data-testid={`stays-card-desktop-amenities-${propertySlug}`}
                className="flex flex-wrap items-center gap-1.5 md:gap-2 pt-1 md:pt-2.5"
              >
                {desktopAmenities.map((amenity) => (
                  <span
                    key={amenity.label}
                    title={amenity.label}
                    aria-label={amenity.label}
                    className="inline-flex items-center justify-center w-6 h-6 md:w-auto md:h-auto md:gap-1.5 md:px-3 md:py-1 rounded-full bg-[#F5F0E6] border border-[#E5DBC9]/80 md:border-transparent text-[#29251F] font-sans text-[12px] font-medium leading-snug shrink-0"
                  >
                    <MinimalAmenityIcon category={amenity.icon} />
                    <span className="sr-only md:not-sr-only">{amenity.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. RIGHT (Desktop) / LOWER ROW (Mobile) — GREEN RATE BADGE AND IN-PAGE QUICK VIEW CTA */}
          <div className="flex flex-row items-center justify-between gap-2 pt-2 border-t border-[#EAE2D3]/75 md:border-t-0 md:border-l md:border-[#E8DFD1]/85 md:pl-5 lg:pl-6 md:pt-1 md:pb-1 md:flex-col md:items-start md:justify-between">
            {/* Pricing Block — Rate Highlighted in Forest Green Background */}
            <div className="min-w-0">
              {startingRate !== null ? (
                <>
                  <span className="hidden md:block font-sans text-[10.5px] font-semibold uppercase tracking-[0.11em] text-[#665E52]">
                    STARTING FROM
                  </span>
                  <div
                    data-testid={`stays-card-price-badge-${propertySlug}`}
                    className="inline-flex items-baseline gap-1 md:gap-1.5 px-2.5 py-1 md:px-3.5 md:py-1.5 md:mt-1.5 rounded-lg md:rounded-xl bg-[#263D32] text-[#FFFDF9] shadow-[0_3px_10px_rgba(38,61,50,0.16)]"
                  >
                    <span className="font-sans text-[14px] sm:text-[15.5px] md:text-[22px] lg:text-[24px] font-bold text-[#FFFDF9] tabular-nums tracking-tight leading-none">
                      {formatINR(startingRate)}
                    </span>
                    <span className="font-sans text-[10.5px] md:text-[11.5px] font-medium text-[#FAF4E8]/90 whitespace-nowrap">
                      / night
                    </span>
                  </div>
                  <span className="hidden md:block font-sans text-[12px] font-medium text-[#5C5549] mt-1.5">
                    Per room &middot; Direct host payment
                  </span>
                </>
              ) : (
                <>
                  <span className="hidden md:block font-sans text-[10.5px] font-semibold uppercase tracking-[0.11em] text-[#665E52]">
                    STARTING FROM
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-[#263D32] text-[#FFFDF9] font-sans text-xs font-semibold md:mt-1.5">
                    Rates on request
                  </span>
                </>
              )}
            </div>

            {/* In-Page Quick View CTA:
                • Mobile (< md): Compact circular Eye-icon-only button so it never overlaps any element on any phone width
                • Desktop (md+): Full editorial Eye icon + "Quick View" pill button below the rate */}
            <button
              ref={ctaRef}
              type="button"
              onClick={handleOpenQuickView}
              data-testid={`quick-view-trigger-${propertySlug}`}
              data-uk-quick-view-cta={propertySlug}
              data-uk-quick-view-cta-id={propertyId}
              title={`Quick View ${property.name}`}
              aria-label={`Quick View ${property.name}`}
              aria-haspopup="dialog"
              aria-expanded={isQuickViewOpen}
              className="group/qv font-sans w-9 h-9 md:w-full md:h-auto md:min-h-[44px] inline-flex items-center justify-center md:gap-2 p-0 md:px-4 md:py-2.5 rounded-full bg-[#F5F0E6] hover:bg-[#263D32] text-[#263D32] hover:text-[#FFFDF9] border border-[#263D32]/30 hover:border-[#263D32] focus:outline-none font-semibold text-[12px] md:text-[13px] tracking-wide transition-colors duration-200 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#C55B23] group-hover/qv:text-[#FFFDF9] transition-colors shrink-0" />
              <span className="hidden md:inline">Quick View</span>
            </button>
          </div>
        </div>
      </article>

      {/* In-Page Animated Quick View Modal — Expands smoothly from & Collapses smoothly back into the Quick View CTA */}
      <PropertyQuickViewModal
        property={property}
        isOpen={isQuickViewOpen}
        originRect={quickViewOriginRect}
        getOriginRect={measureLiveCtaRect}
        onClose={handleCloseQuickView}
      />
    </>
  );
}
