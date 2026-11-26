import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getHostProperties,
  getHostBookings,
  buildPreviewHostBlocks,
} from '@/lib/host';
import { CalendarView } from '@/components/host/calendar-view';

export const dynamic = 'force-dynamic';

export default async function HostCalendarPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties, isPreviewMode } = await getHostProperties(user?.id);

  const propertyIds = properties.map((p: any) => p.id);
  const roomUnitIds = properties.flatMap((p: any) =>
    Array.isArray(p.room_units) ? p.room_units.map((r: any) => r.id) : []
  );

  let confirmedBookings: any[] = [];
  let pendingBookings: any[] = [];
  let blocks: any[] = [];

  if (isPreviewMode) {
    const allBookings = await getHostBookings(propertyIds);
    confirmedBookings = allBookings.filter((b: any) => b.status === 'confirmed');
    pendingBookings = allBookings.filter((b: any) => b.status === 'pending');
    blocks = buildPreviewHostBlocks();
  } else {
    try {
      const adminClient = createAdminClient();
      if (propertyIds.length > 0) {
        const { data: bData } = await adminClient
          .from('stay_bookings')
          .select('*, properties(name, village, district), room_units(room_name, base_price)')
          .in('property_id', propertyIds)
          .in('status', ['pending', 'confirmed'])
          .order('check_in', { ascending: true });

        const allBookings = bData || [];
        confirmedBookings = allBookings.filter((b: any) => b.status === 'confirmed');
        pendingBookings = allBookings.filter((b: any) => b.status === 'pending');
      }

      if (roomUnitIds.length > 0) {
        const { data: blockData } = await adminClient
          .from('room_availability_blocks')
          .select(
            'id, room_unit_id, blocked_from, blocked_until, reason, created_at, room_units(room_name, property_id, properties(name))'
          )
          .in('room_unit_id', roomUnitIds)
          .order('blocked_from', { ascending: true });

        blocks = blockData || [];
      }
    } catch {
      const allBookings = await getHostBookings(propertyIds);
      confirmedBookings = allBookings.filter((b: any) => b.status === 'confirmed');
      pendingBookings = allBookings.filter((b: any) => b.status === 'pending');
      blocks = buildPreviewHostBlocks();
    }
  }

  return (
    <CalendarView
      properties={properties}
      confirmedBookings={confirmedBookings}
      pendingBookings={pendingBookings}
      blocks={blocks}
    />
  );
}
