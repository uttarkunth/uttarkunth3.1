import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties } from '@/lib/host';
import { PropertiesCatalogClient } from '@/components/host/properties-catalog-client';

export const dynamic = 'force-dynamic';

export default async function HostPropertiesCatalogPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties, isAdmin } = await getHostProperties(user?.id);

  return <PropertiesCatalogClient initialProperties={properties} isAdmin={isAdmin} />;
}
