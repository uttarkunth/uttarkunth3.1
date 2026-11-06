import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search-bar';
import { BRAND } from '@/lib/constants';
import { getActiveDestinations, filterPropertiesForDestination, CURATED_DESTINATIONS, Destination } from '@/lib/destinations.server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { formatINR } from '@/lib/utils';
import {
  MapPin,
  Home,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Compass,
  Sparkles,
  Building2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Stays — Find Your Place in the Mountains — ${BRAND.name}`,
  description: 'Explore welcoming timber homestays, riverside retreats, and comfortable bases in the Himalayas. 100% direct host payment.',
};

async function getStaysData() {
  let destinations = CURATED_DESTINATIONS;
  try {
    destinations = await getActiveDestinations();
  } catch {
    destinations = CURATED_DESTINATIONS;
  }

  try {
    const supabase = createPublicServerSupabaseClient();
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, slug, name, description, address, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved');

    const source = (error || !properties) ? [] : properties;

    let propertiesWithRooms: any[] = [];
    if (source.length > 0) {
      const propertyIds = source.map((p) => p.id);
      const { data: rooms } = await supabase
        .from('room_units')
        .select('id, property_id, room_name, description, max_guests, base_price, active')
        .in('property_id', propertyIds)
        .eq('active', true);

      propertiesWithRooms = source.map((p) => ({
        ...p,
        rooms: rooms ? rooms.filter((r) => r.property_id === p.id) : [],
      }));
    }

    // Calculate real qualifying counts per destination
    const destinationsWithCounts = destinations.map((d) => ({
      ...d,
      propertyCount: filterPropertiesForDestination(propertiesWithRooms, d).length,
    }));

    return {
      properties: propertiesWithRooms,
      destinations: destinationsWithCounts,
    };
  } catch {
    const destinationsWithCounts = destinations.map((d) => ({
      ...d,
      propertyCount: 0,
    }));

    return {
      properties: [],
      destinations: destinationsWithCounts,
    };
  }
}

interface StaysPageProps {
  searchParams?: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    type?: string;
  };
}

export default async function StaysPage({ searchParams }: StaysPageProps) {
  const { properties, destinations } = await getStaysData();

  // If a destination filter was supplied via search, filter accordingly
  let filteredProperties = properties;
  const destinationQuery = (searchParams?.destination || '').toLowerCase().trim();
  if (destinationQuery) {
    const matchedDest = destinations.find(
      (d) => d.slug === destinationQuery || d.name.toLowerCase() === destinationQuery
    );
    if (matchedDest) {
      filteredProperties = filterPropertiesForDestination(properties, matchedDest);
    }
  }

  const himachalDestinations = destinations.filter((d) => d.region === 'Himachal Pradesh');
  const jkDestinations = destinations.filter((d) => d.region === 'Jammu & Kashmir');
  const uttarakhandDestinations = destinations.filter((d) => d.region === 'Uttarakhand');

  return (
    <div className="space-y-16 sm:space-y-24 py-10 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. STAYS HERO */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Home className="w-3.5 h-3.5 text-ukorange" />
          Pillar I • Stays &amp; Hospitality
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-forest leading-tight">
          Find Your Place in the Mountains.
        </h1>
        <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Explore welcoming stays, discover local places and find a comfortable base for your time in the Himalayas.
        </p>

        {/* Quick Search */}
        <div className="pt-4 max-w-3xl mx-auto">
          <SearchBar />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-charcoal font-medium pt-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-ukorange" /> Direct Host Payment at Property
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-ukorange" /> Authentic Mountain Homestays
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-ukorange" /> Transparent Nightly Rates
          </span>
        </div>
      </section>

      {/* 2. DIRECT HOST PAYMENT GUARANTEE BANNER */}
      <section className="bg-ivory-warm rounded-3xl p-6 sm:p-8 border border-forest/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest text-ivory flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-ukorange" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-forest">Direct Host Payment Model</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed max-w-2xl">
              No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.
            </p>
          </div>
        </div>
        <Link
          href="/booking-policy"
          className="text-xs font-semibold text-ukorange hover:underline whitespace-nowrap self-start sm:self-auto"
        >
          Read Booking Policy →
        </Link>
      </section>

      {/* 3. VERIFIED MOUNTAIN PROPERTIES */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Real Inventory</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
              Currently Available Mountain Stays
            </h2>
          </div>
          <span className="text-xs text-charcoal-muted">
            Showing {properties.length} real published properties
          </span>
        </div>

        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property: any) => {
              const coverPhoto = property.photos?.[0];
              const startingPrice = property.rooms?.[0]?.base_price || 900;
              const locationText = `${property.village || 'Jari'}, ${property.district || 'Kullu'}`;
              const amenities = property.amenities || [];

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col group"
                >
                  <div className="relative aspect-[16/10] w-full bg-forest-dark overflow-hidden">
                    {coverPhoto ? (
                      <Image
                        src={coverPhoto}
                        alt={property.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      /* Neutral branded missing-image presentation */
                      <div className="absolute inset-0 bg-canvas flex flex-col items-center justify-center p-6 text-center text-forest border-b border-forest/10">
                        <Building2 className="w-12 h-12 text-forest/40 mb-2" />
                        <span className="font-serif text-lg font-bold">{property.name}</span>
                        <span className="text-[11px] text-charcoal-muted uppercase tracking-wider mt-1">
                          Approved Himalayan Homestay
                        </span>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 bg-forest/90 text-ivory text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                      {property.property_type || 'Homestay'}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-ivory text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                      {formatINR(startingPrice)} <span className="font-normal text-[11px]">/ night</span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-ukorange font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{locationText}</span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                        {property.name}
                      </h3>
                      <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed">
                        {property.description}
                      </p>

                      {/* Verified Amenities Pills */}
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {amenities.slice(0, 3).map((amenity: string) => (
                            <span
                              key={amenity}
                              className="text-[10px] bg-canvas text-charcoal px-2 py-0.5 rounded-md font-medium border border-forest/10"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Request-Based Booking
                      </span>
                      <Link
                        href={`/stays/${property.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-ukorange transition-colors"
                      >
                        <span>View &amp; Request</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-6 rounded-3xl bg-forest/5 border border-forest/10 space-y-4">
            <Home className="w-10 h-10 text-forest/40 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-forest">No Verified Mountain Stays Currently Listed</h3>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
              All previous test listings have been cleared. New homestays appear here in real-time once curated and approved.
            </p>
            <div className="pt-2">
              <Link
                href="/host/properties/new"
                className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 bg-forest text-ivory rounded-full hover:bg-forest/90 transition-colors shadow-soft"
              >
                List Your Homestay →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 4. EXPLORE POPULAR DESTINATIONS DIRECTORY (Destination-First Discovery) */}
      <section id="destinations" className="space-y-12 pt-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ukorange/10 text-ukorange text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Curated Regional Directory
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
            Explore Popular Destinations
          </h2>
          <p className="text-sm text-charcoal-muted max-w-2xl leading-relaxed">
            Our curated directory of mountain towns and valleys across Himachal Pradesh, Jammu &amp; Kashmir, and Uttarakhand. New stays appear automatically as hosts complete verification.
          </p>
        </div>

        {/* Region 1: Himachal Pradesh */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-forest/15 pb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-forest">Region</span>
            <h3 className="font-serif text-2xl font-bold text-forest">Himachal Pradesh</h3>
            <span className="text-xs text-charcoal-muted">({himachalDestinations.length} Destinations)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {himachalDestinations.map((d) => (
              <Link
                key={d.id}
                href={`/stays/destinations/${d.slug}`}
                className="p-5 bg-white rounded-2xl border border-forest/15 hover:border-ukorange/40 hover:shadow-soft transition-all flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ukorange uppercase tracking-wider">Himachal</span>
                    {d.propertyCount! > 0 ? (
                      <span className="bg-forest/10 text-forest text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {d.propertyCount} {d.propertyCount === 1 ? 'Stay' : 'Stays'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-charcoal-muted">Coming Soon</span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-bold text-forest group-hover:text-ukorange transition-colors">
                    {d.name}
                  </h4>
                  <p className="text-[11px] text-charcoal-muted line-clamp-2 leading-relaxed">
                    {d.tagline}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-forest group-hover:text-ukorange flex items-center gap-1 pt-1 border-t border-forest/5">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Region 2: Jammu & Kashmir */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3 border-b border-forest/15 pb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-forest">Region</span>
            <h3 className="font-serif text-2xl font-bold text-forest">Jammon &amp; Kashmir</h3>
            <span className="text-xs text-charcoal-muted">({jkDestinations.length} Destinations)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {jkDestinations.map((d) => (
              <Link
                key={d.id}
                href={`/stays/destinations/${d.slug}`}
                className="p-5 bg-white rounded-2xl border border-forest/15 hover:border-ukorange/40 hover:shadow-soft transition-all flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ukorange uppercase tracking-wider">J&amp;K</span>
                    {d.propertyCount! > 0 ? (
                      <span className="bg-forest/10 text-forest text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {d.propertyCount} {d.propertyCount === 1 ? 'Stay' : 'Stays'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-charcoal-muted">Coming Soon</span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-bold text-forest group-hover:text-ukorange transition-colors">
                    {d.name}
                  </h4>
                  <p className="text-[11px] text-charcoal-muted line-clamp-2 leading-relaxed">
                    {d.tagline}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-forest group-hover:text-ukorange flex items-center gap-1 pt-1 border-t border-forest/5">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Region 3: Uttarakhand */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3 border-b border-forest/15 pb-3">
            <span className="text-xs uppercase font-bold tracking-widest text-forest">Region</span>
            <h3 className="font-serif text-2xl font-bold text-forest">Uttarakhand</h3>
            <span className="text-xs text-charcoal-muted">({uttarakhandDestinations.length} Destinations)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {uttarakhandDestinations.map((d) => (
              <Link
                key={d.id}
                href={`/stays/destinations/${d.slug}`}
                className="p-5 bg-white rounded-2xl border border-forest/15 hover:border-ukorange/40 hover:shadow-soft transition-all flex flex-col justify-between group space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ukorange uppercase tracking-wider">Uttarakhand</span>
                    {d.propertyCount! > 0 ? (
                      <span className="bg-forest/10 text-forest text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {d.propertyCount} {d.propertyCount === 1 ? 'Stay' : 'Stays'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-charcoal-muted">Coming Soon</span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-bold text-forest group-hover:text-ukorange transition-colors">
                    {d.name}
                  </h4>
                  <p className="text-[11px] text-charcoal-muted line-clamp-2 leading-relaxed">
                    {d.tagline}
                  </p>
                </div>
                <div className="text-[11px] font-semibold text-forest group-hover:text-ukorange flex items-center gap-1 pt-1 border-t border-forest/5">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ACCOMMODATION-TYPE DISCOVERY (StayInBharat Inspired) */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ukorange">
            Types of Mountain Stays
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            Stay by Architecture &amp; Setting
          </h3>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Find the right mountain setting for your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-forest/15 space-y-2 text-center shadow-soft hover:shadow-lifted transition-all">
            <div className="text-3xl mb-1">🪵</div>
            <h4 className="font-serif text-xl font-bold text-forest">Traditional Homestays</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Authentic Kathkuni timber homes hosted by mountain families with home-cooked thalis.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-forest/15 space-y-2 text-center shadow-soft hover:shadow-lifted transition-all">
            <div className="text-3xl mb-1">🌲</div>
            <h4 className="font-serif text-xl font-bold text-forest">Mountain Retreats</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Riverside suites and secluded pine forest havens designed for peace and deep focus.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-forest/15 space-y-2 text-center shadow-soft hover:shadow-lifted transition-all">
            <div className="text-3xl mb-1">🏡</div>
            <h4 className="font-serif text-xl font-bold text-forest">Village Cottages</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Quiet independent stone-and-wood cottages for extended writing retreats and family stays.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-forest/15 space-y-2 text-center shadow-soft hover:shadow-lifted transition-all">
            <div className="text-3xl mb-1">🍎</div>
            <h4 className="font-serif text-xl font-bold text-forest">Orchard Havens</h4>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Active mountain apple and apricot orchards nestled along high Himalayan ridges.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HOST PARTNERSHIP CTA */}
      <section className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-lifted">
        <span className="text-xs uppercase tracking-widest text-ukorange font-bold block">
          Mountain Hosts &amp; Homestay Owners
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold max-w-2xl mx-auto leading-tight">
          List Your Mountain Homestay With Complete Autonomy
        </h2>
        <p className="text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-sans">
          Connect with mindful travelers through our dedicated Himalayan network. You control your reservations, approve each guest request, and receive 100% of your stay tariff directly from guests at your property.
        </p>
        <div className="pt-2">
          <Link
            href="/stays/partner"
            className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-7 py-3.5 rounded-full font-semibold text-sm transition-all shadow-lifted"
          >
            <span>Partner With Uttarkunth Stays</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
