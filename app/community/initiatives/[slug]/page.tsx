import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BRAND, COMMUNITY_INITIATIVES } from '@/lib/constants';
import {
  Users,
  Heart,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  Shield,
  Layers,
  Clock,
} from 'lucide-react';

export function generateStaticParams() {
  return COMMUNITY_INITIATIVES.map((init) => ({
    slug: init.slug,
  }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const init = COMMUNITY_INITIATIVES.find((i) => i.slug === params.slug);
  if (!init) {
    return { title: `Initiative Not Found — ${BRAND.name}` };
  }
  return {
    title: `${init.title} — ${BRAND.name} Community`,
    description: init.description,
  };
}

export default function InitiativeDetailPage({ params }: { params: { slug: string } }) {
  const init = COMMUNITY_INITIATIVES.find((i) => i.slug === params.slug);

  if (!init) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-10">
      {/* Back button */}
      <Link
        href="/community/initiatives"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Initiatives</span>
      </Link>

      {/* Header section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-forest/10 text-forest text-xs font-bold rounded-full">
            {init.category}
          </span>
          <span className="px-3 py-1 bg-ukorange/15 text-ukorange text-xs font-bold rounded-full">
            {init.status}
          </span>
          <span className="text-xs text-charcoal-muted flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-ukorange" />
            {init.location} ({init.valley})
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest">
          {init.title}
        </h1>

        <p className="text-base sm:text-lg text-charcoal-muted font-serif italic leading-relaxed">
          &ldquo;{init.tagline}&rdquo;
        </p>
      </div>

      {/* Main Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-6">
        <div className="space-y-3">
          <h2 className="font-serif text-xl font-bold text-forest">Scope &amp; Background</h2>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed whitespace-pre-line">
            {init.description}
          </p>
        </div>

        {/* Objectives Checklist */}
        <div className="space-y-3 pt-6 border-t border-forest/10">
          <h3 className="font-serif text-lg font-bold text-forest">Grassroots Objectives &amp; Visionary Scope</h3>
          <ul className="space-y-2.5">
            {init.objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-charcoal">
                <CheckCircle2 className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Active Implementation Status */}
        <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-1 text-xs">
          <span className="font-bold text-ukorange block">Current Operational Status: {init.status}</span>
          <p className="text-charcoal-muted leading-relaxed">
            Uttarkunth is actively operating from Jari, Parvati Valley—building economic upliftment through engines of business so village communities can develop their regions and solve environmental, cultural, economical, educational, and developmental challenges from within.
          </p>
        </div>

        {/* Participation & Collaboration */}
        <div className="p-4 bg-warm-canvas rounded-2xl border border-beige flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-ukorange flex-shrink-0" />
            <div>
              <span className="font-bold text-forest block">Participation &amp; Collaboration</span>
              <span className="text-charcoal-muted">{init.cohortSchedule}</span>
            </div>
          </div>

          <Link
            href="/community/join"
            className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors flex-shrink-0 inline-flex items-center gap-1.5 justify-center"
          >
            <Heart className="w-3.5 h-3.5 text-ukorange" />
            <span>Join the Uttarkunth Community</span>
          </Link>
        </div>
      </div>

      {/* Grassroots Business Ethos reminder */}
      <div className="p-6 bg-forest-dark text-ivory rounded-3xl space-y-2 text-xs">
        <span className="text-ukorange font-bold uppercase tracking-wider block">Karmayog &amp; Village Enterprise Ethos</span>
        <p className="text-ivory/80 leading-relaxed">
          Uttarkunth believes that a village initiative—such as an emerging startup or local business—directly helps develop its village by creating sustainable livelihoods, retaining local talent, and building the capacity to solve regional problems together.
        </p>
      </div>
    </div>
  );
}

