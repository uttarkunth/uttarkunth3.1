import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search-bar';
import { AestheticBentoGrid } from '@/components/aesthetic-bento-grid';
import { AestheticPropertyCard } from '@/components/aesthetic-property-card';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';
import { BRAND } from '@/lib/constants';
import { Sparkles, CheckCircle2, Trees, HeartHandshake, Shield, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getProperties() {
  try {
    const supabase = createPublicServerSupabaseClient();
    const { data: properties } = await supabase
      .from('properties')
      .select('id, slug, name, description, address, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .limit(6);

    if (!properties || properties.length === 0) {
      return [];
    }

    const propertyIds = properties.map(p => p.id);
    const { data: rooms } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .in('property_id', propertyIds)
      .eq('active', true);

    return properties.map(p => ({
      ...p,
      rooms: rooms ? rooms.filter(r => r.property_id === p.id) : []
    }));
  } catch {
    return [];
  }
}

export default async function AestheticPreviewPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      
      {/* Editorial Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-forest-dark via-forest to-forest-dark text-white">
        
        {/* Subtle Mountain Backdrop */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
            alt="Himalayan Sanctuary"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wider uppercase text-ivory">
            <Sparkles className="w-4 h-4 text-ukorange" />
            <span>Pinterest & Bento Inspired UI/UX Preview</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-ivory leading-[1.05] max-w-4xl mx-auto">
            Where the Deodar Sings. <br />
            <span className="italic font-normal text-ukorange">Sanctuary</span> in Jari.
          </h1>

          <p className="text-base sm:text-xl text-ivory/80 max-w-2xl mx-auto font-sans leading-relaxed">
            Authentic timber homestays, home-cooked mountain meals, and direct host approval in Himachal Pradesh.
          </p>

          {/* Floating Search Bar */}
          <div className="pt-4 sm:pt-6">
            <SearchBar />
          </div>

          {/* Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-ivory/70 pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              100% Host Approval Guarantee
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              0% First-Year Host Commission
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              Verified Local Homestays
            </span>
          </div>
        </div>
      </section>

      {/* Bento Grid Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AestheticBentoGrid properties={properties} />
      </section>

      {/* All Available Stays Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-ukorange">All Mountain Havens</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-0.5">
              Curated Local Retreats
            </h2>
          </div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest hover:text-ukorange transition-colors"
          >
            <span>View All Properties</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <AestheticPropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      {/* Himalayan Philosophy Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-forest-dark text-ivory p-8 sm:p-12 relative overflow-hidden border border-forest/20">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              Our Community Mission
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-ivory leading-tight">
              Learn by Doing. <br />
              <span className="italic font-normal text-ukorange">Grow by Serving.</span>
            </h3>
            <p className="text-sm sm:text-base text-ivory/80 leading-relaxed font-sans">
              Founded by Gaurav Negi in Jari, Uttarkunth Stays bridges mindful travelers with generational Himalayan custodians. We reject sterile corporate tourism in favor of real human warmth, community dignity, and environmental stewardship.
            </p>
            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ukorange hover:bg-ukorange-hover text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <span>Read the Founder's Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}