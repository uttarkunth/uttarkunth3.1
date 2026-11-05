import React from 'react';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { HostAssignmentsManager } from '@/components/admin/host-assignments';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const auth = await requireStaffPermission('property.assign_host', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('staff.invite', { requireMfaAal2: false })
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
            Host assignments and member management requires explicit &apos;property.assign_host&apos; or &apos;staff.invite&apos; staff authority.
          </p>
        </div>
      </div>
    );
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
      knownUsers = authData.users.map((u: any) => ({
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
