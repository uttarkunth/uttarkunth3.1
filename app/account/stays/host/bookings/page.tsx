import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties, getHostBookings } from '@/lib/host';
import { BookingsManager } from '@/components/host/bookings-manager';

export const dynamic = 'force-dynamic';

export default async function HostBookingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties } = await getHostProperties(user?.id);
  const propertyIds = properties.map((p: any) => p.id);
  const bookings = await getHostBookings(propertyIds);

  return <BookingsManager initialBookings={bookings} />;
}
