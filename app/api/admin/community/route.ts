import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkIsPlatformAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden: Platform administrator access required.' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data: participations } = await adminClient
      .from('community_participations')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: stories } = await adminClient
      .from('community_stories')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ok: true,
      participations: participations || [],
      stories: stories || [],
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
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkIsPlatformAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Forbidden: Platform administrator access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { target_type, target_id, action, notes } = body;

    if (!target_type || !target_id || !action) {
      return NextResponse.json({ ok: false, error: 'Missing parameters' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (target_type === 'participation') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'decline') newStatus = 'declined';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid participation action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('community_participations')
        .update({
          status: newStatus,
          admin_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target_id)
        .select()
        .maybeSingle();

      if (updateErr || !updated) {
        return NextResponse.json(
          {
            ok: false,
            code: 'FEATURE_NOT_YET_OPEN',
            error: updateErr?.message || 'Community participations table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ ok: true, participation: updated || { id: target_id, status: newStatus } });
    }

    if (target_type === 'story') {
      let newStatus: string;
      if (action === 'publish') newStatus = 'published';
      else if (action === 'reject') newStatus = 'rejected';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid story action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('community_stories')
        .update({
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target_id)
        .select()
        .maybeSingle();

      if (updateErr || !updated) {
        return NextResponse.json(
          {
            ok: false,
            code: 'FEATURE_NOT_YET_OPEN',
            error: updateErr?.message || 'Community stories table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ ok: true, story: updated || { id: target_id, status: newStatus } });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported target type' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin community POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
