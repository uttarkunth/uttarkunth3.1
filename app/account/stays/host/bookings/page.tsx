import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties, getHostBookings } from '@/lib/host';
import { BookingsManager } from '@/components/host/bookings-manager';

export const dynamic = 'force-dynamic';

export default async function HostBookingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/bookings');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  const propertyIds = properties.map((p: any) => p.id);
  const bookings = await getHostBookings(propertyIds);

  return <BookingsManager initialBookings={bookings} />;
}
