import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { HostDecisionSchema } from '@/lib/validations';

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

    const contentType = req.headers.get('content-type') || '';
    let rawData: any = {};

    if (contentType.includes('application/json')) {
      rawData = await req.json();
    } else {
      const formData = await req.formData();
      rawData = Object.fromEntries(formData.entries());
    }

    const parsed = HostDecisionSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: parsed.error.errors[0]?.message || 'Invalid decision payload'
      }, { status: 400 });
    }

    const { booking_id, action, host_notes } = parsed.data;

    // Use admin client for database RPC execution
    const adminSupabase = createAdminClient();

    // Call the transactional respond_to_stay_booking RPC function
    // which acquires room-level row locks (FOR UPDATE), checks confirmed overlaps and blocks
    const { data: rpcResult, error: rpcErr } = await (adminSupabase.rpc as any)('respond_to_stay_booking', {
      p_stay_booking_id: booking_id,
      p_action: action,
      p_actor_user_id: user.id,
      p_host_notes: host_notes?.trim() || null
    });

    if (rpcErr) {
      const isConflict = rpcErr.message.toLowerCase().includes('conflict') ||
                         rpcErr.message.toLowerCase().includes('already has a confirmed') ||
                         rpcErr.message.toLowerCase().includes('blocked');
      return NextResponse.json({
        ok: false,
        error: rpcErr.message
      }, { status: isConflict ? 409 : 400 });
    }

    const resultObj = rpcResult as any;

    // Mirror to booking_requests table if present
    try {
      if (resultObj?.booking_reference) {
        await adminSupabase
          .from('booking_requests')
          .update({
            status: action === 'decline' ? 'rejected' : action === 'confirm' ? 'confirmed' : 'cancelled',
            host_notes: host_notes?.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('booking_reference', resultObj.booking_reference);
      }
    } catch {
      // Ignored
    }

    // If request was from an HTML form, redirect back
    const acceptHeader = req.headers.get('accept') || '';
    if (acceptHeader.includes('text/html') && !contentType.includes('application/json')) {
      return NextResponse.redirect(new URL('/account/stays/host/bookings', req.url), 303);
    }

    return NextResponse.json({
      ok: true,
      data: rpcResult
    });
  } catch (err: any) {
    console.error('Decision error:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to update booking status.'
    }, { status: 500 });
  }
}
