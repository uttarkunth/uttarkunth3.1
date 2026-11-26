import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties } from '@/lib/host';
import { ReviewsManager } from '@/components/host/reviews-manager';

export const dynamic = 'force-dynamic';

export default async function HostReviewsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/reviews');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  const propertyIds = properties.map((p: any) => p.id);

  const adminClient = createAdminClient();
  let reviews: any[] = [];

  if (propertyIds.length > 0) {
    const { data } = await adminClient
      .from('reviews')
      .select(
        'id, property_id, reviewer_name, rating, comment, moderation_status, created_at, properties(name)'
      )
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (data) {
      reviews = data;
    }
  }

  return <ReviewsManager initialReviews={reviews} />;
}
