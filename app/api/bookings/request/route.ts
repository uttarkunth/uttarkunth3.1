import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { BookingRequestSchema } from '@/lib/validations';
import { calculateNights, validateStayDates, generateBookingReference } from '@/lib/booking-calculator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod input validation
    const parsed = BookingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: parsed.error.errors[0]?.message || 'Invalid booking parameters'
      }, { status: 400 });
    }

    const {
      property_id,
      room_unit_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      adults,
      children,
      special_requests
    } = parsed.data;

    // 2. Strict date validation
    const dateValidation = validateStayDates(check_in, check_out);
    if (!dateValidation.valid) {
      return NextResponse.json({
        ok: false,
        error: dateValidation.error
      }, { status: 400 });
    }

    const nights = calculateNights(check_in, check_out);

    // 3. Connect to Supabase
    const supabase = createAdminClient();

    // 4. Verify property is published and approved
    const { data: property, error: propErr } = await supabase
      .from('properties')
      .select('id, name, published, moderation_status')
      .eq('id', property_id)
      .single();

    if (propErr || !property || !property.published || property.moderation_status !== 'approved') {
      return NextResponse.json({
        ok: false,
        error: 'Property is not accepting booking requests at this time.'
      }, { status: 400 });
    }

    // 5. Verify room is active and check capacity
    const { data: room, error: roomErr } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, max_guests, base_price, active')
      .eq('id', room_unit_id)
      .eq('property_id', property_id)
      .eq('active', true)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({
        ok: false,
        error: 'Selected room is currently unavailable.'
      }, { status: 400 });
    }

    if ((adults + children) > room.max_guests) {
      return NextResponse.json({
        ok: false,
        error: `Total guests (${adults + children}) exceed room capacity of ${room.max_guests}.`
      }, { status: 400 });
    }

    // 6. Check for active date conflicts in stay_bookings
    const { data: conflictingBookings, error: conflictErr } = await supabase
      .from('stay_bookings')
      .select('id, check_in, check_out, status')
      .eq('room_unit_id', room_unit_id)
      .in('status', ['pending', 'confirmed'])
      .lt('check_in', check_out)
      .gt('check_out', check_in);

    if (conflictErr) {
      console.error('Conflict check error:', conflictErr);
    } else if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json({
        ok: false,
        error: 'The requested dates are no longer available for this room.'
      }, { status: 409 });
    }

    // 7. Check availability blocks
    const { data: blocks, error: blockErr } = await supabase
      .from('room_availability_blocks')
      .select('id')
      .eq('room_unit_id', room_unit_id)
      .lt('blocked_from', check_out)
      .gt('blocked_until', check_in);

    if (blocks && blocks.length > 0) {
      return NextResponse.json({
        ok: false,
        error: 'This room is blocked by the host for the selected dates.'
      }, { status: 409 });
    }

    // 8. Calculate trusted price server-side
    const totalEstimate = Math.round(Number(room.base_price) * nights);

    // 9. Generate reference and access token
    const bookingReference = generateBookingReference();
    const guestAccessToken = crypto.randomBytes(32).toString('hex');
    const guestAccessTokenHash = crypto.createHash('sha256').update(guestAccessToken).digest('hex');

    // 10. Insert into stay_bookings table
    const { data: newBooking, error: insertErr } = await supabase
      .from('stay_bookings')
      .insert({
        booking_reference: bookingReference,
        property_id: property.id,
        room_unit_id: room.id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        adults,
        children,
        rooms_count: 1,
        special_requests: specialRequests || null,
        status: 'pending',
        total_estimate: totalEstimate,
        guest_access_token_hash: guestAccessTokenHash
      })
      .select('id, booking_reference, status, total_estimate')
      .single();

    if (insertErr) {
      console.error('Booking insertion error:', insertErr);
      if (insertErr.message?.includes('overlapping') || insertErr.code === '23P01') {
        return NextResponse.json({
          ok: false,
          error: 'Dates were just booked by another guest. Please choose different dates.'
        }, { status: 409 });
      }
      throw new Error(insertErr.message || 'Database error creating booking request');
    }

    // Also mirror to booking_requests table for backward-compatible admin/host feeds
    try {
      await supabase.from('booking_requests').insert({
        booking_reference: bookingReference,
        property_id: property.id,
        room_unit_id: room.id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        adults,
        children,
        special_requests: specialRequests || null,
        estimated_total: totalEstimate,
        status: 'pending',
        guest_access_token_hash: guestAccessTokenHash
      });
    } catch {
      // Non-critical mirror
    }

    return NextResponse.json({
      ok: true,
      booking_reference: bookingReference,
      status: 'pending',
      nights,
      estimated_total: totalEstimate,
      guest_access_token: guestAccessToken
    });
  } catch (err: any) {
    console.error('Booking request failure:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to submit booking request.'
    }, { status: 500 });
  }
}
