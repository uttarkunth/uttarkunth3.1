import React from 'react';
import { HeroVideo } from '@/components/hero-video';
import { FourPillarsShowcase } from '@/components/home/four-pillars-showcase';
import { FeaturedStaysRows } from '@/components/home/featured-stays-rows';
import { DestinationAtlas } from '@/components/home/destination-atlas';
import { RecentReviewsCarousel } from '@/components/home/recent-reviews-carousel';
import { TreasuresOfHimalayasShowcase } from '@/components/home/treasures-of-himalayas-showcase';
import { StoriesFromMountainsShowcase } from '@/components/home/stories-from-mountains-showcase';
import { GrowingTogetherShowcase } from '@/components/home/growing-together-showcase';
import { INITIAL_CURATED_PRODUCTS } from '@/lib/home-pillars';
import {
  EXISTING_REVIEWS,
  normalizeAndSortRecentReviews,
} from '@/lib/reviews';
import {
  LinkButton,
  EmptyState,
  ScrollReveal,
} from '@/components/ui';
import {
  BRAND,
  AUTHENTIC_PRODUCTIONS,
  PRODUCT_CATEGORIES,
  EXISTING_PROPERTIES,
} from '@/lib/constants';
import {
  getActiveDestinations,
  filterPropertiesForDestination,
  CURATED_DESTINATIONS,
} from '@/lib/destinations.server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import {
  ArrowRight,
  ArrowDown,
  Home,
  Heart,
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
    const [
      { data: properties, error },
      { data: approvedProducts },
      { data: approvedReviews },
    ] = await Promise.all([
      supabase
        .from('properties')
        .select('*')
        .eq('published', true)
        .eq('moderation_status', 'approved')
        .neq('slug', 'wonderway-retreat')
        .limit(24),
      supabase
        .from('products')
        .select('*')
        .eq('moderation_status', 'approved')
        .limit(12),
      supabase
        .from('reviews')
        .select(
          'id, property_id, booking_id, reviewer_user_id, reviewer_name, rating, comment, moderation_status, moderated_at, moderated_by, created_at, properties(name, slug, village, district)'
        )
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    const rawSource =
      !error && properties && properties.length > 0 ? properties : EXISTING_PROPERTIES;
    const source = rawSource.filter((p: any) => p && p.slug !== 'wonderway-retreat');

    let propertiesWithRooms: any[] = [];
    if (source.length > 0) {
      const propertyIds = source.map((p: any) => p.id);
      const { data: rooms } = await supabase
        .from('room_units')
        .select('*')
        .in('property_id', propertyIds)
        .eq('active', true)
        .order('sort_order', { ascending: true });

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

    const liveReviews = normalizeAndSortRecentReviews(approvedReviews, propertiesWithRooms, 12);
    const reviews =
      liveReviews.length > 0
        ? liveReviews
        : normalizeAndSortRecentReviews(EXISTING_REVIEWS, propertiesWithRooms, 12);

    const curatedProducts =
      approvedProducts && approvedProducts.length > 0
        ? approvedProducts
        : INITIAL_CURATED_PRODUCTS;

    return {
      properties: propertiesWithRooms,
      destinations: destinationsWithCounts,
      products: curatedProducts,
      reviews,
    };
  } catch {
    const cleanFallback = EXISTING_PROPERTIES.filter((p: any) => p.slug !== 'wonderway-retreat');
    const destinationsWithCounts = destinations.map((d) => ({
      ...d,
      propertyCount: filterPropertiesForDestination(cleanFallback, d).length,
    }));
    return {
      properties: cleanFallback,
      destinations: destinationsWithCounts,
      products: INITIAL_CURATED_PRODUCTS,
      reviews: normalizeAndSortRecentReviews(EXISTING_REVIEWS, cleanFallback, 12),
    };
  }
}

export default async function HomePage() {
  const { properties, destinations, products, reviews } = await getHomePageData();

  return (
    <div className="space-y-14 sm:space-y-16 lg:space-y-20 pb-16">
      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 3: HERO — ART-DIRECTED RESPONSIVE HIMALAYAN PANORAMA
          • Starts at y=0 (-mt-16) directly behind the Header so there is zero plain header background
          • Larger, clearer editorial typography on mobile viewports
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative -mt-16 pt-10 sm:pt-14 lg:pt-0 w-full aspect-[1200/896] lg:aspect-[1376/768] flex items-start overflow-hidden bg-warm-canvas"
      >
        <HeroVideo videoSrc="/assets/uttarkunth-hero-video.webm" />

        {/* Left-Aligned Hero Editorial Heading — Always Positioned Cleanly Below the Left Dotted Trail & Icons */}
        <div className="pointer-events-none relative z-20 w-full pt-[10%] sm:pt-[11.5%] lg:pt-[16.8%]">
          <div className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8">
            <div className="relative max-w-[252px] sm:max-w-xs lg:max-w-[540px] xl:max-w-[580px] py-1 sm:py-2 lg:py-3 pr-2 sm:pr-5 pl-1 space-y-1.5 sm:space-y-2 lg:space-y-3.5">
              {/* Ultra-Smooth Feathered Radial Vignette (Reaches 0 opacity inside closest-side + blur-2xl feathering = zero visible edges) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 sm:-inset-x-16 lg:-inset-x-24 -inset-y-8 sm:-inset-y-14 lg:-inset-y-20 rounded-full bg-[radial-gradient(closest-side_at_42%_50%,rgba(10,18,14,0.48)_0%,rgba(10,18,14,0.24)_54%,rgba(10,18,14,0)_100%)] blur-2xl"
              />

              <h1 className="relative font-serif text-[17px] sm:text-xl lg:text-[42px] xl:text-[48px] font-semibold tracking-[0.01em] text-[#FFFDF9] leading-[1.12] [text-shadow:0_2px_14px_rgba(8,14,10,0.88),0_1px_3px_rgba(8,14,10,0.95)]">
                Born in the Himalayas.
                <span className="italic font-normal text-[#FDE2A8] block mt-0.5 lg:mt-1.5">
                  Built Around Community.
                </span>
              </h1>

              <div
                aria-hidden="true"
                className="relative h-[1px] sm:h-[1.5px] lg:h-[2px] w-16 sm:w-24 lg:w-44 bg-gradient-to-r from-[#FDE2A8]/85 via-[#E59866]/55 to-transparent"
              />

              <p className="relative font-sans text-[11px] sm:text-[12px] lg:text-[16.5px] xl:text-[18px] text-[#FAF4E8]/95 font-normal leading-[1.35] sm:leading-relaxed max-w-[238px] sm:max-w-[280px] lg:max-w-[490px] xl:max-w-[530px] [text-shadow:0_1px_10px_rgba(8,14,10,0.92),0_1px_2px_rgba(8,14,10,0.96)]">
                Discover meaningful stays, Himalayan products, original stories and opportunities to be
                part of something bigger.
              </p>

              {/* Clean Minimalist Editorial Explore Uttarkunth CTA — Hidden on Mobile, Visible on Tablet/PC */}
              <div className="hidden sm:block relative pt-1.5 lg:pt-2 pointer-events-auto">
                <a
                  href="#four-pillars"
                  className="group inline-flex items-center gap-2.5 pl-4 pr-2 lg:pl-5 lg:pr-2.5 py-1.5 lg:py-2 rounded-full bg-[#FFFDF9] hover:bg-white text-[#1F332A] border border-[#E5DEC9] hover:border-[#C55B23] shadow-[0_4px_14px_rgba(12,20,16,0.22)] text-[11.5px] lg:text-[13.5px] font-semibold tracking-[0.02em] transition-colors duration-200 ease-out"
                >
                  <span>Explore Uttarkunth</span>
                  <span className="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-[#F2ECE0] group-hover:bg-[#C55B23] text-[#1F332A] group-hover:text-white flex items-center justify-center transition-colors duration-200">
                    <ArrowDown
                      strokeWidth={1.75}
                      className="w-3 h-3 lg:w-3.5 lg:h-3.5"
                    />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 4 & 5: THE FOUR PILLARS CAROUSEL -> SEARCH BAR -> ONE CONNECTED HIMALAYAN ECOSYSTEM
          • Calibrated so on mobile load the Carousel Card + Search Bar + "One Connected Himalayan Ecosystem."
            sit cleanly above the mobile bottom navigation bar
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="four-pillars"
        className="relative z-30 !mt-0 w-full pt-1.5 sm:pt-5 lg:pt-7 pb-1.5 sm:pb-3 scroll-mt-1 sm:scroll-mt-2 overflow-x-clip overflow-y-visible"
      >
        <div id="ecosystem" className="sr-only" aria-hidden="true" />
        {/* Smooth Unbounded Top-to-Bottom Himalayan Golden-Hour Valley Transition (Zero Hard Edges) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(244,230,204,0.88)_22%,rgba(235,216,186,0.72)_54%,rgba(242,231,212,0.82)_80%,#F5F0E6_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-[#C55B23]/[0.14] blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-1/4 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-[#263D32]/[0.14] blur-[130px]"
        />

        {/* Borderless, Feathered Smooth Himalayan Sanctuary Stage */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0.5 pb-1 sm:pt-3 sm:pb-2 bg-[radial-gradient(closest-side_at_50%_46%,rgba(253,226,168,0.48)_0%,rgba(218,142,78,0.18)_44%,rgba(38,61,50,0.08)_74%,rgba(245,240,230,0)_100%)]">
          {/* Soft Feathered Golden-Hour Sunburst & Mist Aura */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[520px] sm:w-[760px] h-[200px] sm:h-[250px] rounded-full bg-[radial-gradient(closest-side,rgba(253,226,168,0.65)_0%,rgba(197,91,35,0.16)_52%,transparent_100%)] blur-2xl"
          />

          {/* Soft Feathered Himalayan Valley Ridge Silhouette Watermark (Fades Smoothly at All Edges) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-44 sm:h-60 opacity-[0.16] [mask-image:radial-gradient(ellipse_75%_80%_at_50%_60%,#000_25%,transparent_95%)]"
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

          <div className="relative z-10">
            <FourPillarsShowcase
              destinations={destinations}
              properties={properties}
              products={products}
              productCategories={PRODUCT_CATEGORIES}
              productions={AUTHENTIC_PRODUCTIONS}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 6: STAYS — LOCATION-GROUPED HORIZONTAL STAYS SHOWCASE
          • Distinct yet harmonious Alpine Pine-Sage, Warm Parchment & Cedar Hearth atmosphere
          • Tightened top gap so "Himalayan Hospitality / Featured Stays" flows naturally from above
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="stays"
        className="relative z-20 !mt-1 sm:!mt-3 w-full pt-2 pb-5 sm:pt-4 sm:pb-7 overflow-x-clip"
      >
        {/* Distinct Alpine Sage Mist & Warm Sandstone Atmosphere */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(223,232,223,0.76)_18%,rgba(236,227,210,0.9)_52%,rgba(225,233,224,0.74)_85%,rgba(245,240,230,0)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 left-1/5 -translate-y-1/2 w-[500px] h-[420px] rounded-full bg-[#263D32]/[0.12] blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1/4 right-1/5 w-[460px] h-[380px] rounded-full bg-[#C55B23]/[0.10] blur-[120px]"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/75 bg-[linear-gradient(135deg,rgba(255,253,249,0.86)_0%,rgba(243,236,222,0.92)_48%,rgba(227,235,226,0.82)_100%)] shadow-[0_18px_46px_-16px_rgba(31,51,42,0.10),inset_0_1px_0_rgba(255,253,249,0.92)] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
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

            <ScrollReveal>
              <div className="space-y-7 sm:space-y-9">
                {properties.length > 0 ? (
                  <FeaturedStaysRows properties={properties} />
                ) : (
                  <EmptyState
                    icon={<Building2 className="w-6 h-6 text-terracotta" />}
                    kicker="Curated Onboarding"
                    title="Verified Homestays in Preparation"
                    description="We only display real, verified mountain properties approved by our moderation team. Are you a local homestay host in the Himalayas?"
                    action={
                      <LinkButton href="/stays/partner" variant="primary" size="md">
                        Partner With Uttarkunth Stays
                      </LinkButton>
                    }
                  />
                )}

                {/* Pick a Uttarkunth Destination — Part of the Stays Sanctuary Div */}
                <div
                  id="destinations"
                  className="pt-6 sm:pt-7 border-t border-[#D5C8B3]/70 scroll-mt-20"
                >
                  <DestinationAtlas destinations={destinations} />
                </div>

                {/* Recent Reviews Carousel — Dynamic Guest Trust Showcase Using public.reviews Structure */}
                <div
                  id="recent-reviews"
                  className="pt-6 sm:pt-7 border-t border-[#D5C8B3]/70 scroll-mt-20"
                >
                  <RecentReviewsCarousel reviews={reviews} properties={properties} />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 8: PRODUCTS — TREASURES OF THE HIMALAYAS
          • Highlighted Pillar Heading + 6 Ordered Sections:
            1. Featured Products (with dynamic regional/brand sub-rows)
            2. Woven & Worn
            3. Flavours of the Himalayas
            4. Crafted by Hand
            5. Natural Living
            6. Meet the Makers
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="products"
        className="relative z-20 w-full pt-2 pb-5 sm:pt-4 sm:pb-7 overflow-x-clip scroll-mt-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(238,226,205,0.78)_20%,rgba(232,223,206,0.92)_52%,rgba(225,233,224,0.72)_85%,rgba(245,240,230,0)_100%)]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/75 bg-[linear-gradient(135deg,rgba(255,253,249,0.88)_0%,rgba(244,236,220,0.92)_50%,rgba(229,236,227,0.84)_100%)] shadow-[0_18px_46px_-16px_rgba(31,51,42,0.10),inset_0_1px_0_rgba(255,253,249,0.92)] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            <ScrollReveal>
              <TreasuresOfHimalayasShowcase products={products} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 9: PRODUCTIONS — STORIES FROM THE MOUNTAINS
          • Highlighted Pillar Heading + 4 Sections:
            1. Featured Stories
            2. Uttarkunth Originals
            3. Creators Collaborations
            4. Have a Story to Tell? — Collaboration CTA
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="productions"
        className="relative z-20 w-full pt-2 pb-5 sm:pt-4 sm:pb-7 overflow-x-clip scroll-mt-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(224,232,223,0.76)_18%,rgba(236,227,210,0.90)_52%,rgba(225,233,224,0.74)_85%,rgba(245,240,230,0)_100%)]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/75 bg-[linear-gradient(135deg,rgba(255,253,249,0.88)_0%,rgba(243,236,222,0.92)_48%,rgba(227,235,226,0.84)_100%)] shadow-[0_18px_46px_-16px_rgba(31,51,42,0.10),inset_0_1px_0_rgba(255,253,249,0.92)] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            <ScrollReveal>
              <StoriesFromMountainsShowcase productions={AUTHENTIC_PRODUCTIONS} />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 10: COMMUNITY — GROWING TOGETHER
          • Highlighted Pillar Heading + Karmayog Description + 6 Welcome Categories
            (showcasing Uttarkunth itself as a village initiative) + Our People · Join Our Mission
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="community"
        className="relative z-20 w-full pt-2 pb-5 sm:pt-4 sm:pb-7 overflow-x-clip scroll-mt-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(245,240,230,0)_0%,rgba(235,225,205,0.78)_20%,rgba(226,234,225,0.88)_55%,rgba(242,233,216,0.76)_85%,rgba(245,240,230,0)_100%)]"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[26px] sm:rounded-[34px] border border-[#D5C8B3]/75 bg-[linear-gradient(135deg,rgba(255,253,249,0.88)_0%,rgba(243,236,222,0.92)_48%,rgba(227,235,226,0.84)_100%)] shadow-[0_18px_46px_-16px_rgba(31,51,42,0.10),inset_0_1px_0_rgba(255,253,249,0.92)] px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            <ScrollReveal>
              <GrowingTogetherShowcase />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 11: FOUNDER WORDS — SIMPLE EDITORIAL QUOTE
      ───────────────────────────────────────────────────────────────────── */}
      <section id="philosophy" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <ScrollReveal>
          <div className="text-center space-y-5 sm:space-y-6 px-2 sm:px-8">
            <span className="text-xs font-serif italic tracking-[0.14em] uppercase text-terracotta block">
              Founder Words
            </span>

            <blockquote className="font-serif text-xl sm:text-3xl lg:text-[2.2rem] font-medium italic text-forest leading-[1.38] tracking-tight max-w-4xl mx-auto text-balance">
              &ldquo;My aim is not to claim that I already know the answer. My aim is to build,
              experiment, learn, document and improve. If a small village can become a place where
              people create businesses, protect what they value and solve small problems together,
              perhaps that experience can become a model for something larger.&rdquo;
            </blockquote>

            <p className="font-serif text-base sm:text-lg font-bold tracking-wide text-charcoal pt-1">
              &mdash; {BRAND.founder}
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 12: PARTNERSHIP & FINAL EDITORIAL CALL TO ACTION
      ───────────────────────────────────────────────────────────────────── */}
      <section
        id="participate"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24"
      >
        {/* Final Monumental Editorial Brand Statement */}
        <div className="bg-warm-surface rounded-2xl border border-beige-dark/80 p-6 sm:p-10 lg:p-12 shadow-editorial-lg text-center space-y-4">
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-forest leading-[1.06] tracking-tight max-w-4xl mx-auto text-balance">
            Ideas Born in the Mountains.{' '}
            <span className="italic font-normal text-terracotta block sm:inline">
              Built Through People.
            </span>
          </h2>

          <p className="font-serif italic text-lg sm:text-2xl text-charcoal-light">
            Learn by Doing &bull; Grow by Serving.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
            <LinkButton
              href="/stays"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4 text-terracotta-light" />}
            >
              Explore Mountain Stays
            </LinkButton>
            <LinkButton
              href="/stays/partner"
              variant="terracotta"
              size="lg"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Partner as a Host
            </LinkButton>
            <LinkButton
              href="/community/join"
              variant="secondary"
              size="lg"
              leftIcon={<Heart className="w-4 h-4 text-terracotta" />}
            >
              Join Community Mission
            </LinkButton>
            <LinkButton href="/contact" variant="outline" size="lg">
              Contact Jari Headquarters
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}