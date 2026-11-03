import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties, getHostBookings } from '@/lib/host';
import { HostSubnav } from '@/components/host-subnav';
import { BookingsManager } from '@/components/host/bookings-manager';

export const dynamic = 'force-dynamic';

export default async function HostBookingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/bookings');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  const propertyIds = properties.map((p) => p.id);
  const bookings = await getHostBookings(propertyIds);
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="space-y-6">
      <HostSubnav
        pendingCount={pendingCount}
        propertiesCount={properties.length}
      />
      <BookingsManager initialBookings={bookings} />
    </div>
  );
}
