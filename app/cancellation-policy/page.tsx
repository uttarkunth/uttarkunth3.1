import React from 'react';
import { BRAND } from '@/lib/constants';
import { RefreshCw, CalendarX, AlertCircle } from 'lucide-react';

export const metadata = {
  title: `Cancellation Policy — ${BRAND.name}`,
  description: `Official booking cancellation guidelines and notice windows for ${BRAND.name}.`,
  alternates: {
    canonical: '/cancellation-policy',
  },
};

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-10">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <RefreshCw className="w-3.5 h-3.5 text-ukorange" />
          Flexible &amp; Fair
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">Cancellation Policy</h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
          Clear and respectful cancellation standards designed for mountain travelers and local hosts.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft space-y-8 text-charcoal text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">1. Free Cancellation on Pending Requests</h2>
          <p>
            If your booking request has not yet been approved by the host, you may cancel it at any time from your <a href="/trips" className="text-ukorange hover:underline font-semibold">My Trips</a> portal with immediate release of the held dates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">2. Confirmed Reservation Cancellations</h2>
          <p>
            Because mountain homestays have limited room inventory (often 2 to 6 rooms total), late cancellations significantly impact local village families. We ask all guests to provide at least <strong>48 hours notice</strong> prior to scheduled check-in if plans change.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">3. Weather &amp; Road Blockages</h2>
          <p>
            The Himalayas can experience seasonal road closures, landslides, or severe snowfall. In the event of documented natural impediments or official travel advisories, cancellations are handled flexibly without penalties in mutual coordination with your host.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">4. Contact &amp; Modifications</h2>
          <p>
            To modify dates or coordinate special circumstances, write to <a href={`mailto:${BRAND.email}`} className="text-ukorange hover:underline font-semibold">{BRAND.email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
