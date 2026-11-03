import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { booking_reference, reason } = await req.json();

    if (!booking_reference) {
      return NextResponse.json({ ok: false, error: 'Booking reference is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: booking, error: findErr } = await supabase
      .from('stay_bookings')
      .select('id, booking_reference, check_in, status')
      .eq('booking_reference', booking_reference)
      .single();

    if (findErr || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ ok: true, status: 'cancelled', message: 'Booking is already cancelled.' });
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return NextResponse.json({ ok: false, error: `Cannot cancel booking with status: ${booking.status}` }, { status: 400 });
    }

    // Check-in date check for confirmed bookings
    const checkInDate = new Date(booking.check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (booking.status === 'confirmed' && checkInDate <= today) {
      return NextResponse.json({
        ok: false,
        error: 'Stays starting today or in the past cannot be cancelled online. Please contact the host directly.'
      }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('stay_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    try {
      await supabase
        .from('booking_requests')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || 'Cancelled by guest',
          updated_at: new Date().toISOString()
        })
        .eq('booking_reference', booking_reference);
    } catch {
      // Ignored
    }

    return NextResponse.json({
      ok: true,
      booking_reference,
      status: 'cancelled'
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to cancel booking.'
    }, { status: 500 });
  }
}
