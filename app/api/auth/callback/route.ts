import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sanitizeInternalRedirectPath } from '@/lib/staff-rbac-shared';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const safeNext = sanitizeInternalRedirectPath(requestUrl.searchParams.get('next'), '/');

  if (code) {
    const supabase = createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
