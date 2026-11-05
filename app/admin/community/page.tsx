import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { CommunityModerationClient } from '@/components/community-moderation-client';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCommunityPage() {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user) {
    redirect('/staff/login?next=/admin/community');
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">Administrator Access Required</h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This portal is restricted to authorized platform administrators.
        </p>
      </div>
    );
  }

  const adminClient = createAdminClient();

  const { data: participations, error: partErr } = await adminClient
    .from('community_participations')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: stories, error: storyErr } = await adminClient
    .from('community_stories')
    .select('*')
    .order('created_at', { ascending: false });

  const isDbReady = !partErr && !storyErr;
  const partList = participations || [];
  const storyList = stories || [];

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Platform Administration</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Community Moderation Desk</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Review field cohort participation applications, assign mentors, and curate authentic community oral history stories.
          </p>
        </div>

        {!isDbReady && (
          <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 block">
              Database Migration Pending Owner Authorization
            </span>
            <p className="leading-relaxed">
              The Phase 2H tables (<code>community_participations</code> and <code>community_stories</code> in <code>20261103140000_phase2g_2h_productions_community_pending_approval.sql</code>) have not yet been applied to the production database. Moderation actions will become operational once the migration is authorized and applied.
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Cohort Applications
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{partList.length}</span>
              <span className="text-xs text-charcoal-muted">
                ({partList.filter((p) => p.status === 'pending').length} pending)
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Accepted Fellows
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-green-700">
                {partList.filter((p) => p.status === 'approved').length}
              </span>
              <span className="text-xs text-charcoal-muted">in field</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Submitted Stories
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-ukorange">{storyList.length}</span>
              <span className="text-xs text-charcoal-muted">
                ({storyList.filter((s) => s.status === 'published').length} published)
              </span>
            </div>
          </div>
        </div>

        {/* Client Interactive Moderation Console */}
        <CommunityModerationClient
          initialParticipations={partList}
          initialStories={storyList}
        />
      </div>
    </div>
  );
}