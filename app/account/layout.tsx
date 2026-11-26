import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { AccountNav } from '@/components/account-nav';
import { AccountLayoutFrame } from '@/components/account-layout-frame';

export const dynamic = 'force-dynamic';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user ? await checkIsPlatformAdmin(user.id) : false;

  let isHost = false;
  let sellerStatus: string | null = null;
  let tripsCount = 0;

  if (user) {
    try {
      const adminClient = createAdminClient();

      const { count: ownedCount } = await adminClient
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', user.id);

      if ((ownedCount || 0) > 0) {
        isHost = true;
      } else {
        const { count: assignedCount } = await (adminClient.from('property_hosts') as any)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('role', ['manager', 'co_host']);
        isHost = (assignedCount || 0) > 0;
      }

      const { data: sellerRecord } = await adminClient
        .from('sellers')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      sellerStatus = (sellerRecord as any)?.status || null;

      const { count } = await adminClient
        .from('stay_bookings')
        .select('id', { count: 'exact', head: true })
        .or(`guest_user_id.eq.${user.id},guest_email.eq.${user.email}`);
      tripsCount = count || 0;
    } catch {
      isHost = false;
      sellerStatus = null;
      tripsCount = 0;
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <AccountNav
        isAdmin={isAdmin}
        isHost={isHost}
        sellerStatus={sellerStatus}
        tripsCount={tripsCount}
      />
      <AccountLayoutFrame>{children}</AccountLayoutFrame>
    </div>
  );
}
