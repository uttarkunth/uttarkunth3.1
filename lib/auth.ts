import { createAdminClient } from './supabase/admin.ts';

/**
 * Authoritative platform administrator verification.
 * Strictly verifies explicit provisioning in public.platform_admins.
 * Sole authoritative source.
 * Never authorizes based on email address, signup order, user_metadata, or app_metadata.
 */
export async function checkIsPlatformAdmin(
  userId?: string | null
): Promise<boolean> {
  if (!userId) return false;

  // Authoritative check against protected platform_admins registry as the sole authority
  try {
    const adminClient = createAdminClient();
    const { data, error } = await (adminClient.from('platform_admins') as any)
      .select('user_id')
      .eq('user_id', userId)
      .in('role', ['admin', 'superadmin', 'platform_admin'])
      .maybeSingle();

    if (error) {
      console.error('Error querying platform_admins:', error);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.error('Failed to verify platform admin status:', err);
    return false;
  }
}
