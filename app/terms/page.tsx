import React from 'react';
import { BRAND } from '@/lib/constants';
import { FileText, Scale, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: `Terms and Conditions — ${BRAND.name}`,
  description: `Official terms of service and platform rules for ${BRAND.name}.`,
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-10">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5 text-ukorange" />
          Platform Agreement
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">Terms and Conditions</h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
          Rules and responsibilities governing use of the Uttarkunth ecosystem.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft space-y-8 text-charcoal text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">1. Platform Scope & Purpose</h2>
          <p>
            Uttarkunth provides an integrated ecosystem supporting Himalayan stays, artisanal products, cultural productions, and community initiatives. By creating an account or submitting requests on <span className="font-semibold text-forest">https://uttarkunth.com</span>, you agree to these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">2. Stay Bookings & Guest Conduct</h2>
          <p>
            Stays on Uttarkunth operate on a host-approval model. A booking request is pending until explicitly accepted by the host. Guests agree to respect local Himalayan customs, observe quiet hours, avoid littering or plastic dumping, and settle accommodation tariffs directly with the host upon arrival or check-out.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">3. Host & Seller Responsibilities</h2>
          <p>
            Hosts and sellers verify that all listed properties, room rates, amenities, and craft goods are accurate and truthfully represented. Hosts agree to provide genuine hospitality, maintain clean and safe premises, and honor accepted reservations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">4. Intellectual Property & Brand Assets</h2>
          <p>
            The Uttarkunth name, logo, original hero media, creative productions, and written editorial content are protected by copyright and intellectual property laws. Unauthorized reproduction or commercial use is prohibited without written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">5. Inquiries & Legal Notices</h2>
          <p>
            For legal notices or questions regarding these terms, contact <a href={`mailto:${BRAND.email}`} className="text-ukorange hover:underline font-semibold">{BRAND.email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
