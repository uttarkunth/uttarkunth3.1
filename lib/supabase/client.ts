import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

const DEFAULT_PUBLIC_SUPABASE_URL = 'https://xyplgugxpmlnjsvlosdg.supabase.co';
const DEFAULT_PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGxndWd4cG1sbmpzdmxvc2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NTcwNTcsImV4cCI6MjEwODIzMzA1N30.ERBO4qbz0sgnyxodHbDBEJIUkJ4GUWXxJWZETga-_64';

function isPlaceholderEnvValue(val?: string | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith('your_supabase_') ||
    trimmed === 'placeholder'
  );
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const rawPublishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabaseUrl = !isPlaceholderEnvValue(rawUrl)
    ? rawUrl!.trim()
    : DEFAULT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = !isPlaceholderEnvValue(rawAnon)
    ? rawAnon!.trim()
    : !isPlaceholderEnvValue(rawPublishable)
      ? rawPublishable!.trim()
      : DEFAULT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Client Configuration Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) must be configured in environment variables.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
