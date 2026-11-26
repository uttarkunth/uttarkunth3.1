import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties, getHostBookings } from '@/lib/host';
import { HostOverviewClient } from '@/components/host/host-overview-client';

export const dynamic = 'force-dynamic';

export default async function HostOverviewPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties, isAdmin, isPreviewMode } = await getHostProperties(user?.id);
  const propertyIds = properties.map((p: any) => p.id);
  const bookings = propertyIds.length > 0 ? await getHostBookings(propertyIds) : [];

  let rawAgreements: any[] = [];
  if (!isPreviewMode && propertyIds.length > 0) {
    try {
      const adminClient = createAdminClient();
      const { data } = await adminClient
        .from('host_agreements')
        .select('*, properties(name)')
        .in('property_id', propertyIds);
      rawAgreements = data || [];
    } catch {
      rawAgreements = [];
    }
  }

  return (
    <HostOverviewClient
      initialProperties={properties}
      initialBookings={bookings}
      agreements={rawAgreements}
      isAdmin={isAdmin}
    />
  );
}