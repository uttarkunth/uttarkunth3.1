import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BRAND, AUTHENTIC_PRODUCTIONS } from '@/lib/constants';
import {
  Film,
  Clapperboard,
  ArrowLeft,
  Share2,
  Sparkles,
  Calendar,
  MapPin,
  Globe,
  Award,
  Video,
} from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return AUTHENTIC_PRODUCTIONS.map((prod) => ({
    slug: prod.slug,
  }));
}

export function generateMetadata({ params }: Props) {
  const production = AUTHENTIC_PRODUCTIONS.find((p) => p.slug === params.slug);
  if (!production) {
    return { title: `Production Not Found — ${BRAND.name}` };
  }
  return {
    title: `${production.title} — ${BRAND.name} Productions`,
    description: production.description,
    alternates: {
      canonical: `/production/${params.slug}`,
    },
  };
}

export default function ProductionDetailPage({ params }: Props) {
  const production = AUTHENTIC_PRODUCTIONS.find((p) => p.slug === params.slug);

  if (!production) {
    notFound();
  }

  const otherProductions = AUTHENTIC_PRODUCTIONS.filter((p) => p.slug !== params.slug);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-12">
      {/* 1. BREADCRUMBS & NAVIGATION */}
      <nav className="flex items-center gap-2 text-xs text-charcoal-muted font-medium">
        <Link href="/" className="hover:text-forest transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/production" className="hover:text-forest transition-colors">
          Productions
        </Link>
        <span>/</span>
        <span className="text-forest font-semibold">{production.title}</span>
      </nav>

      {/* 2. FILM HEADER & BADGES */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-bold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5 text-ukorange" />
            {production.category}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            Official Archive
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-forest leading-tight">
          {production.title}
        </h1>

        <p className="text-base sm:text-lg text-charcoal max-w-3xl leading-relaxed">
          {production.description}
        </p>
      </div>

      {/* 3. DEDICATED CINEMATIC PLAYER CONTAINER */}
      <div className="space-y-2">
        <div className="rounded-3xl overflow-hidden bg-charcoal shadow-2xl border border-forest/20 relative aspect-video">
          <video
            controls
            poster={production.thumbnail}
            className="w-full h-full object-cover"
            preload="metadata"
          >
            <source src={production.videoSrc} type="video/webm" />
            <p className="text-ivory text-sm p-6">
              Your browser does not support HTML5 video playback.
            </p>
          </video>
        </div>
        <p className="text-[11px] text-charcoal-muted text-center">
          Note: The on-site player above streams our bundled Himalayan visual preview clip (<code>/assets/uttarkunth-hero-video.webm</code>). Full-length archival streaming masters are prepared separately for release.
        </p>
      </div>

      {/* 4. DETAILS & METADATA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Synopsis & Cultural Significance */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
            <h2 className="font-serif text-2xl font-bold text-forest">About the Production</h2>
            <p className="text-charcoal-muted leading-relaxed text-sm">
              Documenting the sacred intangible heritage and oral living folklore of Himachal Pradesh,
              this film was captured on location in the high mountain settlements of the Parvati and Kullu Valleys.
              Our objective is preservation through honest visual documentation without sensationalism or commercial staging.
            </p>
            <p className="text-charcoal-muted leading-relaxed text-sm">
              Filmed with village consent and guided by traditional elders, {production.title} preserves
              vernacular cultural narratives, ceremonial instruments, and oral memory for posterity.
            </p>
          </div>

          {/* Director & Production Ethics */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
            <h3 className="font-serif text-xl font-bold text-forest">Production Principles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-1">
                <span className="font-bold text-forest text-xs uppercase tracking-wider block">Community Consent</span>
                <p className="text-xs text-charcoal-muted">All participants and local custodians granted direct filming permissions.</p>
              </div>
              <div className="p-4 rounded-2xl bg-forest/5 border border-forest/10 space-y-1">
                <span className="font-bold text-forest text-xs uppercase tracking-wider block">Zero Staged Rituals</span>
                <p className="text-xs text-charcoal-muted">100% observational cinematography with authentic ambient soundscapes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Metadata & CTAs */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
            <h3 className="font-serif text-lg font-bold text-forest border-b border-forest/10 pb-3">Film Credits</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-ukorange" /> Location
                </span>
                <span className="font-semibold text-forest">Kullu &amp; Parvati Valleys</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-ukblue-deep" /> State
                </span>
                <span className="font-semibold text-forest">Himachal Pradesh, India</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-forest" /> Producer
                </span>
                <span className="font-semibold text-forest">Uttarkunth Films</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-charcoal-muted" /> Release Year
                </span>
                <span className="font-semibold text-forest">2026</span>
              </div>
            </div>

            <div className="pt-4 border-t border-forest/10 space-y-2">
              <Link
                href="/production/collaborate"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Pitch a Film Collaboration</span>
              </Link>
              <Link
                href="/production"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-forest/5 hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Browse All Productions</span>
              </Link>
            </div>
          </div>

          {/* More Authentic Productions */}
          {otherProductions.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
              <h4 className="font-serif text-base font-bold text-forest">More Mountain Productions</h4>
              {otherProductions.map((other) => (
                <Link
                  key={other.id}
                  href={`/production/${other.slug}`}
                  className="flex items-center gap-3 p-2 rounded-2xl hover:bg-forest/5 transition-colors group"
                >
                  <img
                    src={other.thumbnail}
                    alt={other.title}
                    className="w-16 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-forest group-hover:text-ukorange transition-colors">
                      {other.title}
                    </h5>
                    <span className="text-[11px] text-charcoal-muted">{other.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
