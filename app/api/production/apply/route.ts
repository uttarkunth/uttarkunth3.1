import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FilmmakerApplicationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profile, error } = await adminClient
      .from('filmmaker_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({
        ok: true,
        available: false,
        profile: null,
        message: 'Online filmmaker profile registry is not yet open (pending database activation).',
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      profile: profile || null,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required. Please sign in to submit a filmmaker application.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = FilmmakerApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid application data' },
        { status: 400 }
      );
    }

    const {
      full_name,
      email,
      phone,
      location,
      creative_role,
      skills,
      portfolio_url,
      bio,
      collaboration_interests,
    } = parsed.data;

    const adminClient = createAdminClient();

    // Upsert filmmaker profile
    const { data: profile, error: upsertErr } = await adminClient
      .from('filmmaker_profiles')
      .upsert({
        user_id: user.id,
        full_name,
        email: email.toLowerCase(),
        phone: phone || null,
        location,
        creative_role,
        skills,
        portfolio_url: portfolio_url || null,
        bio,
        collaboration_interests,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (upsertErr) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FEATURE_NOT_YET_OPEN',
          error:
            'Online filmmaker registration is not yet open while our Productions database module awaits production activation. Please reach out directly to info@uttarkunth.com.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Filmmaker application submitted successfully. Our productions desk will contact you within 48 hours.',
      profile,
    });
  } catch (err: any) {
    console.error('Filmmaker apply route error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
