import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CommunityParticipationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: participations, error } = await adminClient
      .from('community_participations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        ok: true,
        available: false,
        participations: [],
        message: 'Online participation registry is not yet open (pending database activation).',
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      participations: participations || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const parsed = CommunityParticipationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid participation details' },
        { status: 400 }
      );
    }

    const {
      initiative_slug,
      full_name,
      email,
      phone,
      skills,
      duration,
      motivation,
    } = parsed.data;

    const adminClient = createAdminClient();

    const { data: record, error: insertErr } = await adminClient
      .from('community_participations')
      .insert({
        user_id: user?.id || null,
        initiative_slug,
        full_name,
        email: email.toLowerCase(),
        phone: phone || null,
        skills,
        duration,
        motivation,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FEATURE_NOT_YET_OPEN',
          error:
            'Online community participation applications are not yet open while our Community database module awaits production activation. Please email info@uttarkunth.com directly.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Your community participation application has been submitted successfully! Our field desk will review your submission.',
      participation: record,
    });
  } catch (err: any) {
    console.error('Community participate POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
