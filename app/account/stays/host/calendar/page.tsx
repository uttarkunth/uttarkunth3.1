import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties } from '@/lib/host';
import { HostSubnav } from '@/components/host-subnav';
import { CalendarView } from '@/components/host/calendar-view';

export const dynamic = 'force-dynamic';

export default async function HostCalendarPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/calendar');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  const propertyIds = properties.map((p) => p.id);
  const roomUnitIds = properties.flatMap((p) =>
    Array.isArray(p.room_units) ? p.room_units.map((r: any) => r.id) : []
  );

  const adminClient = createAdminClient();

  // Query confirmed and pending bookings
  let confirmedBookings: any[] = [];
  let pendingBookings: any[] = [];
  if (propertyIds.length > 0) {
    const { data: bData } = await adminClient
      .from('stay_bookings')
      .select('id, booking_reference, check_in, check_out, status, guest_name, property_id, room_unit_id, properties(name), room_units(room_name)')
      .in('property_id', propertyIds)
      .in('status', ['pending', 'confirmed'])
      .order('check_in', { ascending: true });

    const allBookings = bData || [];
    confirmedBookings = allBookings.filter((b) => b.status === 'confirmed');
    pendingBookings = allBookings.filter((b) => b.status === 'pending');
  }

  // Query manual room availability blocks
  let blocks: any[] = [];
  if (roomUnitIds.length > 0) {
    const { data: blockData } = await adminClient
      .from('room_availability_blocks')
      .select('id, room_unit_id, blocked_from, blocked_until, reason, created_at, room_units(room_name, property_id, properties(name))')
      .in('room_unit_id', roomUnitIds)
      .order('blocked_from', { ascending: true });

    blocks = blockData || [];
  }

  return (
    <div className="space-y-6">
      <HostSubnav
        pendingCount={pendingBookings.length}
        propertiesCount={properties.length}
      />
      <CalendarView
        properties={properties}
        confirmedBookings={confirmedBookings}
        pendingBookings={pendingBookings}
        blocks={blocks}
      />
    </div>
  );
}
