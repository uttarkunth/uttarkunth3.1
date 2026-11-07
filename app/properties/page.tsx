import React from 'react';
import { SearchBar } from '@/components/search-bar';
import { PropertyCard } from '@/components/property-card';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { PROPERTY_TYPES, AMENITIES_LIST } from '@/lib/constants';
import { Filter, SlidersHorizontal, Mountain, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PropertiesPageProps {
  searchParams: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    propertyType?: string;
    minPrice?: string;
    maxPrice?: string;
    amenity?: string;
  };
}

async function fetchFilteredProperties(params: PropertiesPageProps['searchParams']) {
  try {
    const supabase = createPublicServerSupabaseClient();

    let query = supabase
      .from('properties')
      .select('id, slug, name, description, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved');

    if (params.destination) {
      query = query.or(`village.ilike.%${params.destination}%,district.ilike.%${params.destination}%,name.ilike.%${params.destination}%`);
    }

    if (params.propertyType && params.propertyType !== 'all') {
      query = query.eq('property_type', params.propertyType);
    }

    const { data: properties, error } = await query;

    let list = properties || [];

    // Attach rooms
    const propIds = list.map(p => p.id);
    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .in('property_id', propIds)
      .eq('active', true);

    const withRooms = list.map(p => ({
      ...p,
      rooms: rooms ? rooms.filter(r => r.property_id === p.id) : (p as any).rooms || []
    }));

    // Filter by guests capacity
    const guestCount = params.guests ? parseInt(params.guests, 10) : 1;
    let filtered = withRooms.filter(p => {
      const maxCap = p.rooms && p.rooms.length > 0
        ? Math.max(...p.rooms.map((r: any) => r.max_guests))
        : 2;
      return maxCap >= guestCount;
    });

    // Filter by Price
    if (params.minPrice) {
      const minP = parseFloat(params.minPrice);
      filtered = filtered.filter(p => {
        const lowest = p.rooms && p.rooms.length > 0
          ? Math.min(...p.rooms.map((r: any) => Number(r.base_price)))
          : 0;
        return lowest >= minP;
      });
    }

    if (params.maxPrice) {
      const maxP = parseFloat(params.maxPrice);
      filtered = filtered.filter(p => {
        const lowest = p.rooms && p.rooms.length > 0
          ? Math.min(...p.rooms.map((r: any) => Number(r.base_price)))
          : 0;
        return lowest <= maxP;
      });
    }

    // Filter by amenity
    if (params.amenity) {
      filtered = filtered.filter(p => {
        const ams = Array.isArray(p.amenities) ? p.amenities : [];
        return ams.some((a: any) => String(a).toLowerCase().includes(params.amenity!.toLowerCase()));
      });
    }

    return filtered;
  } catch {
    return [];
  }
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const properties = await fetchFilteredProperties(searchParams);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Parvati & Kullu Valleys</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            Explore Himalayan Stays
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Browse verified mountain homestays, retreats, and cottages with host approval.
          </p>
        </div>

        {/* Compact Search Bar */}
        <SearchBar
          initialDestination={searchParams.destination || ''}
          initialCheckIn={searchParams.checkIn || ''}
          initialCheckOut={searchParams.checkOut || ''}
          initialGuests={searchParams.guests ? parseInt(searchParams.guests, 10) : 2}
          compact
        />
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-forest/10">
        <span className="text-xs font-semibold text-charcoal-muted flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-forest" />
          Filter:
        </span>

        {/* All Stays */}
        <Link
          href="/properties"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !searchParams.propertyType ? 'bg-forest text-white' : 'bg-white border border-forest/20 text-charcoal hover:bg-forest/5'
          }`}
        >
          All Types
        </Link>

        {PROPERTY_TYPES.map(t => (
          <Link
            key={t.id}
            href={`/properties?propertyType=${t.id}${searchParams.destination ? `&destination=${searchParams.destination}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              searchParams.propertyType === t.id ? 'bg-forest text-white' : 'bg-white border border-forest/20 text-charcoal hover:bg-forest/5'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Results Grid */}
      {properties.length > 0 ? (
        <div className="space-y-4">
          <div className="text-xs font-medium text-charcoal-muted flex items-center justify-between">
            <span>Showing {properties.length} verified accommodation{properties.length > 1 ? 's' : ''}</span>
            {searchParams.destination && (
              <span>Destination: <strong className="text-forest">{searchParams.destination}</strong></span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {properties.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/10 shadow-soft max-w-xl mx-auto space-y-4">
          <Mountain className="w-12 h-12 text-forest/40 mx-auto" />
          <h3 className="font-serif text-2xl font-bold text-forest">No Stays Found For This Search</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            We currently feature authentic homestays in <strong>Jari, Parvati Valley</strong>. Try clearing your search filters or exploring all available stays.
          </p>
          <Link
            href="/properties"
            className="inline-block px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Clear All Filters
          </Link>
        </div>
      )}
    </div>
  );
}
