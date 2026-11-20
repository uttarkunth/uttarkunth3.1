'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PropertyImage } from '@/components/property-image';
import { PropertyQuickViewButton } from '@/components/stays/property-quick-view-modal';
import { getPropertyPhotoList } from '@/lib/property-images';
import {
  classifyAmenityIcon,
  formatPropertyTypeLabel,
  normalizeAmenitiesList,
  type AmenityIconCategory,
} from '@/lib/property-quick-view';
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
  MapPin,
  Mountain,
  PawPrint,
  ShieldCheck,
  Shirt,
  Sun,
  Utensils,
  Wifi,
} from 'lucide-react';

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
    <article
      data-testid={`stays-result-card-${property.slug}`}
      className="group relative bg-[#FFFDF9] rounded-[16px] border border-[#D9CCB8] hover:border-[#C55B23]/55 overflow-hidden shadow-[0_6px_22px_-8px_rgba(38,61,50,0.09)] hover:shadow-[0_14px_32px_-10px_rgba(38,61,50,0.16)] hover:-translate-y-[1px] transition-all duration-300 flex flex-col lg:grid lg:grid-cols-[35%_43%_22%] lg:min-h-[258px] lg:max-h-[286px]"
    >
      {/* ─────────────────────────────────────────────────────────────────────
          LEFT — PROPERTY PHOTOGRAPHY (35% on Desktop)
      ───────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:h-full bg-[#263D32] overflow-hidden shrink-0">
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

          {/* Subtle gradient vignette for photo counter legibility */}
          {totalPhotos > 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
            />
          )}
        </Link>

        {/* Subtle Image Navigation Arrows & Photo Counter when multiple genuine photos exist */}
        {totalPhotos > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              aria-label={`Previous photo of ${property.name}`}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A2B23]/65 hover:bg-[#1A2B23]/90 text-[#FFFDF9] border border-[#FFFDF9]/25 backdrop-blur-sm flex items-center justify-center opacity-85 hover:opacity-100 transition-all duration-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextPhoto}
              aria-label={`Next photo of ${property.name}`}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A2B23]/65 hover:bg-[#1A2B23]/90 text-[#FFFDF9] border border-[#FFFDF9]/25 backdrop-blur-sm flex items-center justify-center opacity-85 hover:opacity-100 transition-all duration-200 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              data-testid={`stays-card-photo-counter-${property.slug}`}
              className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 px-2.5 py-0.5 rounded-full bg-[#1A2B23]/75 backdrop-blur-sm border border-[#FFFDF9]/20 font-sans text-[11px] font-medium text-[#FFFDF9] tabular-nums tracking-wide"
            >
              {photoIndex + 1} / {totalPhotos}
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          CENTRE (43% on Desktop) & RIGHT (22% on Desktop)
          • On Tablet (md to lg): 2-column split [1fr_240px] so text is never compressed
          • On Desktop (lg+): Direct children via contents so 35% | 43% | 22% grid applies
      ───────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:grid md:grid-cols-[1fr_240px] lg:contents flex-1">
        {/* CENTRE — PROPERTY INFORMATION (43% on Desktop) */}
        <div className="p-5 sm:p-6 lg:px-6 lg:py-5 flex flex-col justify-between gap-3.5 min-w-0">
          <div className="space-y-2.5">
            {/* Property Type, Verification Indicator & Quick View */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F5F0E6] border border-[#D9CCB8] text-[#263D32] text-[11px] font-semibold tracking-wide">
                  {propertyTypeLabel}
                </span>
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
            <div className="pt-2.5 border-t border-[#E8DFD1] flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {displayedAmenities.map((amenity) => (
                <div
                  key={amenity.label}
                  className="inline-flex items-center gap-1.5 font-sans text-[12px] font-normal text-[#29251F]"
                >
                  <MinimalAmenityIcon category={amenity.icon} />
                  <span className="truncate max-w-[190px]">{amenity.label}</span>
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
              className="font-sans w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#263D32] hover:bg-[#C55B23] text-[#FFFDF9] font-semibold text-xs sm:text-[13px] tracking-wide transition-colors duration-200 shadow-xs"
            >
              <span>View Stay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
