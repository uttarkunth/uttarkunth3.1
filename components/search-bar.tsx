'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CURATED_DESTINATIONS } from '@/lib/destinations';
import { MapPin, Calendar, Users, Search } from 'lucide-react';

interface SearchBarProps {
  initialDestination?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  compact?: boolean;
}

export function SearchBar({
  initialDestination = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  compact = false
}: SearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests.toString());

    router.push(`/stays?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className={`bg-white rounded-2xl shadow-lifted border border-forest/10 p-2 sm:p-3 transition-all ${
        compact ? 'max-w-4xl' : 'max-w-5xl'
      } mx-auto`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-forest/10">
        {/* Destination Picker */}
        <div className="flex items-center gap-3 px-3 py-2">
          <MapPin className="w-5 h-5 text-ukorange flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
              Destination
            </label>
            <select
              suppressHydrationWarning
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent font-medium text-charcoal text-sm focus:outline-none truncate"
            >
              <option value="">All Mountain Destinations</option>
              <optgroup label="Himachal Pradesh">
                {CURATED_DESTINATIONS.filter((d) => d.region === 'Himachal Pradesh').map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Jammu & Kashmir">
                {CURATED_DESTINATIONS.filter((d) => d.region === 'Jammu & Kashmir').map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Uttarakhand">
                {CURATED_DESTINATIONS.filter((d) => d.region === 'Uttarakhand').map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Check-in Date */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Calendar className="w-5 h-5 text-forest flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
              Check-in
            </label>
            <input
              suppressHydrationWarning
              type="date"
              min={todayStr}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut('');
                }
              }}
              className="w-full bg-transparent font-medium text-charcoal text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Calendar className="w-5 h-5 text-forest flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
              Check-out
            </label>
            <input
              suppressHydrationWarning
              type="date"
              min={checkIn || todayStr}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent font-medium text-charcoal text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Guests & Submit Button */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Users className="w-5 h-5 text-ukblue-deep flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-charcoal-muted">
              Guests
            </label>
            <select
              suppressHydrationWarning
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10))}
              className="w-full bg-transparent font-medium text-charcoal text-sm focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            suppressHydrationWarning
            className="flex-shrink-0 bg-forest hover:bg-forest-hover text-white p-3 rounded-xl transition-all hover:scale-105 shadow-md flex items-center justify-center gap-1.5 font-semibold text-sm px-4"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>
    </form>
  );
}
