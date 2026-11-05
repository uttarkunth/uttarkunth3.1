import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission } from '@/lib/staff-rbac';
import { AdminNav } from '@/components/admin-nav';
import { ProductModerationClient } from '@/components/admin/product-moderation-client';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const auth = await requireStaffPermission('seller.verify_documents', { requireMfaAal2: false });
  const finalAuth = !auth.authorized
    ? await requireStaffPermission('seller.approve', { requireMfaAal2: false })
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
            Product and artisan moderation requires explicit &apos;seller.verify_documents&apos; or &apos;seller.approve&apos; staff authority.
          </p>
        </div>
      </div>
    );
  }

  const adminClient = createAdminClient();

  // Fetch sellers, products, and interests
  const { data: sellers } = await adminClient
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: products } = await adminClient
    .from('products')
    .select('*, sellers(business_name, contact_email, valley)')
    .order('created_at', { ascending: false });

  const { data: interests } = await adminClient
    .from('product_interests')
    .select('*, products(title)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <AdminNav />
      <ProductModerationClient
        initialSellers={sellers || []}
        initialProducts={products || []}
        initialInterests={interests || []}
      />
    </div>
  );
}
