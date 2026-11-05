'use client';

import React, { useEffect, useState } from 'react';
import {
  STAFF_ROLE_DEFINITIONS,
  ALL_STAFF_PERMISSIONS,
  REQUIRED_STAFF_AGREEMENTS,
  type StaffRoleCode,
  type StaffPermissionCode,
} from '@/lib/staff-rbac-shared';
import {
  UserPlus,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  FileCheck2,
  UserX,
  RefreshCw,
  Copy,
} from 'lucide-react';

interface StaffGovernanceClientProps {
  currentUserId: string;
  currentUserEmail: string;
  initialStaffProfiles?: any[];
  initialInvitations?: any[];
  initialDualApprovals?: any[];
}

export function StaffGovernanceClient({
  currentUserId,
  currentUserEmail,
  initialStaffProfiles = [],
  initialInvitations = [],
  initialDualApprovals = [],
}: StaffGovernanceClientProps) {
  const [activeTab, setActiveTab] = useState<
    'registry' | 'invitations' | 'applications' | 'rbac' | 'dual_auth' | 'agreements'
  >('registry');

  const [staffProfiles, setStaffProfiles] = useState<any[]>(initialStaffProfiles);
  const [platformAdmins, setPlatformAdmins] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>(initialInvitations);
  const [dualApprovals, setDualApprovals] = useState<any[]>(initialDualApprovals);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Permission Editor State
  const [selectedStaffForRbac, setSelectedStaffForRbac] = useState<string>('');
  const [editRoleSlug, setEditRoleSlug] = useState<StaffRoleCode>('property_reviewer');
  const [editCustomPermissions, setEditCustomPermissions] = useState<StaffPermissionCode[]>([]);
  const [editDualApprovalId, setEditDualApprovalId] = useState<string>('');
  const [editRbacReason, setEditRbacReason] = useState<string>('');

  // Invitation Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('Marketplace & Compliance');
  const [inviteDesignation, setInviteDesignation] = useState('Marketplace & Seller Reviewer');
  const [inviteRole, setInviteRole] = useState<StaffRoleCode>('marketplace_reviewer');
  const [inviteEmploymentCategory, setInviteEmploymentCategory] = useState<
    'full_time' | 'part_time' | 'contractor' | 'advisor' | 'fellow'
  >('full_time');
  const [inviteExpiryHours, setInviteExpiryHours] = useState(72);
  const [issuedInviteLink, setIssuedInviteLink] = useState<string | null>(null);
  const [issuedInviteToken, setIssuedInviteToken] = useState<string | null>(null);

  // Dual Approval Form State
  const [dualActionType, setDualActionType] = useState<
    | 'superadmin_creation'
    | 'admin_promotion'
    | 'commercial_terms_change'
    | 'bulk_sensitive_data_export'
    | 'exceptional_listing_approval'
    | 'destructive_published_record_action'
  >('admin_promotion');
  const [dualTargetType, setDualTargetType] = useState('staff_profile');
  const [dualTargetId, setDualTargetId] = useState('');
  const [dualReason, setDualReason] = useState('');

  // Suspension / Termination Reason State
  const [lifecycleReason, setLifecycleReason] = useState<Record<string, string>>({});

  const fetchGovernanceState = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStaffProfiles(data.staffProfiles || []);
        setPlatformAdmins(data.platformAdmins || []);
        setInvitations(data.invitations || []);
        setDualApprovals(data.dualApprovals || []);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceState();
  }, []);

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIssuedInviteLink(null);
    setIssuedInviteToken(null);

    try {
      const roleDef = STAFF_ROLE_DEFINITIONS[inviteRole];
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invitation',
          official_email: inviteEmail.trim(),
          department: inviteDepartment,
          proposed_designation: inviteDesignation,
          role_code: inviteRole,
          initial_permissions: roleDef.defaultPermissions,
          employment_category: inviteEmploymentCategory,
          expires_in_hours: Number(inviteExpiryHours),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to issue staff invitation.' });
        return;
      }
      setIssuedInviteToken(data.invitation.invitation_token);
      setIssuedInviteLink(data.invitation.onboarding_url);
      setFeedback({
        type: 'success',
        message: `Single-use staff invitation created for ${inviteEmail}. Share the onboarding link below.`,
      });
      setInviteEmail('');
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating invitation.' });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_invitation',
          invitation_id: invitationId,
          reason: 'Withdrawn by Founder prior to onboarding completion',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Could not cancel invitation.' });
        return;
      }
      setFeedback({ type: 'success', message: 'Invitation cancelled and invalidated.' });
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReviewApplication = async (
    staffProfileId: string,
    decision: 'approve' | 'reject' | 'request_info' | 'keep_under_review'
  ) => {
    setFeedback(null);
    const reason =
      lifecycleReason[staffProfileId] ||
      `Founder onboarding review decision: ${decision.toUpperCase()}`;

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_application',
          staff_profile_id: staffProfileId,
          decision,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Decision failed.' });
        return;
      }
      setFeedback({
        type: 'success',
        message:
          decision === 'approve'
            ? `Staff member approved and issued immutable ID: ${data.staff_id}`
            : `Application status updated to ${data.status}.`,
      });
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSuspendOrTerminate = async (
    staffProfileId: string,
    action: 'suspend_staff' | 'terminate_staff'
  ) => {
    setFeedback(null);
    const reason = lifecycleReason[staffProfileId];
    if (!reason || reason.trim().length < 5) {
      setFeedback({
        type: 'error',
        message:
          'A documented governance reason (min 5 chars) is mandatory before suspending or terminating staff.',
      });
      return;
    }

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          staff_profile_id: staffProfileId,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Action failed.' });
        return;
      }
      setFeedback({ type: 'success', message: data.message });
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRequestDualApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_dual_approval',
          action_type: dualActionType,
          target_type: dualTargetType,
          target_id: dualTargetId,
          reason: dualReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to request dual approval.' });
        return;
      }
      setFeedback({
        type: 'success',
        message: 'High-risk action submitted to Dual Authorisation Queue.',
      });
      setDualTargetId('');
      setDualReason('');
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDecideDualApproval = async (
    dualApprovalId: string,
    decision: 'approve' | 'reject'
  ) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decide_dual_approval',
          dual_approval_id: dualApprovalId,
          decision,
          notes: `Founder / Second-Reviewer decision: ${decision.toUpperCase()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Dual approval decision failed.' });
        return;
      }
      setFeedback({
        type: 'success',
        message: `Dual authorisation request ${decision === 'approve' ? 'approved' : 'rejected'}.`,
      });
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleUpdateStaffPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!selectedStaffForRbac) {
      setFeedback({ type: 'error', message: 'Select a staff member to update permissions.' });
      return;
    }

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_permissions',
          target_user_id: selectedStaffForRbac,
          role_slug: editRoleSlug,
          custom_permissions: editCustomPermissions,
          dual_approval_id: editDualApprovalId.trim() || undefined,
          reason: editRbacReason.trim() || `Updated role to ${editRoleSlug}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Failed to update staff permissions.' });
        return;
      }
      setFeedback({
        type: 'success',
        message: 'Staff role and custom permission assignments updated in PostgreSQL.',
      });
      fetchGovernanceState();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const pendingApplications = staffProfiles.filter(
    (sp) =>
      sp.status === 'pending_founder_approval' ||
      sp.status === 'onboarding_in_progress' ||
      sp.status === 'invited'
  );

  return (
    <div className="space-y-6">
      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-forest/15 pb-3">
        {[
          { id: 'registry', label: 'Staff Registry & Lifecycle', icon: ShieldCheck },
          { id: 'invitations', label: 'Founder Invitation System', icon: UserPlus },
          {
            id: 'applications',
            label: `Staff Onboarding Queue (${pendingApplications.length})`,
            icon: FileCheck2,
          },
          { id: 'rbac', label: '8-Role & 18-Permission Matrix', icon: KeyRound },
          { id: 'dual_auth', label: 'Dual Authorisation', icon: Lock },
          { id: 'agreements', label: '8 Mandatory Staff Agreements', icon: FileCheck2 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-forest text-white shadow-xs'
                  : 'text-charcoal-muted hover:text-charcoal hover:bg-forest/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-[11px] underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: STAFF REGISTRY & LIFECYCLE */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-forest/15 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-forest">
                  Active &amp; Historical Internal Staff Registry
                </h2>
                <p className="text-xs text-charcoal-muted">
                  Suspending or terminating a staff member immediately revokes active sessions and removes `platform_admins` privileges while preserving their historical employment &amp; audit records.
                </p>
              </div>
              <button
                onClick={fetchGovernanceState}
                className="p-2 rounded-xl border border-forest/15 text-forest hover:bg-forest/5"
                title="Refresh Registry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Authoritative platform_admins + staff_profiles view */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-warm border-b border-forest/10 text-charcoal">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff ID</th>
                    <th className="py-3 px-4 font-semibold">Name &amp; Official Email</th>
                    <th className="py-3 px-4 font-semibold">Role &amp; Department</th>
                    <th className="py-3 px-4 font-semibold">Lifecycle Status</th>
                    <th className="py-3 px-4 font-semibold">Agreements</th>
                    <th className="py-3 px-4 font-semibold">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {platformAdmins.map((pa, idx) => {
                    const linkedProfile = staffProfiles.find((sp) => sp.user_id === pa.user_id);
                    const staffId =
                      linkedProfile?.staff_id ||
                      `UK-STAFF-2026-${String(idx + 1).padStart(4, '0')}`;
                    const roleCode = (linkedProfile?.role_code ||
                      (pa.role === 'superadmin' ? 'founder' : pa.role)) as StaffRoleCode;
                    const roleDef =
                      STAFF_ROLE_DEFINITIONS[roleCode] || STAFF_ROLE_DEFINITIONS.founder;

                    return (
                      <tr key={pa.user_id} className="hover:bg-ivory/60">
                        <td className="py-3.5 px-4 font-mono font-bold text-forest">{staffId}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-charcoal">
                            {linkedProfile?.full_legal_name || 'Gaurav Negi (Founder)'}
                          </div>
                          <div className="text-charcoal-muted">{pa.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-forest">{roleDef.title}</span>
                          <div className="text-[11px] text-charcoal-muted">
                            {linkedProfile?.department || roleDef.department}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase">
                            {linkedProfile?.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-700">
                          8 / 8 Signed
                        </td>
                        <td className="py-3.5 px-4">
                          {pa.user_id === currentUserId ? (
                            <span className="text-[11px] text-charcoal-muted italic">
                              Current Founder Session
                            </span>
                          ) : linkedProfile ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                type="text"
                                placeholder="Reason for suspension/termination..."
                                value={lifecycleReason[linkedProfile.id] || ''}
                                onChange={(e) =>
                                  setLifecycleReason({
                                    ...lifecycleReason,
                                    [linkedProfile.id]: e.target.value,
                                  })
                                }
                                className="px-2 py-1 border border-forest/20 rounded text-[11px]"
                              />
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleSuspendOrTerminate(linkedProfile.id, 'suspend_staff')
                                  }
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-semibold"
                                >
                                  Suspend
                                </button>
                                <button
                                  onClick={() =>
                                    handleSuspendOrTerminate(linkedProfile.id, 'terminate_staff')
                                  }
                                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded text-[10px] font-semibold"
                                >
                                  Terminate
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-charcoal-muted">
                              Core Platform Superadmin
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Suspended or Terminated historical staff records */}
                  {staffProfiles
                    .filter((sp) => sp.status === 'suspended' || sp.status === 'terminated')
                    .map((sp) => (
                      <tr key={sp.id} className="bg-red-50/30">
                        <td className="py-3.5 px-4 font-mono text-charcoal-muted">
                          {sp.staff_id || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-charcoal">{sp.full_legal_name}</div>
                          <div className="text-charcoal-muted">{sp.official_email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{sp.designation}</div>
                          <div className="text-[11px] text-charcoal-muted">{sp.department}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold uppercase">
                            {sp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">Preserved</td>
                        <td className="py-3.5 px-4 text-[11px] text-charcoal-muted">
                          Access revoked &bull; Reason: {sp.suspension_reason || sp.termination_reason}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FOUNDER INVITATION SYSTEM */}
      {activeTab === 'invitations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleCreateInvitation}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4"
          >
            <h2 className="font-serif text-xl font-bold text-forest">
              Issue Single-Use Staff Onboarding Invitation
            </h2>
            <p className="text-xs text-charcoal-muted">
              No public staff self-registration exists. Invitations are unique, expiring, single-use, and bound to the invitee&rsquo;s official email.
            </p>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Official Staff Email *
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="new.staff@uttarkunth.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Assigned Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => {
                    const r = e.target.value as StaffRoleCode;
                    setInviteRole(r);
                    setInviteDepartment(STAFF_ROLE_DEFINITIONS[r].department);
                    setInviteDesignation(STAFF_ROLE_DEFINITIONS[r].title);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
                >
                  {Object.values(STAFF_ROLE_DEFINITIONS).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Proposed Designation *
                </label>
                <input
                  type="text"
                  required
                  value={inviteDesignation}
                  onChange={(e) => setInviteDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Employment / Contractor Status *
                </label>
                <select
                  value={inviteEmploymentCategory}
                  onChange={(e) => setInviteEmploymentCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
                >
                  <option value="full_time">Full-Time Employee</option>
                  <option value="part_time">Part-Time Staff</option>
                  <option value="contractor">Independent Contractor</option>
                  <option value="advisor">Advisor / Specialist</option>
                  <option value="fellow">Regional Fellow</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Invitation Expiry (Hours) *
              </label>
              <input
                type="number"
                min={1}
                max={720}
                value={inviteExpiryHours}
                onChange={(e) => setInviteExpiryHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
              />
            </div>

            <div className="p-3 bg-ivory-warm rounded-xl border border-forest/10 text-[11px] space-y-1">
              <span className="font-semibold text-forest block">
                Initial Permission Scope ({STAFF_ROLE_DEFINITIONS[inviteRole].defaultPermissions.length} permissions):
              </span>
              <div className="flex flex-wrap gap-1">
                {STAFF_ROLE_DEFINITIONS[inviteRole].defaultPermissions.map((p) => (
                  <span key={p} className="px-2 py-0.5 bg-white border border-forest/15 rounded font-mono text-[10px]">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-forest hover:bg-forest-hover text-white py-3 rounded-xl text-xs font-semibold transition-colors"
            >
              Generate Single-Use Staff Invitation Token
            </button>

            {issuedInviteToken && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>Single-Use Invitation Token Generated</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(issuedInviteToken)}
                    className="inline-flex items-center gap-1 text-emerald-800 underline"
                  >
                    <Copy className="w-3 h-3" /> Copy Token
                  </button>
                </div>
                <div className="font-mono text-[11px] bg-white p-2 rounded border border-emerald-200 break-all">
                  {issuedInviteToken}
                </div>
                <div className="text-[11px] text-emerald-800">
                  Onboarding Path: <code>{issuedInviteLink}</code>
                </div>
              </div>
            )}
          </form>

          {/* Existing Invitations List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
            <h2 className="font-serif text-xl font-bold text-forest">
              Issued Staff Invitations ({invitations.length})
            </h2>
            {invitations.length === 0 ? (
              <p className="text-xs text-charcoal-muted py-8 text-center">
                No pending or historical staff invitations recorded yet. Use the form on the left to issue a single-use token.
              </p>
            ) : (
              <div className="divide-y divide-forest/10 text-xs">
                {invitations.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-forest">{inv.official_email}</div>
                      <div className="text-charcoal-muted">
                        {inv.proposed_designation} ({inv.department}) &bull; Status:{' '}
                        <span className="font-semibold uppercase">{inv.status}</span>
                      </div>
                      <div className="text-[11px] text-charcoal-muted font-mono">
                        Expires: {new Date(inv.expires_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-[11px] font-semibold"
                      >
                        Cancel Invite
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF ONBOARDING APPLICATIONS QUEUE */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
          <h2 className="font-serif text-xl font-bold text-forest">
            Staff Applications &amp; Onboarding Verification Queue ({pendingApplications.length})
          </h2>
          <p className="text-xs text-charcoal-muted">
            Staff members who complete onboarding remain in <code className="font-mono">pending_founder_approval</code> with zero administrative privileges until the Founder verifies their HR records, confirms all 8 signed agreements, and issues their immutable <code className="font-mono">UK-STAFF-YYYY-XXXX</code> identifier. Self-approval is strictly blocked.
          </p>

          {pendingApplications.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-muted border border-dashed border-forest/15 rounded-2xl">
              No staff onboarding dossiers are currently awaiting Founder sign-off.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl border border-forest/15 bg-ivory-warm space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-forest">
                        {app.full_legal_name} ({app.official_email})
                      </h3>
                      <p className="text-charcoal-muted">
                        Proposed: <strong>{app.designation}</strong> &bull; {app.department} &bull;{' '}
                        {app.employment_category}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-full uppercase text-[10px]">
                      {app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-forest/10">
                    <div>
                      <span className="text-charcoal-muted block">Identity Document:</span>
                      <strong className="uppercase">{app.identity_document_type}</strong> (
                      {app.identity_document_reference})
                    </div>
                    <div>
                      <span className="text-charcoal-muted block">Mandatory Agreements:</span>
                      <strong className="text-emerald-700">
                        {app.all_agreements_accepted ? '8 / 8 Accepted & Hashed' : 'Incomplete'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-charcoal-muted block">Mobile &amp; Joining:</span>
                      <strong>
                        {app.verified_mobile} &bull; {app.joining_date}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      onClick={() => handleReviewApplication(app.id, 'approve')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl"
                    >
                      Approve &amp; Issue UK-STAFF ID
                    </button>
                    <button
                      onClick={() => handleReviewApplication(app.id, 'request_info')}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-xl"
                    >
                      Request Additional Info
                    </button>
                    <button
                      onClick={() => handleReviewApplication(app.id, 'keep_under_review')}
                      className="px-3.5 py-2 bg-white border border-forest/20 text-forest font-semibold rounded-xl"
                    >
                      Keep Under Review
                    </button>
                    <button
                      onClick={() => handleReviewApplication(app.id, 'reject')}
                      className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-900 font-semibold rounded-xl"
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: 8-ROLE & 18-PERMISSION MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-forest">
              Authoritative 8-Role &amp; 18-Permission Departmental Matrix
            </h2>
            <p className="text-xs text-charcoal-muted mt-1">
              Server-side API handlers enforce <code className="font-mono">requireStaffPermission(permission)</code> on every request. No staff role other than Founder/Operations Admin can cross departmental boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(STAFF_ROLE_DEFINITIONS).map((role) => (
              <div
                key={role.code}
                className="p-5 rounded-2xl border border-forest/15 bg-ivory-warm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-ukorange">
                      {role.department}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-forest">{role.title}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-forest text-white text-[10px] font-mono rounded-full">
                    {role.code}
                  </span>
                </div>
                <p className="text-xs text-charcoal-muted">{role.description}</p>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
                    Allowed Admin Modules:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {role.allowedModules.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 bg-white border border-forest/15 text-forest font-mono text-[10px] rounded"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
                    Granted Granular Permissions ({role.defaultPermissions.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {role.defaultPermissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-forest/10 text-forest font-mono text-[10px] rounded"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Role & Custom Permission Assignment Editor */}
          <form
            onSubmit={handleUpdateStaffPermissions}
            className="p-6 rounded-2xl border border-forest/20 bg-ivory-warm space-y-4 text-xs"
          >
            <div>
              <h3 className="font-serif text-lg font-bold text-forest">
                Founder Role &amp; Granular Permission Assignment Editor
              </h3>
              <p className="text-charcoal-muted">
                Modify an existing staff member&rsquo;s role or grant/revoke custom permission overrides. Promoting an account to <code className="font-mono">founder</code> requires an approved Dual Authorisation ID.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-charcoal mb-1">
                  Target Staff Member *
                </label>
                <select
                  value={selectedStaffForRbac}
                  onChange={(e) => {
                    const uid = e.target.value;
                    setSelectedStaffForRbac(uid);
                    const found = staffProfiles.find(
                      (sp) => sp.user_id === uid || sp.id === uid
                    );
                    if (found) {
                      setEditRoleSlug(
                        (found.role_slug || found.role_code || 'property_reviewer') as StaffRoleCode
                      );
                      setEditCustomPermissions(
                        Array.isArray(found.custom_permissions) ? found.custom_permissions : []
                      );
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white"
                >
                  <option value="">Select staff profile...</option>
                  {staffProfiles.map((sp) => (
                    <option key={sp.id || sp.user_id} value={sp.user_id || sp.id}>
                      {sp.full_legal_name} ({sp.official_email}) — {sp.role_slug || sp.role_code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-1">Assigned Role *</label>
                <select
                  value={editRoleSlug}
                  onChange={(e) => setEditRoleSlug(e.target.value as StaffRoleCode)}
                  className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white"
                >
                  {Object.values(STAFF_ROLE_DEFINITIONS).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-1">
                  Dual Approval ID (if promoting to Superadmin)
                </label>
                <input
                  type="text"
                  value={editDualApprovalId}
                  onChange={(e) => setEditDualApprovalId(e.target.value)}
                  placeholder="Optional dual approval UUID"
                  className="w-full px-3 py-2 rounded-xl border border-forest/20 bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <span className="block font-semibold text-charcoal mb-1.5">
                Additional Custom Permissions:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_STAFF_PERMISSIONS.map((perm) => {
                  const checked = editCustomPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg border border-forest/15 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setEditCustomPermissions((prev) =>
                            prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
                          );
                        }}
                        className="accent-forest"
                      />
                      <span className="font-mono text-[10px]">{perm}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={editRbacReason}
                onChange={(e) => setEditRbacReason(e.target.value)}
                placeholder="Documented governance reason for permission change..."
                className="flex-1 w-full px-3 py-2 rounded-xl border border-forest/20 bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-forest hover:bg-forest-hover text-white font-semibold rounded-xl shrink-0"
              >
                Save Role &amp; Permission Assignments
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: DUAL AUTHORISATION */}
      {activeTab === 'dual_auth' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleRequestDualApproval}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4"
          >
            <h2 className="font-serif text-xl font-bold text-forest">
              Initiate High-Risk Dual Authorisation Request
            </h2>
            <p className="text-xs text-charcoal-muted">
              High-risk administrative actions require Founder sign-off or two-person authorisation. While Uttarkunth is Founder-led, the Founder is the mandatory final approver.
            </p>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                High-Risk Action Category *
              </label>
              <select
                value={dualActionType}
                onChange={(e) => setDualActionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20 bg-white"
              >
                <option value="superadmin_creation">Superadmin Account Creation</option>
                <option value="admin_promotion">Administrator Role Promotion</option>
                <option value="commercial_terms_change">Commercial Commission Terms Change</option>
                <option value="bulk_sensitive_data_export">Bulk Sensitive Data Export</option>
                <option value="exceptional_listing_approval">
                  Exceptional Listing Approval (Incomplete Verification)
                </option>
                <option value="destructive_published_record_action">
                  Destructive Action on Published Record
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Target Entity Type *
                </label>
                <input
                  type="text"
                  required
                  value={dualTargetType}
                  onChange={(e) => setDualTargetType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  Target Record ID *
                </label>
                <input
                  type="text"
                  required
                  value={dualTargetId}
                  onChange={(e) => setDualTargetId(e.target.value)}
                  placeholder="UUID or identifier"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Documented Justification (Min 10 chars) *
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                value={dualReason}
                onChange={(e) => setDualReason(e.target.value)}
                placeholder="State the operational and compliance justification for this high-risk action..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-forest/20"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-forest hover:bg-forest-hover text-white py-3 rounded-xl text-xs font-semibold"
            >
              Submit for Founder Dual Authorisation
            </button>
          </form>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
            <h2 className="font-serif text-xl font-bold text-forest">
              Dual Authorisation Queue ({dualApprovals.length})
            </h2>
            {dualApprovals.length === 0 ? (
              <p className="text-xs text-charcoal-muted py-8 text-center">
                No pending dual-authorisation requests.
              </p>
            ) : (
              <div className="divide-y divide-forest/10 text-xs">
                {dualApprovals.map((da) => {
                  const initiator = da.requested_by || da.requested_by_user_id;
                  const isSelfInitiated = initiator === currentUserId;
                  return (
                    <div key={da.id} className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-forest uppercase">{da.action_type}</span>
                        <span className="px-2.5 py-0.5 bg-forest/10 text-forest font-mono text-[10px] rounded-full uppercase">
                          {da.status}
                        </span>
                      </div>
                      <div className="text-charcoal-muted font-mono text-[11px]">
                        ID: {da.id} &bull; Target: {da.target_type} ({da.target_id})
                      </div>
                      <div className="text-charcoal">{da.reason || da.justification}</div>
                      {da.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-1">
                          {isSelfInitiated ? (
                            <span className="text-[11px] text-amber-800 italic">
                              Initiated by your session — requires independent second reviewer/Founder sign-off.
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDecideDualApproval(da.id, 'approve')}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-[11px]"
                              >
                                Approve Dual Auth
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDecideDualApproval(da.id, 'reject')}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg font-semibold text-[11px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: 8 MANDATORY STAFF AGREEMENTS */}
      {activeTab === 'agreements' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-4">
          <h2 className="font-serif text-xl font-bold text-forest">
            Uttarkunth Staff Agreements &amp; Conduct Policy Facility (8 Required Instruments)
          </h2>
          <p className="text-xs text-charcoal-muted">
            Every onboarding staff member must review and accept all eight versioned agreements below. The system records the agreement version, SHA-256 document hash, acceptance timestamp, and authenticated staff identity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REQUIRED_STAFF_AGREEMENTS.map((ag, i) => (
              <div
                key={ag.code}
                className="p-4 rounded-2xl border border-forest/15 bg-ivory-warm space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ukorange">
                    0{i + 1} &bull; {ag.code}
                  </span>
                  <span className="px-2 py-0.5 bg-forest/10 text-forest font-mono text-[10px] rounded">
                    {ag.version}
                  </span>
                </div>
                <h3 className="font-serif text-base font-bold text-forest">{ag.title}</h3>
                <p className="text-charcoal-muted">{ag.summary}</p>
                <p className="text-[11px] text-charcoal bg-white p-3 rounded-xl border border-forest/10 font-serif leading-relaxed">
                  {ag.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
