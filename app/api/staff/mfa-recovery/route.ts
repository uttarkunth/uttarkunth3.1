import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/mfa-recovery
 * Records a lost authenticator device recovery request for Founder-authorized identity verification.
 * Never bypasses MFA automatically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { official_email, staff_id, reason, verification_contact } = body || {};

    if (!official_email || !reason || String(reason).trim().length < 10) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Please provide your official work email and a detailed explanation (at least 10 characters) to request Founder-authorized MFA recovery.',
        },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    await recordStaffAuditLog({
      actorUserId: user?.id || '00000000-0000-0000-0000-000000000000',
      actorEmail: official_email,
      staffId: staff_id || 'UNVERIFIED-RECOVERY-REQ',
      action: 'staff_mfa_recovery_requested',
      targetType: 'staff_security',
      targetId: user?.id || official_email,
      result: 'pending_dual_approval',
      reason: String(reason).trim(),
      metadata: {
        official_email: String(official_email).trim().toLowerCase(),
        reported_staff_id: staff_id || null,
        verification_contact: verification_contact || null,
        procedure: 'Founder out-of-band video/identity verification required before TOTP factor reset',
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        'Lost authenticator recovery request logged in the Founder Security Queue. Your TOTP factor remains enforced until the Founder completes out-of-band identity verification.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
