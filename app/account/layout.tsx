import React from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { AccountNav } from '@/components/account-nav';

export const dynamic = 'force-dynamic';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const isAdmin = await checkIsPlatformAdmin(user.id);

  // Authoritative host access check: user must be assigned to at least one property
  let isHost = false;
  let tripsCount = 0;

  try {
    const adminClient = createAdminClient();

    // 1. Check primary host ownership
    const { count: ownedCount } = await adminClient
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id);

    if ((ownedCount || 0) > 0) {
      isHost = true;
    } else {
      // 2. Check co-host / manager assignments
      const { count: assignedCount } = await (adminClient.from('property_hosts') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('role', ['manager', 'co_host']);
      isHost = (assignedCount || 0) > 0;
    }

    // 3. Query trips count for this user
    const { count } = await adminClient
      .from('stay_bookings')
      .select('id', { count: 'exact', head: true })
      .or(`guest_user_id.eq.${user.id},guest_email.eq.${user.email}`);
    tripsCount = count || 0;
  } catch (err) {
    isHost = false;
    tripsCount = 0;
  }

  return (
    <div className="min-h-screen bg-warm-canvas/60">
      <AccountNav isAdmin={isAdmin} isHost={isHost} tripsCount={tripsCount} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
