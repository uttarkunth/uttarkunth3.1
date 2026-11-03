import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { HostAssignmentsManager } from '@/components/admin/host-assignments';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAdmin = user ? await checkIsPlatformAdmin(user.id) : false;
  if (!user || !isAdmin) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();

  // 1. Fetch properties
  const { data: rawProperties } = await adminClient
    .from('properties')
    .select('id, name, slug, village, district, property_type, host_id')
    .order('name');

  // 2. Fetch property_hosts assignments
  const { data: rawHosts } = await (adminClient.from('property_hosts') as any)
    .select('*');

  // 3. Fetch registered users via admin auth API
  let knownUsers: Array<{ id: string; email: string; fullName?: string }> = [];
  try {
    const { data: authData } = await adminClient.auth.admin.listUsers();
    if (authData?.users) {
      knownUsers = authData.users.map((u) => ({
        id: u.id,
        email: u.email || 'Unknown Email',
        fullName: u.user_metadata?.full_name || u.user_metadata?.name || undefined,
      }));
    }
  } catch (err) {
    console.warn('Failed to list auth users:', err);
  }

  // Combine properties with their team hosts
  const properties = (rawProperties || []).map((p) => ({
    ...p,
    hosts: (rawHosts || []).filter((h: any) => h.property_id === p.id),
  }));

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <HostAssignmentsManager
          properties={properties}
          knownUsers={knownUsers}
        />
      </div>
    </div>
  );
}
