import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  STAFF_ROLE_DEFINITIONS,
  FOUR_OPERATIONAL_DEPARTMENTS,
  resolveOperationalDepartment,
  type StaffRoleCode,
  type StaffPermission,
} from '@/lib/staff-rbac';
import {
  ShieldCheck,
  Home,
  ShoppingBag,
  Film,
  Heart,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Bell,
  HelpCircle,
  ArrowRight,
  Lock,
  KeyRound,
  Briefcase,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StaffPortalPage() {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user) {
    redirect('/staff/login?portal=staff&next=/staff');
  }

  if (!isAdmin) {
    redirect('/staff/login?error=unauthorized');
  }

  // Enforce TOTP MFA (AAL2)
  let mfaLevel = 'aal1';
  try {
    const supabase = createServerSupabaseClient();
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel === 'aal2') {
      mfaLevel = 'aal2';
    }
  } catch {
    mfaLevel = 'aal1';
  }

  if (mfaLevel !== 'aal2') {
    redirect('/staff/login?portal=staff&next=/staff');
  }

  const adminClient = createAdminClient();
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
    rawRole in STAFF_ROLE_DEFINITIONS ? rawRole : 'property_reviewer';
  const roleDef = STAFF_ROLE_DEFINITIONS[roleCode];
  const isFounder = roleCode === 'founder';

  const operationalDept = resolveOperationalDepartment(
    staffProfile.department,
    roleCode
  );

  // Resolve effective permissions (role defaults + custom grants - explicit revocations)
  const effectivePermSet = new Set<StaffPermission>(roleDef.defaultPermissions);
  if (Array.isArray(staffProfile.custom_permissions)) {
    for (const p of staffProfile.custom_permissions) {
      effectivePermSet.add(p as StaffPermission);
    }
  }
  if (Array.isArray(staffProfile.revoked_permissions)) {
    for (const r of staffProfile.revoked_permissions) {
      effectivePermSet.delete(r as StaffPermission);
    }
  }
  const effectivePermissions = Array.from(effectivePermSet);

  const canAccessStays =
    isFounder ||
    operationalDept === 'stays' ||
    effectivePermSet.has('property.review');
  const canAccessProducts =
    isFounder ||
    operationalDept === 'products' ||
    effectivePermSet.has('seller.approve') ||
    effectivePermSet.has('seller.verify_documents') ||
    effectivePermSet.has('product.approve');
  const canAccessProductions =
    isFounder ||
    operationalDept === 'productions' ||
    effectivePermSet.has('productions.review_proposal');
  const canAccessCommunity =
    isFounder ||
    operationalDept === 'community' ||
    effectivePermSet.has('community.moderate');
  const canAccessReports =
    isFounder ||
    effectivePermSet.has('audit.view_full') ||
    effectivePermSet.has('finance.review_agreements');

  // Query ONLY the department tables that this staff member is authorized to access
  let staysMetrics = {
    totalProperties: 0,
    pendingProperties: 0,
    stagedEdits: 0,
    pendingBookings: 0,
    recentPendingItems: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
  };

  if (canAccessStays) {
    const { data: props } = await adminClient
      .from('properties')
      .select('id, name, village, moderation_status, pending_changes');
    const propList = props || [];
    const pendingProps = propList.filter((p) => p.moderation_status === 'pending');
    const stagedProps = propList.filter(
      (p) => p.pending_changes !== null && p.pending_changes !== undefined
    );

    const { data: bookings } = await adminClient
      .from('stay_bookings')
      .select('id, booking_reference, guest_name, status')
      .eq('status', 'pending');
    const pendingBookings = bookings || [];

    staysMetrics = {
      totalProperties: propList.length,
      pendingProperties: pendingProps.length,
      stagedEdits: stagedProps.length,
      pendingBookings: pendingBookings.length,
      recentPendingItems: [
        ...pendingProps.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `New stay submission (${p.village || 'Himalayas'})`,
          href: '/admin/properties',
        })),
        ...stagedProps.slice(0, 3).map((p) => ({
          id: `${p.id}-staged`,
          title: p.name,
          subtitle: 'Host staged listing edit awaiting review',
          href: '/admin/properties',
        })),
      ],
    };
  }

  let productsMetrics = {
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    recentPendingItems: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
  };

  if (canAccessProducts) {
    const { data: sellers } = await adminClient
      .from('sellers')
      .select('user_id, business_name, status');
    const sellerList = sellers || [];
    const pendingSellers = sellerList.filter((s) => s.status === 'pending');

    const { data: products } = await adminClient
      .from('products')
      .select('id, title, category, moderation_status');
    const productList = products || [];
    const pendingProducts = productList.filter((p) => p.moderation_status === 'pending');

    productsMetrics = {
      totalSellers: sellerList.length,
      pendingSellers: pendingSellers.length,
      totalProducts: productList.length,
      pendingProducts: pendingProducts.length,
      recentPendingItems: [
        ...pendingSellers.slice(0, 3).map((s) => ({
          id: s.user_id,
          title: s.business_name,
          subtitle: 'Seller & GSTIN verification dossier pending',
          href: '/admin/products',
        })),
        ...pendingProducts.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: `Product curation review (${p.category || 'Craft'})`,
          href: '/admin/products',
        })),
      ],
    };
  }

  let productionsMetrics = {
    totalFilmmakers: 0,
    pendingFilmmakers: 0,
    totalProposals: 0,
    pendingProposals: 0,
    recentPendingItems: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
  };

  if (canAccessProductions) {
    const { data: filmmakers } = await adminClient
      .from('filmmaker_profiles')
      .select('id, full_name, craft_specialty, status');
    const fmList: any[] = filmmakers || [];
    const pendingFm = fmList.filter((f) => f.status === 'pending');

    const { data: proposals } = await adminClient
      .from('production_proposals')
      .select('id, title, genre, status');
    const propList: any[] = proposals || [];
    const pendingProp = propList.filter((p) => p.status === 'pending');

    productionsMetrics = {
      totalFilmmakers: fmList.length,
      pendingFilmmakers: pendingFm.length,
      totalProposals: propList.length,
      pendingProposals: pendingProp.length,
      recentPendingItems: [
        ...pendingFm.slice(0, 3).map((f) => ({
          id: f.id,
          title: f.full_name || 'Filmmaker Application',
          subtitle: `Creator onboarding (${f.craft_specialty || 'Production'})`,
          href: '/admin/productions',
        })),
        ...pendingProp.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: `Production slate proposal (${p.genre || 'Documentary'})`,
          href: '/admin/productions',
        })),
      ],
    };
  }

  let communityMetrics = {
    totalStories: 0,
    pendingStories: 0,
    totalParticipations: 0,
    pendingParticipations: 0,
    recentPendingItems: [] as Array<{ id: string; title: string; subtitle: string; href: string }>,
  };

  if (canAccessCommunity) {
    const { data: stories } = await adminClient
      .from('community_stories')
      .select('id, title, author_name, moderation_status');
    const storyList: any[] = stories || [];
    const pendingSt = storyList.filter((s) => s.moderation_status === 'pending');

    const { data: participations } = await adminClient
      .from('community_participations')
      .select('id, full_name, initiative_slug, status');
    const partList: any[] = participations || [];
    const pendingPt = partList.filter((p) => p.status === 'pending');

    communityMetrics = {
      totalStories: storyList.length,
      pendingStories: pendingSt.length,
      totalParticipations: partList.length,
      pendingParticipations: pendingPt.length,
      recentPendingItems: [
        ...pendingSt.slice(0, 3).map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: `Community story by ${s.author_name || 'Member'}`,
          href: '/admin/community',
        })),
        ...pendingPt.slice(0, 3).map((p) => ({
          id: p.id,
          title: p.full_name || 'Fellowship Applicant',
          subtitle: `Initiative: ${p.initiative_slug || 'General'}`,
          href: '/admin/community',
        })),
      ],
    };
  }

  const departmentTitle =
    operationalDept === 'founder_office'
      ? 'Founder Executive Office (All 4 Pillars)'
      : FOUR_OPERATIONAL_DEPARTMENTS.find((d) => d.slug === operationalDept)?.name ||
        roleDef.department;

  const primaryDepartmentHref =
    operationalDept === 'stays'
      ? '/admin/properties'
      : operationalDept === 'products'
        ? '/admin/products'
        : operationalDept === 'productions'
          ? '/admin/productions'
          : operationalDept === 'community'
            ? '/admin/community'
            : '/admin/dashboard';

  const navItems = [
    { label: 'Dashboard', href: '/staff', icon: Briefcase, allowed: true },
    { label: 'My Department', href: primaryDepartmentHref, icon: ShieldCheck, allowed: true },
    { label: 'My Tasks', href: '#tasks', icon: ClipboardList, allowed: true },
    { label: 'Applications', href: primaryDepartmentHref, icon: FileText, allowed: true },
    { label: 'Work Management', href: primaryDepartmentHref, icon: Clock, allowed: true },
    { label: 'Reports', href: '/admin/audit', icon: BarChart3, allowed: canAccessReports },
    { label: 'My Profile', href: '#profile', icon: UserCheck, allowed: true },
    { label: 'Notifications', href: '#notifications', icon: Bell, allowed: true },
    { label: 'Help & Support', href: '#support', icon: HelpCircle, allowed: true },
  ].filter((item) => item.allowed);

  return (
    <div className="min-h-screen bg-ivory pb-20">
      {/* Top Staff Portal Bar */}
      <div className="bg-forest-dark text-ivory border-b border-forest/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-ukorange/20 text-ukorange border border-ukorange/40 text-[10px] font-mono uppercase tracking-widest rounded">
              team.uttarkunth.com · Staff Portal
            </span>
            <span className="text-xs font-semibold text-ivory/90">
              {departmentTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-2.5 py-1 bg-white/10 rounded-full text-ivory">
              {staffProfile.staff_id}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
              <KeyRound className="w-3 h-3" />
              AAL2 MFA Verified
            </span>
            {isFounder && (
              <Link
                href="/admin/dashboard"
                className="text-xs font-semibold px-3 py-1.5 bg-ukorange hover:bg-ukorange-hover text-white rounded-full transition-colors flex items-center gap-1"
              >
                <span>Founder Command Centre</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Permission-Scoped Dynamic Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-ivory/80 hover:text-white hover:bg-forest/50 whitespace-nowrap transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-ukorange" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Staff Identity & Authorization Boundary Card */}
        <div
          id="profile"
          className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-ukorange">
                Authorised Staff Workspace
              </span>
              <span className="px-2.5 py-0.5 bg-forest text-ivory text-[11px] font-mono rounded-full">
                {staffProfile.staff_id}
              </span>
              <span className="px-2.5 py-0.5 bg-forest/10 text-forest text-[11px] font-semibold rounded-full">
                {staffProfile.designation || roleDef.title}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-forest">
              {staffProfile.full_name || user.email}
            </h1>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Assigned Department:{' '}
              <strong className="text-charcoal">{departmentTitle}</strong> &bull; Role:{' '}
              <strong className="text-charcoal">{roleDef.title}</strong>. Your workspace is strictly scoped to your assigned department and Founder-approved permissions.
            </p>
          </div>

          <div className="bg-ivory-warm rounded-2xl p-4 border border-forest/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest">
                Effective Permissions ({effectivePermissions.length})
              </span>
              <Lock className="w-3.5 h-3.5 text-ukorange" />
            </div>
            <div className="flex flex-wrap gap-1">
              {effectivePermissions.slice(0, 6).map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 bg-white border border-forest/15 text-forest text-[10px] font-mono rounded"
                >
                  {perm}
                </span>
              ))}
              {effectivePermissions.length > 6 && (
                <span className="px-2 py-0.5 bg-forest/10 text-charcoal-muted text-[10px] font-mono rounded">
                  +{effectivePermissions.length - 6} more
                </span>
              )}
            </div>
            <p className="text-[11px] text-charcoal-muted pt-1">
              Cross-department access is blocked at API &amp; RLS layers.
            </p>
          </div>
        </div>

        {/* Assigned Department Desks (Strictly Filtered by Permission) */}
        <div id="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-forest">
              Department Work Queues &amp; Pending Applications
            </h2>
            <span className="text-xs text-charcoal-muted font-mono">
              Real-time Supabase department records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. UTTARKUNTH STAYS DESK */}
            {canAccessStays && (
              <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ukorange">
                        Department 01
                      </span>
                      <h3 className="font-serif text-xl font-bold text-forest">
                        UTTARKUNTH STAYS
                      </h3>
                    </div>
                  </div>
                  <Link
                    href="/admin/properties"
                    className="px-3.5 py-2 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Stays Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {staysMetrics.pendingProperties}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">New Properties</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {staysMetrics.stagedEdits}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Staged Edits</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {staysMetrics.pendingBookings}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Pending Bookings</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href="/admin/properties"
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    Property Moderation ({staysMetrics.totalProperties}) &rarr;
                  </Link>
                  <span className="text-charcoal-muted">&bull;</span>
                  <Link
                    href="/admin/bookings"
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    Stay Bookings &rarr;
                  </Link>
                  <span className="text-charcoal-muted">&bull;</span>
                  <Link
                    href="/admin/users"
                    className="text-xs font-semibold text-forest hover:underline"
                  >
                    Host Assignments &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* 2. UTTARKUNTH PRODUCTS DESK */}
            {canAccessProducts && (
              <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ukorange">
                        Department 02
                      </span>
                      <h3 className="font-serif text-xl font-bold text-forest">
                        UTTARKUNTH PRODUCTS
                      </h3>
                    </div>
                  </div>
                  <Link
                    href="/admin/products"
                    className="px-3.5 py-2 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Products Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {productsMetrics.pendingSellers}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Pending Sellers</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {productsMetrics.pendingProducts}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Pending Products</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {productsMetrics.totalProducts}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Total Products</div>
                  </div>
                </div>

                <p className="text-xs text-charcoal-muted">
                  Verify Indian GSTIN checksums, inspect private FSSAI/AYUSH/GI licences, and curate authentic Himalayan craft products.
                </p>
              </div>
            )}

            {/* 3. UTTARKUNTH PRODUCTIONS DESK */}
            {canAccessProductions && (
              <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ukorange">
                        Department 03
                      </span>
                      <h3 className="font-serif text-xl font-bold text-forest">
                        UTTARKUNTH PRODUCTIONS
                      </h3>
                    </div>
                  </div>
                  <Link
                    href="/admin/productions"
                    className="px-3.5 py-2 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Productions Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {productionsMetrics.pendingFilmmakers}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Creator Profiles</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {productionsMetrics.pendingProposals}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Pending Proposals</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {productionsMetrics.totalProposals}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Total Slates</div>
                  </div>
                </div>

                <p className="text-xs text-charcoal-muted">
                  Review filmmaker credentials, documentary proposals, regional storytelling projects, and takedown requests.
                </p>
              </div>
            )}

            {/* 4. UTTARKUNTH COMMUNITY DESK */}
            {canAccessCommunity && (
              <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ukorange">
                        Department 04
                      </span>
                      <h3 className="font-serif text-xl font-bold text-forest">
                        UTTARKUNTH COMMUNITY
                      </h3>
                    </div>
                  </div>
                  <Link
                    href="/admin/community"
                    className="px-3.5 py-2 bg-forest text-white text-xs font-semibold rounded-xl hover:bg-forest-light transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Community Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {communityMetrics.pendingStories}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Pending Stories</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {communityMetrics.pendingParticipations}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Fellowships</div>
                  </div>
                  <div className="p-3 bg-ivory-warm rounded-2xl">
                    <div className="font-serif text-2xl font-bold text-forest">
                      {communityMetrics.totalStories + communityMetrics.totalParticipations}
                    </div>
                    <div className="text-[11px] text-charcoal-muted">Total Records</div>
                  </div>
                </div>

                <p className="text-xs text-charcoal-muted">
                  Moderate community stories, evaluate fellowship &amp; volunteer applications, and coordinate regional preservation initiatives.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications & Internal Support */}
        <div
          id="notifications"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-forest">
              <CheckCircle2 className="w-4 h-4 text-ukorange" />
              <h3 className="font-serif text-lg font-bold">
                Department Security &amp; Audit Compliance
              </h3>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Every approval, rejection, request for changes, and private document view performed under <code className="font-mono">{staffProfile.staff_id}</code> is recorded in the immutable Staff Audit Log. Staff members cannot modify their own role, permissions, or department.
            </p>
          </div>

          <div
            id="support"
            className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-3"
          >
            <div className="flex items-center gap-2 text-forest">
              <HelpCircle className="w-4 h-4 text-ukorange" />
              <h3 className="font-serif text-lg font-bold">
                Internal Escalation &amp; Founder Office Support
              </h3>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Shared functions (HR, Finance, Legal &amp; Compliance, Technology, and Commercial Agreements) are centrally managed by the Founder Office. Contact the Founder Office for role delegations or high-risk dual-approval requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
