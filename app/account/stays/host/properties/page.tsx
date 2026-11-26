import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties } from '@/lib/host';
import { PropertiesCatalogClient } from '@/components/host/properties-catalog-client';

export const dynamic = 'force-dynamic';

export default async function HostPropertiesCatalogPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/properties');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  return <PropertiesCatalogClient initialProperties={properties} isAdmin={isAdmin} />;
}
