import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties } from '@/lib/host';
import { HostSupportClient } from '@/components/host/host-support-client';

export const dynamic = 'force-dynamic';

export default async function HostSupportPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/support');
  }

  const { isHost, isAdmin } = await getHostProperties(user.id);

  if (!isHost && !isAdmin) {
    redirect('/account/stays/host');
  }

  return <HostSupportClient />;
}
