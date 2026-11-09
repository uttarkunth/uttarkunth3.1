import React from 'react';
import { BRAND } from '@/lib/constants';
import { ShieldCheck, Lock, Eye, FileText } from 'lucide-react';

export const metadata = {
  title: `Privacy Policy — ${BRAND.name}`,
  description: `Official Privacy Policy and data protection disclosures for ${BRAND.name}.`,
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-10">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-ukorange" />
          Data Protection & Privacy
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">Privacy Policy</h1>
        <p className="text-sm text-charcoal-muted max-w-xl mx-auto">
          How Uttarkunth collects, protects, and respects your personal data across our ecosystem.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft space-y-8 text-charcoal text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">1. Introduction</h2>
          <p>
            Uttarkunth (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;) operates the official ecosystem at <span className="font-semibold text-forest">https://uttarkunth.com</span>. We are committed to transparency, user privacy, and responsible digital stewardship. We collect only information strictly necessary to facilitate homestay reservations, genuine product enquiries, and community participation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account & Profile Details:</strong> Full name, verified email address, phone number, and optional mountain traveler biography.</li>
            <li><strong>Booking & Stay Requests:</strong> Check-in and check-out dates, guest counts, room selections, and special request notes provided to the host.</li>
            <li><strong>Host & Partner Submissions:</strong> Property specifications, photos, village location, and host verification documents.</li>
            <li><strong>Technical Diagnostics:</strong> Anonymized server logs, browser type, and basic telemetry required to ensure high availability and security.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">3. Direct Payment & Financial Data</h2>
          <p>
            Uttarkunth does not process online payments, store credit card numbers, or maintain financial balances for stay reservations in this release. All accommodation payments are settled directly between guests and hosts at the property.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">4. Data Storage & Security</h2>
          <p>
            All account records and operational data are stored securely on our enterprise Supabase infrastructure with Row Level Security (RLS) policies enforcing strict access boundaries. Sensitive administrative capabilities are restricted to authenticated platform administrators.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl font-bold text-forest">5. Contact Our Privacy Team</h2>
          <p>
            For privacy inquiries, data deletion requests, or questions regarding personal information, contact our team directly at <a href={`mailto:${BRAND.email}`} className="text-ukorange hover:underline font-semibold">{BRAND.email}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
