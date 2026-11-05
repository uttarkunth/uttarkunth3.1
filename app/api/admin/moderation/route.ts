import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStaffPermission('property.review', {
      requireMfaAal2: true,
      requiredDepartment: 'stays',
    });

    if (!auth.authorized || !auth.user || !auth.staffProfile) {
      return NextResponse.json(
        {
          ok: false,
          code: auth.code,
          error:
            auth.error ||
            'Forbidden: Stays property review permission and TOTP MFA (AAL2) required.',
        },
        { status: auth.status }
      );
    }

    const user = auth.user;
    const staffProfile = auth.staffProfile;

    const body = await req.json();
    const { property_id, action, admin_notes } = body;

    if (!property_id || !action) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing property_id or action.',
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Staged Changes Review Actions
    if (action === 'approve_staged' || action === 'reject_staged') {
      const rpcAction = action === 'approve_staged' ? 'approve' : 'reject';
      const { error: rpcErr } = await (adminClient.rpc as any)('admin_review_property_changes', {
        p_property_id: property_id,
        p_action: rpcAction,
        p_admin_notes: admin_notes?.trim() || null,
        p_admin_user_id: user.id,
      });

      if (rpcErr) {
        throw rpcErr;
      }

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: `property_${action}`,
        targetType: 'property',
        targetId: String(property_id),
        reason: admin_notes?.trim() || null,
        afterState: { staged_decision: rpcAction },
      });

      return NextResponse.json({
        ok: true,
        action,
        message:
          action === 'approve_staged'
            ? 'Proposed changes approved and published to the live listing.'
            : 'Proposed changes rejected. Current approved listing remains live.',
      });
    }

    // 2. Initial Listing Moderation Actions (Approve / Reject / Request Changes)
    let newStatus = 'pending';
    let isPublished = false;

    if (action === 'approve') {
      newStatus = 'approved';
      isPublished = true;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      isPublished = false;
    } else if (action === 'request_changes') {
      newStatus = 'changes_requested';
      isPublished = false;
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid moderation action.' },
        { status: 400 }
      );
    }

    const { error: updateErr } = await adminClient
      .from('properties')
      .update({
        moderation_status: newStatus,
        published: isPublished,
        moderation_notes: admin_notes?.trim() || `Property ${newStatus} by administrator.`,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', property_id);

    if (updateErr) {
      throw updateErr;
    }

    await recordStaffAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      staffId: staffProfile.staff_id,
      roleSlug: staffProfile.role_slug,
      action: `property_${newStatus}`,
      targetType: 'property',
      targetId: String(property_id),
      reason: admin_notes?.trim() || null,
      afterState: {
        moderation_status: newStatus,
        published: isPublished,
      },
    });

    return NextResponse.json({
      ok: true,
      action: newStatus,
      published: isPublished,
      message: `Property successfully ${newStatus}.`,
    });
  } catch (err: any) {
    console.error('Moderation action error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Failed to apply moderation action.',
      },
      { status: 500 }
    );
  }
}
