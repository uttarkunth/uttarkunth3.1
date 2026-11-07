import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { attachPrivateLocationToProperty } from '@/lib/host';
import { PropertyModerationEngine } from '@/components/admin/property-moderation';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const auth = await requireStaffPermission('property.review');

  if (!auth.authorized || !auth.user) {
    return (
      <div className="pb-16 bg-ivory min-h-screen">
        <AdminNav />
        <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest">Access Restricted</h1>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Homestay and property moderation requires explicit &apos;property.review&apos; staff authority.
          </p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();
  const { data: properties } = await adminClient
    .from('properties')
    .select('*, room_units(*), property_private_locations(*)')
    .order('created_at', { ascending: false });

  const enrichedProperties = (properties || []).map(attachPrivateLocationToProperty);

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PropertyModerationEngine initialProperties={enrichedProperties} />
      </div>
    </div>
  );
}
