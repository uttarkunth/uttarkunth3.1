import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getHostProperties,
  getHostBookings,
  buildPreviewHostReviews,
} from '@/lib/host';
import { PerformanceInsightsClient } from '@/components/host/performance-insights-client';

export const dynamic = 'force-dynamic';

export default async function HostPerformancePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties, isPreviewMode } = await getHostProperties(user?.id);
  const propertyIds = properties.map((p: any) => p.id);
  const bookings = propertyIds.length > 0 ? await getHostBookings(propertyIds) : [];

  let reviews: any[] = [];
  if (isPreviewMode) {
    reviews = buildPreviewHostReviews();
  } else if (propertyIds.length > 0) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from('reviews')
        .select('id, property_id, reviewer_name, rating, comment, created_at')
        .in('property_id', propertyIds);
      reviews = data && data.length > 0 ? data : buildPreviewHostReviews();
    } catch {
      reviews = buildPreviewHostReviews();
    }
  }

  return (
    <PerformanceInsightsClient
      initialProperties={properties}
      initialBookings={bookings}
      initialReviews={reviews}
    />
  );
}
