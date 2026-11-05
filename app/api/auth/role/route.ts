import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true, isAdmin: false });
    }

    const adminClient = createAdminClient();
    const { data: row, error: profileErr } = await (
      adminClient.from('staff_profiles' as any) as any
    )
      .select(
        'user_id, staff_id, role_slug, role_code, department, status, founder_approved, founder_approved_by, founder_approved_at, agreements_completed, all_agreements_accepted, privacy_notice_accepted, mfa_enrolled, session_revoked_at'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileErr || !row) {
      return NextResponse.json({ ok: true, isAdmin: false, staffProfile: null });
    }

    const roleSlug = row.role_slug || row.role_code || null;
    const isAdmin = await checkIsPlatformAdmin(user.id);
    const { count: founderCount, error: founderCountErr } = await (
      adminClient.from('staff_profiles' as any) as any
    )
      .select('id', { count: 'exact', head: true })
      .eq('role_slug', 'founder');

    // The Founder may sign in once to record their own genuine agreements/consent.
    // This narrow setup exception does not authorize any admin action or bypass MFA.
    const canCompleteFounderSetup =
      !isAdmin &&
      !founderCountErr &&
      founderCount === 1 &&
      roleSlug === 'founder' &&
      row.staff_id === 'UK-STAFF-2026-0001' &&
      row.status === 'active' &&
      row.founder_approved === true &&
      Boolean(row.founder_approved_at) &&
      row.founder_approved_by === user.id &&
      !row.session_revoked_at &&
      row.agreements_completed !== true;

    const staffProfile = {
      staff_id: row.staff_id || null,
      role_slug: roleSlug,
      department: row.department || null,
      status: row.status || null,
      founder_approved: row.founder_approved === true,
      agreements_completed: row.agreements_completed === true || row.all_agreements_accepted === true,
      privacy_notice_accepted: row.privacy_notice_accepted === true,
      mfa_enrolled: row.mfa_enrolled === true,
    };

    return NextResponse.json({
      ok: true,
      isAdmin,
      canCompleteFounderSetup,
      staffProfile: isAdmin || canCompleteFounderSetup ? staffProfile : null,
    });
  } catch (err) {
    console.error('Failed to resolve user admin role:', err);
    return NextResponse.json({ ok: true, isAdmin: false });
  }
}
