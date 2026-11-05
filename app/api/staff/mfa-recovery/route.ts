import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/mfa-recovery
 * Records a verified staff member's lost-authenticator request.
 * This endpoint never resets or bypasses MFA.
 */
export async function POST(req: NextRequest) {
  try {
    // This is a browser-only action from the current login page; reject cross-origin submissions.
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (!origin || !host || new URL(origin).host.toLowerCase() !== host.toLowerCase()) {
      return NextResponse.json({ ok: false, error: 'Same-origin request required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = String(body?.reason || '').trim();
    const suppliedEmail = String(body?.official_email || '').trim().toLowerCase();
    const suppliedStaffId = String(body?.staff_id || '').trim();
    const verificationContact = String(body?.verification_contact || '').trim();

    if (reason.length < 10 || reason.length > 1000 || !suppliedEmail) {
      return NextResponse.json(
        { ok: false, error: 'Enter your official work email and a reason between 10 and 1,000 characters.' },
        { status: 400 }
      );
    }
    if (verificationContact.length > 254) {
      return NextResponse.json({ ok: false, error: 'Verification contact is too long.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.id || !user.email) {
      return NextResponse.json(
        { ok: false, error: 'Sign in to your own staff account before requesting MFA recovery.' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await (
      adminClient.from('staff_profiles' as any) as any
    )
      .select(
        'id, user_id, staff_id, role_slug, role_code, official_email, status, founder_approved, founder_approved_at, founder_approved_by, session_revoked_at, privacy_notice_accepted, agreements_completed, all_agreements_accepted, onboarding_completed, mfa_enrolled'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: 'No matching staff profile was found for this signed-in account.' }, { status: 403 });
    }

    const validEmails = [user.email, profile.official_email]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map((value) => value.trim().toLowerCase());
    const identityMatches =
      validEmails.includes(suppliedEmail) &&
      (!suppliedStaffId || suppliedStaffId === profile.staff_id);

    if (
      !identityMatches ||
      profile.status !== 'active' ||
      profile.founder_approved !== true ||
      !profile.founder_approved_at ||
      !profile.founder_approved_by ||
      profile.session_revoked_at ||
      profile.privacy_notice_accepted !== true ||
      profile.agreements_completed !== true ||
      profile.all_agreements_accepted !== true ||
      profile.onboarding_completed !== true
    ) {
      return NextResponse.json(
        { ok: false, error: 'The signed-in account does not match an active, approved staff identity eligible for recovery.' },
        { status: 403 }
      );
    }

    let verifiedTotp = false;
    try {
      const { data: factors } = await (supabase.auth as any).mfa.listFactors();
      verifiedTotp = (factors?.totp || []).some((factor: any) => factor.status === 'verified');
    } catch {
      verifiedTotp = false;
    }
    if (profile.mfa_enrolled !== true && !verifiedTotp) {
      return NextResponse.json(
        { ok: false, error: 'This staff account has no enrolled TOTP factor to recover. Use the initial MFA enrollment flow.' },
        { status: 409 }
      );
    }

    // Limit one request per staff account per 15 minutes; the audit record is the throttle source.
    const throttleAfter = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count: recentCount, error: throttleError } = await adminClient
      .from('admin_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('actor_user_id', user.id)
      .eq('action', 'staff_mfa_recovery_requested')
      .gte('created_at', throttleAfter);

    if (throttleError) {
      return NextResponse.json({ ok: false, error: 'Recovery request could not be safely rate-checked. Try again later.' }, { status: 503 });
    }
    if ((recentCount || 0) > 0) {
      return NextResponse.json({ ok: false, error: 'A recovery request was already submitted recently. Contact the Founder through the verified support channel.' }, { status: 429 });
    }

    const roleSlug = profile.role_slug || profile.role_code || null;
    await recordStaffAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      staffId: profile.staff_id,
      roleSlug,
      action: 'staff_mfa_recovery_requested',
      targetType: 'staff_security',
      targetId: profile.id,
      result: 'pending_dual_approval',
      reason,
      metadata: {
        verification_contact: verificationContact || null,
        procedure: 'Founder out-of-band identity verification required before TOTP factor reset',
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Recovery request logged for Founder review. Your TOTP factor remains enforced; no MFA reset or bypass was performed.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
