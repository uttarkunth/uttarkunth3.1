import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { StaffGovernanceClient } from '@/components/admin/staff-governance-client';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminStaffGovernancePage() {
  const auth = await requireStaffPermission('staff.invite', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('staff.hire_approve', { requireMfaAal2: false })
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
            Staff Registry and HR Governance requires explicit &apos;staff.invite&apos; or &apos;staff.hire_approve&apos; authority.
          </p>
        </div>
      </div>
    );
  }

  const user = finalAuth.user;
  const adminClient = createAdminClient();
  let initialStaffProfiles: any[] = [];
  let initialInvitations: any[] = [];
  let initialDualApprovals: any[] = [];

  try {
    const { data: sp } = await (adminClient.from('staff_profiles' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    initialStaffProfiles = sp || [];
  } catch {
    initialStaffProfiles = [];
  }

  try {
    const { data: inv } = await (adminClient.from('staff_invitations' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    initialInvitations = inv || [];
  } catch {
    initialInvitations = [];
  }

  try {
    const { data: da } = await (adminClient.from('staff_dual_approvals' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    initialDualApprovals = da || [];
  } catch {
    initialDualApprovals = [];
  }

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
            Founder &amp; Internal Governance
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Staff Portal, Invitations, RBAC &amp; Dual Authorisation
          </h1>
          <p className="text-sm text-charcoal-muted mt-1 max-w-3xl">
            Manage the separate Uttarkunth staff identity lifecycle: issue single-use onboarding invitations, review staff applications and 8 mandatory agreements, assign granular departmental permissions, and execute immediate suspension or termination with full employment history preservation.
          </p>
        </div>

        <StaffGovernanceClient
          currentUserId={user.id}
          currentUserEmail={user.email || ''}
          initialStaffProfiles={initialStaffProfiles}
          initialInvitations={initialInvitations}
          initialDualApprovals={initialDualApprovals}
        />
      </div>
    </div>
  );
}
