import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyplgugxpmlnjsvlosdg.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // If service role key is not configured in local environment, use anon key
    // Privileged database operations will require SUPABASE_SERVICE_ROLE_KEY
    const fallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGxndWd4cG1sbmpzdmxvc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NTcwNTcsImV4cCI6MjEwODIzMzA1N30.ERBO4qbz0sgnyxodHbDBEJIUkJ4GUWXxJWZETga-_64';
    return createClient<Database>(supabaseUrl, fallbackKey, {
      auth: { persistSession: false }
    });
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
