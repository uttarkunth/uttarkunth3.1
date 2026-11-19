import React from 'react';
import Link from 'next/link';
import { BRAND, COMMUNITY_INITIATIVES } from '@/lib/constants';
import {
  Users,
  Heart,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Sparkles,
  Mountain,
  Sprout,
  BookOpen,
  Briefcase,
  Compass,
  Landmark,
} from 'lucide-react';

export const metadata = {
  title: `One Active Himalayan Initiative — ${BRAND.name} Community`,
  description: `Discover Uttarkunth as an active Himalayan initiative of the people of Jari for economic upliftment through engines of business and grassroots regional development.`,
};

const PROBLEM_SOLVING_DIMENSIONS = [
  {
    title: 'Environmental',
    description:
      'Building local responsibility and practical capacity to care for mountain ecosystems, trails, water sources, and village surroundings.',
    icon: Sprout,
  },
  {
    title: 'Cultural',
    description:
      'Preserving living traditions, oral heritage, vernacular wisdom, and community identity while engaging with the modern world on our own terms.',
    icon: Landmark,
  },
  {
    title: 'Economical',
    description:
      'Creating engines of business rooted in the village so economic value stays with local families, youth, makers, and entrepreneurs.',
    icon: Briefcase,
  },
  {
    title: 'Educational',
    description:
      'Developing real-world skills, entrepreneurial confidence, and shared learning so mountain youth can lead right from their home valleys.',
    icon: BookOpen,
  },
  {
    title: 'Developmental & Regional',
    description:
      'Strengthening village infrastructure, collective problem-solving, and grassroots resilience to tackle every emerging regional challenge.',
    icon: Compass,
  },
];

export default function InitiativesPage() {
  const initiative = COMMUNITY_INITIATIVES[0]!;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Mountain className="w-3.5 h-3.5 text-terracotta" />
          Grassroots Movement from Jari
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-forest leading-tight">
          One Active Himalayan Initiative
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted leading-relaxed">
          Born in Jari, Parvati Valley, <strong className="text-forest">Uttarkunth</strong> itself is
          our active Himalayan initiative—an initiative of the people of Jari for economic upliftment
          through engines of business and real grassroots development.
        </p>
      </div>

      {/* Primary Active Initiative Showcase Card — Uttarkunth */}
      <div className="bg-warm-surface rounded-[28px] sm:rounded-[34px] border border-beige-dark/80 shadow-soft overflow-hidden">
        {/* Top Banner Strip */}
        <div className="bg-gradient-to-r from-[#1F332A] via-[#263D32] to-[#1F332A] text-[#FFFDF9] px-6 py-5 sm:px-10 sm:py-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#C55B23]/40">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C55B23] text-white text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {initiative.status}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-[#FDE2A8] text-xs font-semibold">
              {initiative.category}
            </span>
          </div>

          <span className="text-xs sm:text-sm font-medium text-[#FAF4E8]/90 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#C55B23]" />
            {initiative.location} &middot; {initiative.valley}
          </span>
        </div>

        {/* Main Initiative Narrative */}
        <div className="p-6 sm:p-10 lg:p-12 space-y-10">
          <div className="space-y-4 max-w-4xl">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta block">
              The Initiative Itself
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-forest leading-tight">
              Uttarkunth — An Initiative of the People of Jari
            </h2>
            <p className="font-serif italic text-lg sm:text-xl text-charcoal-muted leading-relaxed">
              &ldquo;{initiative.tagline}&rdquo;
            </p>
          </div>

          {/* Core Narrative Paragraphs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5 text-sm sm:text-base text-charcoal leading-relaxed">
              <p>
                <strong>Uttarkunth</strong> is not merely a digital platform—it is a living initiative
                of the people of Jari built for <strong>economic upliftment through engines of business</strong>.
                We believe that lasting progress in the Himalayas cannot come from passive dependency;
                it comes when mountain people build viable, self-sustaining enterprises that generate
                real livelihoods and local strength.
              </p>
              <p>
                Through these engines of business, the people of Jari and neighbouring valleys build
                the financial and organizational capacity to <strong>develop their own regions and
                solve the real problems arising there</strong>—from <strong>environmental</strong> and{' '}
                <strong>cultural</strong> challenges to <strong>economical</strong>,{' '}
                <strong>educational</strong>, <strong>developmental</strong>, and all other regional
                issues that mountain communities face.
              </p>
              <p>
                As we build Uttarkunth, our visionary scope is to nurture a broader{' '}
                <strong>Uttarkunth Community</strong> that works together for{' '}
                <strong>real grassroots development</strong>. For example, when a village initiative—whether
                an emerging startup, an artisan collective, or any other responsible local business—takes
                root, it creates jobs, retains talent, and directly helps develop its own village.
              </p>
            </div>

            {/* Right Column: Visionary Scope Callout Box */}
            <div className="lg:col-span-5 rounded-3xl bg-[#FAF6EE] border border-[#D9CCB8] p-6 sm:p-7 space-y-5">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-terracotta">
                  <Users className="w-3.5 h-3.5" />
                  Visionary Scope
                </span>
                <h3 className="font-serif text-2xl font-bold text-forest leading-snug">
                  Building a Community for Real Grassroots Development
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                  Every village startup or local business becomes a development engine for its own
                  village—turning entrepreneurial energy into shared regional upliftment.
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#E5DEC9]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest block">
                  Core Foundations
                </span>
                {initiative.objectives.map((objective, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] text-charcoal">
                    <CheckCircle2 className="w-4 h-4 text-terracotta shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regional Problems We Build Capacity to Solve */}
          <div className="pt-8 border-t border-[#D9CCB8]/80 space-y-5">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-terracotta block">
                Capacity Through Engines of Business
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                Solving Real Regional Challenges From Within
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {PROBLEM_SOLVING_DIMENSIONS.map((dim) => {
                const IconComponent = dim.icon;
                return (
                  <div
                    key={dim.title}
                    className="rounded-2xl bg-[#FFFDF9] border border-[#D9CCB8] p-4 sm:p-5 space-y-2.5 shadow-2xs"
                  >
                    <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-terracotta">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h4 className="font-serif text-lg font-bold text-forest">{dim.title}</h4>
                    <p className="text-xs text-charcoal-muted leading-relaxed">{dim.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-[#D9CCB8]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-charcoal-muted">
              <strong className="text-forest">Status:</strong> {initiative.cohortSchedule}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/community/initiatives/${initiative.slug}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-forest/25 bg-white hover:bg-forest/5 text-forest text-xs font-semibold transition-colors no-underline"
              >
                <span>Read Full Initiative Charter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/community/join"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold transition-colors shadow-2xs no-underline"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Join the Uttarkunth Community</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

