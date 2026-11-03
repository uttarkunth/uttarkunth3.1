import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    const isAdmin = user ? await checkIsPlatformAdmin(user.id) : false;
    if (authErr || !user || !isAdmin) {
      return NextResponse.json({
        ok: false,
        error: 'Forbidden: Platform administrator privileges required.'
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      property_id,
      host_user_id,
      host_name,
      host_contact,
      agreement_start,
      agreement_end,
      intro_commission_percent = 0,
      intro_period_months = 12,
      standard_commission_percent = 10,
      agreement_status = 'draft',
      host_accepted = false,
      accepted_at,
      acceptance_reference,
      notes
    } = body;

    if (!property_id || !host_name || !agreement_start) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required agreement terms: property_id, host_name, agreement_start.'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Strict bilateral verification:
    // Every new commercial agreement begins strictly in 'draft' status with accepted_at = null.
    // Demonstrable host acceptance is executed exclusively via the authorized bilateral acceptance workflow.
    const agreementData: any = {
      property_id,
      host_user_id: host_user_id || null,
      host_name: host_name.trim(),
      host_contact: host_contact?.trim() || null,
      agreement_start,
      agreement_end: agreement_end || null,
      commission_percent: Number(standard_commission_percent),
      intro_commission_percent: Number(intro_commission_percent),
      intro_period_months: Number(intro_period_months),
      standard_commission_percent: Number(standard_commission_percent),
      agreement_status: 'draft',
      notes: notes ? notes.trim() : null,
      accepted_at: null,
      terms_version: '2026.1'
    };

    const { data: agreement, error: insertErr } = await adminClient
      .from('host_agreements')
      .insert(agreementData)
      .select('id')
      .single();

    if (insertErr) {
      throw insertErr;
    }

    // Insert into audit log
    await adminClient.from('admin_audit_log').insert({
      actor_user_id: user.id,
      action: 'host_agreement_created',
      target_type: 'agreement',
      target_id: agreement.id,
      details: {
        property_id,
        host_name,
        standard_commission_percent,
        intro_commission_percent,
        status: 'draft',
        admin_email: user.email
      }
    });

    return NextResponse.json({
      ok: true,
      agreement_id: agreement.id,
      message: 'Commercial terms saved as Draft (Pending demonstrable host acceptance).'
    });
  } catch (err: any) {
    console.error('Agreement creation error:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to authorize host agreement.'
    }, { status: 500 });
  }
}
