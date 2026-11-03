import React from 'react';
import Link from 'next/link';
import { BRAND, COMMUNITY_INITIATIVES, COMMUNITY_STORIES } from '@/lib/constants';
import {
  Users,
  Heart,
  Trees,
  Compass,
  BookOpen,
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  GraduationCap,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: `Community & Karmayog Initiatives — ${BRAND.name}`,
  description: `Village development, cultural preservation, and youth empowerment initiatives by ${BRAND.name}. Learn by doing, grow by serving.`,
};

export default function CommunityPage() {
  return (
    <div className="space-y-16 py-12 pb-24">
      {/* Hero Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-ukorange" />
          Pillar IV • Community &amp; Karmayog
        </div>
        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-forest">
          Grassroots Purpose, Real Action
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl mx-auto leading-relaxed">
          Uttarkunth is founded on Karmayog: learning by doing, growing by serving. We work directly with Himalayan village communities to preserve heritage, foster youth skills, and protect delicate mountain ecosystems.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/community/participate"
            className="inline-flex items-center gap-2 bg-forest text-ivory px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-forest-dark transition-all shadow-sm"
          >
            <Heart className="w-3.5 h-3.5 text-ukorange" /> Join a Field Initiative
          </Link>
          <Link
            href="/community/initiatives"
            className="inline-flex items-center gap-2 bg-ivory-warm text-forest border border-forest/20 px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-forest/10 transition-all"
          >
            Explore 9 Initiatives <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Living University & Karmayog Ethos */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-forest-dark text-ivory rounded-3xl p-8 sm:p-12 shadow-lifted relative overflow-hidden space-y-8">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-widest text-ukorange font-bold block">
              The Uttarkunth Living University Vision
            </span>
            <blockquote className="font-serif text-2xl sm:text-4xl font-medium italic">
              &ldquo;{BRAND.philosophy}&rdquo;
            </blockquote>
            <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed font-sans">
              We envision the Himalayas not as a playground for extractive tourism, but as a living classroom. Uttarkunth operates on the principle that genuine education is rooted in community service, traditional craftsmanship, ecological regeneration, and hands-on participation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-forest/30">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-ukorange uppercase block">Why Over What</span>
              <p className="text-xs text-ivory/70 leading-relaxed">
                {BRAND.motto}. We prioritize active field implementation over endless theorizing.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-ukorange uppercase block">Strictly Non-NGO</span>
              <p className="text-xs text-ivory/70 leading-relaxed">
                We do not solicit charitable donations. We build sustainable, community-owned economic and cultural models.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-ukorange uppercase block">Village Autonomy</span>
              <p className="text-xs text-ivory/70 leading-relaxed">
                All initiatives are co-created with local elders, homestay keepers, and panchayats with explicit consent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 Pillars of Action Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Proposed Field Tracks</span>
            <h2 className="font-serif text-3xl font-bold text-forest mt-1">Our 9 Proposed Grassroots Initiatives</h2>
            <p className="text-xs text-charcoal-muted mt-1 max-w-xl">
              Planned community tracks designed for Parvati Valley, Kullu, Spiti, and Kinnaur. Field cohorts will open as local coordination and database activation are completed.
            </p>
          </div>
          <Link
            href="/community/initiatives"
            className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <span>View All Detailed Initiatives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMMUNITY_INITIATIVES.slice(0, 6).map((init) => (
            <Link
              key={init.id}
              href={`/community/initiatives/${init.slug}`}
              className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft hover:shadow-lifted hover:border-forest/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-forest/10 text-forest text-[11px] font-bold rounded-full">
                    {init.category}
                  </span>
                  <span className="text-[10px] font-semibold text-ukorange">{init.valley}</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-forest group-hover:text-terracotta transition-colors">
                  {init.title}
                </h3>
                <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-3">
                  {init.description}
                </p>
              </div>

              <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-ukorange" />
                  {init.status}
                </span>
                <span className="font-semibold text-forest group-hover:translate-x-0.5 transition-transform">
                  Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community Stories Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Oral Archive &amp; Field Chronicles</span>
            <h2 className="font-serif text-3xl font-bold text-forest mt-1">Stories From the Valleys</h2>
            <p className="text-xs text-charcoal-muted mt-1 max-w-xl">
              Authentic field dispatches, wisdom from elders, and volunteer reflections recorded with participant consent.
            </p>
          </div>
          <Link
            href="/community/stories"
            className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <span>Read All Stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {COMMUNITY_STORIES.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft text-center space-y-3">
            <BookOpen className="w-8 h-8 text-ukorange mx-auto" />
            <h3 className="font-serif text-xl font-bold text-forest">Oral Folklore &amp; Field Stories Archive</h3>
            <p className="text-xs text-charcoal-muted max-w-lg mx-auto leading-relaxed">
              Verified dispatches and elder oral history transcriptions will be published here once field cohorts begin and community consent records are archived in production.
            </p>
            <div className="pt-1">
              <Link
                href="/community/stories"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-ukorange"
              >
                <span>Visit Archive Overview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMMUNITY_STORIES.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-charcoal-muted">
                    <span className="font-semibold text-forest">{story.author}</span>
                    <span>•</span>
                    <span>{story.village}, {story.valley}</span>
                    <span>•</span>
                    <span>{story.date}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-forest">{story.title}</h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">{story.excerpt}</p>
                </div>

                <div className="pt-4 border-t border-forest/10 flex items-center justify-between">
                  <span className="text-[11px] text-charcoal-muted font-mono">{story.readTime}</span>
                  <Link
                    href="/community/stories"
                    className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1 transition-colors"
                  >
                    Read Dispatch →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Participation Callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-ivory-warm rounded-3xl p-8 sm:p-12 border border-forest/20 shadow-soft text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6 text-ukorange" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
              Ready to Contribute Your Skills?
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Whether you are an architect, botanist, educator, web developer, or conscious traveler, we welcome thoughtful collaborators for our field residencies.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/community/participate"
              className="inline-flex items-center gap-2 bg-forest hover:bg-forest-hover text-white px-8 py-3 rounded-xl font-semibold text-xs shadow-xs transition-colors"
            >
              <span>Submit Participation Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
