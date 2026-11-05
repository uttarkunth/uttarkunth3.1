import React from 'react';
import { AdminNav } from '@/components/admin-nav';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { CommercialAgreementManager } from '@/components/admin/agreement-manager';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const auth = await requireStaffPermission('finance.review_agreements', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('compliance.configure_licences', { requireMfaAal2: false })
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
            Commercial terms, commission matrices, and statutory settings require explicit &apos;finance.review_agreements&apos; or Founder authority.
          </p>
        </div>
      </div>
    );
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
