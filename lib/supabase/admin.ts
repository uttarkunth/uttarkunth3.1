import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.ts';
import { createServerSupabaseClient } from './server.ts';

export function createAdminClient(): ReturnType<typeof createClient<Database>> {
  if (typeof window !== 'undefined') {
    throw new Error('Security Violation: lib/supabase/admin.ts cannot be executed in client code.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasValidServiceRoleKey =
    Boolean(serviceRoleKey) &&
    !serviceRoleKey!.includes('your_') &&
    !serviceRoleKey!.includes('placeholder') &&
    serviceRoleKey!.length > 40;

  if (!supabaseUrl) {
    throw new Error(
      'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for createAdminClient(). Never fall back to the public anon key.'
    );
  }

  if (!hasValidServiceRoleKey) {
    // When SUPABASE_SERVICE_ROLE_KEY is unset or still holds the .env.example placeholder,
    // use the current authenticated request session so PostgreSQL FORCE ROW LEVEL SECURITY
    // enforces Founder/Staff permissions via auth.uid().
    return createServerSupabaseClient() as unknown as ReturnType<typeof createClient<Database>>;
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
