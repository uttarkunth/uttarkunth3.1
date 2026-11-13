import React from 'react';
import { BRAND } from '@/lib/constants';
import { BookmarkCheck, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: `Booking Policy — ${BRAND.name}`,
  description: `Official stay reservation and host confirmation guidelines for ${BRAND.name}.`,
};

export default function BookingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-10">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <BookmarkCheck className="w-3.5 h-3.5 text-ukorange" />
          Himalayan Hospitality
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">Booking Policy</h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
          How stay requests, host confirmations, and direct payments work on Uttarkunth.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft space-y-8 text-charcoal text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">1. Request-Based Reservations</h2>
          <p>
            To protect homestays from overbooking and ensure genuine personal hospitality, Uttarkunth operates on a request-based workflow. When you submit a booking request:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Your dates and room selection are provisionally held.</li>
            <li>The property host receives an immediate notification with your trip details.</li>
            <li>The request remains in <strong>Pending</strong> status until the host formally accepts or declines.</li>
            <li>Once accepted, your reservation transitions to <strong>Confirmed</strong>, and room calendar slots are locked.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">2. Direct Host Payment (Zero Online Processing)</h2>
          <div className="p-4 rounded-2xl bg-ivory-warm border border-forest/20 text-xs sm:text-sm text-forest space-y-1">
            <strong className="block font-serif text-base text-forest">Direct Payment Guarantee:</strong>
            <p>
              Guests do not pay online through the platform. 100% of the accommodation fee is settled directly with the host at the property upon check-in or check-out (via cash, UPI, or local transfer). Uttarkunth charges zero guest booking fees.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">3. Check-In & Identification</h2>
          <p>
            In compliance with regional regulations in Himachal Pradesh, Uttarakhand, and Jammu &amp; Kashmir, guests must present valid government photo identification (Aadhaar, Passport, or Voter ID) to the host upon arrival.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">4. Questions & Support</h2>
          <p>
            For assistance with pending requests or coordinating special arrival arrangements, contact our support desk at <a href={`mailto:${BRAND.email}`} className="text-ukorange hover:underline font-semibold">{BRAND.email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
