import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireStaffPermission('productions.review_proposal', {
      requireMfaAal2: true,
      requiredDepartment: 'productions',
    });

    const fallbackAuth = !auth.authorized
      ? await requireStaffPermission('productions.approve_profile', {
          requireMfaAal2: true,
          requiredDepartment: 'productions',
        })
      : auth;

    if (!fallbackAuth.authorized || !fallbackAuth.user) {
      return NextResponse.json(
        {
          ok: false,
          code: fallbackAuth.code,
          error:
            fallbackAuth.error ||
            'Forbidden: Productions review permission and TOTP MFA (AAL2) required.',
        },
        { status: fallbackAuth.status }
      );
    }

    const adminClient = createAdminClient();

    const { data: profiles } = await adminClient
      .from('filmmaker_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: proposals } = await adminClient
      .from('production_proposals')
      .select('*, filmmaker_profiles(full_name, email, creative_role)')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ok: true,
      profiles: profiles || [],
      proposals: proposals || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target_type, target_id, action, notes } = body;

    if (!target_type || !target_id || !action) {
      return NextResponse.json(
        { ok: false, error: 'Missing target_type, target_id, or action.' },
        { status: 400 }
      );
    }

    const requiredPerm =
      target_type === 'profile' ? 'productions.approve_profile' : 'productions.review_proposal';

    const auth = await requireStaffPermission(requiredPerm, {
      requireMfaAal2: true,
      requiredDepartment: 'productions',
    });

    if (!auth.authorized || !auth.user || !auth.staffProfile) {
      return NextResponse.json(
        {
          ok: false,
          code: auth.code,
          error:
            auth.error ||
            `Forbidden: Productions permission (${requiredPerm}) and TOTP MFA (AAL2) required.`,
        },
        { status: auth.status }
      );
    }

    const user = auth.user;
    const staffProfile = auth.staffProfile;
    const adminClient = createAdminClient();

    if (target_type === 'proposal') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'request_revision') newStatus = 'revision_requested';
      else if (action === 'in_production') newStatus = 'in_production';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid proposal action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('production_proposals')
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
              'Production proposals table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: `production_proposal_${newStatus}`,
        targetType: 'production_proposal',
        targetId: String(target_id),
        reason: notes || null,
        afterState: { status: newStatus },
      });

      return NextResponse.json({
        ok: true,
        proposal: updated || { id: target_id, status: newStatus },
      });
    }

    if (target_type === 'profile') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'in_discussion') newStatus = 'in_discussion';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid profile action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('filmmaker_profiles')
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
              'Filmmaker profiles table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: `filmmaker_profile_${newStatus}`,
        targetType: 'filmmaker_profile',
        targetId: String(target_id),
        reason: notes || null,
        afterState: { status: newStatus },
      });

      return NextResponse.json({
        ok: true,
        profile: updated || { id: target_id, status: newStatus },
      });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported target type' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin productions POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
