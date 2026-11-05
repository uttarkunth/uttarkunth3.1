import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  requireStaffPermission,
  recordStaffAuditLog,
  formatImmutableStaffId,
  verifyAllStaffAgreementsCompleted,
  STAFF_ROLE_DEFINITIONS,
  REQUIRED_STAFF_AGREEMENTS,
  type StaffRoleSlug,
  type StaffPermission,
  type HighRiskActionType,
} from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/staff
 * Returns staff profiles, invitations, pending onboarding applications, agreement acceptances,
 * and dual-authorisation requests strictly from PostgreSQL.
 */
export async function GET() {
  const auth = await requireStaffPermission('staff.invite', { requireMfaAal2: true });
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      { ok: false, code: auth.code, error: auth.error },
      { status: auth.status }
    );
  }

  const adminClient = createAdminClient();

  let staffProfiles: any[] = [];
  let invitations: any[] = [];
  let acceptances: any[] = [];
  let dualApprovals: any[] = [];
  let platformAdmins: any[] = [];
  let migrationPending = false;

  try {
    const { data: pa } = await (adminClient.from('platform_admins') as any)
      .select('*')
      .order('created_at', { ascending: true });
    platformAdmins = pa || [];
  } catch {
    platformAdmins = [];
  }

  try {
    const { data: sp, error: spErr } = await (adminClient.from('staff_profiles' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (spErr) {
      migrationPending = true;
    } else {
      staffProfiles = sp || [];
    }
  } catch {
    migrationPending = true;
    staffProfiles = [];
  }

  try {
    const { data: inv } = await (adminClient.from('staff_invitations' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    invitations = inv || [];
  } catch {
    invitations = [];
  }

  try {
    const { data: acc } = await (adminClient.from('staff_agreement_acceptances' as any) as any)
      .select('*')
      .order('accepted_at', { ascending: false });
    acceptances = acc || [];
  } catch {
    acceptances = [];
  }

  try {
    const { data: da } = await (adminClient.from('staff_dual_approvals' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });
    dualApprovals = da || [];
  } catch {
    dualApprovals = [];
  }

  return NextResponse.json({
    ok: true,
    migrationPending,
    platformAdmins,
    staffProfiles,
    invitations,
    acceptances,
    dualApprovals,
    rolesCatalog: Object.values(STAFF_ROLE_DEFINITIONS),
    agreementsCatalog: REQUIRED_STAFF_AGREEMENTS,
  });
}

/**
 * POST /api/admin/staff
 * Handles Founder staff governance actions with mandatory AAL2 MFA enforcement
 * and strict database persistence (never faking writes in memory):
 * - invite_staff / create_invitation
 * - cancel_invitation
 * - review_onboarding / review_application
 * - update_permissions
 * - suspend_staff
 * - terminate_staff
 * - request_dual_approval / decide_dual_approval
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body || {};

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'Missing staff governance action.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // ------------------------------------------------------------------------
    // 1. INVITE NEW STAFF MEMBER (Founder-controlled single-use invitation)
    // ------------------------------------------------------------------------
    if (action === 'invite_staff' || action === 'create_invitation') {
      const auth = await requireStaffPermission('staff.invite', { requireMfaAal2: true });
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const officialEmail = String(body.official_email || '').trim().toLowerCase();
      if (!officialEmail || !officialEmail.includes('@')) {
        return NextResponse.json(
          { ok: false, error: 'A valid official work email address is required.' },
          { status: 400 }
        );
      }

      const roleSlug = (body.role_slug || body.role_code || 'marketplace_reviewer') as StaffRoleSlug;
      const roleDef = STAFF_ROLE_DEFINITIONS[roleSlug] || STAFF_ROLE_DEFINITIONS.marketplace_reviewer;
      const department = String(body.department || roleDef.department || 'operations').trim();
      const designation = String(
        body.designation || body.proposed_designation || roleDef.title
      ).trim();
      const employmentCategory = String(body.employment_category || 'full_time').trim();
      const expiryHours = Math.max(
        1,
        Math.min(720, Number(body.expiry_hours || body.expires_in_hours || 72))
      );

      const initialPermissions = Array.isArray(body.initial_permissions)
        ? body.initial_permissions
        : roleDef.permissions;
      const mergedPermissions = Array.from(
        new Set([...(roleDef?.permissions || []), ...(initialPermissions as StaffPermission[])])
      );

      const rawToken = `uk_inv_${crypto.randomBytes(24).toString('hex')}`;
      const tokenHash = crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
      const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
      const onboardingUrl = `/staff/onboard?token=${rawToken}`;

      const { data: created, error: invErr } = await (
        adminClient.from('staff_invitations' as any) as any
      )
        .insert({
          token_hash: tokenHash,
          official_email: officialEmail,
          department,
          designation,
          proposed_designation: designation,
          role_slug: roleSlug,
          role_code: roleSlug,
          initial_permissions: mergedPermissions,
          employment_category: employmentCategory,
          invited_by_user_id: auth.user.id,
          invited_by: auth.user.id,
          expires_at: expiresAt,
          status: 'pending',
        })
        .select()
        .single();

      if (invErr || !created) {
        return NextResponse.json(
          {
            ok: false,
            code: 'DATABASE_PERSISTENCE_FAILED',
            error:
              invErr?.message ||
              'Failed to persist staff invitation in PostgreSQL. Verify that the Phase 2 staff governance migration has been applied.',
          },
          { status: 503 }
        );
      }

      const invitationRecord = {
        ...created,
        invitation_token: rawToken,
        onboarding_url: onboardingUrl,
      };

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: 'staff_invitation_created',
        targetType: 'staff_invitation',
        targetId: created.id,
        reason: `Invited ${officialEmail} as ${designation} (${roleSlug})`,
        afterState: {
          official_email: officialEmail,
          department,
          designation,
          role_slug: roleSlug,
          employment_category: employmentCategory,
          expires_at: expiresAt,
        },
      });

      return NextResponse.json({
        ok: true,
        invitation: invitationRecord,
        singleUseOnboardingUrl: onboardingUrl,
        message: `Single-use invitation generated for ${officialEmail} (expires in ${expiryHours}h).`,
      });
    }

    // ------------------------------------------------------------------------
    // 2. CANCEL / WITHDRAW UNUSED INVITATION
    // ------------------------------------------------------------------------
    if (action === 'cancel_invitation') {
      const auth = await requireStaffPermission('staff.invite', { requireMfaAal2: true });
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const { invitation_id, reason } = body;
      if (!invitation_id) {
        return NextResponse.json({ ok: false, error: 'Missing invitation_id.' }, { status: 400 });
      }

      const { data: updated, error: cancelErr } = await (
        adminClient.from('staff_invitations' as any) as any
      )
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', invitation_id)
        .is('used_at', null)
        .select()
        .maybeSingle();

      if (cancelErr || !updated) {
        return NextResponse.json(
          {
            ok: false,
            error: cancelErr?.message || 'Invitation not found or already consumed.',
          },
          { status: 400 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: 'staff_invitation_cancelled',
        targetType: 'staff_invitation',
        targetId: invitation_id,
        reason: reason || 'Cancelled unused staff invitation.',
      });

      return NextResponse.json({ ok: true, invitation: updated });
    }

    // ------------------------------------------------------------------------
    // 3. FOUNDER REVIEW OF STAFF ONBOARDING APPLICATION
    // ------------------------------------------------------------------------
    if (action === 'review_onboarding' || action === 'review_application') {
      const candidateIdentifier = body.candidate_user_id || body.staff_profile_id;
      const decision = body.decision;
      const notes = body.notes || body.reason;

      if (!candidateIdentifier || !decision) {
        return NextResponse.json(
          { ok: false, error: 'Missing candidate identifier or decision.' },
          { status: 400 }
        );
      }

      const auth = await requireStaffPermission('staff.hire_approve', {
        requireMfaAal2: true,
        targetCandidateUserId: candidateIdentifier,
      });
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const { data: candidate, error: candErr } = await (
        adminClient.from('staff_profiles' as any) as any
      )
        .select('*')
        .or(`user_id.eq.${candidateIdentifier},id.eq.${candidateIdentifier}`)
        .maybeSingle();

      if (candErr || !candidate) {
        return NextResponse.json(
          { ok: false, error: candErr?.message || 'Staff candidate record not found.' },
          { status: 404 }
        );
      }

      if (candidate.user_id === auth.user.id) {
        return NextResponse.json(
          {
            ok: false,
            code: 'SELF_APPROVAL_FORBIDDEN',
            error: 'Forbidden: No employee may approve their own staff onboarding.',
          },
          { status: 403 }
        );
      }

      if (decision === 'approve') {
        const agreementsFlag = Boolean(
          candidate.agreements_completed ?? candidate.all_agreements_accepted ?? false
        );

        const { data: acceptanceRows } = await (
          adminClient.from('staff_agreement_acceptances' as any) as any
        )
          .select('*')
          .or(`staff_user_id.eq.${candidate.user_id},user_id.eq.${candidate.user_id}`);

        const verifiedAcceptances = verifyAllStaffAgreementsCompleted(acceptanceRows || []);

        if (!agreementsFlag && !verifiedAcceptances.completed) {
          return NextResponse.json(
            {
              ok: false,
              error: `Cannot approve staff account: Candidate has not completed all 8 mandatory Uttarkunth agreements. Missing: ${verifiedAcceptances.missingAgreements.join(', ')}`,
            },
            { status: 400 }
          );
        }

        const { count: existingStaffCount } = await (
          adminClient.from('staff_profiles' as any) as any
        )
          .select('id', { count: 'exact', head: true })
          .not('staff_id', 'is', null);

        const nextSeq = (existingStaffCount || 1) + 1;
        const immutableStaffId =
          candidate.staff_id || formatImmutableStaffId(new Date().getFullYear(), nextSeq);
        const nowIso = new Date().toISOString();
        const roleSlug = (candidate.role_slug ||
          candidate.role_code ||
          'operations_admin') as StaffRoleSlug;

        const { data: updatedCandidate, error: updErr } = await (
          adminClient.from('staff_profiles' as any) as any
        )
          .update({
            staff_id: immutableStaffId,
            status: 'active',
            founder_approved_at: nowIso,
            founder_approved_by: auth.user.id,
            approved_by: auth.user.id,
            approved_at: nowIso,
            moderation_notes: notes || 'Approved by Founder.',
            updated_at: nowIso,
          })
          .eq('user_id', candidate.user_id)
          .select()
          .single();

        if (updErr || !updatedCandidate) {
          return NextResponse.json(
            { ok: false, error: updErr?.message || 'Failed to activate staff profile.' },
            { status: 500 }
          );
        }

        const { error: paErr } = await (adminClient.from('platform_admins') as any).upsert({
          user_id: candidate.user_id,
          email: candidate.official_email,
          role: roleSlug,
        });

        if (paErr) {
          return NextResponse.json(
            { ok: false, error: `Failed to register platform_admins entry: ${paErr.message}` },
            { status: 500 }
          );
        }

        // Seed default role permissions into staff_permission_assignments
        const roleDef = STAFF_ROLE_DEFINITIONS[roleSlug];
        if (roleDef && updatedCandidate.id) {
          for (const perm of roleDef.permissions) {
            const { error: permErr } = await (
              adminClient.from('staff_permission_assignments' as any) as any
            ).upsert(
              {
                staff_profile_id: updatedCandidate.id,
                user_id: candidate.user_id,
                permission_key: perm,
                permission_code: perm,
                granted_by: auth.user.id,
                revoked_at: null,
              },
              { onConflict: 'staff_profile_id,permission_key' }
            );
            if (permErr) {
              console.error('Failed to seed default staff permission assignment:', permErr);
            }
          }
        }

        await recordStaffAuditLog({
          actorUserId: auth.user.id,
          actorEmail: auth.user.email,
          staffId: auth.staffProfile?.staff_id,
          roleSlug: auth.staffProfile?.role_slug,
          action: 'staff_onboarding_approved',
          targetType: 'staff_profile',
          targetId: candidate.user_id,
          reason: notes || 'Founder approved staff onboarding.',
          beforeState: { status: candidate.status, staff_id: candidate.staff_id },
          afterState: {
            status: 'active',
            staff_id: immutableStaffId,
            role_slug: roleSlug,
            department: candidate.department,
          },
        });

        return NextResponse.json({
          ok: true,
          staff_id: immutableStaffId,
          status: 'active',
          profile: updatedCandidate,
          message: `Staff member approved and activated with immutable ID ${immutableStaffId}.`,
        });
      }

      const statusMap: Record<string, string> = {
        reject: 'rejected',
        request_info: 'info_requested',
        keep_under_review: 'under_review',
        withdraw_invitation: 'terminated',
      };
      const nextStatus = statusMap[decision];
      if (!nextStatus) {
        return NextResponse.json(
          { ok: false, error: 'Invalid onboarding review decision.' },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      const { data: updatedCandidate, error: updErr } = await (
        adminClient.from('staff_profiles' as any) as any
      )
        .update({
          status: nextStatus,
          moderation_notes: notes || null,
          updated_at: nowIso,
        })
        .eq('user_id', candidate.user_id)
        .select()
        .single();

      if (updErr || !updatedCandidate) {
        return NextResponse.json(
          { ok: false, error: updErr?.message || 'Failed to update candidate status.' },
          { status: 500 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: `staff_onboarding_${decision}`,
        targetType: 'staff_profile',
        targetId: candidate.user_id,
        reason: notes || null,
        beforeState: { status: candidate.status },
        afterState: { status: nextStatus },
      });

      return NextResponse.json({ ok: true, status: nextStatus, profile: updatedCandidate });
    }

    // ------------------------------------------------------------------------
    // 4. UPDATE STAFF ROLE / PERMISSIONS (Founder Permission Editor)
    // ------------------------------------------------------------------------
    if (action === 'update_permissions') {
      const targetId = body.target_user_id || body.staff_profile_id;
      const roleSlug = (body.role_slug || body.role_code) as StaffRoleSlug;
      const { custom_permissions, dual_approval_id, reason } = body;

      if (!targetId || !roleSlug || !(roleSlug in STAFF_ROLE_DEFINITIONS)) {
        return NextResponse.json(
          { ok: false, error: 'Missing or invalid target_user_id or role_slug.' },
          { status: 400 }
        );
      }

      const isSuperadminPromotion = roleSlug === 'founder';
      const auth = await requireStaffPermission('staff.permissions.manage', {
        requireMfaAal2: true,
        highRiskAction: isSuperadminPromotion ? 'superadmin_creation' : undefined,
        dualApprovalId: dual_approval_id,
      });

      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, error: auth.error, code: auth.code },
          { status: auth.status }
        );
      }

      const nowIso = new Date().toISOString();
      const normalizedCustomPerms: StaffPermission[] = Array.isArray(custom_permissions)
        ? custom_permissions
        : [];
      const newDept = STAFF_ROLE_DEFINITIONS[roleSlug].department;

      const { data: updatedProfile, error: updErr } = await (
        adminClient.from('staff_profiles' as any) as any
      )
        .update({
          role_slug: roleSlug,
          role_code: roleSlug,
          department: newDept,
          custom_permissions: normalizedCustomPerms,
          updated_at: nowIso,
        })
        .or(`user_id.eq.${targetId},id.eq.${targetId}`)
        .select()
        .single();

      if (updErr || !updatedProfile) {
        return NextResponse.json(
          { ok: false, error: updErr?.message || 'Staff profile not found.' },
          { status: 404 }
        );
      }

      // Sync platform_admins role if active
      if (updatedProfile.status === 'active') {
        await (adminClient.from('platform_admins') as any)
          .update({ role: roleSlug })
          .eq('user_id', updatedProfile.user_id);
      }

      // Sync staff_permission_assignments table
      try {
        await (adminClient.from('staff_permission_assignments' as any) as any)
          .update({ revoked_at: nowIso })
          .eq('user_id', updatedProfile.user_id)
          .is('revoked_at', null);

        const effectiveSet = Array.from(
          new Set<StaffPermission>([
            ...STAFF_ROLE_DEFINITIONS[roleSlug].permissions,
            ...normalizedCustomPerms,
          ])
        );
        for (const perm of effectiveSet) {
          const { error: syncErr } = await (
            adminClient.from('staff_permission_assignments' as any) as any
          ).upsert(
            {
              staff_profile_id: updatedProfile.id,
              user_id: updatedProfile.user_id,
              permission_key: perm,
              permission_code: perm,
              granted_by: auth.user.id,
              revoked_at: null,
            },
            { onConflict: 'staff_profile_id,permission_key' }
          );
          if (syncErr) {
            console.error('Failed to sync updated staff permission:', syncErr);
          }
        }
      } catch (syncErr: any) {
        console.error('Permission assignment sync error:', syncErr);
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: 'staff_permissions_updated',
        targetType: 'staff_profile',
        targetId: updatedProfile.user_id,
        reason: reason || `Updated role to ${roleSlug}`,
        afterState: {
          role_slug: roleSlug,
          department: newDept,
          custom_permissions: normalizedCustomPerms,
        },
      });

      return NextResponse.json({ ok: true, profile: updatedProfile });
    }

    // ------------------------------------------------------------------------
    // 5. SUSPEND OR TERMINATE STAFF ACCESS IMMEDIATELY
    // ------------------------------------------------------------------------
    if (action === 'suspend_staff' || action === 'terminate_staff') {
      const auth = await requireStaffPermission('staff.terminate', { requireMfaAal2: true });
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const targetId = body.target_user_id || body.staff_profile_id;
      const { reason, reassign_to_user_id } = body;
      if (!targetId || !reason || String(reason).trim().length < 5) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Target staff user ID and a formal reason (min 5 chars) are mandatory for suspension or termination.',
          },
          { status: 400 }
        );
      }

      const { data: existingTarget } = await (adminClient.from('staff_profiles' as any) as any)
        .select('*')
        .or(`user_id.eq.${targetId},id.eq.${targetId}`)
        .maybeSingle();

      if (!existingTarget) {
        return NextResponse.json(
          { ok: false, error: 'Target staff profile not found.' },
          { status: 404 }
        );
      }

      if (existingTarget.user_id === auth.user.id) {
        return NextResponse.json(
          { ok: false, error: 'Founder cannot self-terminate the sole superadmin account.' },
          { status: 400 }
        );
      }

      const newStatus = action === 'terminate_staff' ? 'terminated' : 'suspended';
      const nowIso = new Date().toISOString();
      const trimmedReason = String(reason).trim();

      const updateFields: Record<string, any> = {
        status: newStatus,
        session_revoked_at: nowIso,
        custom_permissions: [],
        updated_at: nowIso,
      };
      if (newStatus === 'terminated') {
        updateFields.terminated_at = nowIso;
        updateFields.termination_reason = trimmedReason;
      } else {
        updateFields.suspended_at = nowIso;
        updateFields.suspension_reason = trimmedReason;
      }

      const { data: updatedProfile, error: updErr } = await (
        adminClient.from('staff_profiles' as any) as any
      )
        .update(updateFields)
        .eq('user_id', existingTarget.user_id)
        .select()
        .single();

      if (updErr) {
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      // Immediately remove from platform_admins and revoke granular permissions
      await (adminClient.from('platform_admins') as any)
        .delete()
        .eq('user_id', existingTarget.user_id);

      try {
        await (adminClient.from('staff_permission_assignments' as any) as any)
          .update({ revoked_at: nowIso })
          .eq('user_id', existingTarget.user_id)
          .is('revoked_at', null);
      } catch {
        // Ignore if table not present
      }

      // Revoke active Supabase Auth refresh tokens / sessions for the terminated/suspended staff user
      try {
        await (adminClient.auth.admin as any).signOut(existingTarget.user_id);
      } catch {
        // session_revoked_at on staff_profiles also blocks any residual JWT at the API gate
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: `staff_${newStatus}`,
        targetType: 'staff_profile',
        targetId: existingTarget.user_id,
        reason: trimmedReason,
        beforeState: { status: existingTarget.status },
        afterState: {
          status: newStatus,
          session_revoked_at: nowIso,
          reassigned_to: reassign_to_user_id || null,
        },
      });

      return NextResponse.json({
        ok: true,
        profile: updatedProfile,
        message: `Staff account immediately ${newStatus}. Active sessions and permissions revoked; historical employment and audit records preserved.`,
      });
    }

    // ------------------------------------------------------------------------
    // 6. DUAL AUTHORISATION WORKFLOW FOR HIGH-RISK ACTIONS
    // ------------------------------------------------------------------------
    if (action === 'request_dual_approval') {
      const auth = await requireStaffPermission('governance.dual_approve', {
        requireMfaAal2: true,
      });
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const { action_type, target_type, target_id, payload } = body;
      const justification = String(body.justification || body.reason || '').trim();
      if (!action_type || !target_id || justification.length < 5) {
        return NextResponse.json(
          { ok: false, error: 'Missing action_type, target_id, or justification.' },
          { status: 400 }
        );
      }

      const { data: dualRecord, error: dualErr } = await (
        adminClient.from('staff_dual_approvals' as any) as any
      )
        .insert({
          action_type: action_type as HighRiskActionType,
          target_type: target_type || 'system',
          target_id,
          requested_by: auth.user.id,
          requested_by_user_id: auth.user.id,
          justification,
          reason: justification,
          payload: payload || {},
          status: 'pending',
        })
        .select()
        .single();

      if (dualErr || !dualRecord) {
        return NextResponse.json(
          { ok: false, error: dualErr?.message || 'Failed to record dual approval request.' },
          { status: 500 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: 'dual_approval_requested',
        targetType: target_type || 'system',
        targetId: target_id,
        result: 'pending_dual_approval',
        reason: justification,
        afterState: { dual_approval_id: dualRecord.id, action_type },
      });

      return NextResponse.json({ ok: true, dualApproval: dualRecord });
    }

    if (action === 'decide_dual_approval' || action === 'resolve_dual_approval') {
      const auth = await requireStaffPermission('governance.dual_approve', {
        requireMfaAal2: true,
      });
      if (!auth.authorized || !auth.user) {
        return NextResponse.json(
          { ok: false, code: auth.code, error: auth.error },
          { status: auth.status }
        );
      }

      const { dual_approval_id, decision, notes } = body;
      if (!dual_approval_id || !decision) {
        return NextResponse.json(
          { ok: false, error: 'Missing dual_approval_id or decision.' },
          { status: 400 }
        );
      }

      const { data: existingDual, error: findErr } = await (
        adminClient.from('staff_dual_approvals' as any) as any
      )
        .select('*')
        .eq('id', dual_approval_id)
        .maybeSingle();

      if (findErr || !existingDual) {
        return NextResponse.json(
          { ok: false, error: 'Dual approval request not found.' },
          { status: 404 }
        );
      }

      const initiatorId = existingDual.requested_by || existingDual.requested_by_user_id;
      if (initiatorId === auth.user.id) {
        return NextResponse.json(
          {
            ok: false,
            code: 'SELF_APPROVAL_FORBIDDEN',
            error:
              'Dual authorisation violation: The initiator of a high-risk action cannot be the second approver.',
          },
          { status: 403 }
        );
      }

      const nextStatus = decision === 'approve' ? 'approved' : 'rejected';
      const nowIso = new Date().toISOString();

      const { data: updatedDual, error: updErr } = await (
        adminClient.from('staff_dual_approvals' as any) as any
      )
        .update({
          status: nextStatus,
          approved_by: auth.user.id,
          approved_by_user_id: auth.user.id,
          second_approver_id: auth.user.id,
          approved_at: nowIso,
          decided_at: nowIso,
          reviewer_notes: notes || null,
          decision_notes: notes || null,
        })
        .eq('id', dual_approval_id)
        .select()
        .single();

      if (updErr || !updatedDual) {
        return NextResponse.json(
          { ok: false, error: updErr?.message || 'Failed to update dual approval.' },
          { status: 500 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: auth.user.id,
        actorEmail: auth.user.email,
        staffId: auth.staffProfile?.staff_id,
        roleSlug: auth.staffProfile?.role_slug,
        action: `dual_approval_${nextStatus}`,
        targetType: existingDual.target_type || 'system',
        targetId: existingDual.target_id,
        reason: notes || null,
        afterState: { dual_approval_id, status: nextStatus },
      });

      return NextResponse.json({ ok: true, dualApproval: updatedDual });
    }

    return NextResponse.json(
      { ok: false, error: 'Unsupported staff governance action.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
