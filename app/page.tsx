import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search-bar';
import { HeroVideo } from '@/components/hero-video';
import { PartnershipChooser } from '@/components/partnership-chooser';
import { BRAND } from '@/lib/constants';
import { getActiveDestinations, filterPropertiesForDestination, CURATED_DESTINATIONS } from '@/lib/destinations.server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { formatINR } from '@/lib/utils';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Home,
  Package,
  Film,
  Users,
  ShieldCheck,
  MapPin,
  Play,
  Heart,
  Store,
  Compass,
  Clock,
  Building2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getHomePageData() {
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
      .select('id, slug, name, description, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .limit(6);

    const source = (error || !properties) ? [] : properties;

    if (source.length === 0) {
      return {
        properties: [],
        destinations: destinations.slice(0, 8),
      };
    }

    const propertyIds = source.map((p) => p.id);
    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .in('property_id', propertyIds)
      .eq('active', true);

    const propertiesWithRooms = source.map((p) => ({
      ...p,
      rooms: rooms ? rooms.filter((r) => r.property_id === p.id) : [],
    }));

    return {
      properties: propertiesWithRooms,
      destinations: destinations.slice(0, 8),
    };
  } catch {
    return {
      properties: [],
      destinations: destinations.slice(0, 8),
    };
  }
}

// Exactly the two authorized productions from Uttarkunth
const AUTHORIZED_PRODUCTIONS = [
  {
    id: 'aaj-ka-devta',
    title: 'Aaj Ka Devta',
    category: 'Documentary',
    description: 'An ethnographic exploration into the living oracle and deity traditions of the Kullu Valley.',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    youtubeUrl: 'https://youtube.com',
  },
  {
    id: 'ruk-gayi-gupt-bali',
    title: 'Ruk Gayi Gupt Bali',
    category: 'Cultural Monologue',
    description: 'A critical investigation into cultural transitions and ritual shifts across sacred Himalayan hamlets.',
    thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    youtubeUrl: 'https://youtube.com',
  },
];

export default async function HomePage() {
  const { properties, destinations } = await getHomePageData();

  return (
    <div className="space-y-20 sm:space-y-32 pb-24">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION WITH EXACT ORIGINAL HERO VIDEO & POSTER
      ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden text-ivory">
        {/* Exact Preserved Original Video & Authentic Fallback Poster */}
        <HeroVideo
          videoSrc="/assets/uttarkunth-hero-video.webm"
          posterSrc="/assets/gaurav-negi-founder.webp"
        />

        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          {/* Ecosystem Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wider uppercase text-ivory">
            <Sparkles className="w-4 h-4 text-ukorange" />
            <span>Ecosystem of Four Pillars • Stays • Products • Productions • Community</span>
          </div>

          {/* Master Blueprint Heading */}
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-ivory leading-[1.05] max-w-4xl mx-auto">
            Ideas born in the mountains. <br />
            <span className="italic font-normal text-ukorange">Built through people.</span>
          </h1>

          {/* Master Blueprint Subheading */}
          <p className="text-base sm:text-xl text-ivory/85 max-w-2xl mx-auto font-sans leading-relaxed">
            A growing ecosystem connecting mountain stays, local products, creative productions and community initiatives.
          </p>

          {/* Primary & Secondary Action Pathways */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/stays"
              className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-7 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all shadow-lifted hover:scale-[1.02]"
            >
              <span>Explore Stays</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-ivory px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all hover:scale-[1.02]"
            >
              <Package className="w-4 h-4 text-ukorange" />
              <span>Discover Products</span>
            </Link>

            <Link
              href="/production"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-ivory px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all hover:scale-[1.02]"
            >
              <Film className="w-4 h-4 text-ukorange" />
              <span>Watch Productions</span>
            </Link>

            <Link
              href="/community"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-ivory px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base transition-all hover:scale-[1.02]"
            >
              <Users className="w-4 h-4 text-ukorange" />
              <span>Join Community</span>
            </Link>
          </div>

          {/* Floating Search Pill */}
          <div className="pt-6 sm:pt-8 max-w-4xl mx-auto">
            <SearchBar />
          </div>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-ivory/80 pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              100% Direct Host Payment at Property
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              Verified Mountain Homestays
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              Host Approval Before Confirmation
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ECOSYSTEM INTRODUCTION
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-ukorange" />
          The Uttarkunth Ecosystem
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-forest leading-tight">
          More Than a Stay. More Than a Store. <br />
          <span className="italic font-normal text-ukorange">One Connected Ecosystem.</span>
        </h2>
        <p className="text-base sm:text-lg text-charcoal-muted leading-relaxed max-w-3xl mx-auto font-sans">
          Uttarkunth began in Jari, deep in the Parvati Valley of Himachal Pradesh. What started with hospitality has expanded into a unified ecosystem celebrating the people, the craft, the stories, and the mountain lands that sustain us. We connect travelers with authentic homestays, support independent mountain makers, document Himalayan narratives through film, and invest in village development.
        </p>
        <div className="pt-2">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-ukorange transition-colors"
          >
            <span>Discover Our Story &amp; Founder</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. FOUR PILLARS BENTO GRID
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-ukorange">Four First-Class Pillars</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
              Explore the Four Pillars
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-muted max-w-md">
            Each pillar represents an authentic dimension of our Himalayan work and community life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Stays */}
          <Link
            href="/stays"
            className="group bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] w-full bg-forest-dark overflow-hidden">
              <Image
                src="/assets/uttarkunth-stays-homepage-card.webp"
                alt="Uttarkunth Stays"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-forest/90 backdrop-blur-md text-ivory flex items-center justify-center">
                <Home className="w-5 h-5 text-ukorange" />
              </div>
              <span className="absolute bottom-3 left-3 bg-black/60 text-ivory text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                Pillar I
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                  Stays
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Timber homestays and retreats in Parvati Valley. Direct host approval with zero guest booking surcharges.
                </p>
              </div>
              <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-xs font-bold text-forest group-hover:text-ukorange">
                <span>Explore Stays</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Pillar 2: Products */}
          <Link
            href="/products"
            className="group bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] w-full bg-forest-dark overflow-hidden">
              <Image
                src="/assets/products-home-page.webp"
                alt="Uttarkunth Products"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-forest/90 backdrop-blur-md text-ivory flex items-center justify-center">
                <Package className="w-5 h-5 text-ukorange" />
              </div>
              <span className="absolute bottom-3 left-3 bg-black/60 text-ivory text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                Pillar II
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                  Products
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Curated Himalayan goods from independent mountain makers. Sourcing in progress &bull; Coming soon.
                </p>
              </div>
              <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-xs font-bold text-forest group-hover:text-ukorange">
                <span>Coming Soon</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Pillar 3: Productions */}
          <Link
            href="/production"
            className="group bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] w-full bg-forest-dark overflow-hidden">
              <Image
                src="/assets/productions-home.webp"
                alt="Uttarkunth Productions"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-forest/90 backdrop-blur-md text-ivory flex items-center justify-center">
                <Film className="w-5 h-5 text-ukorange" />
              </div>
              <span className="absolute bottom-3 left-3 bg-black/60 text-ivory text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                Pillar III
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                  Productions
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Cinematic documentaries, village chronicles, and oral histories documenting the living heritage of the Himalayas.
                </p>
              </div>
              <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-xs font-bold text-forest group-hover:text-ukorange">
                <span>Watch Productions</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Pillar 4: Community */}
          <Link
            href="/community"
            className="group bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-[4/3] w-full bg-forest-dark overflow-hidden">
              <Image
                src="/assets/community-home-page.webp"
                alt="Uttarkunth Community"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-forest/90 backdrop-blur-md text-ivory flex items-center justify-center">
                <Users className="w-5 h-5 text-ukorange" />
              </div>
              <span className="absolute bottom-3 left-3 bg-black/60 text-ivory text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                Pillar IV
              </span>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                  Community
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed">
                  Grassroots action, trail stewardship, youth skills, and cultural archiving rooted in Karmayog service.
                </p>
              </div>
              <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-xs font-bold text-forest group-hover:text-ukorange">
                <span>Join Community</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. FEATURED STAYS (Actual Supabase Published Listings Only)
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider mb-2">
              <Home className="w-3.5 h-3.5 text-ukorange" />
              Real Mountain Inventory
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Featured Mountain Stays
            </h2>
          </div>
          <Link
            href="/stays"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-forest hover:text-ukorange transition-colors"
          >
            <span>Explore All Stays</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Direct Host Payment Guarantee Banner */}
        <div className="bg-ivory-warm rounded-2xl p-4 sm:p-5 border border-forest/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-ukorange flex-shrink-0" />
            <div>
              <span className="text-xs sm:text-sm font-bold text-forest block">
                Direct Host Payment Guarantee
              </span>
              <span className="text-xs text-charcoal-muted">
                No online payment for stays in this release. You pay your host directly upon arrival at the property.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-ukorange bg-ukorange/10 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
            Zero Platform Surcharge
          </span>
        </div>

        {/* Real Properties Grid */}
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {properties.map((property: any) => {
              const coverPhoto = property.photos?.[0];
              const startingPrice = property.rooms?.[0]?.base_price || 900;
              const locationText = `${property.village || 'Jari'}, ${property.district || 'Kullu'}`;

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
                          Authentic Himalayan Homestay
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
                      {(property.amenities || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {property.amenities.slice(0, 3).map((amenity: string) => (
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
          <div className="text-center py-12 px-6 rounded-3xl bg-forest/5 border border-forest/10 space-y-3">
            <Building2 className="w-10 h-10 text-forest/40 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-forest">No Live Homestays Listed Yet</h3>
            <p className="text-xs text-charcoal-muted max-w-md mx-auto">
              Our curated homestays are currently undergoing onboarding and review. Are you a local homestay host?
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

      {/* ─────────────────────────────────────────────────────────────
          5. DESTINATION-FIRST DISCOVERY PREVIEW
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ukorange/10 text-ukorange text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              Regional Discovery
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Explore Popular Destinations
            </h2>
          </div>
          <Link
            href="/stays#destinations"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-forest hover:text-ukorange transition-colors"
          >
            <span>View All 22 Destinations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {destinations.map((d) => (
            <Link
              key={d.id}
              href={`/stays/destinations/${d.slug}`}
              className="p-5 bg-white rounded-2xl border border-forest/15 hover:border-ukorange/40 hover:shadow-soft transition-all flex flex-col justify-between group space-y-2"
            >
              <div>
                <span className="text-[10px] font-bold text-ukorange uppercase tracking-wider block">
                  {d.region === 'Himachal Pradesh' ? 'Himachal' : d.region === 'Jammu & Kashmir' ? 'J&K' : 'Uttarakhand'}
                </span>
                <h4 className="font-serif text-lg font-bold text-forest group-hover:text-ukorange transition-colors">
                  {d.name}
                </h4>
              </div>
              <div className="text-[11px] font-semibold text-forest group-hover:text-ukorange flex items-center justify-between pt-2 border-t border-forest/5">
                <span>View Stays</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. PRODUCTS — HONEST COMING SOON STATE (Zero Fake Products)
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ukorange/10 text-ukorange text-xs font-semibold uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5" />
              Pillar II • Products
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Discover Something Meaningful.
            </h2>
          </div>
          <Link href="/products/sell" className="text-xs sm:text-sm font-semibold text-ukorange hover:underline">
            Sell With Us →
          </Link>
        </div>

        {/* Elegant Editorial Coming Soon Presentation */}
        <div className="bg-white rounded-3xl p-8 sm:p-14 border border-forest/15 shadow-soft text-center space-y-6 max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-forest/10 text-forest mx-auto flex items-center justify-center">
            <Package className="w-8 h-8 text-ukorange" />
          </div>

          <div className="space-y-3">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              Our Product Collection is Coming Soon
            </h3>
            <p className="text-sm text-charcoal-muted max-w-xl mx-auto leading-relaxed font-sans">
              We&rsquo;re building a growing collection of valuable products from independent makers, local creators and responsible businesses. We do not display fictional inventory — every product appears only after authentic sourcing and moderation approval.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products/sell"
              className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-6 py-3 rounded-full font-semibold text-xs transition-all shadow-sm"
            >
              <Store className="w-4 h-4" />
              <span>Sell Your Products With Us</span>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-forest/5 hover:bg-forest/10 text-forest border border-forest/15 px-6 py-3 rounded-full font-semibold text-xs transition-all"
            >
              <span>Explore Categories Taxonomy</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. PRODUCTIONS — EXACTLY THE TWO AUTHORIZED VIDEOS
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ukblue-deep/10 text-ukblue-deep text-xs font-semibold uppercase tracking-wider mb-2">
              <Film className="w-3.5 h-3.5 text-ukorange" />
              Pillar III • Visual Storytelling
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Productions &amp; Himalayan Cinema
            </h2>
          </div>
          <Link
            href="/production"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-forest hover:text-ukorange transition-colors"
          >
            <span>Watch All Productions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {AUTHORIZED_PRODUCTIONS.map((film) => (
            <div
              key={film.id}
              className="bg-white rounded-3xl border border-forest/15 overflow-hidden shadow-soft hover:shadow-lifted transition-all flex flex-col group"
            >
              <div className="relative aspect-video w-full bg-forest-dark overflow-hidden">
                <Image
                  src={film.thumbnail}
                  alt={film.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <Link
                  href="/production"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-ukorange transition-all">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </Link>
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                  <span className="font-semibold uppercase tracking-wider text-[11px] bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {film.category}
                  </span>
                  <span className="text-[11px] text-white/80">Uttarkunth Archive</span>
                </div>
              </div>

              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl font-bold text-forest group-hover:text-ukorange transition-colors">
                    {film.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                    {film.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                  <Link
                    href="/production"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:text-ukorange transition-colors"
                  >
                    <span>Watch Film</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={film.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-charcoal-muted hover:text-ukorange"
                  >
                    YouTube ↗
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. OUR PHILOSOPHY & KARMAYOG
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 text-center space-y-8 shadow-lifted relative overflow-hidden">
          <span className="text-xs uppercase tracking-widest text-ukorange font-bold block">
            Our Core Philosophy
          </span>

          <blockquote className="font-serif text-3xl sm:text-5xl lg:text-6xl font-medium italic text-ivory leading-tight">
            &ldquo;{BRAND.philosophy}&rdquo;
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left border-t border-white/15">
            <div className="space-y-2">
              <span className="text-xs font-bold text-ukorange uppercase tracking-wider block">1. Karmayog in Action</span>
              <h4 className="font-serif text-lg font-bold text-ivory">Think 5%, Do 95% Work</h4>
              <p className="text-xs text-ivory/70 leading-relaxed font-sans">
                Real change in mountain communities happens through daily persistent effort, not abstract strategy documents.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-ukorange uppercase tracking-wider block">2. Complete Integrity</span>
              <h4 className="font-serif text-lg font-bold text-ivory">Direct Host Payments</h4>
              <p className="text-xs text-ivory/70 leading-relaxed font-sans">
                Zero middle-layer surcharges. Guests pay the host directly, ensuring maximum economic retention in the village.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-ukorange uppercase tracking-wider block">3. Respecting Nature</span>
              <h4 className="font-serif text-lg font-bold text-ivory">Ecological Guardianship</h4>
              <p className="text-xs text-ivory/70 leading-relaxed font-sans">
                Protecting alpine rivers, ancient deodar groves, and vernacular wood architecture against destructive over-commercialization.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-7 py-3 rounded-full font-semibold text-sm transition-all"
            >
              Read Our Full Story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. COMMUNITY & VILLAGE DEVELOPMENT VISION
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-ukorange" />
              Community &amp; Village Development
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Investing in Himalayan People &amp; Places
            </h3>
            <p className="text-xs sm:text-sm text-charcoal leading-relaxed font-sans">
              We distinguish active work from our long-term vision. We are a parent brand and business ecosystem with a community purpose — supporting youth skill development, preserving mountain cultural heritage, and keeping trails clean and wild.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link
              href="/community/join"
              className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-ivory px-7 py-3.5 rounded-full font-semibold text-sm transition-all shadow-sm"
            >
              <span>Join Our Mission</span>
              <ArrowRight className="w-4 h-4 text-ukorange" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. UNIVERSAL PARTNERSHIP CHOOSER
      ───────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-ukorange">Collaborate With Us</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            Be Part of the Uttarkunth Journey
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Choose your pathway to participate as a host, artisan, creator, or community volunteer.
          </p>
        </div>

        <PartnershipChooser />
      </section>
    </div>
  );
}
