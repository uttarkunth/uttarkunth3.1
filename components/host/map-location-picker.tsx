'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Compass } from 'lucide-react';

interface MapLocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coordsOrLat: any, maybeLng?: any) => void;
  addressHint?: string;
  villageName?: string;
}

const UTTARAKHAND_PRESETS = [
  { name: 'Uttarkashi', lat: 30.7268, lng: 78.4354 },
  { name: 'Harsil', lat: 31.0366, lng: 78.7369 },
  { name: 'Sankri (Har Ki Dun)', lat: 31.0772, lng: 78.1812 },
  { name: 'Chopta / Tungnath', lat: 30.4855, lng: 79.1764 },
  { name: 'Joshimath / Auli', lat: 30.5564, lng: 79.5639 },
  { name: 'Mana Village', lat: 30.7681, lng: 79.4975 },
  { name: 'Mukteshwar', lat: 29.4722, lng: 79.6478 },
  { name: 'Almora / Kasar Devi', lat: 29.6200, lng: 79.6600 },
  { name: 'Lansdowne', lat: 29.8377, lng: 78.6874 },
  { name: 'Rishikesh', lat: 30.0869, lng: 78.2676 },
];

export function MapLocationPicker({
  latitude,
  longitude,
  onChange,
  addressHint,
}: MapLocationPickerProps) {
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const currentLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 30.7268;
  const currentLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 78.4354;
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

  const triggerChange = (lat: number, lng: number) => {
    if (typeof onChange === 'function') {
      if (onChange.length === 1) {
        onChange({ latitude: lat, longitude: lng });
      } else {
        onChange(lat, lng);
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        triggerChange(lat, lng);
      },
      (err) => {
        setGeoLocating(false);
        setGeoError(`Unable to fetch GPS: ${err.message}. Please enter coordinates manually.`);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // OpenStreetMap embed URL with marker
  const delta = 0.015;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - delta}%2C${currentLat - delta}%2C${currentLng + delta}%2C${currentLat + delta}&layer=mapnik&marker=${currentLat}%2C${currentLng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`;

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">Map Pinning & Exact Guest Navigation</h4>
            <p className="text-xs text-stone-500">
              Pin your homestay location on the map so guests can find you effortlessly and get turn-by-turn directions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={geoLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg transition shrink-0 shadow-sm"
        >
          <Navigation className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
          {geoLocating ? 'Detecting GPS...' : 'Use My Current Location'}
        </button>
      </div>

      {geoError && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
          {geoError}
        </p>
      )}

      {/* Manual Lat / Lng inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Latitude (°N)
          </label>
          <input
            type="number"
            step="0.000001"
            value={latitude ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              triggerChange(isNaN(val) ? 0 : val, currentLng);
            }}
            placeholder="e.g. 30.726829"
            className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Longitude (°E)
          </label>
          <input
            type="number"
            step="0.000001"
            value={longitude ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              triggerChange(currentLat, isNaN(val) ? 0 : val);
            }}
            placeholder="e.g. 78.435402"
            className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-[11px] font-medium text-stone-500 mb-1.5 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" />
          Or jump to regional cluster center:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {UTTARAKHAND_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => triggerChange(p.lat, p.lng)}
              className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded text-[11px] transition"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Embed Preview */}
      <div className="rounded-xl overflow-hidden border border-stone-300 relative bg-stone-200">
        <iframe
          title="Homestay Map Location"
          width="100%"
          height="240"
          src={osmEmbedUrl}
          className="w-full border-0"
          loading="lazy"
        />

        <div className="p-2.5 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-mono text-stone-600">
            Pinned at: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
          </span>
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            <span>Verify in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
