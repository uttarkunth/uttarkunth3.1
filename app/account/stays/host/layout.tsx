import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHostProperties, getHostBookings } from '@/lib/host';
import { HostWorkspaceShell } from '@/components/host/host-workspace-shell';

export const dynamic = 'force-dynamic';

export default async function HostWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { properties, isHost, isAdmin } = await getHostProperties(user?.id);
  const propertyIds = properties.map((p: any) => p.id);
  const bookings = propertyIds.length > 0 ? await getHostBookings(propertyIds) : [];
  const pendingCount = bookings.filter((b: any) => b.status === 'pending').length;

  return (
    <HostWorkspaceShell
      properties={properties}
      pendingCount={pendingCount}
      isHost={isHost}
      isAdmin={isAdmin}
      userEmail={user?.email || 'host@uttarkunth.com'}
    >
      {children}
    </HostWorkspaceShell>
  );
}
