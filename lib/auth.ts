import { createAdminClient } from './supabase/admin.ts';

/**
 * Authoritative platform administrator & active staff verification.
 * Only a fully approved, consented, and onboarded staff_profiles record grants privileged status.
 * Legacy platform_admins rows never grant access by themselves.
 * Never authorizes based on email address, signup order, user_metadata, app_metadata, or preview flags.
 */
export async function checkIsPlatformAdmin(
  userId?: string | null
): Promise<boolean> {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return false;
  }

  try {
    const adminClient = createAdminClient();

    // The authoritative internal staff identity must be a genuine public.staff_profiles record.
    // Legacy platform_admins records never automatically grant admin access without an active staff profile.
    const { data: staffRow, error: staffErr } = await (
      adminClient.from('staff_profiles' as any) as any
    )
      .select(
        'user_id, status, founder_approved, founder_approved_at, founder_approved_by, staff_id, session_revoked_at, agreements_completed, all_agreements_accepted, privacy_notice_accepted, onboarding_completed, role_slug, role_code'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (staffErr || !staffRow) {
      // Fails closed: Missing or failed staff profile query never falls back to legacy admin
      return false;
    }

    // 1. Require active status (immediately revokes access if suspended, terminated, or pending)
    if (staffRow.status !== 'active') {
      return false;
    }

    // 2. Reject revoked sessions
    if (staffRow.session_revoked_at) {
      return false;
    }

    // 3. Require explicit privacy consent and completion of every required agreement.
    if (
      staffRow.privacy_notice_accepted !== true ||
      staffRow.agreements_completed !== true ||
      staffRow.all_agreements_accepted !== true ||
      staffRow.onboarding_completed !== true
    ) {
      return false;
    }

    // 4. Require Founder approval and immutable Staff ID.
    if (
      staffRow.founder_approved !== true ||
      !staffRow.founder_approved_at ||
      !staffRow.founder_approved_by ||
      !staffRow.staff_id
    ) {
      return false;
    }

    // 5. Require valid staff role
    const role = staffRow.role_slug || staffRow.role_code;
    if (!role) {
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to verify platform admin status (failing closed):', err);
    return false;
  }
}

/**
 * Resolves the current authenticated Founder/Admin session for Server Components and API Routes.
 * Strictly fails closed when unauthenticated or unauthorized — never synthesizes preview users.
 * Free of top-level next/headers imports so /lib/auth.ts remains safely importable in Node test runners.
 */
export async function resolveFounderOrAdminSession(supabaseClient?: any): Promise<{
  user: { id: string; email?: string; user_metadata?: Record<string, any> } | null;
  isAdmin: boolean;
  isPreviewSession: boolean;
}> {
  let client = supabaseClient;

  if (!client) {
    try {
      const { createServerSupabaseClient } = await import('./supabase/server');
      client = createServerSupabaseClient();
    } catch {
      client = null;
    }
  }

  if (client) {
    try {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (user && user.id) {
        const isAdmin = await checkIsPlatformAdmin(user.id);
        return { user, isAdmin, isPreviewSession: false };
      }
    } catch {
      // Fail closed on auth read error
    }
  }

  return { user: null, isAdmin: false, isPreviewSession: false };
}
