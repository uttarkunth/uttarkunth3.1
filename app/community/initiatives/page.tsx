import React from 'react';
import Link from 'next/link';
import { BRAND, COMMUNITY_INITIATIVES } from '@/lib/constants';
import { Users, Heart, ArrowRight, Calendar, MapPin, CheckCircle2, Sparkles, Filter } from 'lucide-react';

export const metadata = {
  title: `Grassroots Initiatives — ${BRAND.name} Community`,
  description: `Explore the 9 active and upcoming Himalayan field initiatives of ${BRAND.name}. Ecology, architecture, youth skills, and oral folklore preservation.`,
  alternates: {
    canonical: '/community/initiatives',
  },
};

export default function InitiativesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-ukorange" />
          Karmayog in the Field
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          9 Proposed Himalayan Field Initiatives
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
          Proposed grassroots tracks designed to support alpine ecology, document living heritage, and build resilient mountain livelihoods without fabricated claims or charity jargon.
        </p>
      </div>

      {/* Initiatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COMMUNITY_INITIATIVES.map((init) => (
          <div
            key={init.id}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-forest/15 shadow-soft hover:shadow-lifted transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 bg-forest/10 text-forest text-[11px] font-bold rounded-full">
                  {init.category}
                </span>
                <span className="text-[11px] font-semibold text-ukorange flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {init.valley}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-forest">
                  <Link href={`/community/initiatives/${init.slug}`} className="hover:text-terracotta transition-colors">
                    {init.title}
                  </Link>
                </h3>
                <p className="text-xs text-charcoal-muted mt-2 leading-relaxed">
                  {init.tagline}
                </p>
              </div>

              {/* Objectives Snippet */}
              <div className="space-y-1.5 pt-2 border-t border-forest/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                  Core Objective
                </span>
                <p className="text-xs text-charcoal leading-relaxed line-clamp-2">
                  {init.objectives[0]}
                </p>
              </div>

              {/* Status & Schedule */}
              <div className="p-3 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-muted">Status:</span>
                  <span className="font-semibold text-forest">{init.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-muted">Cohort:</span>
                  <span className="font-medium text-charcoal-muted truncate max-w-[180px]">{init.cohortSchedule}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 flex items-center justify-between gap-2">
              <Link
                href={`/community/initiatives/${init.slug}`}
                className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
              >
                <span>Read Full Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href={`/community/participate?initiative=${init.slug}`}
                className="px-3 py-1.5 bg-forest hover:bg-forest-hover text-white text-[11px] font-semibold rounded-xl transition-colors"
              >
                Apply
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Philosophy Banner */}
      <div className="p-8 bg-forest-dark text-ivory rounded-3xl shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Field Integrity</span>
          <h3 className="font-serif text-2xl font-bold">Have a Specialized Skill to Offer?</h3>
          <p className="text-xs text-ivory/80 leading-relaxed">
            We review individual applications for field residencies across research, photography, soil testing, and vernacular building apprenticeships.
          </p>
        </div>

        <Link
          href="/community/join"
          className="px-6 py-3 bg-ukorange hover:bg-ukorange-deep text-white font-semibold text-xs rounded-full transition-colors flex-shrink-0 inline-flex items-center gap-2"
        >
          <span>Volunteer or Partner</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
