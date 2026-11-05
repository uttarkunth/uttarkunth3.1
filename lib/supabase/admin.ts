import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Security Violation: lib/supabase/admin.ts cannot be executed in client code.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for createAdminClient(). Never fall back to the public anon key.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
