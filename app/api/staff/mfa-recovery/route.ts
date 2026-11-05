import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/mfa-recovery
 * Records a lost authenticator device recovery request for Founder-authorized identity verification.
 * Never bypasses MFA automatically. Verifies that official_email belongs to a registered staff profile
 * before writing to the immutable audit log to prevent unauthenticated log flooding.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { official_email, staff_id, reason, verification_contact } = body || {};

    const cleanEmail = String(official_email || '')
      .trim()
      .toLowerCase();
    const cleanReason = String(reason || '').trim();

    if (
      !cleanEmail ||
      !cleanEmail.includes('@') ||
      cleanReason.length < 10 ||
      cleanReason.length > 500
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Please provide your official work email and a detailed explanation (10 to 500 characters) to request Founder-authorized MFA recovery.',
        },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    let matchedStaff: any = null;
    try {
      const { data } = await (adminClient.from('staff_profiles' as any) as any)
        .select('user_id, staff_id, official_email, role_slug, status')
        .eq('official_email', cleanEmail)
        .maybeSingle();
      matchedStaff = data;
    } catch {
      matchedStaff = null;
    }

    // Only write to the immutable audit log if the email corresponds to a real staff record
    // or if the caller holds an authenticated session matching that email.
    if (matchedStaff || (user?.email && user.email.toLowerCase() === cleanEmail)) {
      await recordStaffAuditLog({
        actorUserId: matchedStaff?.user_id || user?.id || '00000000-0000-0000-0000-000000000000',
        actorEmail: cleanEmail,
        staffId: matchedStaff?.staff_id || staff_id || 'UNVERIFIED-RECOVERY-REQ',
        roleSlug: matchedStaff?.role_slug || null,
        action: 'staff_mfa_recovery_requested',
        targetType: 'staff_security',
        targetId: matchedStaff?.user_id || user?.id || cleanEmail,
        result: 'pending_dual_approval',
        reason: cleanReason,
        metadata: {
          official_email: cleanEmail,
          reported_staff_id: staff_id || null,
          verification_contact: verification_contact ? String(verification_contact).slice(0, 120) : null,
          procedure:
            'Founder out-of-band video/identity verification required before TOTP factor reset',
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        'Lost authenticator recovery request logged in the Founder Security Queue. Your TOTP factor remains enforced until the Founder completes out-of-band identity verification.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
