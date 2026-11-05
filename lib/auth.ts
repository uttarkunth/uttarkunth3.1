import { createAdminClient } from './supabase/admin.ts';

/**
 * Authoritative platform administrator & active staff verification.
 * Strictly verifies explicit provisioning in public.platform_admins and/or active status in public.staff_profiles.
 * Sole authoritative source in production — fails closed on any missing configuration or unverified user.
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

    // 1. Direct query on public.platform_admins
    const { data, error } = await (adminClient.from('platform_admins') as any)
      .select('user_id, role')
      .eq('user_id', userId)
      .in('role', [
        'admin',
        'superadmin',
        'super_admin',
        'platform_admin',
        'founder',
        'operations_admin',
        'property_reviewer',
        'marketplace_reviewer',
        'productions_editor',
        'community_manager',
        'support_executive',
        'finance_compliance_reviewer',
      ])
      .maybeSingle();

    const hasPlatformAdminRow = Boolean(!error && data);

    // 2. Check public.staff_profiles for active status and revocation state
    let hasActiveStaffProfile = false;
    try {
      const { data: staffRow, error: staffErr } = await (
        adminClient.from('staff_profiles' as any) as any
      )
        .select('user_id, status, founder_approved_at, staff_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!staffErr && staffRow) {
        if (staffRow.status !== 'active') {
          // Immediately revoke admin access if staff profile is suspended, terminated, or pending
          return false;
        }
        if (staffRow.founder_approved_at && staffRow.staff_id) {
          hasActiveStaffProfile = true;
        }
      }
    } catch {
      // If staff_profiles is not yet migrated, rely solely on platform_admins
    }

    return hasPlatformAdminRow || hasActiveStaffProfile;
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
