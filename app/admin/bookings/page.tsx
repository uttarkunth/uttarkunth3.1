import React from 'react';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { BookingsSupervisor } from '@/components/admin/bookings-supervisor';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const auth = await requireStaffPermission('property.assign_host', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('support.manage_tickets', { requireMfaAal2: false })
    : auth;

  if (!finalAuth.authorized || !finalAuth.user) {
    return (
      <div className="pb-16 bg-ivory min-h-screen">
        <AdminNav />
        <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest">Access Restricted</h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Stay booking supervision requires explicit &apos;property.assign_host&apos; or &apos;support.manage_tickets&apos; staff authority.
          </p>
        </div>
      </div>
    );
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
