'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatINR } from '@/lib/utils';
import { MapPin, Sparkles, Volume2, VolumeX, CheckCircle2, ArrowRight, Trees, Wind, Compass } from 'lucide-react';

interface BentoGridProps {
  properties: any[];
}

export function AestheticBentoGrid({ properties }: BentoGridProps) {
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('all');

  const yash = properties.find(p => p.slug === 'yash-home-stay') || properties[0];
  const wonderway = properties.find(p => p.slug === 'wonderway-retreat') || properties[1];

  const moods = [
    { id: 'all', label: '✨ All Retreats' },
    { id: 'woodfire', label: '🪵 Cedar Hearth & Woodfire' },
    { id: 'river', label: '🌊 Parvati River Solitude' },
    { id: 'workation', label: '💻 High-Speed Workation' },
    { id: 'orchard', label: '🍎 Apple Blossom & Orchard' }
  ];

  return (
    <div className="space-y-8">
      {/* Mountain Moods Filter */}
      <div className="border-b border-forest/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-ukorange">Slow Travel Experience</span>
            <h3 className="font-serif text-3xl font-bold text-forest mt-0.5">Explore by Mountain Mood</h3>
          </div>
          <span className="text-xs text-charcoal-muted">Curated according to Himalayan rhythm & pace</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedMood === mood.id
                  ? 'bg-forest text-ivory shadow-sm'
                  : 'bg-white/80 border border-forest/15 text-charcoal hover:border-forest/40'
              }`}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {/* 1. Large Feature Bento Tile (Yash Home Stay) */}
        {yash && (
          <div className="md:col-span-2 lg:col-span-2 md:row-span-2 bg-white rounded-3xl overflow-hidden border border-forest/15 shadow-soft hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between">
            <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-forest-dark">
              <Image
                src={yash.photos?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'}
                alt={yash.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-black/20" />

              <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                <span className="px-3 py-1 bg-forest/90 backdrop-blur-md text-ivory text-xs font-semibold uppercase tracking-wider rounded-full">
                  Featured Sanctuary
                </span>
                <span className="px-3 py-1 bg-ukorange/90 backdrop-blur-md text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  ★ 4.9 • Verified
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white z-20">
                <span className="text-xs uppercase font-semibold text-ukorange tracking-widest block">
                  {yash.village || 'Jari'}, Parvati Valley
                </span>
                <h3 className="font-serif text-3xl font-bold text-ivory mt-0.5">
                  {yash.name}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-charcoal-muted leading-relaxed line-clamp-2">
                {yash.description}
              </p>

              <div className="flex flex-wrap gap-2 text-xs font-medium text-forest">
                <span className="px-2.5 py-1 bg-forest/5 rounded-md border border-forest/10">🪵 Deodar Timber Joinery</span>
                <span className="px-2.5 py-1 bg-forest/5 rounded-md border border-forest/10">📶 High-Speed Wi-Fi</span>
                <span className="px-2.5 py-1 bg-forest/5 rounded-md border border-forest/10">🍲 Home Tandoor Meals</span>
              </div>

              <div className="pt-3 border-t border-forest/10 flex items-center justify-between">
                <div>
                  <span className="font-serif text-2xl font-bold text-forest">₹900</span>
                  <span className="text-xs text-charcoal-muted"> / night</span>
                </div>
                <Link
                  href={`/properties/${yash.slug}`}
                  className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-ivory rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                >
                  View Details & Book
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. Editorial Philosophy Card */}
        <div className="bg-forest text-ivory rounded-3xl p-6 flex flex-col justify-between shadow-soft relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-forest-hover/40 pointer-events-none" />
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-ukorange">Brand Philosophy</span>
            <p className="font-serif text-2xl font-normal italic mt-3 leading-snug">
              "Learn by Doing • Grow by Serving."
            </p>
            <p className="text-xs text-ivory/80 mt-2 font-sans leading-relaxed">
              We empower local Himalayan homestays with direct digital ownership and 0% first-year commissions.
            </p>
          </div>
          <div className="pt-6 border-t border-white/10 mt-4">
            <span className="text-xs font-semibold block text-ivory/90">Gaurav Negi</span>
            <span className="text-[11px] text-ivory/60 block">Founder, Uttarkunth</span>
          </div>
        </div>

        {/* 3. Parvati Ambient Soundscape Simulator */}
        <div className="bg-white rounded-3xl p-6 flex flex-col justify-between border border-forest/15 shadow-soft">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-widest text-ukorange">Atmosphere</span>
              <span className="text-xs uppercase font-semibold text-charcoal-muted">
                {isPlayingSound ? 'Playing' : 'Tap to Listen'}
              </span>
            </div>
            <h4 className="font-serif text-xl font-bold text-forest mt-2">Parvati Waters & Cedar Breeze</h4>
            <p className="text-xs text-charcoal-muted mt-1">Calm mountain waters flowing past the deodar pine trees.</p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 h-7">
              <div className={`w-1.5 bg-forest rounded-full transition-all ${isPlayingSound ? 'h-6 animate-pulse' : 'h-2'}`} />
              <div className={`w-1.5 bg-ukorange rounded-full transition-all ${isPlayingSound ? 'h-4 animate-bounce' : 'h-2'}`} />
              <div className={`w-1.5 bg-forest rounded-full transition-all ${isPlayingSound ? 'h-7 animate-pulse' : 'h-2'}`} />
              <div className={`w-1.5 bg-ukorange rounded-full transition-all ${isPlayingSound ? 'h-3 animate-bounce' : 'h-2'}`} />
            </div>

            <button
              onClick={() => setIsPlayingSound(!isPlayingSound)}
              className="w-10 h-10 rounded-full bg-forest text-ivory flex items-center justify-center hover:bg-forest-hover transition-transform hover:scale-105 shadow-sm"
              aria-label="Toggle Soundscape"
            >
              {isPlayingSound ? <VolumeX className="w-4 h-4 text-ukorange" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 4. Wonderway Retreat Card */}
        {wonderway && (
          <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl overflow-hidden border border-forest/15 shadow-soft hover:shadow-xl transition-all duration-500 group flex flex-col sm:flex-row">
            <div className="relative sm:w-1/2 h-56 sm:h-auto overflow-hidden bg-forest-dark">
              <Image
                src={wonderway.photos?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'}
                alt={wonderway.name}
                fill
                sizes="(max-width: 768px) 100vw, 30vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-forest/90 text-ivory text-xs font-semibold uppercase rounded-full">
                  Mountain Retreat
                </span>
              </div>
              <div className="absolute bottom-3 left-3 text-white">
                <span className="text-xs font-semibold text-ukorange">Jari, Kullu</span>
              </div>
            </div>

            <div className="sm:w-1/2 p-6 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-forest">{wonderway.name}</h3>
                <p className="text-xs text-charcoal-muted line-clamp-2 mt-1 leading-relaxed">
                  {wonderway.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs text-forest font-medium">
                <span className="px-2.5 py-1 bg-forest/5 rounded border border-forest/10">🌄 Balcony Views</span>
                <span className="px-2.5 py-1 bg-forest/5 rounded border border-forest/10">🅿️ Free Parking</span>
              </div>

              <div className="pt-2 border-t border-forest/10 flex items-center justify-between">
                <div>
                  <span className="font-serif text-xl font-bold text-forest">₹3,500</span>
                  <span className="text-xs text-charcoal-muted"> / night</span>
                </div>
                <Link
                  href={`/properties/${wonderway.slug}`}
                  className="px-4 py-2 bg-forest hover:bg-forest-hover text-ivory rounded-full text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Reserve
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 5. Live Valley Conditions Card */}
        <div className="bg-ivory-warm rounded-3xl p-6 flex flex-col justify-between border border-forest/15 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-widest text-forest/70">Valley Conditions</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="my-2">
            <div className="font-serif text-4xl font-bold text-forest">15°C</div>
            <div className="text-xs font-semibold text-ukorange mt-0.5">Crisp Himalayan Air</div>
            <div className="text-xs text-charcoal-muted">Clear Skies over Parvati Pass</div>
          </div>
          <div className="text-xs text-charcoal-muted border-t border-forest/10 pt-2 flex justify-between">
            <span>Altitude: 1,524m</span>
            <span>Air: Pure Pine</span>
          </div>
        </div>

        {/* 6. Host Story Link */}
        <Link
          href="/about"
          className="bg-white rounded-3xl p-6 flex flex-col justify-between border border-forest/15 shadow-soft hover:border-forest/40 hover:shadow-lg transition-all group"
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-ukorange/10 text-ukorange flex items-center justify-center font-bold text-sm mb-3">
              🛖
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-ukorange">Community Custodians</span>
            <h4 className="font-serif text-xl font-bold text-forest mt-1 group-hover:text-ukorange transition-colors">
              The People of Jari
            </h4>
            <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
              Read how local families keep the sacred valleys clean, hospitable, and true to tradition.
            </p>
          </div>
          <div className="pt-3 flex items-center gap-1.5 text-xs font-semibold text-forest">
            <span>Read Valley Stories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-ukorange" />
          </div>
        </Link>

      </div>
    </div>
  );
}
