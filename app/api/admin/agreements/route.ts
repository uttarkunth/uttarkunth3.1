import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStaffPermission('finance.review_agreements', {
      requireMfaAal2: true,
    });

    if (!auth.authorized || !auth.user || !auth.staffProfile) {
      return NextResponse.json(
        {
          ok: false,
          code: auth.code,
          error:
            auth.error ||
            'Forbidden: Commercial agreement management permission (finance.review_agreements) and TOTP MFA (AAL2) required.',
        },
        { status: auth.status }
      );
    }

    const user = auth.user;
    const staffProfile = auth.staffProfile;

    const body = await req.json();
    const {
      property_id,
      host_user_id,
      host_name,
      host_contact,
      agreement_start,
      agreement_end,
      intro_commission_percent = 0,
      intro_period_months = 12,
      standard_commission_percent = 10,
      notes,
    } = body;

    if (!property_id || !host_name || !agreement_start) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing required agreement terms: property_id, host_name, agreement_start.',
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Strict bilateral verification:
    // Every new commercial agreement begins strictly in 'draft' status with accepted_at = null.
    const agreementData: any = {
      property_id,
      host_user_id: host_user_id || null,
      host_name: host_name.trim(),
      host_contact: host_contact?.trim() || null,
      agreement_start,
      agreement_end: agreement_end || null,
      commission_percent: Number(standard_commission_percent),
      intro_commission_percent: Number(intro_commission_percent),
      intro_period_months: Number(intro_period_months),
      standard_commission_percent: Number(standard_commission_percent),
      agreement_status: 'draft',
      notes: notes ? notes.trim() : null,
      accepted_at: null,
      terms_version: '2026.1',
    };

    const { data: agreement, error: insertErr } = await adminClient
      .from('host_agreements')
      .insert(agreementData)
      .select('id')
      .single();

    if (insertErr) {
      throw insertErr;
    }

    await recordStaffAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      staffId: staffProfile.staff_id,
      roleSlug: staffProfile.role_slug,
      action: 'host_agreement_created',
      targetType: 'agreement',
      targetId: String(agreement.id),
      afterState: {
        property_id,
        host_name,
        standard_commission_percent,
        intro_commission_percent,
        status: 'draft',
      },
    });

    return NextResponse.json({
      ok: true,
      agreement_id: agreement.id,
      message: 'Commercial terms saved as Draft (Pending demonstrable host acceptance).',
    });
  } catch (err: any) {
    console.error('Agreement creation error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Failed to authorize host agreement.',
      },
      { status: 500 }
    );
  }
}
