import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireStaffPermission('community.moderate', {
      requireMfaAal2: true,
      requiredDepartment: 'community',
    });

    if (!auth.authorized || !auth.user) {
      return NextResponse.json(
        {
          ok: false,
          code: auth.code,
          error:
            auth.error ||
            'Forbidden: Community moderation permission (community.moderate) and TOTP MFA (AAL2) required.',
        },
        { status: auth.status }
      );
    }

    const adminClient = createAdminClient();

    const { data: participations } = await adminClient
      .from('community_participations')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: stories } = await adminClient
      .from('community_stories')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ok: true,
      participations: participations || [],
      stories: stories || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStaffPermission('community.moderate', {
      requireMfaAal2: true,
      requiredDepartment: 'community',
    });

    if (!auth.authorized || !auth.user || !auth.staffProfile) {
      return NextResponse.json(
        {
          ok: false,
          code: auth.code,
          error:
            auth.error ||
            'Forbidden: Community moderation permission (community.moderate) and TOTP MFA (AAL2) required.',
        },
        { status: auth.status }
      );
    }

    const user = auth.user;
    const staffProfile = auth.staffProfile;

    const body = await req.json();
    const { target_type, target_id, action, notes } = body;

    if (!target_type || !target_id || !action) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (target_type === 'participation') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'decline') newStatus = 'declined';
      else {
        return NextResponse.json(
          { ok: false, error: 'Invalid participation action.' },
          { status: 400 }
        );
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('community_participations')
        .update({
          status: newStatus,
          admin_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target_id)
        .select()
        .maybeSingle();

      if (updateErr || !updated) {
        return NextResponse.json(
          {
            ok: false,
            code: 'FEATURE_NOT_YET_OPEN',
            error:
              updateErr?.message ||
              'Community participations table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: `community_participation_${newStatus}`,
        targetType: 'community_participation',
        targetId: String(target_id),
        reason: notes || null,
        afterState: { status: newStatus },
      });

      return NextResponse.json({
        ok: true,
        participation: updated || { id: target_id, status: newStatus },
      });
    }

    if (target_type === 'story') {
      let newStatus: string;
      if (action === 'publish') newStatus = 'published';
      else if (action === 'reject') newStatus = 'rejected';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid story action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await (
        adminClient.from('community_stories' as any) as any
      )
        .update({
          status: newStatus,
          moderation_status: newStatus === 'published' ? 'approved' : 'rejected',
          published: newStatus === 'published',
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target_id)
        .select()
        .maybeSingle();

      if (updateErr || !updated) {
        return NextResponse.json(
          {
            ok: false,
            code: 'FEATURE_NOT_YET_OPEN',
            error:
              updateErr?.message ||
              'Community stories table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: `community_story_${newStatus}`,
        targetType: 'community_story',
        targetId: String(target_id),
        reason: notes || null,
        afterState: { status: newStatus },
      });

      return NextResponse.json({
        ok: true,
        story: updated || { id: target_id, status: newStatus },
      });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported target type' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin community POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
