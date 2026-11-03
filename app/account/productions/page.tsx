import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AUTHENTIC_PRODUCTIONS } from '@/lib/constants';
import { Film, Play, Sparkles, Video, ArrowRight, Clapperboard, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountProductionsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/productions');
  }

  const adminClient = createAdminClient();

  // Query filmmaker profile
  const { data: profile, error: profErr } = await adminClient
    .from('filmmaker_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Query user submitted proposals
  const { data: proposals, error: propErr } = await adminClient
    .from('production_proposals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const isDbReady = !propErr && (!profErr || profErr.code === 'PGRST116');
  const userProposals = proposals || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'in_production':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-800 text-[11px] font-bold rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Approved for Production
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Revisions Requested
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold rounded-full">
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-ukorange/15 text-ukorange text-[11px] font-bold rounded-full">
            <Clock className="w-3 h-3" />
            Under Editorial Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Pillar III • Productions</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">My Productions & Access</h1>
        <p className="text-xs text-charcoal-muted mt-1">
          Stream authorized mountain documentaries, track film pitches, and access co-production grants
        </p>
      </div>

      {!isDbReady && (
        <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 block">
            Online Co-Production Registry Pending Activation
          </span>
          <p className="leading-relaxed">
            Our online filmmaker profile and proposal database tables are prepared locally and awaiting production database activation. To pitch a documentary in the meantime, please email <a href="mailto:info@uttarkunth.com" className="underline font-semibold">info@uttarkunth.com</a>.
          </p>
        </div>
      )}

      {/* Filmmaker Workspace Status if user submitted profile or proposals */}
      {profile && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
                <Clapperboard className="w-5 h-5 text-ukorange" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-muted block">
                  Filmmaker Profile
                </span>
                <h3 className="font-serif text-xl font-bold text-forest">{profile.full_name}</h3>
              </div>
            </div>
            <div>
              <span className="px-3 py-1 bg-forest/10 text-forest text-xs font-bold rounded-full capitalize">
                Role: {profile.creative_role.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 text-xs space-y-2">
            <p className="text-charcoal-muted leading-relaxed">
              <strong>Base:</strong> {profile.location} • <strong>Skills:</strong> {Array.isArray(profile.skills) ? profile.skills.join(', ') : 'Documentary Filmmaking'}
            </p>
            {profile.portfolio_url && (
              <p className="text-charcoal-muted">
                <strong>Showreel:</strong> <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-ukorange underline">{profile.portfolio_url}</a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Submitted Film Proposals */}
      {userProposals.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-forest">My Submitted Film Pitches</h3>
            <span className="px-2.5 py-1 bg-ivory-warm border border-forest/15 text-forest text-xs font-bold rounded-full">
              {userProposals.length} {userProposals.length === 1 ? 'Pitch' : 'Pitches'}
            </span>
          </div>

          <div className="space-y-4">
            {userProposals.map((prop: any) => (
              <div key={prop.id} className="p-4 bg-ivory-warm rounded-2xl border border-forest/10 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-charcoal-muted uppercase">{prop.category}</span>
                    <h4 className="font-serif text-base font-bold text-forest">{prop.title}</h4>
                  </div>
                  <div>{getStatusBadge(prop.status)}</div>
                </div>

                <p className="text-charcoal-muted leading-relaxed line-clamp-2">
                  {prop.synopsis}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-forest/10 text-[11px] text-charcoal-muted">
                  <span>Location: <strong>{prop.proposed_location}</strong></span>
                  {prop.estimated_budget && (
                    <span>Estimated: <strong>₹{Number(prop.estimated_budget).toLocaleString('en-IN')}</strong></span>
                  )}
                  <span>Submitted: <strong>{new Date(prop.created_at).toLocaleDateString()}</strong></span>
                </div>

                {prop.admin_notes && (
                  <div className="p-3 bg-white rounded-xl border border-forest/15 text-[11px] text-forest space-y-1">
                    <span className="font-semibold block text-ukorange">Production Editorial Note:</span>
                    <p className="text-charcoal-muted">{prop.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productions Catalog & Streaming Access */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-forest">Uttarkunth Productions Catalog</h2>
          <span className="text-xs text-charcoal-muted">Public on-site visual preview available</span>
        </div>

        {AUTHENTIC_PRODUCTIONS.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft flex flex-col md:flex-row gap-6 md:items-center justify-between"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden relative flex-shrink-0 bg-forest/10 border border-forest/10">
                <img
                  src={prod.thumbnail}
                  alt={prod.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-forest/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-forest flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 ml-0.5 fill-forest" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-forest/10 text-forest text-[11px] font-bold rounded-full">
                    {prod.category}
                  </span>
                  <span className="text-[11px] text-charcoal-muted font-semibold flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-ukorange" />
                    Public Preview Clip
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest">{prod.title}</h3>
                <p className="text-xs text-charcoal-muted max-w-xl leading-relaxed">
                  {prod.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-forest/10 flex-shrink-0">
              <Link
                href={`/production/${prod.slug}`}
                className="px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>View Film Page</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Filmmaker Collaboration Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-forest" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-forest">Collaborate with Uttarkunth Films</h3>
            <p className="text-xs text-charcoal-muted">We fund and produce independent Himalayan stories</p>
          </div>
        </div>

        <p className="text-xs text-charcoal-muted leading-relaxed">
          Are you an ethnographic filmmaker, sound recordist, or visual storyteller working on indigenous folklore, river ecology, or high-altitude pastoralism? Uttarkunth offers production support and community distribution.
        </p>

        <div className="pt-2">
          <Link
            href="/production/collaborate"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl transition-colors"
          >
            <span>Submit Another Film Pitch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
