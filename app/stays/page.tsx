import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HorizontalPropertyCard } from '@/components/stays/horizontal-property-card';
import { StaysSharedTransitionRestorer } from '@/components/stays/property-detail-transition-shell';
import { RegionalDestinationsSlider } from '@/components/stays/regional-destinations-slider';
import { SearchBar } from '@/components/search-bar';
import { BRAND, EXISTING_PROPERTIES } from '@/lib/constants';
import {
  getActiveDestinations,
  filterPropertiesForDestination,
  CURATED_DESTINATIONS,
} from '@/lib/destinations.server';
import { filterStaysProperties } from '@/lib/stays-search';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import {
  Home,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Stays — Find Your Place in the Mountains — ${BRAND.name}`,
  description:
    'Explore welcoming timber homestays, riverside retreats, and comfortable bases in the Himalayas. 100% direct host payment.',
};

function buildFallbackStaysData(destinations = CURATED_DESTINATIONS) {
  const cleanFallback = EXISTING_PROPERTIES.filter(
    (p: any) => p.slug !== 'wonderway-retreat'
  );
  const destinationsWithCounts = destinations.map((d) => ({
    ...d,
    propertyCount: filterPropertiesForDestination(cleanFallback, d).length,
  }));

  return {
    properties: cleanFallback,
    destinations: destinationsWithCounts,
  };
}

async function fetchLiveStaysData() {
  const supabase = createPublicServerSupabaseClient();
  const [destinations, { data: properties, error }] = await Promise.all([
    getActiveDestinations().catch(() => CURATED_DESTINATIONS),
    supabase
      .from('properties')
      .select('*')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .neq('slug', 'wonderway-retreat'),
  ]);

  const rawSource =
    !error && properties && properties.length > 0 ? properties : EXISTING_PROPERTIES;
  const source = rawSource.filter((p: any) => p && p.slug !== 'wonderway-retreat');

  let propertiesWithRooms: any[] = [];
  if (source.length > 0) {
    const propertyIds = source.map((p: any) => p.id);
    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .in('property_id', propertyIds)
      .eq('active', true);

    propertiesWithRooms = source.map((p: any) => ({
      ...p,
      rooms:
        rooms && rooms.length > 0
          ? rooms.filter((r) => r.property_id === p.id)
          : p.rooms || [],
    }));
  }

  const destinationsWithCounts = destinations.map((d) => ({
    ...d,
    propertyCount: filterPropertiesForDestination(propertiesWithRooms, d).length,
  }));

  return {
    properties: propertiesWithRooms,
    destinations: destinationsWithCounts,
  };
}

async function getStaysData() {
  try {
    return await Promise.race([
      fetchLiveStaysData(),
      new Promise<ReturnType<typeof buildFallbackStaysData>>((resolve) =>
        setTimeout(() => resolve(buildFallbackStaysData()), 2500)
      ),
    ]);
  } catch {
    return buildFallbackStaysData();
  }
}

interface StaysPageProps {
  searchParams?:
    | Promise<{
        destination?: string;
        q?: string;
        checkIn?: string;
        checkOut?: string;
        guests?: string;
        adults?: string;
        children?: string;
        childAges?: string;
        infants?: string;
        amenities?: string;
        type?: string;
      }>
    | {
        destination?: string;
        q?: string;
        checkIn?: string;
        checkOut?: string;
        guests?: string;
        adults?: string;
        children?: string;
        childAges?: string;
        infants?: string;
        amenities?: string;
        type?: string;
      };
}

export default async function StaysPage({ searchParams }: StaysPageProps) {
  const [{ properties, destinations }, resolvedParams] = await Promise.all([
    getStaysData(),
    Promise.resolve(searchParams || {}),
  ]);

  const parsedAdults = resolvedParams?.adults
    ? Math.max(1, Number(resolvedParams.adults) || 2)
    : resolvedParams?.guests
    ? Math.max(1, Number(resolvedParams.guests) || 2)
    : 2;

  const parsedChildren = resolvedParams?.children
    ? Math.max(0, Number(resolvedParams.children) || 0)
    : 0;

  const parsedChildAges = resolvedParams?.childAges
    ? resolvedParams.childAges
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n) && n >= 2 && n <= 17)
    : [];

  const parsedInfants = resolvedParams?.infants
    ? Math.max(0, Number(resolvedParams.infants) || 0)
    : 0;

  const parsedAmenities = resolvedParams?.amenities
    ? resolvedParams.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  const hasExplicitGuestFilter = Boolean(
    resolvedParams?.adults || resolvedParams?.children || resolvedParams?.guests
  );

  const filteredProperties = filterStaysProperties(
    properties,
    {
      destinationSlug: resolvedParams?.destination || '',
      query: resolvedParams?.q || '',
      checkIn: resolvedParams?.checkIn || '',
      checkOut: resolvedParams?.checkOut || '',
      adults: hasExplicitGuestFilter ? parsedAdults : 0,
      children: hasExplicitGuestFilter ? parsedChildren : 0,
      childAges: parsedChildAges,
      infants: parsedInfants,
      selectedAmenityIds: parsedAmenities,
      propertyType: resolvedParams?.type || '',
    },
    destinations
  );

  const himachalDestinations = destinations.filter(
    (d) => d.region === 'Himachal Pradesh'
  );
  const jkDestinations = destinations.filter((d) => d.region === 'Jammu & Kashmir');
  const uttarakhandDestinations = destinations.filter(
    (d) => d.region === 'Uttarakhand'
  );

  return (
    <div className="space-y-10 sm:space-y-14 lg:space-y-16 pb-20">
      <StaysSharedTransitionRestorer />
      {/* ─────────────────────────────────────────────────────────────────────
          1. STAYS HERO — HIMALAYAN NATURAL STONE ROOFING BACKGROUND
          • Starts at -mt-16 behind the header
          • Covers header -> "Find Your Place in the Mountains." -> description -> exact 50% midpoint of the search bar
      ───────────────────────────────────────────────────────────────────── */}
      <section data-testid="stays-hero-section" className="relative z-30 -mt-16 w-full">
        {/* Natural Stone Roofing Backdrop Layer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#18221D]">
          <Image
            src="/assets/aistudio/Truestone-Natural-Stone-Roofing-Ash-Heavy-600x600-2_c45a7c65.jpg"
            alt="Traditional Himalayan natural slate stone roofing"
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-center"
          />
          {/* Balanced Himalayan Slate & Golden-Hour Vignette so stone texture remains rich & text has crisp contrast */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,21,17,0.62)_0%,rgba(18,27,22,0.52)_48%,rgba(15,24,19,0.74)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(253,226,168,0.14)_0%,rgba(197,91,35,0.08)_42%,transparent_75%)]"
          />
        </div>

        {/* Hero Heading & Editorial Description */}
        <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-7 sm:pb-9 text-center space-y-3 sm:space-y-4">
          <h1 className="font-serif font-normal text-3xl sm:text-5xl lg:text-[56px] text-[#FFFDF9] tracking-[0.01em] leading-[1.12] [text-shadow:0_2px_16px_rgba(8,14,10,0.85),0_1px_3px_rgba(8,14,10,0.95)]">
            Find Your Place in the Mountains.
          </h1>

          <div
            aria-hidden="true"
            className="mx-auto h-[1.5px] w-24 sm:w-36 bg-gradient-to-r from-transparent via-[#FDE2A8]/80 to-transparent"
          />

          <p className="font-sans font-normal text-sm sm:text-base lg:text-[17px] text-[#FAF4E8]/95 max-w-2xl mx-auto leading-relaxed [text-shadow:0_1px_10px_rgba(8,14,10,0.9)]">
            Explore welcoming stays, discover local places and find a comfortable base for your
            time in the Himalayas.
          </p>
        </div>

        {/* Search Bar Wrapper — Top 50% over Stone Hero Background, Bottom 50% over Warm Himalayan Canvas (#F5F0E6) */}
        <div data-testid="stays-hero-search-overlap" className="relative w-full">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[#F5F0E6] border-t border-[#D5C8B3]/80 z-10"
          />
          <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <SearchBar
              initialDestination={resolvedParams?.destination || ''}
              initialQuery={resolvedParams?.q || ''}
              initialCheckIn={resolvedParams?.checkIn || ''}
              initialCheckOut={resolvedParams?.checkOut || ''}
              initialGuests={parsedAdults + parsedChildren}
              initialAdults={parsedAdults}
              initialChildren={parsedChildren}
              initialChildAges={parsedChildAges}
              initialInfants={parsedInfants}
              initialAmenities={parsedAmenities}
              properties={properties}
              destinations={destinations}
              showAmenityChips={true}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          2 & 3. HOMEPAGE SANCTUARY CONTAINER — VERIFIED MOUNTAIN STAYS & SLIDABLE REGIONAL DESTINATIONS
          • Full Homepage Golden-Hour Valley, Alpine Sage Mist & Feathered Ridge Background Design
      ───────────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full overflow-x-clip">
        {/* Homepage Atmospheric Golden-Hour & Alpine Sage Background Layers */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(244,230,204,0.88)_18%,rgba(223,232,223,0.78)_46%,rgba(236,227,210,0.9)_72%,rgba(245,240,230,0)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-24 left-1/5 w-[540px] h-[500px] rounded-full bg-[#C55B23]/[0.13] blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 right-1/5 w-[540px] h-[500px] rounded-full bg-[#263D32]/[0.13] blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1/4 left-1/4 w-[480px] h-[420px] rounded-full bg-[#263D32]/[0.11] blur-[120px]"
        />

        {/* Soft Feathered Himalayan Valley Ridge Silhouette Watermark (Matching Homepage Background Image Design) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 top-12 w-full h-56 sm:h-72 opacity-[0.15] [mask-image:radial-gradient(ellipse_75%_80%_at_50%_60%,#000_25%,transparent_95%)]"
        >
          <path
            d="M0,220 L140,118 L245,178 L390,74 L535,168 L690,88 L845,172 L1010,68 L1165,162 L1310,96 L1440,176 L1440,320 L0,320 Z"
            fill="#263D32"
            fillOpacity="0.45"
          />
          <path
            d="M0,256 C180,210 340,238 520,198 C710,156 890,224 1090,184 C1240,154 1350,196 1440,214 L1440,320 L0,320 Z"
            fill="#C55B23"
            fillOpacity="0.32"
          />
          <path
            d="M0,284 C260,254 510,292 780,264 C1040,236 1260,274 1440,258 L1440,320 L0,320 Z"
            fill="#1A2B23"
            fillOpacity="0.45"
          />
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
          {/* Stays & Destinations Unified Sanctuary Container matching Homepage Design System */}
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/75 bg-[linear-gradient(135deg,rgba(255,253,249,0.88)_0%,rgba(243,236,222,0.92)_48%,rgba(227,235,226,0.84)_100%)] shadow-[0_18px_46px_-16px_rgba(31,51,42,0.10),inset_0_1px_0_rgba(255,253,249,0.92)] px-4 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-9 space-y-10 sm:space-y-12">
            {/* Subtle Top Warm Terracotta & Pine Accent Line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#263D32]/25 to-transparent"
            />

            {/* Soft Feathered Alpine Contour & Valley Ridge Watermark */}
            <svg
              aria-hidden="true"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-36 sm:h-48 opacity-[0.11] [mask-image:radial-gradient(ellipse_80%_85%_at_50%_65%,#000_25%,transparent_95%)]"
            >
              <path
                d="M0,236 C220,178 410,248 640,192 C880,134 1110,218 1440,164 L1440,320 L0,320 Z"
                fill="#263D32"
                fillOpacity="0.52"
              />
              <path
                d="M0,268 C260,224 520,258 790,216 C1040,178 1250,232 1440,208 L1440,320 L0,320 Z"
                fill="#C55B23"
                fillOpacity="0.28"
              />
            </svg>

            {/* 2. VERIFIED MOUNTAIN PROPERTIES */}
            <div className="relative z-10 space-y-6 sm:space-y-7">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D9CCB8]/80 pb-3.5 sm:pb-4">
                <div className="space-y-1">
                  <span className="block font-serif font-normal sm:font-medium text-[#C55B23] text-xl sm:text-2xl md:text-[26px] lg:text-[30px] tracking-wide leading-snug">
                    Himalayan Hospitality
                  </span>
                  <h2 className="font-serif text-[22px] sm:text-3xl md:text-4xl lg:text-[42px] font-medium text-[#1F332A] tracking-tight leading-[1.15] sm:leading-tight">
                    Currently Available Mountain Stays
                  </h2>
                </div>
                <span className="font-sans text-xs font-normal text-[#5C5549]">
                  Showing {filteredProperties.length} real published{' '}
                  {filteredProperties.length === 1 ? 'property' : 'properties'}
                </span>
              </div>

              {filteredProperties.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  {filteredProperties.map((property: any) => (
                    <HorizontalPropertyCard
                      key={property.id || property.slug}
                      property={property}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 px-6 rounded-[22px] bg-[#FFFDF9]/90 border border-[#D5C8B3]/80 space-y-4">
                  <Home className="w-10 h-10 text-[#1F332A]/40 mx-auto" />
                  <h3 className="font-serif text-2xl font-medium text-[#1F332A]">
                    No Verified Mountain Stays Match Your Filter
                  </h3>
                  <p className="font-sans font-normal text-xs text-[#5C5549] max-w-md mx-auto leading-relaxed">
                    Try clearing your destination filter or explore our active partner stays in
                    Jari, Parvati Valley.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/stays"
                      className="font-sans inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 bg-[#1F332A] text-[#FFFDF9] rounded-full hover:bg-[#C55B23] transition-colors"
                    >
                      View All Stays &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 3. EXPLORE POPULAR DESTINATIONS — SMALL, SLIDABLE REGIONAL CARDS */}
            <div
              id="destinations"
              className="relative z-10 pt-8 sm:pt-10 border-t border-[#D5C8B3]/75 space-y-7 sm:space-y-9"
            >
              <div className="space-y-1">
                <h2 className="font-serif text-[22px] sm:text-3xl md:text-4xl lg:text-[42px] font-medium text-[#1F332A] tracking-tight leading-[1.15] sm:leading-tight">
                  Explore Popular Destinations
                </h2>
              </div>

              <div className="space-y-7 sm:space-y-8">
                <RegionalDestinationsSlider
                  regionTitle="Himachal Pradesh"
                  destinations={himachalDestinations}
                />
                <RegionalDestinationsSlider
                  regionTitle="Jammu & Kashmir"
                  destinations={jkDestinations}
                />
                <RegionalDestinationsSlider
                  regionTitle="Uttarakhand"
                  destinations={uttarakhandDestinations}
                />
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              4. HOST PARTNERSHIP CTA — DARK FOREST SANCTUARY CARD
          ───────────────────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#2B4438] bg-[linear-gradient(145deg,#1D3027_0%,#263E33_54%,#2D463A_100%)] text-[#F8F3E8] p-7 sm:p-12 lg:p-14 text-center space-y-5 shadow-[0_20px_50px_-18px_rgba(16,28,22,0.45)]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[220px] rounded-full bg-[radial-gradient(closest-side,rgba(253,226,168,0.18)_0%,rgba(197,91,35,0.10)_52%,transparent_100%)] blur-2xl"
            />
            <span className="relative z-10 block font-serif font-normal sm:font-medium text-[#C55B23] text-xl sm:text-2xl md:text-[26px] tracking-wide leading-snug">
              Mountain Hosts &amp; Homestay Owners
            </span>
            <h2 className="relative z-10 font-serif text-2xl sm:text-4xl lg:text-[44px] font-medium text-[#FFFDF9] max-w-2xl mx-auto leading-tight">
              List Your Mountain Homestay With Complete Autonomy
            </h2>
            <p className="relative z-10 font-sans font-normal text-xs sm:text-sm text-[#FAF4E8]/85 max-w-xl mx-auto leading-relaxed">
              Connect with mindful travelers through our dedicated Himalayan network. You
              control your reservations, approve each guest request, and receive 100% of your
              stay tariff directly from guests at your property.
            </p>
            <div className="relative z-10 pt-2">
              <Link
                href="/stays/partner"
                className="font-sans inline-flex items-center gap-2 bg-[#C55B23] hover:bg-[#B04E1B] text-[#FFFDF9] px-7 py-3.5 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-[0_8px_22px_rgba(197,91,35,0.35)]"
              >
                <span>Partner With Uttarkunth Stays</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
