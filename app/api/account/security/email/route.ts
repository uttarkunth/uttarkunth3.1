import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import {
  recordStaffAuditLog,
  validateEmailChangeRequest,
  type EmailChangeValidationInput,
  type EmailChangeValidationResult,
} from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user || !user.id || !user.email) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHENTICATED', error: 'Authentication required.' },
        { status: 401 }
      );
    }

    let mfaLevel: 'aal1' | 'aal2' = 'aal1';
    try {
      const { data: aalData } = await (supabase.auth as any).mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal2') {
        mfaLevel = 'aal2';
      }
    } catch {
      mfaLevel = 'aal1';
    }

    const adminClient = createAdminClient();
    let staffRow: any = null;
    try {
      const { data: sp } = await (adminClient.from('staff_profiles' as any) as any)
        .select('id, user_id, staff_id, role_slug, official_email, status')
        .eq('user_id', user.id)
        .maybeSingle();
      staffRow = sp;
    } catch {
      staffRow = null;
    }

    // Only a currently authorized staff identity receives the additional AAL2 email-change gate.
    const isPrivilegedStaffOrFounder = await checkIsPlatformAdmin(user.id);

    const body = await req.json().catch(() => ({}));
    const validation = validateEmailChangeRequest({
      userId: user.id,
      currentEmail: user.email,
      newEmail: body?.new_email ?? body?.email,
      currentPassword: body?.current_password ?? body?.password,
      isPrivilegedStaffOrFounder,
      mfaAssuranceLevel: mfaLevel,
    });

    if (!validation.valid) {
      if (isPrivilegedStaffOrFounder) {
        await recordStaffAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          staffId: staffRow?.staff_id || null,
          roleSlug: staffRow?.role_slug || null,
          action: 'account_email_change_rejected',
          targetType: 'auth_user',
          targetId: user.id,
          result: 'denied',
          reason: `${validation.code}: ${validation.error}`,
        });
      }
      return NextResponse.json(
        { ok: false, code: validation.code, error: validation.error },
        { status: validation.statusCode }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: 'Server authentication configuration error.' },
        { status: 500 }
      );
    }

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: reauthErr } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: String(body.current_password ?? body.password),
    });

    if (reauthErr) {
      if (isPrivilegedStaffOrFounder) {
        await recordStaffAuditLog({
          actorUserId: user.id,
          actorEmail: user.email,
          staffId: staffRow?.staff_id || null,
          roleSlug: staffRow?.role_slug || null,
          action: 'account_email_change_reauth_failed',
          targetType: 'auth_user',
          targetId: user.id,
          result: 'denied',
          reason: 'Invalid current password during email change re-authentication.',
        });
      }
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_PASSWORD',
          error: 'Current password verification failed.',
        },
        { status: 403 }
      );
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      email: validation.normalizedNewEmail,
    });

    if (updateErr) {
      return NextResponse.json(
        { ok: false, code: 'UPDATE_FAILED', error: updateErr.message },
        { status: 400 }
      );
    }

    await recordStaffAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      staffId: staffRow?.staff_id || null,
      roleSlug: staffRow?.role_slug || null,
      action: 'account_email_change_initiated',
      targetType: 'auth_user',
      targetId: user.id,
      result: 'success',
      reason:
        'Authenticated email change initiated; awaiting Supabase Auth email confirmation before trg_sync_auth_user_email_change updates informational email fields.',
      beforeState: { email: user.email, user_id: user.id },
      afterState: { requested_email: validation.normalizedNewEmail, user_id: user.id },
    });

    return NextResponse.json({
      ok: true,
      user_id: user.id,
      current_email: user.email,
      requested_email: validation.normalizedNewEmail,
      message:
        'Confirmation link sent to your email address. Your UUID-anchored permissions remain unchanged, and your profile email fields will synchronize automatically once confirmed.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
