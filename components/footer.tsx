import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { BRAND, DESTINATIONS } from '@/lib/constants';
import { MapPin, Mail, Phone, Heart, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-forest-dark text-ivory border-t border-forest/20 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Story Column */}
          <div className="space-y-4">
            <Logo variant="dark" showTagline />
            <p className="text-sm text-ivory/80 leading-relaxed font-sans">
              Born in Jari, Parvati Valley. Rooted in authentic Himalayan culture, local homestays, and sustainable community hospitality.
            </p>
            <div className="p-3 bg-forest/40 border border-forest/30 rounded-lg">
              <span className="text-xs uppercase tracking-widest text-ukorange font-semibold block mb-1">Our Philosophy</span>
              <p className="font-serif italic text-base text-ivory font-medium">
                "{BRAND.philosophy}"
              </p>
            </div>
            <div className="text-xs text-ivory/60 space-y-1">
              <p>Founder: <span className="text-ivory font-medium">{BRAND.founder}</span></p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ukorange flex-shrink-0" />
                <span>{BRAND.headquarters}</span>
              </p>
            </div>
          </div>

          {/* Featured Destinations */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-ivory mb-4 tracking-wide">Himalayan Valleys</h3>
            <ul className="space-y-2.5 text-sm text-ivory/70">
              {DESTINATIONS.map(d => (
                <li key={d.name}>
                  <Link
                    href={`/properties?destination=${encodeURIComponent(d.name)}`}
                    className="hover:text-ukorange transition-colors flex items-center justify-between"
                  >
                    <span>{d.name}</span>
                    <span className="text-xs text-ivory/40">{d.valley}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-ivory mb-4 tracking-wide">Uttarkunth Stays</h3>
            <ul className="space-y-2.5 text-sm text-ivory/70">
              <li>
                <Link href="/properties" className="hover:text-ukorange transition-colors">
                  Explore Homestays
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-ukorange transition-colors">
                  Our Himalayan Heritage
                </Link>
              </li>
              <li>
                <Link href="/host/dashboard" className="hover:text-ukorange transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-ukorange" />
                  Become a Host (0% Commission)
                </Link>
              </li>
              <li>
                <Link href="/guest/trips" className="hover:text-ukorange transition-colors">
                  My Trips & Booking Requests
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-ukorange transition-colors">
                  Contact & Local Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Trust & Responsible Tourism */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-ivory mb-4 tracking-wide">Responsible Tourism</h3>
            <p className="text-xs text-ivory/70 leading-relaxed">
              Every booking directly empowers mountain families, promotes natural preservation, and sustains genuine Himalayan village heritage.
            </p>
            <div className="space-y-2 text-xs text-ivory/80 pt-2 border-t border-forest/30">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-ukorange" />
                <span>{BRAND.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-ukorange" />
                <span>{BRAND.phone}</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-block text-[11px] bg-ukorange/20 text-ukorange border border-ukorange/30 px-2.5 py-1 rounded-full font-medium">
                Request-To-Book • Verified Hosts
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-forest/30 flex flex-col sm:flex-row items-center justify-between text-xs text-ivory/50 gap-4">
          <p>© {new Date().getFullYear()} Uttarkunth Stays 3.0. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-ivory transition-colors">Privacy Policy</Link>
            <Link href="/about" className="hover:text-ivory transition-colors">Host Terms</Link>
            <Link href="/about" className="hover:text-ivory transition-colors">Guest Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
