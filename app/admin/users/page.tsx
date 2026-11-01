import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPlatformAdmin } from '@/lib/constants';
import { Users, Mail, Shield, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isPlatformAdmin(user.email)) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();

  // Query platform admins
  const { data: admins } = await adminClient.from('platform_admins').select('*');
  const adminList = admins || [];

  return (
    <div className="pb-16 bg-ivory">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">User Directory</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Platform Users & Roles</h1>
          <p className="text-sm text-charcoal-muted mt-1">Manage verified administrator privileges and host accounts</p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <h2 className="font-serif text-2xl font-bold text-forest pb-4 border-b border-forest/10 flex items-center gap-2">
            <Shield className="w-5 h-5 text-ukorange" />
            <span>Platform Administrators</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 flex items-center justify-between">
              <div>
                <strong className="block text-sm text-forest">Gaurav Negi (Founder & Superadmin)</strong>
                <span className="text-xs text-charcoal-muted">gauravnegi748@gmail.com</span>
              </div>
              <span className="px-2.5 py-1 bg-charcoal text-white text-[10px] font-bold uppercase rounded-full">
                Primary Superadmin
              </span>
            </div>

            <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 flex items-center justify-between">
              <div>
                <strong className="block text-sm text-forest">Uttarkunth Official</strong>
                <span className="text-xs text-charcoal-muted">info@uttarkunth.com</span>
              </div>
              <span className="px-2.5 py-1 bg-forest text-white text-[10px] font-bold uppercase rounded-full">
                Primary Business
              </span>
            </div>

            <div className="p-4 bg-ivory-warm rounded-2xl border border-forest/15 flex items-center justify-between">
              <div>
                <strong className="block text-sm text-forest">Uttarkunth Operations</strong>
                <span className="text-xs text-charcoal-muted">uttarkunth@gmail.com</span>
              </div>
              <span className="px-2.5 py-1 bg-forest/80 text-white text-[10px] font-bold uppercase rounded-full">
                Secondary Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
