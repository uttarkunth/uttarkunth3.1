import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getDestinationBySlug,
  filterPropertiesForDestination,
  getNearbyPropertiesForDestination,
  getActiveDestinations,
} from '@/lib/destinations.server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { BRAND } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import {
  MapPin,
  Home,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Compass,
  Sparkles,
  ArrowLeft,
  Building2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface DestinationPageProps {
  params: {
    slug: string;
  };
}

async function getPropertiesForDestination(slug: string) {
  const destination = await getDestinationBySlug(slug);
  if (!destination) return { destination: null, properties: [], nearbyProperties: [] };

  try {
    const supabase = createPublicServerSupabaseClient();
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, slug, name, description, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved');

    const source = (error || !properties) ? [] : properties;
    const directMatching = filterPropertiesForDestination(source, destination);
    const nearbyMatching = getNearbyPropertiesForDestination(source, destination);

    const allMatching = [...directMatching, ...nearbyMatching];
    if (allMatching.length === 0) {
      return { destination, properties: [], nearbyProperties: [] };
    }

    const ids = allMatching.map((p) => p.id);
    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .in('property_id', ids)
      .eq('active', true);

    const attachRooms = (list: any[]) =>
      list.map((p) => ({
        ...p,
        rooms: rooms ? rooms.filter((r) => r.property_id === p.id) : [],
      }));

    return {
      destination,
      properties: attachRooms(directMatching),
      nearbyProperties: attachRooms(nearbyMatching),
    };
  } catch {
    return {
      destination,
      properties: [],
      nearbyProperties: [],
    };
  }
}

export async function generateMetadata({ params }: DestinationPageProps) {
  const destination = await getDestinationBySlug(params.slug);
  if (!destination) return { title: `Destination Not Found — ${BRAND.name}` };

  return {
    title: `${destination.name}, ${destination.region} Stays — ${BRAND.name}`,
    description: destination.description,
  };
}

export default async function DestinationDetailPage({ params }: DestinationPageProps) {
  const { destination, properties, nearbyProperties } = await getPropertiesForDestination(params.slug);

  if (!destination) {
    notFound();
  }

  const allDestinations = await getActiveDestinations();
  const otherDestinations = allDestinations.filter((d) => d.slug !== destination.slug).slice(0, 6);

  return (
    <div className="space-y-16 py-10 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-charcoal-muted">
        <Link href="/" className="hover:text-forest">Home</Link>
        <span>/</span>
        <Link href="/stays" className="hover:text-forest">Stays</Link>
        <span>/</span>
        <span className="text-forest font-semibold">{destination.name}</span>
      </nav>

      {/* Destination Hero Banner */}
      <section className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 shadow-lifted relative overflow-hidden space-y-6">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-ukorange">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destination.region}</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-ivory">
            {destination.name}
          </h1>

          <p className="text-base sm:text-lg text-ivory/85 font-sans leading-relaxed">
            {destination.description}
          </p>

          <div className="flex items-center gap-3 pt-2 text-xs font-medium text-ivory/70">
            <span className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
              {properties.length} {properties.length === 1 ? 'Direct Stay' : 'Direct Stays'}
            </span>
            <span>•</span>
            <span>Direct Host Payments</span>
            <span>•</span>
            <span>Request-Based Booking</span>
          </div>
        </div>

        {/* Subtle background ambient overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </section>

      {/* Main Content Area */}
      <section className="space-y-8">
        {/* ── CASE 1: DIRECT PROPERTIES EXIST (e.g. Kullu-Jari) ── */}
        {properties.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Verified Listings</span>
                <h2 className="font-serif text-3xl font-bold text-forest mt-1">
                  Accommodations in {destination.name}
                </h2>
              </div>
              <span className="text-xs text-charcoal-muted">
                Showing {properties.length} direct published {properties.length === 1 ? 'property' : 'properties'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property: any) => {
                const coverPhoto = property.photos?.[0];
                const startingPrice = property.rooms?.[0]?.base_price || 900;
                const locationText = `${property.village || destination.name}, ${property.district || destination.region}`;

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
                        <div className="absolute inset-0 bg-canvas flex flex-col items-center justify-center p-6 text-center text-forest border-b border-forest/10">
                          <Building2 className="w-12 h-12 text-forest/40 mb-2" />
                          <span className="font-serif text-lg font-bold">{property.name}</span>
                          <span className="text-[11px] text-charcoal-muted uppercase tracking-wider mt-1">
                            Himalayan Homestay
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
                      </div>

                      <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                        <span className="text-xs text-charcoal font-medium">
                          {property.rooms?.length || 1} Room units
                        </span>
                        <Link
                          href={`/stays/${property.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-ukorange transition-colors"
                        >
                          <span>View Stay Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CASE 2: NO DIRECT STAYS, BUT NEARBY STAYS EXIST (e.g. Kasol -> Jari stays) ── */}
        {properties.length === 0 && nearbyProperties.length > 0 && (
          <div className="space-y-8">
            <div className="bg-ivory-warm p-6 sm:p-8 rounded-3xl border border-forest/15 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ukorange block">
                Geographic Clarity
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                0 Stays Located Directly in Kasol Hamlet
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                We do not currently have verified stays physically located within Kasol village itself. To help you plan your journey through Parvati Valley, we have listed our verified partner stays located in nearby <strong>Jari (~10 km away)</strong> below:
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-forest/10 pb-3">
                <h3 className="font-serif text-2xl font-bold text-forest">
                  Nearby Stays in Parvati Valley
                </h3>
                <span className="text-xs text-charcoal-muted font-medium">
                  Showing {nearbyProperties.length} neighboring {nearbyProperties.length === 1 ? 'stay' : 'stays'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {nearbyProperties.map((property: any) => {
                  const coverPhoto = property.photos?.[0];
                  const startingPrice = property.rooms?.[0]?.base_price || 900;

                  return (
                    <div
                      key={property.id}
                      className="bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col group"
                    >
                      <div className="relative aspect-[16/10] w-full bg-forest-dark overflow-hidden">
                        {coverPhoto && (
                          <Image
                            src={coverPhoto}
                            alt={property.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                          />
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
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ukorange/10 text-ukorange text-xs font-semibold rounded-lg">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Physically Located in Jari (~10 km from Kasol)</span>
                          </div>
                          <h4 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                            {property.name}
                          </h4>
                          <p className="text-xs text-charcoal-muted line-clamp-2 leading-relaxed">
                            {property.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                          <span className="text-xs text-charcoal font-medium">
                            {property.rooms?.length || 1} Room units
                          </span>
                          <Link
                            href={`/stays/${property.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-forest hover:text-ukorange transition-colors"
                          >
                            <span>View Stay Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── CASE 3: NO PROPERTIES (Mandated Authentic Empty State) ── */}
        {properties.length === 0 && nearbyProperties.length === 0 && (
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-forest/15 shadow-soft text-center space-y-6 max-w-3xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
              <Compass className="w-8 h-8 text-ukorange" />
            </div>

            <div className="space-y-3">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                We have not yet partnered with a verified stay in this destination.
              </h3>
              <p className="text-sm text-charcoal-muted leading-relaxed max-w-xl mx-auto">
                Uttarkunth features only genuine, vetted accommodations that meet our standards for authenticity and guest care. Explore nearby stays in Parvati Valley or partner with us if you host here.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/stays"
                className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-ivory px-6 py-3 rounded-full font-semibold text-xs transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Explore Other Destinations
              </Link>
              <Link
                href="/stays/partner"
                className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-6 py-3 rounded-full font-semibold text-xs transition-all shadow-sm"
              >
                List Your Property in {destination.name} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Explore Other Destinations Directory Grid */}
      <section className="space-y-6 pt-10 border-t border-forest/15">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl font-bold text-forest">
            Explore Other Himalayan Destinations
          </h3>
          <Link href="/stays" className="text-xs font-semibold text-ukorange hover:underline">
            View All 22 Destinations →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {otherDestinations.map((d) => (
            <Link
              key={d.id}
              href={`/stays/destinations/${d.slug}`}
              className="p-4 bg-white rounded-2xl border border-forest/10 hover:border-ukorange/40 hover:shadow-soft transition-all text-center space-y-1 group"
            >
              <span className="text-[10px] uppercase font-bold text-ukorange block">
                {d.region === 'Himachal Pradesh' ? 'Himachal' : d.region === 'Jammu & Kashmir' ? 'J&K' : 'Uttarakhand'}
              </span>
              <h4 className="font-serif text-base font-bold text-forest group-hover:text-ukorange transition-colors">
                {d.name}
              </h4>
            </Link>
          ))}
        </div>
      </section>

      {/* Property Partnership Banner */}
      <section className="bg-ivory-warm rounded-3xl p-8 sm:p-10 border border-forest/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs uppercase font-bold tracking-wider text-ukorange">Host Partnership</span>
          <h3 className="font-serif text-2xl font-bold text-forest">Own a homestay or retreat in {destination.name}?</h3>
          <p className="text-xs text-charcoal-muted max-w-xl">
            Partner with Uttarkunth. No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property. Manage your bookings with host approval, and welcome travelers on your own terms.
          </p>
        </div>
        <Link
          href="/stays/partner"
          className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-ivory px-6 py-3 rounded-full font-semibold text-xs whitespace-nowrap shadow-sm"
        >
          <span>List Your Property</span>
          <ArrowRight className="w-4 h-4 text-ukorange" />
        </Link>
      </section>
    </div>
  );
}
