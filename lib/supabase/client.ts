import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyplgugxpmlnjsvlosdg.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGxndWd4cG1sbmpzdmxvc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NTcwNTcsImV4cCI6MjEwODIzMzA1N30.ERBO4qbz0sgnyxodHbDBEJIUkJ4GUWXxJWZETga-_64';

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
