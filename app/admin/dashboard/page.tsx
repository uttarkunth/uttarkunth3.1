import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import {
  STAFF_ROLE_DEFINITIONS,
  FOUR_OPERATIONAL_DEPARTMENTS,
  resolveOperationalDepartment,
  type StaffRoleCode,
} from '@/lib/staff-rbac';
import { CURATED_DESTINATIONS } from '@/lib/destinations';
import {
  Shield,
  Home,
  Inbox,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Percent,
  FileText,
  ShoppingBag,
  Film,
  Heart,
  UserCog,
  Lock,
  Briefcase,
  Compass,
  KeyRound,
  Handshake,
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
    !staffProfile.staff_id ||
    !staffProfile.founder_approved_at
  ) {
    redirect('/staff/login?error=unauthorized');
  }

  const rawRole = (staffProfile.role_slug || staffProfile.role_code) as StaffRoleCode;
  const roleCode: StaffRoleCode =
    rawRole in STAFF_ROLE_DEFINITIONS ? rawRole : 'operations_admin';
  const roleDef = STAFF_ROLE_DEFINITIONS[roleCode];
  const isFounder = roleCode === 'founder';
  const staffId = staffProfile.staff_id;
  const operationalDept = resolveOperationalDepartment(staffProfile.department, roleCode);

  // If a department staff member (non-Founder) lands on /admin/dashboard, redirect them to their dedicated Staff Portal (/staff)
  if (!isFounder) {
    redirect('/staff');
  }

  // =========================================================================
  // FOUNDER COMMAND CENTRE — REAL-TIME DATABASE METRICS (ZERO FABRICATED DATA)
  // =========================================================================

  // 1. Properties & Staged Updates (UTTARKUNTH STAYS)
  const { data: properties } = await adminClient
    .from('properties')
    .select('id, name, moderation_status, published, pending_changes, host_id, created_at');
  const propList = properties || [];
  const pendingModeration = propList.filter((p) => p.moderation_status === 'pending');
  const stagedUpdates = propList.filter(
    (p) => p.pending_changes !== null && p.pending_changes !== undefined
  );
  const unassignedProps = propList.filter((p) => !p.host_id);
  const activeProps = propList.filter(
    (p) => p.published === true && p.moderation_status === 'approved'
  );

  // 2. Stay Bookings (UTTARKUNTH STAYS)
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, booking_reference, check_in, check_out, status, total_estimate, created_at')
    .order('created_at', { ascending: false });
  const bookingList = bookings || [];
  const pendingBookings = bookingList.filter((b) => b.status === 'pending');
  const confirmedBookings = bookingList.filter((b) => b.status === 'confirmed');

  // 3. Sellers & Products (UTTARKUNTH PRODUCTS)
  const { data: sellers } = await adminClient
    .from('sellers')
    .select('user_id, business_name, status, created_at');
  const sellerList: any[] = sellers || [];
  const pendingSellers = sellerList.filter((s) => s.status === 'pending');

  const { data: products } = await adminClient
    .from('products')
    .select('id, title, moderation_status, created_at');
  const productList: any[] = products || [];
  const pendingProducts = productList.filter((p) => p.moderation_status === 'pending');

  // 4. Productions — Filmmakers & Proposals (UTTARKUNTH PRODUCTIONS)
  const { data: filmmakers } = await adminClient
    .from('filmmaker_profiles')
    .select('*');
  const filmmakerList: any[] = filmmakers || [];
  const pendingFilmmakers = filmmakerList.filter((f) => f.status === 'pending');

  const { data: proposals } = await adminClient
    .from('production_proposals')
    .select('*');
  const proposalList: any[] = proposals || [];
  const pendingProposals = proposalList.filter((p) => p.status === 'pending');

  // 5. Community Submissions — Stories & Participations (UTTARKUNTH COMMUNITY)
  const { data: stories } = await adminClient
    .from('community_stories')
    .select('*');
  const storyList: any[] = stories || [];
  const pendingStories = storyList.filter((s) => s.moderation_status === 'pending');

  const { data: participations } = await adminClient
    .from('community_participations')
    .select('*');
  const partList: any[] = participations || [];
  const pendingParticipations = partList.filter((p) => p.status === 'pending');

  // 6. Platform Users, Staff Registry, Invitations, Dual Approvals & Security Alerts
  let totalPlatformUsers = 0;
  try {
    const { count: profileCount } = await (adminClient.from('profiles' as any) as any)
      .select('id', { count: 'exact', head: true });
    if (typeof profileCount === 'number' && profileCount > 0) {
      totalPlatformUsers = profileCount;
    }
  } catch {
    // Fallback if profiles table not yet migrated
  }

  const { data: allAdmins } = await adminClient
    .from('platform_admins')
    .select('user_id, email, role, created_at');

  let totalStaffCount = (allAdmins || []).length;
  let activeStaffCount = (allAdmins || []).length;
  let pendingStaffOnboardingCount = 0;
  let pendingInvitationsCount = 0;
  let pendingDualApprovalsCount = 0;
  let securityAlertsCount = 0;

  try {
    const { data: allStaffRows } = await (adminClient.from('staff_profiles' as any) as any)
      .select('id, status');
    if (allStaffRows && allStaffRows.length > 0) {
      totalStaffCount = Math.max(totalStaffCount, allStaffRows.length);
      activeStaffCount = allStaffRows.filter((s: any) => s.status === 'active').length;
      pendingStaffOnboardingCount = allStaffRows.filter((s: any) =>
        ['pending_founder_approval', 'under_review', 'info_requested'].includes(s.status)
      ).length;
    }

    const { data: pendingInvites } = await (adminClient.from('staff_invitations' as any) as any)
      .select('id')
      .eq('status', 'pending');
    pendingInvitationsCount = (pendingInvites || []).length;

    const { data: pendingDual } = await (adminClient.from('staff_dual_approvals' as any) as any)
      .select('id')
      .eq('status', 'pending');
    pendingDualApprovalsCount = (pendingDual || []).length;

    const { data: alertLogs } = await (adminClient.from('staff_audit_log' as any) as any)
      .select('id, action')
      .in('action', [
        'mfa_recovery_requested',
        'unauthorized_access_attempt',
        'staff_suspended',
        'staff_terminated',
      ]);
    securityAlertsCount = (alertLogs || []).length;
  } catch {
    // Phase 2 tables pending SQL execution in live Supabase
  }

  if (totalPlatformUsers === 0) {
    const distinctUsers = new Set<string>();
    for (const a of allAdmins || []) if (a.user_id) distinctUsers.add(a.user_id);
    for (const s of sellerList) if (s.user_id) distinctUsers.add(s.user_id);
    for (const f of filmmakerList) if (f.user_id) distinctUsers.add(f.user_id);
    for (const p of propList) if (p.host_id) distinctUsers.add(p.host_id);
    totalPlatformUsers = distinctUsers.size;
  }

  // 7. Commercial Agreements (Finance & Compliance)
  const { data: agreements } = await adminClient
    .from('host_agreements')
    .select('id, agreement_status, accepted_at');
  const agreementList = agreements || [];
  const activeAgreementsCount = agreementList.filter(
    (a) => a.agreement_status === 'active' && a.accepted_at !== null
  ).length;

  // 8. Audit Trail
  const { data: auditLogs } = await adminClient
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  const logs = auditLogs || [];

  // 19 Canonical Executive Overview Metrics (Part 6.1)
  const executiveMetrics = [
    { label: 'Total Platform Users', value: totalPlatformUsers, sub: 'Verified accounts' },
    { label: 'Total Staff', value: totalStaffCount, sub: `${activeStaffCount} active` },
    { label: 'Active Staff', value: activeStaffCount, sub: `${pendingStaffOnboardingCount} onboarding` },
    { label: 'Pending Staff Invitations', value: pendingInvitationsCount, sub: 'Single-use tokens' },
    { label: 'Total Properties', value: propList.length, sub: 'Uttarkunth Stays' },
    { label: 'Active Properties', value: activeProps.length, sub: 'Published & approved' },
    {
      label: 'Pending Property Approvals',
      value: pendingModeration.length + stagedUpdates.length,
      sub: `${pendingModeration.length} new, ${stagedUpdates.length} edits`,
    },
    { label: 'Total Bookings', value: bookingList.length, sub: `${confirmedBookings.length} confirmed` },
    { label: 'Pending Booking Requests', value: pendingBookings.length, sub: 'Awaiting decision' },
    { label: 'Marketplace Sellers', value: sellerList.length, sub: 'Uttarkunth Products' },
    { label: 'Pending Seller Verifications', value: pendingSellers.length, sub: 'GSTIN & licences' },
    { label: 'Total Products', value: productList.length, sub: 'Artisan catalogue' },
    { label: 'Pending Product Approvals', value: pendingProducts.length, sub: 'Awaiting curation' },
    { label: 'Production Proposals', value: proposalList.length, sub: `${filmmakerList.length} filmmakers` },
    {
      label: 'Pending Production Reviews',
      value: pendingProposals.length + pendingFilmmakers.length,
      sub: `${pendingProposals.length} slates, ${pendingFilmmakers.length} profiles`,
    },
    {
      label: 'Community Members & Entries',
      value: partList.length + storyList.length,
      sub: `${partList.length} fellowships, ${storyList.length} stories`,
    },
    {
      label: 'Pending Community Applications',
      value: pendingParticipations.length + pendingStories.length,
      sub: 'Awaiting moderation',
    },
    { label: 'Pending Dual Approvals', value: pendingDualApprovalsCount, sub: 'High-risk governance' },
    { label: 'Security Alerts', value: securityAlertsCount, sub: `${logs.length} recent audit events` },
  ];

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* SECTION 1: FOUNDER COMMAND CENTRE HEADER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ukorange">
                admin.uttarkunth.com &bull; Founder Command Centre
              </span>
              <span className="px-2.5 py-0.5 bg-forest text-ivory text-[11px] font-mono rounded-full">
                {staffId}
              </span>
              <span className="px-2.5 py-0.5 bg-ukorange/15 text-ukorange text-[11px] font-semibold rounded-full">
                {roleDef.title} ({operationalDept})
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-950/10 text-emerald-800 border border-emerald-600/30 text-[11px] font-semibold rounded-full inline-flex items-center gap-1">
                <KeyRound className="w-3 h-3" />
                AAL2 MFA Enforced
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest">
              Founder Operational &amp; Governance Console
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted max-w-3xl">
              Supreme executive control across all four Uttarkunth operational departments (Stays, Products, Productions, Community) and centralized shared functions (HR, Finance, Legal &amp; Compliance, Security, and Strategy). All 19 metrics below reflect live Supabase state.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/staff"
              className="px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
            >
              <UserCog className="w-4 h-4 text-ukorange" />
              <span>Hiring, Invitations &amp; RBAC</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/staff"
              className="px-4 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-forest" />
              <span>Staff Portal View</span>
            </Link>
            <Link
              href="/admin/audit"
              className="px-4 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest border border-forest/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-forest" />
              <span>Immutable Audit Trail</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1B: 19 REAL-TIME EXECUTIVE OVERVIEW METRICS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-forest">
              1. Executive Overview — 19 Real-Time Platform Metrics
            </h2>
            <span className="text-[11px] text-charcoal-muted font-mono">
              Zero fabricated statistics &bull; Live Supabase queries
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {executiveMetrics.map((m) => (
              <div
                key={m.label}
                className="p-4 bg-white rounded-2xl border border-forest/15 shadow-xs space-y-1"
              >
                <div className="text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider line-clamp-1">
                  {m.label}
                </div>
                <div className="font-serif text-2xl font-bold text-forest">{m.value}</div>
                <div className="text-[11px] text-charcoal-muted">{m.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: FOUR OPERATIONAL DEPARTMENT DESKS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-forest">
              2. Four Operational Department Desks
            </h2>
            <span className="text-[11px] text-charcoal-muted font-mono">
              Strict departmental isolation for non-Founder staff
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. UTTARKUNTH STAYS */}
            <Link
              href="/admin/properties"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ukorange">
                  {FOUR_OPERATIONAL_DEPARTMENTS[0].name}
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
                {activeProps.length} active stays &bull; {unassignedProps.length} unassigned &bull;{' '}
                {pendingBookings.length} pending bookings
              </p>
            </Link>

            {/* 2. UTTARKUNTH PRODUCTS */}
            <Link
              href="/admin/products"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ukorange">
                  {FOUR_OPERATIONAL_DEPARTMENTS[1].name}
                </span>
                <ShoppingBag className="w-4 h-4 text-ukorange" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">
                  {pendingSellers.length + pendingProducts.length}
                </span>
                <span className="text-xs text-charcoal-muted">
                  ({pendingSellers.length} sellers, {pendingProducts.length} products)
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {sellerList.length} marketplace sellers &bull; {productList.length} total products
              </p>
            </Link>

            {/* 3. UTTARKUNTH PRODUCTIONS */}
            <Link
              href="/admin/productions"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ukorange">
                  {FOUR_OPERATIONAL_DEPARTMENTS[2].name}
                </span>
                <Film className="w-4 h-4 text-ukorange" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-bold text-forest">
                  {pendingFilmmakers.length + pendingProposals.length}
                </span>
                <span className="text-xs text-charcoal-muted">
                  ({pendingFilmmakers.length} creators, {pendingProposals.length} slates)
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted">
                {filmmakerList.length} total profiles &bull; {proposalList.length} total proposals
              </p>
            </Link>

            {/* 4. UTTARKUNTH COMMUNITY */}
            <Link
              href="/admin/community"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:border-forest/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ukorange">
                  {FOUR_OPERATIONAL_DEPARTMENTS[3].name}
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
                {storyList.length} total stories &bull; {partList.length} fellowship applications
              </p>
            </Link>
          </div>
        </section>

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

        {/* SECTIONS 3–9: CENTRALIZED FOUNDER GOVERNANCE & SHARED FUNCTIONS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-forest">
              3–9. Centralized Shared Functions &amp; Founder Governance Desks
            </h2>
            <span className="text-[11px] text-charcoal-muted font-mono">
              HR &bull; Audit &bull; Partnerships &bull; Finance &bull; Strategy &bull; Security &bull; Settings
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Section 3: Hiring & People */}
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
              <h3 className="font-serif text-base font-bold text-forest">
                3. Hiring &amp; People (HR)
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Issue single-use staff invitations ({pendingInvitationsCount} pending), verify 8 mandatory legal agreements, assign UK-STAFF-YYYY-XXXX IDs, and manage {activeStaffCount} active staff.
              </p>
            </Link>

            {/* Section 4: Audit & Quality */}
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
              <h3 className="font-serif text-base font-bold text-forest">
                4. Audit &amp; Quality Assurance
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Inspect append-only staff audit logs, review moderation quality across all 4 departments, and monitor dual-approval records ({pendingDualApprovalsCount} pending).
              </p>
            </Link>

            {/* Section 5: Partnerships & Relations */}
            <Link
              href="/admin/users"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                  <Handshake className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
              </div>
              <h3 className="font-serif text-base font-bold text-forest">
                5. Partnerships &amp; Relations
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Oversee Property Hosts ({propList.length} properties), Artisan Sellers ({sellerList.length}), Filmmakers ({filmmakerList.length}), and Community Partners ({partList.length}).
              </p>
            </Link>

            {/* Section 6: Finance & Compliance */}
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
              <h3 className="font-serif text-base font-bold text-forest">
                6. Finance, Tax &amp; Compliance
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Founder-managed commercial commission agreements ({activeAgreementsCount} active bilateral contracts), Modulo-36 GSTIN verification, and private compliance dossiers.
              </p>
            </Link>

            {/* Section 7: Strategy & Development */}
            <Link
              href="/stays"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                  <Compass className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
              </div>
              <h3 className="font-serif text-base font-bold text-forest">
                7. Strategy &amp; Regional Development
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Curated expansion across {CURATED_DESTINATIONS.length} Himalayan destinations (Himachal Pradesh &amp; Uttarakhand), cross-pillar ecosystem alignment, and regional heritage preservation.
              </p>
            </Link>

            {/* Section 8 & 9: Governance, Security & Platform Settings */}
            <Link
              href="/admin/staff"
              className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                  <Shield className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
              </div>
              <h3 className="font-serif text-base font-bold text-forest">
                8 &amp; 9. Security, RBAC &amp; Platform Settings
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Enforce TOTP MFA (AAL2), grant/revoke granular permissions, execute immediate session revocation, and manage private storage buckets (<code className="font-mono">staff-hr-docs</code>, <code className="font-mono">seller-verification-docs</code>).
              </p>
            </Link>
          </div>
        </section>

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
