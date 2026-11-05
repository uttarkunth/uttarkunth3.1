import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveMemberCapabilities } from '@/lib/roles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const meta = user.user_metadata || {};
    let dbProfile: any = null;

    try {
      const adminClient = createAdminClient();
      const { data } = await (adminClient.from('profiles' as any) as any)
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      dbProfile = data;
    } catch {
      dbProfile = null;
    }

    const capabilities = await resolveMemberCapabilities(user.id);

    const profile = {
      id: user.id,
      full_name: dbProfile?.full_name || meta.full_name || 'Uttarkunth Member',
      preferred_name:
        dbProfile?.preferred_name || meta.preferred_name || dbProfile?.full_name || meta.full_name || '',
      avatar_url: dbProfile?.avatar_url || meta.avatar_url || null,
      email: dbProfile?.email || user.email || '',
      phone: dbProfile?.phone || meta.phone || '',
      address: dbProfile?.address || meta.address || '',
      location: dbProfile?.location || meta.location || '',
      bio: dbProfile?.bio || meta.bio || '',
      mountain_interests: Array.isArray(dbProfile?.mountain_interests)
        ? dbProfile.mountain_interests
        : Array.isArray(meta.mountain_interests)
        ? meta.mountain_interests
        : [],
      contact_verified: Boolean(dbProfile?.contact_verified ?? user.email_confirmed_at),
    };

    return NextResponse.json({
      ok: true,
      profile,
      capabilities,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

async function handleSaveProfile(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const fullName = String(body.full_name || '').trim();
    if (!fullName) {
      return NextResponse.json({ ok: false, error: 'Full name is required.' }, { status: 400 });
    }

    const preferredName = String(body.preferred_name || fullName).trim();
    const avatarUrl = body.avatar_url ? String(body.avatar_url).trim() : null;
    const phone = String(body.phone || '').trim();
    const address = String(body.address || '').trim();
    const location = String(body.location || '').trim();
    const bio = String(body.bio || '').trim();
    const mountainInterests = Array.isArray(body.mountain_interests)
      ? body.mountain_interests.map((t: any) => String(t))
      : [];

    const nowIso = new Date().toISOString();
    const rowPayload = {
      id: user.id,
      full_name: fullName,
      preferred_name: preferredName,
      avatar_url: avatarUrl,
      email: user.email || '',
      phone: phone || null,
      address: address || null,
      location: location || null,
      bio: bio || null,
      mountain_interests: mountainInterests,
      contact_verified: Boolean(user.email_confirmed_at),
      updated_at: nowIso,
    };

    let savedInProfilesTable = false;
    try {
      const adminClient = createAdminClient();
      const { error: upsertErr } = await (adminClient.from('profiles' as any) as any).upsert(
        rowPayload,
        { onConflict: 'id' }
      );
      if (!upsertErr) {
        savedInProfilesTable = true;
      }
    } catch {
      savedInProfilesTable = false;
    }

    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        preferred_name: preferredName,
        avatar_url: avatarUrl,
        phone,
        address,
        location,
        bio,
        mountain_interests: mountainInterests,
      },
    });

    return NextResponse.json({
      ok: true,
      savedInProfilesTable,
      profile: rowPayload,
      message: 'Member profile updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleSaveProfile(req);
}

export async function POST(req: NextRequest) {
  return handleSaveProfile(req);
}