import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { booking_reference, guest_access_token, reason } = body || {};

    if (!booking_reference || typeof booking_reference !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Booking reference is required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { data: booking, error: findErr } = await adminSupabase
      .from('stay_bookings')
      .select(
        'id, booking_reference, property_id, guest_email, guest_access_token_hash, check_in, status'
      )
      .eq('booking_reference', booking_reference.trim())
      .single();

    if (findErr || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 });
    }

    // Verify caller authorization:
    // 1. Valid cryptographic guest_access_token matching guest_access_token_hash, OR
    // 2. Authenticated user whose email matches booking.guest_email, OR
    // 3. Authenticated property host for booking.property_id, OR
    // 4. Active staff member with stays.bookings.manage (support.manage_tickets) + AAL2 MFA
    let isAuthorized = false;
    let actorLabel = 'guest';

    if (
      guest_access_token &&
      typeof guest_access_token === 'string' &&
      booking.guest_access_token_hash
    ) {
      const providedHash = crypto
        .createHash('sha256')
        .update(guest_access_token.trim(), 'utf8')
        .digest('hex');
      const expectedBuf = Buffer.from(String(booking.guest_access_token_hash), 'utf8');
      const providedBuf = Buffer.from(providedHash, 'utf8');
      if (
        expectedBuf.length === providedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        isAuthorized = true;
        actorLabel = 'guest_token';
      }
    }

    let sessionUser: { id: string; email?: string } | null = null;
    if (!isAuthorized) {
      const supabase = createServerSupabaseClient();
      const { data: authData } = await supabase.auth.getUser();
      sessionUser = authData?.user || null;

      if (sessionUser) {
        // Check if authenticated user is the guest
        if (
          sessionUser.email &&
          booking.guest_email &&
          sessionUser.email.trim().toLowerCase() === booking.guest_email.trim().toLowerCase()
        ) {
          isAuthorized = true;
          actorLabel = 'authenticated_guest';
        }

        // Check if authenticated user is the primary host or manager of the property
        if (!isAuthorized && booking.property_id) {
          const { data: prop } = await adminSupabase
            .from('properties')
            .select('host_id')
            .eq('id', booking.property_id)
            .maybeSingle();

          if (prop?.host_id === sessionUser.id) {
            isAuthorized = true;
            actorLabel = 'primary_host';
          } else {
            const { data: hostAssign } = await (adminSupabase.from('property_hosts') as any)
              .select('id, role')
              .eq('property_id', booking.property_id)
              .eq('user_id', sessionUser.id)
              .in('role', ['primary_host', 'manager'])
              .maybeSingle();
            if (hostAssign) {
              isAuthorized = true;
              actorLabel = 'property_manager';
            }
          }
        }

        // Check if authenticated user is authorized Stays/Support staff with AAL2
        if (!isAuthorized) {
          const staffAuth = await requireStaffPermission('stays.bookings.manage', {
            requireMfaAal2: true,
          });
          if (staffAuth.authorized && staffAuth.staffProfile) {
            isAuthorized = true;
            actorLabel = `staff:${staffAuth.staffProfile.staff_id}`;
            await recordStaffAuditLog({
              actorUserId: sessionUser.id,
              actorEmail: sessionUser.email,
              staffId: staffAuth.staffProfile.staff_id,
              roleSlug: staffAuth.staffProfile.role_slug,
              action: 'booking_cancelled_by_staff',
              targetType: 'stay_booking',
              targetId: String(booking.id),
              reason: reason || 'Staff booking cancellation',
              afterState: { booking_reference: booking.booking_reference, status: 'cancelled' },
            });
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          ok: false,
          code: 'BOOKING_CANCELLATION_UNAUTHORIZED',
          error:
            'Forbidden: Cancelling a booking requires a valid guest access token, the signed-in guest account, the property host, or authorized Stays staff.',
        },
        { status: 403 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({
        ok: true,
        status: 'cancelled',
        message: 'Booking is already cancelled.',
      });
    }

    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return NextResponse.json(
        { ok: false, error: `Cannot cancel booking with status: ${booking.status}` },
        { status: 400 }
      );
    }

    const checkInDate = new Date(booking.check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (booking.status === 'confirmed' && checkInDate <= today && !actorLabel.startsWith('staff:')) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Stays starting today or in the past cannot be cancelled online. Please contact the host directly.',
        },
        { status: 400 }
      );
    }

    const { error: updateErr } = await adminSupabase
      .from('stay_bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (updateErr) {
      throw new Error(updateErr.message);
    }

    try {
      await adminSupabase
        .from('booking_requests')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || `Cancelled by ${actorLabel}`,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_reference', booking_reference.trim());
    } catch {
      // Ignored
    }

    return NextResponse.json({
      ok: true,
      booking_reference: booking.booking_reference,
      status: 'cancelled',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Failed to cancel booking.',
      },
      { status: 500 }
    );
  }
}
