import React from 'react';
import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { Heart, Users, CheckCircle2, ArrowRight, Mail } from 'lucide-react';

export const metadata = {
  title: `Join Our Mission — ${BRAND.name} Community`,
  description: `Participate, volunteer, or partner with ${BRAND.name} in Himalayan community initiatives.`,
  alternates: {
    canonical: '/community/join',
  },
};

export default function JoinCommunityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Heart className="w-3.5 h-3.5 text-ukorange" />
          Community Participation
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          Join the Uttarkunth Mission
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-xl mx-auto">
          Whether you are an educator, environmentalist, designer, doctor, or passionate traveler, your skills can make a genuine difference in the valley.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft space-y-2">
          <Users className="w-6 h-6 text-ukorange" />
          <h3 className="font-serif text-lg font-bold text-forest">Volunteer in Jari</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Spend meaningful time in Parvati Valley teaching workshops, assisting in trail cleanups, or supporting homestay digitalization.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft space-y-2">
          <Heart className="w-6 h-6 text-forest" />
          <h3 className="font-serif text-lg font-bold text-forest">Skill Exchange</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Offer specialized knowledge in sustainable energy, architectural conservation, digital arts, or healthcare awareness.
          </p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft space-y-2">
          <CheckCircle2 className="w-6 h-6 text-ukblue-deep" />
          <h3 className="font-serif text-lg font-bold text-forest">Partner Organization</h3>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Collaborate on academic research, environmental impact assessments, or responsible alpine tourism policy.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft space-y-6">
        <h2 className="font-serif text-2xl font-bold text-forest">How to Participate</h2>
        <p className="text-sm text-charcoal-muted leading-relaxed">
          Introduce yourself, describe your background, and share how you would like to contribute to our mountain initiatives:
        </p>
        <div className="p-4 bg-forest/5 rounded-2xl border border-forest/15 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-ukorange" />
            <div>
              <span className="text-xs text-charcoal-muted block">Direct Community Desk</span>
              <a href={`mailto:${BRAND.email}?subject=Community%20Mission%20Participation`} className="font-semibold text-forest hover:text-ukorange text-sm">
                {BRAND.email}
              </a>
            </div>
          </div>
          <Link
            href={`/contact?subject=Community%20Volunteer`}
            className="inline-flex items-center gap-1.5 bg-forest text-ivory px-5 py-2 rounded-full text-xs font-semibold hover:bg-forest-dark transition-all"
          >
            Submit Application via Contact <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
