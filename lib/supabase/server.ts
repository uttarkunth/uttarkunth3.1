import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers.js';
import type { Database } from './types.ts';

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

function resolvePublicSupabaseCredentials() {
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

  return { supabaseUrl, supabaseAnonKey };
}

export function createServerSupabaseClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Security Violation: lib/supabase/server.ts cannot be executed in client code.');
  }

  let cookieStore: ReturnType<typeof cookies> | null = null;
  try {
    cookieStore = cookies();
  } catch {
    cookieStore = null;
  }

  let authHeader: string | null = null;
  try {
    const headerStore = headers();
    const rawAuth = headerStore.get('authorization');
    if (rawAuth && rawAuth.toLowerCase().startsWith('bearer ')) {
      authHeader = rawAuth;
    }
  } catch {
    authHeader = null;
  }

  const { supabaseUrl, supabaseAnonKey } = resolvePublicSupabaseCredentials();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) must be configured in environment variables.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    ...(authHeader
      ? {
          global: {
            headers: {
              Authorization: authHeader,
            },
          },
        }
      : {}),
    cookies: {
      get(name: string) {
        try {
          return cookieStore?.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore?.set({ name, value, ...options });
        } catch {
          // Can occur in Server Components where cookies cannot be written
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore?.set({ name, value: '', ...options });
        } catch {
          // Can occur in Server Components
        }
      },
    },
  });
}

export function createPublicServerSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (typeof window !== 'undefined') {
    throw new Error('Security Violation: lib/supabase/server.ts cannot be executed in client code.');
  }

  const { supabaseUrl, supabaseAnonKey } = resolvePublicSupabaseCredentials();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Server Configuration Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) must be configured in environment variables.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
