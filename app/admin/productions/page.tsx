import React from 'react';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { ProductionsModerationClient } from '@/components/productions-moderation-client';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminProductionsPage() {
  const auth = await requireStaffPermission('productions.review_proposal', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('productions.approve_profile', { requireMfaAal2: false })
    : auth;

  if (!finalAuth.authorized || !finalAuth.user) {
    return (
      <div className="pb-16 bg-ivory min-h-screen">
        <AdminNav />
        <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest">Access Restricted</h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Himalayan productions and filmmaker proposal moderation requires explicit &apos;productions.review_proposal&apos; or &apos;productions.approve_profile&apos; staff authority.
          </p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();

  // Fetch proposals
  const { data: proposals, error: propErr } = await adminClient
    .from('production_proposals')
    .select('*, filmmaker_profiles(full_name, email, creative_role, location)')
    .order('created_at', { ascending: false });

  // Fetch profiles
  const { data: profiles, error: profErr } = await adminClient
    .from('filmmaker_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const isDbReady = !propErr && !profErr;
  const proposalList = proposals || [];
  const profileList = profiles || [];

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Platform Administration</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Productions &amp; Film Pitch Moderation</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Review documentary pitches, grant proposals, and creative collaborator profiles submitted to Uttarkunth Productions.
          </p>
        </div>

        {!isDbReady && (
          <div className="p-5 bg-amber-50 rounded-3xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px] text-amber-800 block">
              Database Migration Pending Owner Authorization
            </span>
            <p className="leading-relaxed">
              The Phase 2G tables (<code>filmmaker_profiles</code> and <code>production_proposals</code> in <code>20261103140000_phase2g_2h_productions_community_pending_approval.sql</code>) have not yet been applied to the production database. Moderation actions will become operational once the migration is authorized and applied.
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Total Proposals
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{proposalList.length}</span>
              <span className="text-xs text-charcoal-muted">
                ({proposalList.filter((p) => p.status === 'submitted' || p.status === 'under_review').length} pending)
              </span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Approved Productions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-green-700">
                {proposalList.filter((p) => p.status === 'approved' || p.status === 'in_production').length}
              </span>
              <span className="text-xs text-charcoal-muted">in development</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Registered Filmmakers
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-ukorange">{profileList.length}</span>
              <span className="text-xs text-charcoal-muted">creative network</span>
            </div>
          </div>
        </div>

        {/* Client Interactive Moderation Console */}
        <ProductionsModerationClient initialProposals={proposalList} initialProfiles={profileList} />
      </div>
    </div>
  );
}
