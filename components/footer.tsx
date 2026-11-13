import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { BRAND, PILLARS } from '@/lib/constants';
import { MapPin, Mail, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-forest-dark text-warm-canvas border-t border-forest/40 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Masthead Banner */}
        <div className="pb-12 mb-12 border-b border-warm-canvas/12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-terracotta block">
              Uttarkunth Living University
            </span>
            <p className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-warm-canvas leading-[1.12] tracking-tight">
              Ideas born in the mountains.{' '}
              <em className="italic text-beige font-normal">Built through people.</em>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:text-right shrink-0">
            <div className="text-xs text-warm-canvas/80 font-sans space-y-0.5">
              <p className="font-serif italic text-base text-warm-canvas">
                &ldquo;{BRAND.philosophy}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Main 5-Column Editorial Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-warm-canvas/12">
          {/* Column 1: Uttarkunth Identity & Headquarters (4 cols) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-5 pr-0 lg:pr-6">
            <Logo variant="dark" showTagline />

            <p className="text-xs sm:text-sm text-warm-canvas/75 leading-relaxed font-sans max-w-sm">
              {BRAND.description}
            </p>

            <div className="pt-2 space-y-2 text-xs text-warm-canvas/70 border-t border-warm-canvas/10 max-w-xs">
              <p>
                Founder:{' '}
                <span className="text-warm-canvas font-semibold">{BRAND.founder}</span>
              </p>
              <p className="flex items-start gap-2 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0 mt-0.5" />
                <span>{BRAND.headquarters}</span>
              </p>
              <p className="flex items-center gap-2 pt-0.5">
                <Mail className="w-3.5 h-3.5 text-terracotta shrink-0" />
                <a
                  href={`mailto:${BRAND.contactEmail}`}
                  className="text-warm-canvas hover:text-terracotta underline underline-offset-4 transition-colors"
                >
                  {BRAND.contactEmail}
                </a>
              </p>
            </div>
          </div>

          {/* Column 2: Four Pillars Ecosystem (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-beige">
              Four Pillars
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-warm-canvas/75">
              {PILLARS.map((pillar) => (
                <li key={pillar.id}>
                  <Link
                    href={pillar.href}
                    className="hover:text-terracotta transition-colors inline-flex items-center gap-1"
                  >
                    <span>{pillar.title}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-warm-canvas/10">
                <Link
                  href="/search"
                  className="hover:text-terracotta transition-colors text-xs text-beige/90"
                >
                  Search Ecosystem
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Partnership & Participation (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-beige">
              Participate
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-warm-canvas/75">
              <li>
                <Link
                  href="/stays/partner"
                  className="hover:text-terracotta transition-colors inline-flex items-center gap-1"
                >
                  <span>List a Property</span>
                  <ArrowUpRight className="w-3 h-3 text-terracotta" />
                </Link>
              </li>
              <li>
                <Link href="/products/sell" className="hover:text-terracotta transition-colors">
                  Sell Your Products
                </Link>
              </li>
              <li>
                <Link
                  href="/production/collaborate"
                  className="hover:text-terracotta transition-colors"
                >
                  Collaborate on Films
                </Link>
              </li>
              <li>
                <Link href="/community/join" className="hover:text-terracotta transition-colors">
                  Join Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/community/initiatives"
                  className="hover:text-terracotta transition-colors"
                >
                  Field Initiatives
                </Link>
              </li>
              <li>
                <Link
                  href="/community/stories"
                  className="hover:text-terracotta transition-colors"
                >
                  Oral History Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Heritage & Account (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-beige">
              Ecosystem &amp; Account
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-warm-canvas/75">
              <li>
                <Link href="/about" className="hover:text-terracotta transition-colors">
                  About Uttarkunth
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-terracotta transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li className="pt-2 border-t border-warm-canvas/10">
                <Link href="/account" className="hover:text-terracotta transition-colors">
                  My Uttarkunth
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-terracotta transition-colors">
                  My Trips
                </Link>
              </li>
              <li>
                <Link href="/account/profile" className="hover:text-terracotta transition-colors">
                  Member Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal Policies & Trust (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-beige">
              Policies &amp; Trust
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-warm-canvas/75">
              <li>
                <Link href="/privacy" className="hover:text-terracotta transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-terracotta transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/booking-policy" className="hover:text-terracotta transition-colors">
                  Booking Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/cancellation-policy"
                  className="hover:text-terracotta transition-colors"
                >
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar — Strict Brand Rule: No version suffixes, zero internal portal links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-warm-canvas/60 gap-4">
          <p>© {new Date().getFullYear()} Uttarkunth. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/privacy" className="hover:text-warm-canvas transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-warm-canvas transition-colors">
              Terms
            </Link>
            <Link href="/booking-policy" className="hover:text-warm-canvas transition-colors">
              Booking Policy
            </Link>
            <Link href="/cancellation-policy" className="hover:text-warm-canvas transition-colors">
              Cancellations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
