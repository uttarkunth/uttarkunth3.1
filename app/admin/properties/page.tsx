import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { PropertyModerationEngine } from '@/components/admin/property-moderation';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAdmin = user ? await checkIsPlatformAdmin(user.id) : false;
  if (!user || !isAdmin) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();
  const { data: properties } = await adminClient
    .from('properties')
    .select('*, room_units(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PropertyModerationEngine initialProperties={properties || []} />
      </div>
    </div>
  );
}
