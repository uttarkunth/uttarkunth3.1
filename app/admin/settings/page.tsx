import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveFounderOrAdminSession } from '@/lib/auth';
import { CommercialAgreementManager } from '@/components/admin/agreement-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const { user, isAdmin } = await resolveFounderOrAdminSession();

  if (!user || !isAdmin) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();

  // Fetch properties
  const { data: properties } = await adminClient
    .from('properties')
    .select('id, name, village, district')
    .order('name');

  // Fetch host_agreements
  const { data: agreements } = await adminClient
    .from('host_agreements')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <CommercialAgreementManager
          properties={properties || []}
          agreements={agreements || []}
        />
      </div>
    </div>
  );
}