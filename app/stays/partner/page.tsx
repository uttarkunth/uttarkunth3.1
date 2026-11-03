import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import {
  Home,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  MapPin,
  CalendarCheck,
  CreditCard,
  HeartHandshake,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

export const metadata = {
  title: `Partner With Uttarkunth Stays — List Your Mountain Property`,
  description:
    'Join our curated network of authentic Himalayan homestays. Retain complete booking autonomy, direct host payments, and transparent terms.',
};

export default function StaysPartnerPage() {
  return (
    <div className="space-y-16 sm:space-y-24 py-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 1. HERO SECTION */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-ukorange" />
          <span>Host Partnership Program</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-forest leading-tight">
          Partner With Uttarkunth Stays. <br />
          <span className="italic font-normal text-ukorange">Host on Your Own Terms.</span>
        </h1>

        <p className="text-base sm:text-lg text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          We connect authentic Himalayan homestays and retreats with conscious travelers who respect mountain heritage. Retain 100% direct guest payments and full reservation control.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-8 py-4 rounded-full font-semibold text-sm transition-all shadow-lifted hover:scale-[1.02]"
          >
            <span>Apply to List Your Property</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white border border-forest/20 text-forest hover:bg-forest/5 px-7 py-4 rounded-full font-semibold text-sm transition-all"
          >
            <span>Speak With Our Team</span>
          </Link>
        </div>
      </section>

      {/* 2. CORE VALUE PROPOSITION FOR HOSTS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-ukorange" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-forest">Direct Host Payment</h3>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property upon check-in via cash, UPI, or local transfer.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
            <CalendarCheck className="w-6 h-6 text-ukorange" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-forest">Request-Based Autonomy</h3>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            No forced instant overbookings. You review every reservation request, inspect guest profiles and trip dates, and approve only the stays that suit your home.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-ukorange" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-forest">Authentic Himalayan Focus</h3>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            We are not a generic mass-market aggregator. We celebrate authentic vernacular architecture, family-run homestays, and responsible mountain stewardship.
          </p>
        </div>
      </section>

      {/* 3. FIVE-STEP HOST ONBOARDING PROCESS */}
      <section className="bg-ivory-warm rounded-3xl p-8 sm:p-14 border border-forest/20 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            How It Works
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
            Five Steps to Listing Your Property
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted">
            Our straightforward review workflow ensures authenticity and trust for hosts and guests.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-forest/10 space-y-2">
            <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-bold flex items-center justify-center">1</span>
            <strong className="block text-sm font-bold text-forest">Submit Application</strong>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Register your account and enter your property details, village location, rooms, and genuine photos.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest/10 space-y-2">
            <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-bold flex items-center justify-center">2</span>
            <strong className="block text-sm font-bold text-forest">Host &amp; Identity Review</strong>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Our administrative team verifies host identity, contact information, and village residency.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest/10 space-y-2">
            <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-bold flex items-center justify-center">3</span>
            <strong className="block text-sm font-bold text-forest">Direct Settlement Terms</strong>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Confirm hosting guidelines and our direct host payment model (100% paid by guests at the property).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest/10 space-y-2">
            <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-bold flex items-center justify-center">4</span>
            <strong className="block text-sm font-bold text-forest">Room Setup</strong>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Configure room units, guest capacities, nightly rates, and authentic house rules.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest/10 space-y-2">
            <span className="w-8 h-8 rounded-full bg-forest text-ivory text-xs font-bold flex items-center justify-center">5</span>
            <strong className="block text-sm font-bold text-forest">Approval &amp; Publish</strong>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Upon administrative review and approval, your listing goes live to receive booking requests.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-all"
          >
            <span>Start Your Application Online</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Host Questions
          </span>
          <h2 className="font-serif text-3xl font-bold text-forest">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-forest/15 space-y-2">
            <h3 className="font-serif text-lg font-bold text-forest">
              How do guest payments work?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Uttarkunth does not collect online stay payments from guests. Guests pay you directly upon arrival at your homestay using cash, UPI, or local bank transfer.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-forest/15 space-y-2">
            <h3 className="font-serif text-lg font-bold text-forest">
              What types of properties qualify?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              We welcome traditional timber homestays, mountain chalets, village cottages, and secluded retreats located in Himalayan hamlets across Himachal Pradesh, Jammu &amp; Kashmir, and Uttarakhand.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-forest/15 space-y-2">
            <h3 className="font-serif text-lg font-bold text-forest">
              Can I decline booking requests?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Yes. All bookings are request-based. You receive notifications for new requests and have full discretion to accept or decline based on availability and house rules.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-forest/15 space-y-2">
            <h3 className="font-serif text-lg font-bold text-forest">
              How do I get help with photography or listing details?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Our team assists hosts in Parvati Valley and neighboring regions with photography, listing optimization, and digital onboarding. You can contact us at {BRAND.email}.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FINAL PARTNERSHIP CTA */}
      <section className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-lifted">
        <span className="text-xs uppercase tracking-widest text-ukorange font-bold block">
          Ready to Welcome Travelers?
        </span>
        <h2 className="font-serif text-3xl sm:text-5xl font-bold max-w-2xl mx-auto leading-tight">
          Join the Growing Uttarkunth Himalayan Community
        </h2>
        <p className="text-sm text-ivory/80 max-w-xl mx-auto leading-relaxed font-sans">
          List your mountain homestay today and connect with guests who appreciate real mountain warmth.
        </p>
        <div className="pt-2">
          <Link
            href="/host/properties/new"
            className="inline-flex items-center gap-2 bg-ukorange hover:bg-ukorange-deep text-white px-8 py-4 rounded-full font-semibold text-sm transition-all shadow-lifted"
          >
            <span>Apply to List Your Homestay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
