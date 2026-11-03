import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { BRAND, COMMUNITY_INITIATIVES } from '@/lib/constants';
import {
  Users,
  HeartHandshake,
  Trees,
  Building2,
  Mic,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Heart,
  Calendar,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountCommunityPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/community');
  }

  const adminClient = createAdminClient();

  // Query user's submitted participation applications
  const { data: participations, error: partErr } = await adminClient
    .from('community_participations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const isDbReady = !partErr;
  const userParticipations = participations || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-[11px] font-bold rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Accepted for Cohort
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full">
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-ukorange/15 text-ukorange text-[11px] font-bold rounded-full">
            <Clock className="w-3 h-3" />
            Application Under Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Pillar IV • Community</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">My Community Workspace</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Hands-on participation, grassroots Himalayan stewardship, and cultural preservation
        </p>
      </div>

      {/* Karmayog Philosophy Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-forest/10 text-forest text-[11px] font-bold rounded-full">
              Karmayog Mindset
            </span>
            <span className="text-xs text-charcoal-muted font-semibold flex items-center gap-1">
              Proposed Initiatives Track
            </span>
          </div>

          <blockquote className="font-serif text-2xl font-bold text-forest">
            &ldquo;{BRAND.tagline}&rdquo;
          </blockquote>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ukorange pt-1">
            <span>{BRAND.philosophy}</span>
            <span>•</span>
            <span>{BRAND.motto}</span>
          </div>

          <p className="text-xs text-charcoal-muted leading-relaxed max-w-2xl pt-2">
            Uttarkunth is not an NGO or a commercial tour broker. We operate on the principle of Karmayog — an action- and service-oriented commitment to mountain people, ecosystems, and enduring heritage.
          </p>
        </div>
      </div>

      {!isDbReady && (
        <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 block">
            Online Participation Registry Pending Activation
          </span>
          <p className="leading-relaxed">
            Our online community participation and oral stories database tables are prepared locally and awaiting production database activation. To express interest in any proposed initiative, email <a href="mailto:info@uttarkunth.com" className="underline font-semibold">info@uttarkunth.com</a>.
          </p>
        </div>
      )}

      {/* My Submitted Participation Applications */}
      {userParticipations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-forest">My Field Participation Applications</h3>
            <span className="px-2.5 py-1 bg-ivory-warm border border-forest/15 text-forest text-xs font-bold rounded-full">
              {userParticipations.length} {userParticipations.length === 1 ? 'Application' : 'Applications'}
            </span>
          </div>

          <div className="space-y-4">
            {userParticipations.map((part: any) => {
              const matchedInit = COMMUNITY_INITIATIVES.find((i) => i.slug === part.initiative_slug);
              return (
                <div key={part.id} className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ukorange">
                        {matchedInit?.category || 'Community Initiative'}
                      </span>
                      <h4 className="font-serif text-base font-bold text-forest">
                        {matchedInit?.title || part.initiative_slug}
                      </h4>
                    </div>
                    <div>{getStatusBadge(part.status)}</div>
                  </div>

                  <p className="text-charcoal-muted leading-relaxed">
                    <strong>Duration:</strong> {part.duration} • <strong>Skills:</strong> {part.skills}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-forest/10 text-[11px] text-charcoal-muted">
                    <span>Submitted on: {new Date(part.created_at).toLocaleDateString()}</span>
                    {matchedInit && (
                      <Link
                        href={`/community/initiatives/${matchedInit.slug}`}
                        className="text-forest hover:text-ukorange font-semibold"
                      >
                        View Initiative Details →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Proposed Initiatives Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-forest">Proposed Field Initiatives</h2>
          <Link
            href="/community/initiatives"
            className="text-xs font-semibold text-forest hover:text-ukorange flex items-center gap-1"
          >
            <span>All 9 Initiatives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMMUNITY_INITIATIVES.slice(0, 4).map((init) => (
            <div
              key={init.id}
              className="bg-white rounded-2xl p-5 border border-forest/15 shadow-soft space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ukorange">
                    {init.valley}
                  </span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-800 text-[10px] font-semibold rounded-full">
                    {init.status}
                  </span>
                </div>
                <h4 className="font-serif text-base font-bold text-forest">{init.title}</h4>
                <p className="text-xs text-charcoal-muted leading-relaxed line-clamp-2">
                  {init.tagline}
                </p>
              </div>

              <div className="pt-2 border-t border-forest/10 flex items-center justify-between text-xs">
                <Link
                  href={`/community/initiatives/${init.slug}`}
                  className="font-semibold text-forest hover:text-ukorange"
                >
                  Learn More
                </Link>
                <Link
                  href={`/community/participate?initiative=${init.slug}`}
                  className="px-2.5 py-1 bg-forest/10 hover:bg-forest hover:text-white text-forest text-[11px] font-semibold rounded-lg transition-colors"
                >
                  Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Oral Archives CTA */}
      <div className="p-6 bg-forest-dark text-ivory rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-ukorange font-bold">Field Chronicles</span>
          <h4 className="font-serif text-lg font-bold">Explore Our Living Oral Folklore Archive</h4>
          <p className="text-xs text-ivory/80">Read dispatches from Jari elders and field stewardship teams.</p>
        </div>
        <Link
          href="/community/stories"
          className="px-5 py-2.5 bg-white text-forest text-xs font-semibold rounded-xl hover:bg-ivory-warm transition-colors flex-shrink-0"
        >
          Read Dispatches →
        </Link>
      </div>
    </div>
  );
}
