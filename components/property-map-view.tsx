'use client';

import React from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface PropertyMapViewProps {
  name: string;
  village?: string;
  district?: string;
  state?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  lowestPrice?: number;
}

export function PropertyMapView({
  name,
  village,
  district,
  state,
  address,
  latitude,
  longitude,
  lowestPrice,
}: PropertyMapViewProps) {
  // Default to Uttarkashi if no coordinates provided
  const lat = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : 30.7268;
  const lng = typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : 78.4354;
  const hasExactCoords = typeof latitude === 'number' && typeof longitude === 'number' && latitude !== 0 && longitude !== 0;

  const delta = 0.012;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-bold text-stone-900">Location & Getting Here</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            {[village, district, state].filter(Boolean).join(', ')}
            {address && ` • ${address}`}
          </p>
        </div>

        <a
          href={googleMapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm shrink-0"
        >
          <Navigation className="w-4 h-4" />
          <span>Get Directions</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      <div className="relative w-full h-[280px] sm:h-[340px] bg-stone-100">
        <iframe
          title={`${name} Map Location`}
          width="100%"
          height="100%"
          src={osmEmbedUrl}
          className="w-full h-full border-0"
          loading="lazy"
        />

        {lowestPrice && (
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-stone-200 flex items-center gap-2 text-xs font-bold text-stone-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Rooms from ₹{lowestPrice.toLocaleString('en-IN')}/night</span>
            </div>
          </div>
        )}

        {!hasExactCoords && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-10 bg-amber-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow backdrop-blur-sm pointer-events-none">
            Showing destination area map. Host will share exact landmarks upon booking.
          </div>
        )}
      </div>
    </div>
  );
}
