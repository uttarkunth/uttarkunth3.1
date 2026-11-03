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

    const { data: profiles } = await adminClient
      .from('filmmaker_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: proposals } = await adminClient
      .from('production_proposals')
      .select('*, filmmaker_profiles(full_name, email, creative_role)')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ok: true,
      profiles: profiles || [],
      proposals: proposals || [],
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
      return NextResponse.json({ ok: false, error: 'Missing target_type, target_id, or action.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (target_type === 'proposal') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'request_revision') newStatus = 'revision_requested';
      else if (action === 'in_production') newStatus = 'in_production';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid proposal action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('production_proposals')
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
            error: updateErr?.message || 'Production proposals table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      // Record in audit log if possible
      try {
        await adminClient.from('admin_audit_log').insert({
          actor_user_id: user.id,
          action: 'property_moderated', // using supported enum from schema
          target_type: 'property', // supported enum in schema
          target_id: target_id,
          details: {
            subsystem: 'productions',
            proposal_id: target_id,
            action,
            new_status: newStatus,
            notes,
          },
        });
      } catch (auditErr) {
        console.warn('Audit log write note:', auditErr);
      }

      return NextResponse.json({ ok: true, proposal: updated || { id: target_id, status: newStatus } });
    }

    if (target_type === 'profile') {
      let newStatus: string;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'in_discussion') newStatus = 'in_discussion';
      else {
        return NextResponse.json({ ok: false, error: 'Invalid profile action.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await adminClient
        .from('filmmaker_profiles')
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
            error: updateErr?.message || 'Filmmaker profiles table is not yet active in the production database.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ ok: true, profile: updated || { id: target_id, status: newStatus } });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported target type' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin productions POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
