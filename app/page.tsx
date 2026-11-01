import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/components/search-bar';
import { PropertyCard } from '@/components/property-card';
import { createAdminClient } from '@/lib/supabase/admin';
import { EXISTING_PROPERTIES, BRAND, DESTINATIONS } from '@/lib/constants';
import { Shield, Sparkles, HeartHandshake, Trees, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

async function getFeaturedProperties() {
  try {
    const supabase = createAdminClient();
    const { data: properties } = await supabase
      .from('properties')
      .select('id, slug, name, description, address, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .limit(6);

    if (!properties || properties.length === 0) {
      return EXISTING_PROPERTIES;
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
    return EXISTING_PROPERTIES;
  }
}

export default async function HomePage() {
  const properties = await getFeaturedProperties();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-forest-dark via-forest to-forest-dark text-white">
        {/* Background Mountain Motif */}
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
            alt="Himalayan Landscape"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium tracking-wider uppercase text-ivory">
            <Sparkles className="w-4 h-4 text-ukorange" />
            <span>Born in Jari • Parvati Valley • Himachal Pradesh</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ivory leading-[1.1] max-w-4xl mx-auto">
            Himalayan Heritage. <br />
            <span className="italic font-normal text-ukorange">Community-Rooted</span> Hospitality.
          </h1>

          <p className="text-base sm:text-xl text-ivory/80 max-w-2xl mx-auto font-sans leading-relaxed">
            Discover authentic local homestays in Parvati Valley. Direct host approval, honest mountain warmth, and responsible sustainable travel.
          </p>

          {/* Prominent Search Bar */}
          <div className="pt-4 sm:pt-6">
            <SearchBar />
          </div>

          {/* Trust Points */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-ivory/70 pt-4">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              Verified Local Homestays
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              0% First-Year Host Commission
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              Host Approval Guaranteed
            </span>
          </div>
        </div>
      </section>

      {/* 2. Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange block mb-2">
              Authentic Stays
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Featured Mountain Accommodations
            </h2>
            <p className="text-sm text-charcoal-muted mt-1 max-w-xl">
              Stay with local families in Jari and Parvati Valley. Clean mountain rooms, home-cooked food, and serene views.
            </p>
          </div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-ukorange transition-colors"
          >
            <span>Explore All Stays</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {properties.map(p => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* 3. Philosophy & Brand Story Section */}
      <section className="bg-sand/30 border-y border-forest/10 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-3 py-1 bg-forest/10 text-forest text-xs font-bold uppercase tracking-wider rounded-md">
                Our Heritage & Purpose
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-forest leading-tight">
                "Learn by Doing • <br />Grow by Serving"
              </h2>
              <p className="text-sm sm:text-base text-charcoal leading-relaxed">
                Founded by <strong>{BRAND.founder}</strong> in Jari, Uttarkunth was born out of a desire to empower mountain communities and protect the cultural soul of the Himalayas.
              </p>
              <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
                We bridge the gap between discerning travelers seeking genuine mountain peace and independent homestay hosts who preserve age-old traditions of Himachali hospitality.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 bg-white rounded-xl border border-forest/10 shadow-sm">
                  <Trees className="w-6 h-6 text-forest mb-2" />
                  <h4 className="font-semibold text-sm text-charcoal">Eco-Rooted</h4>
                  <p className="text-xs text-charcoal-muted mt-1">Zero plastic waste initiatives & sustainable village living.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-forest/10 shadow-sm">
                  <HeartHandshake className="w-6 h-6 text-ukorange mb-2" />
                  <h4 className="font-semibold text-sm text-charcoal">Community First</h4>
                  <p className="text-xs text-charcoal-muted mt-1">Direct earnings flow to local hosts and mountain families.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-forest/10 shadow-sm">
                  <Shield className="w-6 h-6 text-forest mb-2" />
                  <h4 className="font-semibold text-sm text-charcoal">Safe & Verified</h4>
                  <p className="text-xs text-charcoal-muted mt-1">Every listing is physically inspected and vetted.</p>
                </div>
              </div>
            </div>

            {/* Visual Mosaic */}
            <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lifted border-4 border-white">
              <Image
                src="https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/wonderway%20retreat/wonderway2.jpeg"
                alt="Wonderway Retreat Jari"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Jari, Kullu</span>
                <h3 className="font-serif text-2xl font-bold text-ivory">Wonderway Retreat</h3>
                <p className="text-xs text-ivory/80 mt-1">Breathtaking views of the Parvati mountain range</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Destinations Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange block mb-2">
            Explore Himachal Pradesh
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            Destinations We Cherish
          </h2>
          <p className="text-sm text-charcoal-muted mt-1">
            From the cedar forests of Jari to the alpine heights of Kasol and Kullu.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {DESTINATIONS.map(d => (
            <Link
              key={d.name}
              href={`/properties?destination=${encodeURIComponent(d.name)}`}
              className="group p-5 bg-white rounded-2xl border border-forest/10 hover:border-forest/30 shadow-soft hover:shadow-lifted transition-all flex flex-col justify-between"
            >
              <div>
                <MapPin className="w-5 h-5 text-ukorange mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl font-bold text-forest group-hover:text-ukorange transition-colors">
                  {d.name}
                </h3>
                <span className="text-xs text-charcoal-muted">{d.valley}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-xs font-semibold text-forest">
                <span>{d.count > 0 ? `${d.count} verified stay${d.count > 1 ? 's' : ''}` : 'Discover'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Host Onboarding Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest rounded-3xl p-8 sm:p-14 text-ivory relative overflow-hidden shadow-lifted">
          <div className="relative z-10 max-w-2xl space-y-6">
            <span className="inline-block px-3 py-1 bg-ukorange text-white text-xs font-bold uppercase tracking-wider rounded-full">
              Host Partnership Program
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-ivory leading-tight">
              Share Your Mountain Home With Travelers Worldwide
            </h2>
            <p className="text-sm sm:text-base text-ivory/80 leading-relaxed font-sans">
              Join Uttarkunth Stays with <strong>0% commission during your first 12 months</strong>. We help independent homestays and mountain retreats in Himachal Pradesh digitize reservations and connect with respectful guests.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/host/dashboard"
                className="px-6 py-3 bg-ukorange hover:bg-ukorange-hover text-white font-semibold text-sm rounded-xl shadow-md transition-all hover:scale-105"
              >
                Apply as a Host
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-ivory font-semibold text-sm rounded-xl border border-white/20 transition-colors"
              >
                Talk to Gaurav Negi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
