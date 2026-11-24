'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PropertyImage } from '@/components/property-image';
import { PropertyQuickViewButton } from '@/components/stays/property-quick-view-modal';
import { getPropertyPhotoList } from '@/lib/property-images';
import {
  formatPropertyTypeLabel,
  normalizeAmenitiesList,
  type AmenityIconCategory,
} from '@/lib/property-quick-view';
import {
  FAVOURITES_UPDATED_EVENT,
  isEcosystemItemSaved,
  toggleSavedEcosystemItem,
} from '@/lib/favourites';
import { formatINR } from '@/lib/utils';
import {
  ArrowRight,
  Building2,
  Car,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Compass,
  Droplets,
  Flame,
  Heart,
  MapPin,
  Mountain,
  PawPrint,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Sun,
  Utensils,
  Wifi,
} from 'lucide-react';
import { isPropertyGuestFavourite } from '@/lib/stays-search';

function MinimalAmenityIcon({ category }: { category: AmenityIconCategory }) {
  const iconProps = {
    strokeWidth: 1.75,
    className: 'w-3.5 h-3.5 text-[#C55B23] shrink-0',
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

function getActualStartingRate(property: Record<string, any>): number | null {
  const rooms = Array.isArray(property?.rooms)
    ? property.rooms.filter((r: any) => r && r.active !== false)
    : [];

  const validRoomPrices = rooms
    .map((r: any) => Number(r.base_price))
    .filter((price: number) => Number.isFinite(price) && price > 0);

  if (validRoomPrices.length > 0) {
    return Math.min(...validRoomPrices);
  }

  const directPrice = Number(property?.base_price ?? property?.starting_price);
  if (Number.isFinite(directPrice) && directPrice > 0) {
    return directPrice;
  }

  return null;
}

function extractMealInfo(rawAmenities: unknown): string | null {
  const normalized = normalizeAmenitiesList(rawAmenities);
  const mealAmenity = normalized.find((a) => a.icon === 'meals');
  return mealAmenity ? mealAmenity.label : null;
}

export interface HorizontalPropertyCardProps {
  property: Record<string, any>;
}

export function HorizontalPropertyCard({ property }: HorizontalPropertyCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [heartPopKey, setHeartPopKey] = useState(0);

  const photos = getPropertyPhotoList(property?.cover_photo, property?.photos);
  const totalPhotos = photos.length;
  const activePhoto = totalPhotos > 0 ? photos[photoIndex % totalPhotos] : null;

  const startingRate = getActualStartingRate(property);
  const amenities = normalizeAmenitiesList(property?.amenities);
  const displayedAmenities = amenities.slice(0, 4);
  const extraAmenitiesCount = Math.max(0, amenities.length - displayedAmenities.length);

  const mealInfo = extractMealInfo(property?.amenities);
  const propertyTypeLabel = formatPropertyTypeLabel(property?.property_type);
  const isVerified =
    property?.moderation_status === 'approved' || property?.published === true;
  const isGuestFav = isPropertyGuestFavourite(property);
  const isRequestBased =
    !property?.booking_mode || property?.booking_mode === 'request_only';

  const locationParts = [
    property?.village,
    property?.district,
    property?.state,
  ]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  const locationText =
    locationParts.length > 0 ? locationParts.slice(0, 2).join(', ') : 'Jari, Kullu';

  const itemId = String(property?.slug || property?.id || 'stay');

  useEffect(() => {
    const syncSaved = () => {
      setIsSaved(isEcosystemItemSaved('stays', itemId));
    };
    syncSaved();
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
    return () => {
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
    };
  }, [itemId]);

  const handleToggleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleSavedEcosystemItem({
      id: itemId,
      category: 'stays',
      title: property?.name || 'Mountain Stay',
      subtitle: locationText,
      href: `/stays/${property.slug}`,
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

  return (
    <div className="relative py-1">
      <article
        data-testid={`stays-result-card-${property.slug}`}
        className="uk-tactile-card group relative z-10 bg-[#FFFDF9] rounded-[24px] border border-[#D9CCB8] hover:border-[#C55B23]/50 overflow-hidden flex flex-col lg:grid lg:grid-cols-[36%_42%_22%] lg:min-h-[268px] lg:max-h-[296px]"
      >
        {/* ─────────────────────────────────────────────────────────────────────
            LEFT — TACTILE HERO PHOTOGRAPHY DECK (36% on Desktop)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="relative w-full aspect-[16/11] sm:aspect-[16/9] lg:aspect-auto lg:h-full bg-[#263D32] overflow-hidden shrink-0">
          <Link
            href={`/stays/${property.slug}`}
            aria-label={`View ${property.name}`}
            className="relative block w-full h-full"
          >
            {activePhoto ? (
              <PropertyImage
                src={activePhoto}
                alt={`${property.name} — photo ${photoIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 420px"
                transformWidth={720}
                transformHeight={480}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 bg-[#F5F0E6] flex flex-col items-center justify-center p-6 text-center text-[#263D32]">
                <Building2 className="w-10 h-10 text-[#263D32]/40 mb-2" />
                <span className="font-serif text-lg font-medium">{property.name}</span>
                <span className="font-sans text-[11px] text-[#665E52] uppercase tracking-wider mt-1">
                  {propertyTypeLabel}
                </span>
              </div>
            )}

            {/* Smooth Dark Bottom Gradient Overlay (for floating price pill & photo counter legibility) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
            />
          </Link>

          {/* Top-Left Floating Frosted-Glass Badge + Top-Right Liquid-Pop Heart Button (Video 00:02–00:06) */}
          <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5">
              {isGuestFav ? (
                <span className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFDF9]/92 backdrop-blur-md border border-[#D9CCB8]/80 text-[#29251F] font-sans text-[11px] font-semibold shadow-sm">
                  <Sparkles className="w-3 h-3 text-[#C55B23] shrink-0" />
                  <span>Guest Favourite</span>
                </span>
              ) : (
                <span className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFDF9]/90 backdrop-blur-md border border-[#D9CCB8]/80 text-[#263D32] font-sans text-[11px] font-semibold shadow-sm">
                  <span>{propertyTypeLabel}</span>
                </span>
              )}
            </div>

            <button
              key={heartPopKey}
              type="button"
              data-testid={`stays-card-favourite-button-${property.slug}`}
              onClick={handleToggleHeart}
              aria-label={
                isSaved ? `Remove ${property.name} from saved stays` : `Save ${property.name}`
              }
              aria-pressed={isSaved}
              className={`pointer-events-auto w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center shadow-md transition-colors duration-200 cursor-pointer ${
                heartPopKey > 0 ? 'animate-uk-heart-pop' : ''
              } ${
                isSaved
                  ? 'bg-[#C55B23] border-[#C55B23] text-[#FFFDF9]'
                  : 'bg-[#18261F]/45 hover:bg-[#18261F]/70 border-white/25 text-[#FFFDF9]'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isSaved ? 'fill-[#FFFDF9] text-[#FFFDF9]' : 'text-[#FFFDF9]'
                }`}
              />
            </button>
          </div>

          {/* Subtle Image Navigation Arrows & Bottom Floating Dark-Glass Price + Photo Counter */}
          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                aria-label={`Previous photo of ${property.name}`}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#1A2B23]/65 hover:bg-[#1A2B23]/90 text-[#FFFDF9] border border-[#FFFDF9]/25 backdrop-blur-sm flex items-center justify-center opacity-85 hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                aria-label={`Next photo of ${property.name}`}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#1A2B23]/65 hover:bg-[#1A2B23]/90 text-[#FFFDF9] border border-[#FFFDF9]/25 backdrop-blur-sm flex items-center justify-center opacity-85 hover:opacity-100 transition-all duration-200 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="pointer-events-none absolute bottom-3 inset-x-3 z-20 flex items-center justify-between gap-2">
            {/* Floating Dark-Glass Tariff Pill on Photo (Video 00:02–00:06) */}
            {startingRate !== null && (
              <div className="px-3 py-1 rounded-xl bg-[#18261F]/80 backdrop-blur-md border border-white/15 text-[#FFFDF9] font-sans text-xs font-bold tabular-nums shadow-sm">
                {formatINR(startingRate)}
                <span className="font-normal text-[10.5px] text-[#FAF4E8]/85"> / night</span>
              </div>
            )}

            {totalPhotos > 1 && (
              <div
                data-testid={`stays-card-photo-counter-${property.slug}`}
                className="ml-auto px-2.5 py-0.5 rounded-full bg-[#1A2B23]/75 backdrop-blur-sm border border-[#FFFDF9]/20 font-sans text-[11px] font-medium text-[#FFFDF9] tabular-nums tracking-wide"
              >
                {photoIndex + 1} / {totalPhotos}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            CENTRE (42% on Desktop) & RIGHT (22% on Desktop)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_240px] lg:contents flex-1">
          {/* CENTRE — PROPERTY INFORMATION (42% on Desktop) */}
          <div className="p-5 sm:p-6 lg:px-6 lg:py-5 flex flex-col justify-between gap-3.5 min-w-0">
            <div className="space-y-2.5">
              {/* Property Type, Verification Indicator & Quick View */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F5F0E6] border border-[#D9CCB8] text-[#263D32] text-[11px] font-semibold tracking-wide">
                    {propertyTypeLabel}
                  </span>
                  {isGuestFav && (
                    <span
                      data-testid={`stays-card-guest-favourite-${property.slug}`}
                      className="font-sans inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#263D32]/10 border border-[#263D32]/25 text-[#263D32] text-[11px] font-semibold"
                    >
                      <Star className="w-3 h-3 fill-[#C55B23] text-[#C55B23] shrink-0" />
                      <span>5.0 &bull; Guest Favourite</span>
                    </span>
                  )}
                  {isVerified && (
                    <span className="font-sans inline-flex items-center gap-1 text-[11px] font-medium text-[#263D32]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
                      <span>Verified Himalayan Host</span>
                    </span>
                  )}
                </div>
                <PropertyQuickViewButton property={property} variant="compact" />
              </div>

              {/* Property Name in Cormorant Garamond, Medium + Location with Minimal Map-Pin Icon */}
              <div className="space-y-1">
                <h3 className="font-serif font-medium text-2xl sm:text-[26px] text-[#263D32] group-hover:text-[#C55B23] transition-colors leading-[1.15] tracking-tight">
                  <Link
                    href={`/stays/${property.slug}`}
                    className="hover:underline focus:outline-none"
                  >
                    {property.name}
                  </Link>
                </h3>

                <div className="flex items-center gap-1.5 font-sans text-xs font-medium text-[#665E52]">
                  <MapPin
                    strokeWidth={1.75}
                    className="w-3.5 h-3.5 text-[#C55B23] shrink-0"
                  />
                  <span>{locationText}</span>
                </div>
              </div>

              {/* Short Property Description */}
              {property.description && (
                <p className="font-sans font-normal text-[13px] text-[#5C5549] line-clamp-2 leading-relaxed">
                  {property.description}
                </p>
              )}
            </div>

            {/* 3–4 Important Amenities with Minimalist Icons */}
            {displayedAmenities.length > 0 && (
              <div className="pt-2.5 border-t border-[#E8DFD1] flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                {displayedAmenities.map((amenity) => (
                  <div
                    key={amenity.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F0E6]/70 border border-[#D9CCB8]/70 font-sans text-[11.5px] font-medium text-[#29251F]"
                  >
                    <MinimalAmenityIcon category={amenity.icon} />
                    <span className="truncate max-w-[170px]">{amenity.label}</span>
                  </div>
                ))}
                {extraAmenitiesCount > 0 && (
                  <span className="font-sans text-[11px] font-semibold text-[#665E52]">
                    +{extraAmenitiesCount} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — PRICING & BOOKING (22% on Desktop) */}
          <div className="bg-[#F5F0E6]/80 border-t md:border-t-0 md:border-l border-[#D9CCB8]/85 p-5 sm:p-6 lg:px-5 lg:py-5 flex flex-col justify-between gap-3.5">
            <div className="space-y-2.5">
              {/* Actual Starting Room Rate with Clear Pricing Basis */}
              {startingRate !== null ? (
                <div>
                  <span className="font-sans block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#665E52]">
                    Starting from
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="font-sans text-2xl sm:text-[26px] font-semibold text-[#263D32] tabular-nums tracking-tight leading-none">
                      {formatINR(startingRate)}
                    </span>
                    <span className="font-sans text-xs font-normal text-[#665E52]">
                      / night
                    </span>
                  </div>
                  <span className="font-sans block text-[11px] font-normal text-[#665E52] mt-1">
                    Per room &bull; 100% direct to host
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-sans block text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#665E52]">
                    Tariff &amp; Availability
                  </span>
                  <p className="font-sans text-sm font-semibold text-[#263D32] mt-1">
                    Contact host for rates
                  </p>
                </div>
              )}

              {/* Relevant Meal Information, where available */}
              {mealInfo && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFFDF9] border border-[#D9CCB8]/90 text-[#263D32] font-sans text-[11px] font-medium">
                  <Utensils className="w-3 h-3 text-[#C55B23] shrink-0" />
                  <span className="line-clamp-1">{mealInfo}</span>
                </div>
              )}
            </div>

            {/* Request-Based Booking Indicator & Prominent "View Stay" CTA */}
            <div className="space-y-2.5">
              {isRequestBased && (
                <div className="flex items-center gap-1.5 font-sans text-[11px] font-medium text-[#665E52]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C55B23] shrink-0" />
                  <span>Request-based booking</span>
                </div>
              )}

              <Link
                href={`/stays/${property.slug}`}
                className="font-sans w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#263D32] hover:bg-[#C55B23] text-[#FFFDF9] font-semibold text-xs sm:text-[13px] tracking-wide transition-colors duration-200 shadow-xs"
              >
                <span>View Stay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
