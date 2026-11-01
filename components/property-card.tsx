'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import { MapPin, Sparkles, CheckCircle2, Heart, ArrowRight } from 'lucide-react';

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
  property_type: string;
  booking_mode?: string;
  rooms?: RoomSummary[];
}

export function PropertyCard({ property }: { property: PropertyCardData }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const rawPhotos = Array.isArray(property.photos) && property.photos.length > 0
    ? property.photos
    : ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'];

  const photos = rawPhotos.slice(0, 4);

  const lowestPrice = property.rooms && property.rooms.length > 0
    ? Math.min(...property.rooms.map(r => Number(r.base_price)))
    : 900;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-forest/15 hover:border-forest/40 shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col justify-between">
      
      {/* Photo Scrubber Container */}
      <div 
        className="relative h-72 sm:h-80 w-full overflow-hidden bg-forest-dark"
        onMouseLeave={() => setPhotoIndex(0)}
      >
        <Image
          src={photos[photoIndex] || photos[0]}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
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
          <span className="px-2.5 py-1 bg-ukorange/90 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        </div>

        {/* Wishlist Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsSaved(!isSaved);
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
            {property.amenities.slice(0, 3).map((a: string, i: number) => (
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
