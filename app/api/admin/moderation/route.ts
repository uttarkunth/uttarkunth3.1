import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';
import { notifyHostPropertyModeration } from '@/lib/notifications';

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

      // Notify host of staged review decision
      try {
        const { data: prop } = await adminClient
          .from('properties')
          .select('name, host_id, slug, contact_email, contact_phone')
          .eq('id', property_id)
          .single();

        if (prop && prop.host_id) {
          await notifyHostPropertyModeration({
            hostUserId: prop.host_id,
            hostEmail: prop.contact_email,
            hostPhone: prop.contact_phone,
            propertyName: prop.name,
            status: action === 'approve_staged' ? 'approved' : 'rejected',
            adminNotes: admin_notes,
            slug: prop.slug,
          });
        }
      } catch (e) {
        console.warn('Failed to notify host on staged changes:', e);
      }

      await recordStaffAuditLog({
        staffId: staffProfile.id,
        userId: user.id,
        action: action === 'approve_staged' ? 'property_changes_approved' : 'property_changes_rejected',
        resourceType: 'properties',
        resourceId: property_id,
        details: {
          admin_notes: admin_notes?.trim() || null,
          decision: action,
        },
      });

      return NextResponse.json({
        ok: true,
        message:
          action === 'approve_staged'
            ? 'Staged changes approved and applied to live listing.'
            : 'Staged changes rejected and discarded.',
      });
    }

    // 2. Initial Listing Moderation Actions: approve, reject, changes_requested
    let updatePayload: Record<string, any> = {};
    let auditAction: string = '';

    if (action === 'approve') {
      updatePayload = {
        moderation_status: 'approved',
        moderation_notes: admin_notes?.trim() || null,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      };
      auditAction = 'property_approved';
    } else if (action === 'reject') {
      updatePayload = {
        moderation_status: 'rejected',
        moderation_notes: admin_notes?.trim() || null,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      };
      auditAction = 'property_rejected';
    } else if (action === 'changes_requested') {
      updatePayload = {
        moderation_status: 'changes_requested',
        moderation_notes: admin_notes?.trim() || null,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      };
      auditAction = 'property_changes_requested';
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid moderation action: ${action}`,
        },
        { status: 400 }
      );
    }

    const { error: updateErr } = await adminClient
      .from('properties')
      .update(updatePayload)
      .eq('id', property_id);

    if (updateErr) {
      throw updateErr;
    }

    // Notify host of moderation decision
    try {
      const { data: prop } = await adminClient
        .from('properties')
        .select('name, host_id, slug, contact_email, contact_phone')
        .eq('id', property_id)
        .single();

      if (prop && prop.host_id) {
        await notifyHostPropertyModeration({
          hostUserId: prop.host_id,
          hostEmail: prop.contact_email,
          hostPhone: prop.contact_phone,
          propertyName: prop.name,
          status: action as any,
          adminNotes: admin_notes,
          slug: prop.slug,
        });
      }
    } catch (e) {
      console.warn('Failed to notify host on property moderation:', e);
    }

    await recordStaffAuditLog({
      staffId: staffProfile.id,
      userId: user.id,
      action: auditAction,
      resourceType: 'properties',
      resourceId: property_id,
      details: {
        admin_notes: admin_notes?.trim() || null,
        status: updatePayload.moderation_status,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Property ${property_id} has been ${action === 'changes_requested' ? 'marked for revisions' : action + 'd'}.`,
    });
  } catch (err: any) {
    console.error('Property moderation API error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Failed to execute moderation action.',
      },
      { status: 500 }
    );
  }
}
