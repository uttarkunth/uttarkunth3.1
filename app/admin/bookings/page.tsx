import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { BookingsSupervisor } from '@/components/admin/bookings-supervisor';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user || !isAdmin) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('*, properties(name, village), room_units(room_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BookingsSupervisor bookings={(bookings as any) || []} />
      </div>
    </div>
  );
}