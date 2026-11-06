'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Check } from 'lucide-react';

interface MapLocationPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  villageName?: string;
}

const COMMON_UTTARAKHAND_LOCATIONS = [
  { name: 'Uttarkashi Town', lat: 30.7268, lng: 78.4354 },
  { name: 'Harsil Valley', lat: 31.0366, lng: 78.7378 },
  { name: 'Sankri / Kedarkantha Base', lat: 31.0778, lng: 78.1812 },
  { name: 'Chopta / Tungnath Base', lat: 30.4854, lng: 79.1764 },
  { name: 'Joshimath', lat: 30.5564, lng: 79.5663 },
  { name: 'Mana Village', lat: 30.7712, lng: 79.4975 },
  { name: 'Munsiyari', lat: 30.0668, lng: 80.2394 },
  { name: 'Jari / Kasol (Parvati Valley)', lat: 31.9866, lng: 77.2644 },
];

export function MapLocationPicker({
  latitude,
  longitude,
  onChange,
  villageName,
}: MapLocationPickerProps) {
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const currentLat = typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : 30.7268;
  const currentLng = typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : 78.4354;
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' && latitude !== 0 && longitude !== 0;

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDetectError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setDetectError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange({ latitude: lat, longitude: lng });
        setDetecting(false);
      },
      (err) => {
        setDetectError(err.message || 'Unable to retrieve your location. Please ensure location permission is allowed.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const delta = 0.008;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - delta}%2C${currentLat - delta}%2C${currentLng + delta}%2C${currentLat + delta}&layer=mapnik&marker=${currentLat}%2C${currentLng}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-700" />
            Property Coordinates &amp; Map Pin
          </label>
          <p className="text-xs text-stone-500 mt-0.5">
            Pin the exact location for guests. Guests will get a one-click &quot;Get Directions&quot; link.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={detecting}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition disabled:opacity-50 shrink-0"
        >
          <Navigation className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
          <span>{detecting ? 'Detecting GPS...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {detectError && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
          {detectError}
        </p>
      )}

      {/* Lat/Long manual inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-stone-600 block mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={latitude ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ latitude: isNaN(val) ? 0 : val, longitude: currentLng });
            }}
            placeholder="e.g. 30.726800"
            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-stone-600 block mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={longitude ?? ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ latitude: currentLat, longitude: isNaN(val) ? 0 : val });
            }}
            placeholder="e.g. 78.435400"
            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Quick Himalayan presets */}
      <div>
        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-1.5">
          Quick Himalayan Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_UTTARAKHAND_LOCATIONS.map((loc) => {
            const isSelected = Math.abs(currentLat - loc.lat) < 0.001 && Math.abs(currentLng - loc.lng) < 0.001;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => onChange({ latitude: loc.lat, longitude: loc.lng })}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 font-semibold shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{loc.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Map Preview */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
        <iframe
          title="Map Location Preview"
          width="100%"
          height="100%"
          src={osmEmbedUrl}
          className="w-full h-full border-0 pointer-events-none"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-semibold text-stone-700 border border-stone-200 shadow-sm flex items-center gap-1">
          <Compass className="w-3 h-3 text-emerald-700" />
          <span>{hasCoords ? `${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}` : 'Default Region Preview'}</span>
        </div>
      </div>
    </div>
  );
}
