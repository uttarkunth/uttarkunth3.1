import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties, getHostBookings } from '@/lib/host';
import { PerformanceInsightsClient } from '@/components/host/performance-insights-client';

export const dynamic = 'force-dynamic';

export default async function HostPerformancePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/performance');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  const propertyIds = properties.map((p: any) => p.id);
  const bookings = propertyIds.length > 0 ? await getHostBookings(propertyIds) : [];

  const adminClient = createAdminClient();
  let reviews: any[] = [];
  if (propertyIds.length > 0) {
    const { data } = await adminClient
      .from('reviews')
      .select('id, property_id, reviewer_name, rating, comment, created_at')
      .in('property_id', propertyIds);
    reviews = data || [];
  }

  return (
    <PerformanceInsightsClient
      initialProperties={properties}
      initialBookings={bookings}
      initialReviews={reviews}
    />
  );
}
