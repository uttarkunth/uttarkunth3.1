import React from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatINR } from '@/lib/utils';
import { isPlatformAdmin } from '@/lib/constants';
import { Calendar, Users, MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isPlatformAdmin(user.email)) {
    redirect('/admin/dashboard');
  }

  const adminClient = createAdminClient();
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('*, properties(name, village), room_units(room_name)')
    .order('created_at', { ascending: false });

  const list = bookings || [];

  return (
    <div className="pb-16 bg-ivory">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Master Ledger</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Platform Booking Oversight</h1>
          <p className="text-sm text-charcoal-muted mt-1">Full registry of guest requests, status snapshots, and commission estimates</p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-warm text-charcoal-muted uppercase tracking-wider border-b border-forest/10">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Property</th>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Dates</th>
                  <th className="p-3">Total (INR)</th>
                  <th className="p-3">Commission Snapshot</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {list.map((b: any) => (
                  <tr key={b.id} className="hover:bg-forest/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-forest">{b.booking_reference}</td>
                    <td className="p-3 font-medium text-charcoal">{b.properties?.name}</td>
                    <td className="p-3">
                      <span className="block font-semibold">{b.guest_name}</span>
                      <span className="text-charcoal-muted text-[11px]">{b.guest_phone}</span>
                    </td>
                    <td className="p-3 text-charcoal-muted">{b.check_in} → {b.check_out}</td>
                    <td className="p-3 font-serif text-sm font-bold text-forest">{formatINR(Number(b.total_estimate || 0))}</td>
                    <td className="p-3 text-charcoal-muted">
                      {b.commission_percent_snapshot != null ? `${b.commission_percent_snapshot}% (${formatINR(Number(b.commission_amount_snapshot || 0))})` : 'Intro 0%'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 font-bold uppercase rounded-full text-[10px] ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        b.status === 'declined' ? 'bg-red-100 text-red-800' :
                        b.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                        'bg-ukorange/15 text-ukorange'
                      }`}>
                        {b.status}
                      </span>
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
