import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductionProposalSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: proposals, error } = await adminClient
      .from('production_proposals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        ok: true,
        available: false,
        proposals: [],
        message: 'Online film proposal registry is not yet open (pending database activation).',
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
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
      return NextResponse.json(
        { ok: false, error: 'Authentication required. Please sign in to submit a film proposal.' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Support filmmaker-initiated takedown/removal request
    if (body?.action === 'request_takedown') {
      const proposalId = String(body.proposal_id || '').trim();
      const takedownReason = String(body.reason || 'Filmmaker requested takedown/archival.').trim();

      if (!proposalId) {
        return NextResponse.json(
          { ok: false, error: 'Missing proposal_id for takedown request.' },
          { status: 400 }
        );
      }

      const adminClient = createAdminClient();
      const { data: existing, error: fetchErr } = await adminClient
        .from('production_proposals')
        .select('*')
        .eq('id', proposalId)
        .maybeSingle();

      if (fetchErr || !existing) {
        return NextResponse.json(
          { ok: false, error: 'Film proposal not found.' },
          { status: 404 }
        );
      }

      if (existing.user_id !== user.id) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: You can only request takedown for your own film proposals.' },
          { status: 403 }
        );
      }

      const combinedNotes = existing.admin_notes
        ? `${existing.admin_notes}\n[TAKEDOWN REQUESTED BY FILMMAKER]: ${takedownReason}`
        : `[TAKEDOWN REQUESTED BY FILMMAKER]: ${takedownReason}`;

      const { data: updated, error: updateErr } = await adminClient
        .from('production_proposals')
        .update({
          status: 'takedown_requested',
          admin_notes: combinedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json(
          { ok: false, error: updateErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        proposal: updated,
        message: 'Takedown request submitted to the Productions Editorial Desk.',
      });
    }

    const parsed = ProductionProposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid proposal data' },
        { status: 400 }
      );
    }

    const {
      title,
      category,
      synopsis,
      concept,
      proposed_location,
      cultural_relevance,
      support_needed,
      estimated_budget,
      portfolio_links,
    } = parsed.data;

    const adminClient = createAdminClient();

    // Check if filmmaker profile exists
    const { data: profile } = await adminClient
      .from('filmmaker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const filmmakerId = profile?.id || null;

    const { data: proposal, error: insertErr } = await adminClient
      .from('production_proposals')
      .insert({
        user_id: user.id,
        filmmaker_id: filmmakerId,
        title,
        category,
        synopsis,
        concept,
        proposed_location,
        cultural_relevance,
        support_needed,
        estimated_budget: estimated_budget || null,
        portfolio_links: portfolio_links || [],
        status: 'submitted',
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FEATURE_NOT_YET_OPEN',
          error:
            'Online film proposal submissions are not yet open while our Productions database module awaits production activation. Please send your pitch directly to info@uttarkunth.com.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Film proposal submitted successfully! Our production team will review your pitch within 3 to 5 business days.',
      proposal,
    });
  } catch (err: any) {
    console.error('Proposal POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}