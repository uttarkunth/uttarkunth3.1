import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: true, isAdmin: false });
    }

    const isAdmin = await checkIsPlatformAdmin(user.id);
    return NextResponse.json({ ok: true, isAdmin });
  } catch (err) {
    console.error('Failed to resolve user admin role:', err);
    return NextResponse.json({ ok: true, isAdmin: false });
  }
}
