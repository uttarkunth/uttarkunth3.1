import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { STAFF_ROLE_DEFINITIONS, type StaffRoleCode } from '@/lib/staff-rbac';
import {
  Shield,
  Home,
  Inbox,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Percent,
  FileText,
  ShoppingBag,
  Film,
  Heart,
  UserCog,
  Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user) {
    redirect('/staff/login?next=/admin/dashboard');
  }

  if (!isAdmin) {
    redirect('/staff/login?error=unauthorized');
  }

  const adminClient = createAdminClient();

  // Authoritative staff identity resolution strictly from public.staff_profiles
  const { data: staffProfile, error: spErr } = await (
    adminClient.from('staff_profiles' as any) as any
  )
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (
    spErr ||
    !staffProfile ||
    staffProfile.status !== 'active' ||
    staffProfile.session_revoked_at ||
    staffProfile.founder_approved !== true ||
    !staffProfile.staff_id ||
    !staffProfile.founder_approved_at ||
    !staffProfile.founder_approved_by ||
    staffProfile.privacy_notice_accepted !== true ||
    staffProfile.agreements_completed !== true ||
    staffProfile.all_agreements_accepted !== true ||
    staffProfile.onboarding_completed !== true
  ) {
    redirect('/staff/login?error=unauthorized');
  }

  const rawRole = (staffProfile.role_slug || staffProfile.role_code) as StaffRoleCode;
  const roleCode: StaffRoleCode =
    Object.prototype.hasOwnProperty.call(STAFF_ROLE_DEFINITIONS, rawRole) ? rawRole : 'operations_admin';
  const roleDef = STAFF_ROLE_DEFINITIONS[roleCode];
  const staffId = staffProfile.staff_id;

  // 1. Properties & Staged Updates
  const { data: properties } = await adminClient
    .from('properties')
    .select('id, moderation_status, pending_changes, host_id');
  const propList = properties || [];
  const pendingModeration = propList.filter((p) => p.moderation_status === 'pending');
  const stagedUpdates = propList.filter(
    (p) => p.pending_changes !== null && p.pending_changes !== undefined
  );
  const unassignedProps = propList.filter((p) => !p.host_id);
  const approvedProps = propList.filter((p) => p.moderation_status === 'approved');

  // 2. Stay Bookings
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, status')
    .order('created_at', { ascending: false });
  const bookingList = bookings || [];
  const pendingBookings = bookingList.filter((b) => b.status === 'pending');
  const confirmedBookings = bookingList.filter((b) => b.status === 'confirmed');

  // 3. Sellers & Products
  const { data: sellers } = await adminClient
    .from('sellers')
    .select('user_id, status');
  const sellerList: any[] = sellers || [];
  const pendingSellers = sellerList.filter((s) => s.status === 'pending');

  const { data: products } = await adminClient
    .from('products')
    .select('id, moderation_status');
  const productList: any[] = products || [];
  const pendingProducts = productList.filter((p) => p.moderation_status === 'pending');

  // 4. Productions (Filmmakers & Proposals)
  const { data: filmmakers } = await adminClient
    .from('filmmaker_profiles')
    .select('id, status');
  const filmmakerList: any[] = filmmakers || [];
  const pendingFilmmakers = filmmakerList.filter((f) => f.status === 'pending');

  const { data: proposals } = await adminClient
    .from('production_proposals')
    .select('id, status');
  const proposalList: any[] = proposals || [];
  const pendingProposals = proposalList.filter((p) => p.status === 'pending');

  // 5. Community Submissions (Stories & Participations)
  const { data: stories } = await adminClient
    .from('community_stories')
    .select('id, moderation_status');
  const storyList: any[] = stories || [];
  const pendingStories = storyList.filter((s) => s.moderation_status === 'pending');

  const { data: participations } = await adminClient
    .from('community_participations')
    .select('id, status');
  const partList: any[] = participations || [];
  const pendingParticipations = partList.filter((p) => p.status === 'pending');

  // 6. Staff Registry & Audit Log
  let activeStaffCount = 0;

  let pendingStaffOnboardingCount = 0;
  try {
    const { data: activeStaffRows } = await (adminClient.from('staff_profiles' as any) as any)
      .select('id')
      .eq('status', 'active');
    activeStaffCount = (activeStaffRows || []).length;

    const { data: pendingStaff } = await (adminClient.from('staff_profiles' as any) as any)
      .select('id')
      .in('status', ['pending_founder_approval', 'under_review', 'info_requested']);
    pendingStaffOnboardingCount = (pendingStaff || []).length;
  } catch {
    // Table pending migration
  }

  // Audit reasons and actor identity are Founder-only, even though all staff may see queue counts.
  let logs: any[] = [];
  if (roleCode === 'founder') {
    const { data: auditLogs } = await adminClient
      .from('admin_audit_log')
      .select('id, action, target_type, target_id, details, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    logs = auditLogs || [];
  }

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Staff Identity & Role Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ukorange">
                Uttarkunth Internal Staff Portal
              </span>
              <span className="px-2.5 py-0.5 bg-forest text-ivory text-[11px] font-mono rounded-full">
                {staffId}
              </span>
              <span className="px-2.5 py-0.5 bg-ukorange/15 text-ukorange text-[11px] font-semibold rounded-full">
                {roleDef.title} ({roleDef.department})
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              {roleCode === 'founder'
                ? 'Founder Operational & Governance Console'
                : `${roleDef.department} Workspace`}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-3xl">
              {roleDef.description} All counts below are real-time database metrics across Uttarkunth pillars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {roleCode === 'founder' && (
              <Link
                href="/admin/staff"
                className="px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
              >
                <UserCog className="w-4 h-4 text-ukorange" />
                <span>Staff Hiring, Invitations &amp; RBAC</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href="/admin/audit"
              className="px-4 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-forest" />
              <span>Immutable Audit Trail</span>
            </Link>
          </div>
        </div>

        {/* Founder Operational Queue Grid (Real DB Counts Only) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl font-bold text-forest">
              Live Cross-Pillar Moderation &amp; Verification Queues
            </h2>
            <span className="text-[11px] text-charcoal-muted font-mono">
              Zero fictional statistics · Direct Supabase state
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Host & Property Queue */}
            <Link
              href="/admin/properties"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Property Staged Changes
                </span>
                <Home className="w-4 h-4 text-ukorange" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">
                  {stagedUpdates.length + pendingModeration.length}
                </span>
                <span className="text-xs text-charcoal-muted">
                  ({stagedUpdates.length} edits, {pendingModeration.length} new)
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {approvedProps.length} live stays &bull; {unassignedProps.length} awaiting host assignment
              </p>
            </Link>

            {/* 2. Seller & Marketplace Queue */}
            <Link
              href="/admin/products"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Seller &amp; GSTIN Verification
                </span>
                <ShoppingBag className="w-4 h-4 text-ukorange" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">
                  {pendingSellers.length}
                </span>
                <span className="text-xs text-charcoal-muted">pending seller applications</span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {pendingProducts.length} product submissions awaiting curation ({productList.length} total)
              </p>
            </Link>

            {/* 3. Productions Queue */}
            <Link
              href="/admin/productions"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Filmmakers &amp; Proposals
                </span>
                <Film className="w-4 h-4 text-ukorange" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">
                  {pendingFilmmakers.length + pendingProposals.length}
                </span>
                <span className="text-xs text-charcoal-muted">
                  ({pendingFilmmakers.length} profiles, {pendingProposals.length} slates)
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {filmmakerList.length} total profiles &bull; {proposalList.length} total proposals
              </p>
            </Link>

            {/* 4. Community & Staff Governance Queue */}
            <Link
              href="/admin/community"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                  Community Submissions
                </span>
                <Heart className="w-4 h-4 text-ukorange" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">
                  {pendingStories.length + pendingParticipations.length}
                </span>
                <span className="text-xs text-charcoal-muted">
                  ({pendingStories.length} stories, {pendingParticipations.length} fellowships)
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {pendingBookings.length} pending stay bookings ({confirmedBookings.length} confirmed)
              </p>
            </Link>
          </div>
        </div>

        {/* Security & Governance Status Banner */}
        <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange">
              Staff Identity &amp; Onboarding
            </span>
            <p className="font-serif text-lg font-bold text-forest">
              {activeStaffCount} Authorised Staff &bull; {pendingStaffOnboardingCount} Pending Onboarding
            </p>
            <p className="text-xs text-charcoal-muted">
              Open staff registration is disabled. All accounts require single-use Founder tokens and 8 signed agreements.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange">
              Assigned Permissions ({roleDef.defaultPermissions.length})
            </span>
            <div className="flex flex-wrap gap-1 pt-1">
              {roleDef.defaultPermissions.slice(0, 6).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 bg-forest/10 text-forest text-[10px] font-mono rounded-md"
                >
                  {perm}
                </span>
              ))}
              {roleDef.defaultPermissions.length > 6 && (
                <span className="px-2 py-0.5 bg-forest/5 text-charcoal-muted text-[10px] font-mono rounded-md">
                  +{roleDef.defaultPermissions.length - 6} more
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ukorange">
              Security &amp; Storage Isolation
            </span>
            <p className="text-xs text-charcoal font-semibold">
              Private Buckets: <code className="font-mono">staff-hr-docs</code> &amp;{' '}
              <code className="font-mono">seller-verification-docs</code>
            </p>
            <p className="text-xs text-charcoal-muted">
              TOTP MFA (AAL2) enforced for privileged approvals. Dual authorisation active for high-risk actions.
            </p>
          </div>
        </div>

        {/* Callouts for Staged / Pending */}
        {(stagedUpdates.length > 0 || pendingModeration.length > 0) && (
          <div className="p-5 bg-ukorange/10 border border-ukorange/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-ukorange flex-shrink-0" />
              <div>
                <strong className="text-sm font-semibold text-charcoal block">
                  {stagedUpdates.length} Staged Change{stagedUpdates.length !== 1 ? 's' : ''} &amp;{' '}
                  {pendingModeration.length} New Listing{pendingModeration.length !== 1 ? 's' : ''}{' '}
                  Require Moderation
                </strong>
                <span className="text-xs text-charcoal-muted">
                  Content changes submitted by hosts remain safely staged until authorized.
                </span>
              </div>
            </div>
            <Link
              href="/admin/properties"
              className="px-4 py-2 bg-ukorange hover:bg-ukorange-hover text-white text-xs font-semibold rounded-xl shadow-sm whitespace-nowrap inline-flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>Launch Moderation Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Quick Portal Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/staff"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <UserCog className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Staff &amp; RBAC Governance</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Issue staff invitations, approve onboarding dossiers, and manage 8-role permissions.
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <Users className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Host &amp; Co-host Teams</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Assign primary hosts and manage operational co-host delegations.
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <Percent className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Commercial Agreements</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Authorize formal bilateral commission contracts.
            </p>
          </Link>

          <Link
            href="/admin/audit"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <FileText className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Administrator Audit Log</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Review immutable audit trail of all platform interventions and Staff IDs.
            </p>
          </Link>
        </div>

        {/* Audit Log & Activity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-forest/10">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-forest" />
              <h2 className="font-serif text-2xl font-bold text-forest">
                Recent Staff &amp; Administrative Activity
              </h2>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>Explore All Logs</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {logs.length > 0 ? (
            <div className="divide-y divide-forest/10 text-xs">
              {logs.map((log: any) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-forest uppercase tracking-wider">
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      {log.details?.actor_staff_id && (
                        <span className="px-2 py-0.2 bg-forest/10 text-forest font-mono text-[10px] rounded">
                          {log.details.actor_staff_id}
                        </span>
                      )}
                    </div>
                    <p className="text-charcoal-muted">
                      Target: <span className="font-semibold text-charcoal">{log.target_type}</span> (
                      {log.target_id?.slice(0, 12)})
                      {log.details?.actor_email && ` • by ${log.details.actor_email}`}
                      {log.details?.reason && ` • Reason: ${log.details.reason}`}
                    </p>
                  </div>
                  <span className="text-charcoal-muted font-mono">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-charcoal-muted">
              Audit log is clean. Platform administrative actions will be recorded here automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
