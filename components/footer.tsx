import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { BRAND, PILLARS } from '@/lib/constants';
import { MapPin, Mail, Phone, Heart, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-forest-dark text-warm-canvas border-t border-forest/30 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Story Column */}
          <div className="space-y-4 lg:col-span-2">
            <Logo variant="dark" showTagline />
            <p className="text-sm text-warm-canvas/80 leading-relaxed font-sans max-w-sm">
              {BRAND.description}
            </p>
            <div className="p-3.5 bg-forest/40 border border-beige/20 rounded-xl max-w-sm">
              <span className="text-xs uppercase tracking-widest text-terracotta font-semibold block mb-1">Our Philosophy</span>
              <p className="font-serif italic text-base text-warm-canvas font-medium">
                "{BRAND.philosophy}"
              </p>
              <p className="text-xs text-beige/80 mt-1 font-sans">
                {BRAND.motto}
              </p>
            </div>
            <div className="text-xs text-warm-canvas/60 space-y-1">
              <p>Founder: <span className="text-warm-canvas font-medium">{BRAND.founder}</span></p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
                <span>{BRAND.headquarters}</span>
              </p>
            </div>
          </div>

          {/* The Four Pillars */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-warm-canvas mb-4 tracking-wide">Ecosystem</h3>
            <ul className="space-y-2.5 text-sm text-warm-canvas/75">
              {PILLARS.map((pillar) => (
                <li key={pillar.id}>
                  <Link
                    href={pillar.href}
                    className="hover:text-terracotta transition-colors flex items-center justify-between"
                  >
                    <span>{pillar.title}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-forest/40">
                <Link
                  href="/trips"
                  className="hover:text-terracotta transition-colors text-xs text-beige"
                >
                  My Trips (Canonical)
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="hover:text-terracotta transition-colors text-xs text-beige"
                >
                  My Uttarkunth Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Partnership Pathways */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-warm-canvas mb-4 tracking-wide">Partnerships</h3>
            <ul className="space-y-2.5 text-sm text-warm-canvas/75">
              <li>
                <Link href="/stays/partner" className="hover:text-terracotta transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
                  <span>List a Property</span>
                </Link>
              </li>
              <li>
                <Link href="/products/sell" className="hover:text-terracotta transition-colors">
                  Sell Your Products
                </Link>
              </li>
              <li>
                <Link href="/production/collaborate" className="hover:text-terracotta transition-colors">
                  Collaborate on Films
                </Link>
              </li>
              <li>
                <Link href="/community/join" className="hover:text-terracotta transition-colors">
                  Join Our Mission
                </Link>
              </li>
              <li className="pt-2 border-t border-forest/40">
                <Link href="/about" className="hover:text-terracotta transition-colors">
                  About Uttarkunth
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-terracotta transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies & Contact */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-semibold text-warm-canvas mb-4 tracking-wide">Policies & Trust</h3>
            <ul className="space-y-2 text-sm text-warm-canvas/75">
              <li>
                <Link href="/privacy" className="hover:text-terracotta transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-terracotta transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/booking-policy" className="hover:text-terracotta transition-colors">
                  Booking Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-terracotta transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>

            <div className="space-y-2 text-xs text-warm-canvas/80 pt-3 border-t border-forest/40">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-terracotta flex-shrink-0" />
                <a href={`mailto:${BRAND.contactEmail}`} className="hover:text-warm-canvas underline underline-offset-2">
                  {BRAND.contactEmail}
                </a>
              </div>
            </div>

            <div className="pt-1">
              <span className="inline-block text-[11px] bg-terracotta/20 text-warm-canvas border border-terracotta/40 px-2.5 py-1 rounded-full font-medium">
                Direct Host Payment • No Online Markups
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar — Strict Brand Rule: No version suffixes, zero internal portal links */}
        <div className="pt-8 mt-8 border-t border-forest/40 flex flex-col sm:flex-row items-center justify-between text-xs text-warm-canvas/60 gap-4">
          <p>© {new Date().getFullYear()} Uttarkunth. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-warm-canvas transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-warm-canvas transition-colors">Terms</Link>
            <Link href="/booking-policy" className="hover:text-warm-canvas transition-colors">Booking Policy</Link>
            <Link href="/cancellation-policy" className="hover:text-warm-canvas transition-colors">Cancellations</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
