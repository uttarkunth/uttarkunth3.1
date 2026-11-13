'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PropertyImage } from '@/components/property-image';
import { getPropertyPhotoList } from '@/lib/property-images';
import { formatINR } from '@/lib/utils';
import {
  FAVOURITES_UPDATED_EVENT,
  isEcosystemItemSaved,
  toggleSavedEcosystemItem,
} from '@/lib/favourites';
import { MapPin, Sparkles, CheckCircle2, Heart, ArrowRight, Image as ImageIcon, Calendar } from 'lucide-react';

export interface RoomSummary {
  id: string;
  room_name: string;
  max_guests: number;
  base_price: number;
}

export interface PropertyCardData {
  id: string;
  slug: string;
  name: string;
  village: string | null;
  district: string | null;
  state: string | null;
  description: string | null;
  amenities: string[] | any;
  photos: string[] | any;
  cover_photo?: string | null;
  property_type: string;
  booking_mode?: string;
  rooms?: RoomSummary[];
}

export function PropertyCard({
  property,
  hideContentBody = false,
}: {
  property: PropertyCardData;
  hideContentBody?: boolean;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const photos = getPropertyPhotoList(property.cover_photo, property.photos).slice(0, 4);

  const lowestPrice = property.rooms && property.rooms.length > 0
    ? Math.min(...property.rooms.map(r => Number(r.base_price)))
    : 900;

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
      className="group bg-warm-surface rounded-2xl overflow-hidden border border-beige/90 hover:border-forest/35 shadow-editorial-sm hover:shadow-editorial-lg transition-all duration-500 ease-editorial flex flex-col justify-between cursor-pointer block text-inherit no-underline"
    >
      {/* Photo Scrubber Container */}
      <div
        className="relative aspect-[3/2] w-full overflow-hidden bg-forest-dark"
        onMouseLeave={() => setPhotoIndex(0)}
      >
        {photos.length > 0 ? (
          <PropertyImage
            src={photos[photoIndex] || photos[0]}
            alt={property.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            transformWidth={600}
            transformHeight={400}
            className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-forest-dark text-warm-canvas/70">
            <ImageIcon className="w-9 h-9" />
            <span className="text-xs font-medium">Property photographs coming soon</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/15 to-black/20" />

        {/* Pinterest-Style Photo Scrubber Hover Zones */}
        {photos.length > 1 && (
          <div className="absolute inset-0 flex z-10">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-full cursor-pointer"
                onMouseEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotoIndex(idx);
                }}
              />
            ))}
          </div>
        )}

        {/* Scrubber Dash Indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3.5 inset-x-4 flex items-center gap-1.5 z-20 pointer-events-none">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === photoIndex ? 'bg-white shadow-sm' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-7 left-4 flex flex-wrap items-center gap-2 z-20 pointer-events-none">
          <span className="px-2.5 py-1 bg-forest-dark/90 backdrop-blur-md text-warm-surface text-[10px] font-bold uppercase tracking-[0.14em] rounded-md border border-white/15 shadow-sm">
            {property.property_type === 'homestay' ? 'Homestay' : 'Mountain Retreat'}
          </span>
          <span className="px-2.5 py-1 bg-forest/85 backdrop-blur-md text-warm-surface text-[10px] font-bold uppercase tracking-wider rounded-md border border-white/15 shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-terracotta-light" />
            Approved
          </span>
        </div>

        {/* Wishlist Heart */}
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
          className="absolute top-7 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors z-30"
          aria-label="Save stay"
        >
          <Heart className={`w-4 h-4 transition-transform duration-200 ${isSaved ? 'fill-terracotta text-terracotta scale-110' : 'text-white'}`} />
        </button>

        {/* Bottom Property Title & Location */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-20 pointer-events-none">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta-light">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{property.village || 'Jari'}, {property.district || 'Kullu'}</span>
          </p>
          <h3 className="font-serif text-2xl font-bold text-warm-surface mt-0.5 leading-snug">
            {property.name}
          </h3>
        </div>
      </div>

      {/* Card Content & Action */}
      {!hideContentBody && (
        <div className="p-6 space-y-4">
          <p className="text-sm text-charcoal-muted line-clamp-2 leading-relaxed">
            {property.description || 'Authentic Himalayan accommodation with home-cooked meals and tranquil views.'}
          </p>

          {/* Amenities Highlights & Live Calendar Indicator */}
          <div className="space-y-2.5">
            {Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-charcoal-light">
                {property.amenities.slice(0, 3).map((a: string, i: number) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-beige-dark">·</span>}
                    <span>{a}</span>
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-forest bg-forest/8 px-2.5 py-1 rounded-md border border-forest/15 w-fit">
              <Calendar className="w-3.5 h-3.5 text-forest" />
              <span>Room Availability Calendar Live</span>
            </div>
          </div>

          {/* Price & Action Row */}
          <div className="pt-3.5 border-t border-beige/90 flex items-center justify-between">
            <div>
              <span className="font-serif text-2xl font-bold text-forest tabular-nums">
                {formatINR(lowestPrice)}
              </span>
              <span className="text-xs text-charcoal-muted font-normal"> / night</span>
            </div>

            <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-forest group-hover:bg-forest-dark text-warm-surface text-[11px] font-semibold uppercase tracking-[0.12em] shadow-xs transition-all duration-200 ease-editorial group-hover:gap-2">
              <span>View Stay</span>
              <ArrowRight className="w-3.5 h-3.5 text-terracotta-light" />
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
