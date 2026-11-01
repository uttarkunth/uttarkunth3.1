import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { HostDecisionSchema } from '@/lib/validations';
import { computeCommission } from '@/lib/commission';
import { isPlatformAdmin } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({
        ok: false,
        error: 'Authentication required to decide on booking requests.'
      }, { status: 401 });
    }

    const body = await req.json();
    const parsed = HostDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: parsed.error.errors[0]?.message || 'Invalid decision payload'
      }, { status: 400 });
    }

    const { booking_id, action, host_notes } = parsed.data;

    // Use admin client for database operations
    const adminSupabase = createAdminClient();

    // Fetch the booking
    const { data: booking, error: bErr } = await adminSupabase
      .from('stay_bookings')
      .select('id, booking_reference, property_id, room_unit_id, status, total_estimate, check_in, check_out')
      .eq('id', booking_id)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({
        ok: false,
        error: 'Booking request not found.'
      }, { status: 404 });
    }

    // Check ownership or admin privilege
    const { data: property } = await adminSupabase
      .from('properties')
      .select('id, host_id')
      .eq('id', booking.property_id)
      .single();

    const isPropertyHost = property?.host_id === user.id;
    const isAdmin = isPlatformAdmin(user.email);

    if (!isPropertyHost && !isAdmin) {
      return NextResponse.json({
        ok: false,
        error: 'Unauthorized: you do not have permission to manage bookings for this property.'
      }, { status: 403 });
    }

    let newStatus = 'pending';
    let commissionPercent = 0;
    let commissionAmount = 0;

    if (action === 'confirm') {
      newStatus = 'confirmed';

      // Compute commission snapshot
      const { data: agreement } = await adminSupabase
        .from('host_agreements')
        .select('agreement_start, intro_period_months, intro_commission_percent, standard_commission_percent')
        .eq('property_id', booking.property_id)
        .eq('agreement_status', 'active')
        .order('agreement_start', { ascending: false })
        .limit(1)
        .single();

      const snapshot = computeCommission(
        Number(booking.total_estimate || 0),
        agreement?.agreement_start,
        agreement?.intro_period_months ?? 12,
        Number(agreement?.intro_commission_percent ?? 0),
        Number(agreement?.standard_commission_percent ?? 10)
      );

      commissionPercent = snapshot.percent;
      commissionAmount = snapshot.amount;
    } else if (action === 'decline') {
      newStatus = 'declined';
    } else {
      newStatus = 'cancelled';
    }

    // Update stay_bookings
    const { error: updateErr } = await adminSupabase
      .from('stay_bookings')
      .update({
        status: newStatus,
        host_notes: host_notes?.trim() || null,
        commission_percent_snapshot: commissionPercent,
        commission_amount_snapshot: commissionAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    // Mirror to booking_requests if present
    try {
      await adminSupabase
        .from('booking_requests')
        .update({
          status: newStatus === 'declined' ? 'rejected' : newStatus,
          host_notes: host_notes?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('booking_reference', booking.booking_reference);
    } catch {
      // Ignored
    }

    // Audit log
    try {
      await adminSupabase.from('admin_audit_log').insert({
        actor_user_id: user.id,
        action: 'booking_decided',
        target_type: 'booking',
        target_id: booking_id,
        details: {
          decision: newStatus,
          booking_reference: booking.booking_reference,
          commission_percent: commissionPercent,
          commission_amount: commissionAmount
        }
      });
    } catch {
      // Ignored
    }

    return NextResponse.json({
      ok: true,
      booking_id,
      booking_reference: booking.booking_reference,
      status: newStatus,
      commission_percent_snapshot: commissionPercent,
      commission_amount_snapshot: commissionAmount
    });
  } catch (err: any) {
    console.error('Decision error:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to update booking status.'
    }, { status: 500 });
  }
}
