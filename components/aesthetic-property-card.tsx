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
import { MapPin, Sparkles, CheckCircle2, Heart, ArrowRight, Image as ImageIcon } from 'lucide-react';

export interface AestheticPropertyProps {
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
  rooms?: Array<{
    id: string;
    room_name: string;
    max_guests: number;
    base_price: number;
  }>;
  moods?: string[];
}

export function AestheticPropertyCard({ property }: { property: AestheticPropertyProps }) {
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
    <div className="group bg-white rounded-3xl overflow-hidden border border-forest/15 hover:border-forest/40 shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
      
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
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-forest-dark text-ivory/70">
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
                onMouseEnter={() => setPhotoIndex(idx)}
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
          <span className="px-3 py-1 bg-forest/90 backdrop-blur-md text-ivory text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm">
            {property.property_type === 'homestay' ? 'Homestay' : 'Mountain Retreat'}
          </span>
          <span className="px-2.5 py-1 bg-forest/80 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-ukorange" />
            Approved
          </span>
        </div>

        {/* Wishlist Heart */}
        <button suppressHydrationWarning
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
          <Heart className={`w-4 h-4 transition-transform duration-200 ${isSaved ? 'fill-ukorange text-ukorange scale-110' : 'text-white'}`} />
        </button>

        {/* Bottom Property Title & Location */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-20 pointer-events-none">
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ukorange">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{property.village || 'Jari'}, {property.district || 'Kullu'}</span>
          </p>
          <h3 className="font-serif text-2xl font-bold text-ivory mt-0.5 leading-snug">
            {property.name}
          </h3>
        </div>
      </div>

      {/* Card Content & Action */}
      <div className="p-6 space-y-4">
        <p className="text-sm text-charcoal-muted line-clamp-2 leading-relaxed">
          {property.description || 'Authentic Himalayan accommodation with home-cooked meals and tranquil views.'}
        </p>

        {/* Amenities Highlights */}
        {Array.isArray(property.amenities) && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-xs font-medium text-forest">
            {property.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="px-2.5 py-1 bg-forest/5 rounded-md border border-forest/10">
                {a}
              </span>
            ))}
          </div>
        )}

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
          <div>
            <span className="font-serif text-2xl font-bold text-forest">
              {formatINR(lowestPrice)}
            </span>
            <span className="text-xs text-charcoal-muted font-normal"> / night</span>
          </div>

          <Link
            href={`/properties/${property.slug}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-forest hover:bg-forest-hover text-ivory text-xs font-semibold uppercase tracking-wider shadow-sm transition-all hover:gap-2"
          >
            <span>View Stay</span>
            <ArrowRight className="w-3.5 h-3.5 text-ukorange" />
          </Link>
        </div>
      </div>

    </div>
  );
}
