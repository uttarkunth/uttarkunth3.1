import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatINR } from '@/lib/utils';
import { isPlatformAdmin } from '@/lib/constants';
import { Shield, Home, Inbox, Users, Activity, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/dashboard');
  }

  // Server-side administrator access verification
  const isAdmin = isPlatformAdmin(user.email);
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">Administrator Access Required</h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This portal is restricted to authorized platform administrators of Uttarkunth Stays. Your account ({user.email}) does not have administrative privileges.
        </p>
        <Link href="/" className="inline-block mt-4 px-4 py-2 bg-forest text-white text-xs font-semibold rounded-lg">
          Return to Homepage
        </Link>
      </div>
    );
  }

  const adminClient = createAdminClient();

  // 1. Fetch properties count & moderation status
  const { data: properties } = await adminClient
    .from('properties')
    .select('id, name, moderation_status, published, created_at');

  const propList = properties || [];
  const pendingModeration = propList.filter(p => p.moderation_status === 'pending');
  const approvedProps = propList.filter(p => p.moderation_status === 'approved');

  // 2. Fetch bookings
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, booking_reference, check_in, check_out, status, total_estimate, created_at, properties(name)')
    .order('created_at', { ascending: false });

  const bookingList = bookings || [];
  const pendingBookings = bookingList.filter(b => b.status === 'pending');
  const confirmedBookings = bookingList.filter(b => b.status === 'confirmed');

  // 3. Fetch recent audit logs
  const { data: auditLogs } = await adminClient
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  const logs = auditLogs || [];

  return (
    <div className="pb-16 bg-ivory">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Platform Administration</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Platform Overview</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Superuser control panel for Gaurav Negi & Uttarkunth Operations. Live database statistics and audit log.
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Total Accommodations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{propList.length}</span>
              <span className="text-xs text-charcoal-muted">({approvedProps.length} approved)</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Pending Moderation
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-ukorange">{pendingModeration.length}</span>
              <span className="text-xs text-charcoal-muted">listings</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Active Booking Requests
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{pendingBookings.length}</span>
              <span className="text-xs text-charcoal-muted">pending host action</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Confirmed Stays
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-green-700">{confirmedBookings.length}</span>
              <span className="text-xs text-charcoal-muted">reservations</span>
            </div>
          </div>
        </div>

        {/* Action Callouts */}
        {pendingModeration.length > 0 && (
          <div className="p-5 bg-ukorange/10 border border-ukorange/30 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-ukorange flex-shrink-0" />
              <div>
                <strong className="text-sm font-semibold text-charcoal block">
                  {pendingModeration.length} Property Listing{pendingModeration.length > 1 ? 's' : ''} Awaiting Review
                </strong>
                <span className="text-xs text-charcoal-muted">
                  New submissions or updated properties require review before appearing publicly.
                </span>
              </div>
            </div>
            <Link
              href="/admin/properties"
              className="px-4 py-2 bg-ukorange hover:bg-ukorange-hover text-white text-xs font-semibold rounded-xl shadow-sm whitespace-nowrap"
            >
              Review Listings
            </Link>
          </div>
        )}

        {/* Audit Log & Activity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-forest/10">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-forest" />
              <h2 className="font-serif text-2xl font-bold text-forest">Security & Platform Audit Log</h2>
            </div>
            <span className="text-xs text-charcoal-muted">Append-only administrative ledger</span>
          </div>

          {logs.length > 0 ? (
            <div className="divide-y divide-forest/10 text-xs">
              {logs.map((log: any) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-forest uppercase tracking-wider">{log.action}</span>
                    <p className="text-charcoal-muted">
                      Target: {log.target_type} ({log.target_id?.slice(0, 8)}...)
                    </p>
                  </div>
                  <span className="text-charcoal-muted font-mono">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-charcoal-muted">
              Audit log is clean. Platform administrative actions will be recorded here automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
