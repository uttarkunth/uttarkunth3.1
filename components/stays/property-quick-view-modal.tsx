'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { PropertyImage } from '@/components/property-image';
import {
  normalizePropertyQuickView,
  type AmenityIconCategory,
  type PropertyQuickViewDetails,
} from '@/lib/property-quick-view';
import { formatINR } from '@/lib/utils';
import {
  FAVOURITES_UPDATED_EVENT,
  isEcosystemItemSaved,
  toggleSavedEcosystemItem,
} from '@/lib/favourites';
import {
  ArrowRight,
  BedDouble,
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
  ShieldCheck,
  Shirt,
  Sun,
  Users,
  Utensils,
  Wifi,
  X,
} from 'lucide-react';

function AmenityIcon({ category }: { category: AmenityIconCategory }) {
  const iconProps = { className: 'w-4 h-4 text-[#C55B23] shrink-0' };
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

export interface PropertyQuickViewModalProps {
  property: Record<string, any>;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyQuickViewModal({
  property,
  isOpen,
  onClose,
}: PropertyQuickViewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const titleId = useId();
  const descId = useId();

  const details: PropertyQuickViewDetails = normalizePropertyQuickView(property);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setPhotoIndex(0);

    const syncSaved = () => {
      setIsSaved(isEcosystemItemSaved('stays', details.slug || details.id));
    };
    syncSaved();
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && details.photos.length > 1) {
        setPhotoIndex((prev) => (prev + 1) % details.photos.length);
      } else if (e.key === 'ArrowLeft' && details.photos.length > 1) {
        setPhotoIndex((prev) => (prev - 1 + details.photos.length) % details.photos.length);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncSaved);
    };
  }, [isOpen, details.id, details.slug, details.photos.length, onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  const activePhoto = details.photos[photoIndex] || details.photos[0] || null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-[#131F19]/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-testid={`quick-view-modal-${details.slug}`}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#FFFDF9] rounded-3xl border border-[#D9CCB8] shadow-[0_24px_64px_rgba(15,25,20,0.38)] overflow-hidden flex flex-col lg:grid lg:grid-cols-[1.05fr_1.15fr]"
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          aria-label={`Close quick view for ${details.name}`}
          data-testid="quick-view-close-button"
          className="absolute top-3.5 right-3.5 z-40 w-9 h-9 rounded-full bg-[#1F332A]/85 hover:bg-[#C55B23] text-[#FFFDF9] flex items-center justify-center transition-colors shadow-md cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Photo Showcase & Gallery Switcher */}
        <div className="relative bg-[#1F332A] flex flex-col justify-between min-h-[230px] sm:min-h-[290px] lg:min-h-[480px]">
          <div className="relative flex-1 w-full min-h-[230px] sm:min-h-[290px] lg:min-h-full overflow-hidden">
            {activePhoto ? (
              <PropertyImage
                src={activePhoto}
                alt={`${details.name} — photo ${photoIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 460px"
                transformWidth={800}
                transformHeight={640}
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#FAF6EE]/80">
                <Building2 className="w-12 h-12 text-[#FDE2A8]/60 mb-2" />
                <span className="font-serif text-lg font-bold">{details.name}</span>
                <span className="text-[11px] uppercase tracking-wider mt-1 opacity-75">
                  Approved Himalayan Homestay
                </span>
              </div>
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30"
            />

            {/* Top Badges + Wishlist Button */}
            <div className="absolute top-3.5 left-3.5 right-14 flex items-center justify-between gap-2 z-20">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full bg-[#1F332A]/90 backdrop-blur-md text-[#FFFDF9] text-[10.5px] font-bold uppercase tracking-wider border border-white/15">
                  {details.propertyTypeLabel}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#1F332A]/85 backdrop-blur-md text-[#FDE2A8] text-[10.5px] font-semibold flex items-center gap-1 border border-white/15">
                  <CheckCircle2 className="w-3 h-3 text-[#C55B23]" />
                  Verified Stay
                </span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const result = toggleSavedEcosystemItem({
                    id: details.slug || details.id,
                    category: 'stays',
                    title: details.name,
                    subtitle: details.locationLabel,
                    href: details.href,
                    meta: `${formatINR(details.startingPrice)} / night`,
                  });
                  setIsSaved(result.saved);
                }}
                aria-label={isSaved ? `Remove ${details.name} from saved stays` : `Save ${details.name}`}
                className="w-8 h-8 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isSaved ? 'fill-[#C55B23] text-[#C55B23]' : 'text-white'
                  }`}
                />
              </button>
            </div>

            {/* Prev / Next Photo Controls */}
            {details.photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPhotoIndex(
                      (prev) => (prev - 1 + details.photos.length) % details.photos.length
                    );
                  }}
                  aria-label="Previous property photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPhotoIndex((prev) => (prev + 1) % details.photos.length);
                  }}
                  aria-label="Next property photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Bottom Photo Counter & Thumbnail Dots */}
            <div className="absolute bottom-3.5 inset-x-4 flex items-center justify-between gap-2 z-20">
              <div className="bg-black/65 backdrop-blur-md text-[#FFFDF9] px-3 py-1 rounded-full text-xs font-bold">
                {formatINR(details.startingPrice)}{' '}
                <span className="font-normal text-[11px] text-[#FAF4E8]/85">/ night</span>
              </div>

              {details.photos.length > 1 && (
                <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {details.photos.slice(0, 5).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPhotoIndex(idx);
                      }}
                      aria-label={`Show photo ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === photoIndex ? 'w-4 bg-[#FDE2A8]' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Scrollable Body + Pinned Footer Actions */}
        <div className="flex flex-col justify-between max-h-[62vh] lg:max-h-[88vh] overflow-hidden bg-[#FFFDF9]">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4">
            {/* Location & Title Header */}
            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#C55B23]">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{details.fullLocationLabel}</span>
              </div>
              <h2
                id={titleId}
                className="font-serif text-2xl sm:text-3xl font-bold text-[#1F332A] leading-tight"
              >
                {details.name}
              </h2>
            </div>

            {/* Key Capacity & Tariff Strip */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#F5F0E6] border border-[#E5DEC9]">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5549] block">
                  Tariff From
                </span>
                <span className="font-serif text-base sm:text-lg font-bold text-[#1F332A] tabular-nums">
                  {formatINR(details.startingPrice)}
                  <span className="font-sans text-[11px] font-normal text-[#5C5549]"> / night</span>
                </span>
              </div>
              <div className="space-y-0.5 border-l border-[#D9CCB8] pl-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5549] block">
                  Capacity
                </span>
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#1F332A]">
                  <Users className="w-3.5 h-3.5 text-[#C55B23]" />
                  Up to {details.maxGuestsCapacity} Guests
                </span>
              </div>
              <div className="space-y-0.5 border-l border-[#D9CCB8] pl-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C5549] block">
                  Inventory
                </span>
                <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#1F332A]">
                  <BedDouble className="w-3.5 h-3.5 text-[#1F332A]" />
                  {details.roomCount} {details.roomCount === 1 ? 'Room Unit' : 'Room Units'}
                </span>
              </div>
            </div>

            {/* Brief Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F332A]">
                Brief Description
              </h3>
              <p
                id={descId}
                data-testid="quick-view-description"
                className="text-xs sm:text-sm text-[#3F3A32] leading-relaxed"
              >
                {details.briefDescription}
              </p>
            </div>

            {/* Key Amenities */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#1F332A]">
                  Key Amenities ({details.keyAmenities.length})
                </h3>
                <span className="text-[11px] text-[#5C5549] font-medium">
                  Host-verified facilities
                </span>
              </div>

              {details.keyAmenities.length > 0 ? (
                <ul
                  data-testid="quick-view-amenities-list"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {details.keyAmenities.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF6EE] border border-[#E5DEC9] text-xs font-medium text-[#1F332A]"
                    >
                      <AmenityIcon category={item.icon} />
                      <span className="truncate">{item.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#5C5549] italic">
                  Standard Himalayan homestay comforts, warm bedding, and host hospitality included.
                </p>
              )}
            </div>

            {/* Direct Host Payment Guarantee Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#1F332A]/6 border border-[#1F332A]/15">
              <ShieldCheck className="w-4 h-4 text-[#C55B23] shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-[#3F3A32] leading-snug">
                <strong className="text-[#1F332A]">Direct Host Payment:</strong> No upfront online
                platform fee. Request your dates and pay your host directly at the property.
              </p>
            </div>
          </div>

          {/* Pinned Modal Footer Actions */}
          <div className="shrink-0 px-5 sm:px-7 py-3.5 border-t border-[#E5DEC9] bg-[#FAF6EE]/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-[#D9CCB8] bg-[#FFFDF9] hover:bg-[#EAE2D3] text-[#1F332A] text-xs font-semibold transition-colors cursor-pointer"
            >
              Keep Browsing Results
            </button>

            <Link
              href={details.href}
              onClick={() => onClose()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F332A] hover:bg-[#C55B23] text-[#FFFDF9] text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
            >
              <span>View Full Stay &amp; Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export interface PropertyQuickViewButtonProps {
  property: Record<string, any>;
  variant?: 'overlay' | 'inline' | 'compact';
  className?: string;
}

export function PropertyQuickViewButton({
  property,
  variant = 'inline',
  className = '',
}: PropertyQuickViewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const name = String(property?.name || 'Property').trim();
  const slug = String(property?.slug || property?.id || 'stay');

  const baseStyles =
    variant === 'overlay'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFDF9]/95 hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] border border-[#E5DEC9]/80 text-[11px] font-semibold tracking-wide shadow-md backdrop-blur-md transition-colors cursor-pointer'
      : variant === 'compact'
        ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6EE] hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] border border-[#D9CCB8] text-[11px] font-semibold transition-colors cursor-pointer'
        : 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#1F332A] text-[#1F332A] hover:text-[#FFFDF9] border border-[#D9CCB8] text-xs font-semibold transition-colors cursor-pointer';

  return (
    <>
      <button
        type="button"
        suppressHydrationWarning
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        aria-label={`Quick view ${name}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        data-testid={`quick-view-trigger-${slug}`}
        className={`${baseStyles} ${className}`}
      >
        <Eye className="w-3.5 h-3.5 text-[#C55B23] shrink-0" />
        <span>Quick View</span>
      </button>

      <PropertyQuickViewModal
        property={property}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
