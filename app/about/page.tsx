import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/constants';
import { Heart, Trees, Sparkles, MapPin, Users, Compass, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: `Our Story — ${BRAND.name}`,
  description: 'The story behind Uttarkunth Stays. Founded by Gaurav Negi in Jari, Parvati Valley. Learn by Doing • Grow by Serving.',
};

export default function AboutPage() {
  return (
    <div className="space-y-16 sm:space-y-24 py-12 pb-24">
      {/* Editorial Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-ukorange" />
          The Uttarkunth Story
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-forest leading-tight">
          Born in the Himalayas. <br />
          <span className="italic font-normal text-ukorange">Built Around Community.</span>
        </h1>
        <p className="text-base sm:text-lg text-charcoal-muted leading-relaxed max-w-2xl mx-auto">
          From Jari, in the heart of Parvati Valley: connecting travelers with authentic local accommodations and helping independent mountain hosts participate in digital hospitality.
        </p>
      </section>

      {/* Philosophy Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-lifted relative overflow-hidden">
          <span className="text-xs uppercase tracking-widest text-ukorange font-bold block">Our Core Philosophy</span>
          <blockquote className="font-serif text-3xl sm:text-5xl font-medium italic text-ivory">
            "{BRAND.philosophy}"
          </blockquote>
          <p className="text-sm text-ivory/80 max-w-2xl mx-auto leading-relaxed">
            We believe sustainable progress happens when people are empowered to learn hands-on and build solutions that serve their communities.
          </p>
          <div className="pt-2 text-xs text-ivory/60">
            Founded by <strong className="text-ivory">{BRAND.founder}</strong> • Jari, Himachal Pradesh
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">What Drives Us</h2>
          <p className="text-sm text-charcoal-muted mt-1">Our principles for modern Himalayan hospitality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-8 border border-forest/15 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
              <Trees className="w-6 h-6 text-forest" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-forest">Ecological Stewardship</h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Parvati Valley is one of the most fragile alpine ecosystems in the world. We actively advocate for zero single-use plastics, water preservation, and low-impact tourism.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-forest/15 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-xl bg-ukorange/10 text-ukorange flex items-center justify-center">
              <Users className="w-6 h-6 text-ukorange" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-forest">Empowering Local Hosts</h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              We offer a 0% commission introductory program to help homestay owners in Jari and beyond list their stays, handle bookings transparently, and build direct guest relationships.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-forest/15 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-xl bg-ukblue-deep/10 text-ukblue flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-ukblue-deep" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-forest">Verified Mountain Warmth</h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              No faceless aggregators or automated overbooking. Every listing is physically inspected, and hosts approve each stay request before finalizing.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Message */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-ivory-warm rounded-3xl p-8 sm:p-12 border border-forest/20 flex flex-col md:flex-row gap-8 items-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-forest text-ivory flex items-center justify-center font-serif text-4xl sm:text-5xl font-bold flex-shrink-0">
            GN
          </div>
          <div className="space-y-4">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">A Note From Gaurav Negi</h3>
            <p className="text-sm text-charcoal leading-relaxed font-sans">
              "Uttarkunth Stays was founded in Jari with a simple vision: to give mountain hosts the tools to welcome the world on their own terms. When you stay with our hosts, you are not a tourist passing through — you are a guest in our Himalayan family. Thank you for traveling responsibly and keeping our mountains pristine."
            </p>
            <div className="text-xs font-semibold text-ukorange uppercase tracking-wider">
              Gaurav Negi — Founder, Uttarkunth
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
