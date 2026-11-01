import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CheckCircle2, XCircle, AlertTriangle, Eye, Shield } from 'lucide-react';
import { isPlatformAdmin } from '@/lib/constants';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isPlatformAdmin(user.email)) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();
  const { data: properties } = await adminClient
    .from('properties')
    .select('*, room_units(*)')
    .order('created_at', { ascending: false });

  const list = properties || [];

  return (
    <div className="pb-16 bg-ivory">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Listing Moderation</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Property Oversight & Verification</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Review submitted properties. Approving a property marks it published and visible to travelers across India.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-warm text-charcoal-muted uppercase tracking-wider border-b border-forest/10">
                <tr>
                  <th className="p-3">Property Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Rooms</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Public</th>
                  <th className="p-3 text-right">Moderation Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {list.map((p: any) => (
                  <tr key={p.id} className="hover:bg-forest/5 transition-colors">
                    <td className="p-3 font-semibold text-forest">
                      <Link href={`/properties/${p.slug}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3 text-charcoal-muted">{p.village}, {p.district}</td>
                    <td className="p-3 capitalize">{p.property_type}</td>
                    <td className="p-3">{p.room_units?.length || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 font-bold uppercase rounded-full text-[10px] ${
                        p.moderation_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.moderation_status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${p.published ? 'text-green-700' : 'text-gray-500'}`}>
                        {p.published ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/properties/${p.slug}`}
                          className="p-1.5 text-charcoal-muted hover:text-forest"
                          title="Preview Listing"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {p.moderation_status !== 'approved' && (
                          <span className="text-[11px] text-green-700 font-semibold cursor-pointer">
                            Approve
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
