import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties } from '@/lib/host';
import { HostSettingsClient } from '@/components/host/host-settings-client';

export const dynamic = 'force-dynamic';

export default async function HostSettingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/settings');
  }

  const { isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  return <HostSettingsClient />;
}
