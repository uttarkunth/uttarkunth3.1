import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties, buildPreviewHostReviews } from '@/lib/host';
import { ReviewsManager } from '@/components/host/reviews-manager';

export const dynamic = 'force-dynamic';

export default async function HostReviewsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties, isPreviewMode } = await getHostProperties(user?.id);
  const propertyIds = properties.map((p: any) => p.id);

  let reviews: any[] = [];

  if (isPreviewMode) {
    reviews = buildPreviewHostReviews();
  } else if (propertyIds.length > 0) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from('reviews')
        .select(
          'id, property_id, reviewer_name, rating, comment, moderation_status, created_at, properties(name)'
        )
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      reviews = data && data.length > 0 ? data : buildPreviewHostReviews();
    } catch {
      reviews = buildPreviewHostReviews();
    }
  }

  return <ReviewsManager initialReviews={reviews} />;
}
