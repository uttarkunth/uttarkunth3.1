import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import {
  Shield, Home, Inbox, Users, Activity, CheckCircle2,
  Clock, AlertTriangle, ArrowRight, Percent, FileText, Sparkles
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/dashboard');
  }

  // Server-side administrator access verification via authoritative registry
  const isAdmin = await checkIsPlatformAdmin(user.id);
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-600 mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-red-700">Administrator Access Required</h1>
        <p className="text-xs text-charcoal-muted leading-relaxed">
          This portal is strictly restricted to authorized platform administrators of Uttarkunth. Your account ({user.email}) does not have administrative privileges.
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
    .select('id, name, moderation_status, published, pending_changes, host_id, created_at');

  const propList = properties || [];
  const pendingModeration = propList.filter((p) => p.moderation_status === 'pending');
  const stagedUpdates = propList.filter((p) => p.pending_changes !== null && p.pending_changes !== undefined);
  const approvedProps = propList.filter((p) => p.moderation_status === 'approved');

  // 2. Fetch bookings
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, booking_reference, check_in, check_out, status, total_estimate, created_at, properties(name)')
    .order('created_at', { ascending: false });

  const bookingList = bookings || [];
  const pendingBookings = bookingList.filter((b) => b.status === 'pending');
  const confirmedBookings = bookingList.filter((b) => b.status === 'confirmed');

  // 3. Fetch recent audit logs
  const { data: auditLogs } = await adminClient
    .from('admin_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  const logs = auditLogs || [];

  return (
    <div className="pb-16 bg-ivory min-h-screen">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Platform Administration</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">Platform Overview</h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Superuser control panel for Gaurav Negi & Uttarkunth Operations. Live database statistics, moderation queues, and audit log.
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Total Accommodations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{propList.length}</span>
              <span className="text-xs text-charcoal-muted">({approvedProps.length} live)</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Staged Live Updates
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-ukorange">{stagedUpdates.length}</span>
              <span className="text-xs text-charcoal-muted">pending review</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Booking Requests
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-forest">{pendingBookings.length}</span>
              <span className="text-xs text-charcoal-muted">pending host action</span>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted block mb-1">
              Confirmed Reservations
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-green-700">{confirmedBookings.length}</span>
              <span className="text-xs text-charcoal-muted">settled directly</span>
            </div>
          </div>
        </div>

        {/* Callouts for Staged / Pending */}
        {(stagedUpdates.length > 0 || pendingModeration.length > 0) && (
          <div className="p-5 bg-ukorange/10 border border-ukorange/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-ukorange flex-shrink-0" />
              <div>
                <strong className="text-sm font-semibold text-charcoal block">
                  {stagedUpdates.length} Staged Change{stagedUpdates.length !== 1 ? 's' : ''} &amp; {pendingModeration.length} New Listing{pendingModeration.length !== 1 ? 's' : ''} Require Moderation
                </strong>
                <span className="text-xs text-charcoal-muted">
                  Content changes submitted by hosts remain safely staged until authorized.
                </span>
              </div>
            </div>
            <Link
              href="/admin/properties"
              className="px-4 py-2 bg-ukorange hover:bg-ukorange-hover text-white text-xs font-semibold rounded-xl shadow-sm whitespace-nowrap inline-flex items-center gap-1.5 self-start sm:self-center"
            >
              <span>Launch Moderation Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Quick Portal Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <Users className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Host & Co-host Teams</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Assign primary hosts and manage operational co-host delegations.
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <Percent className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Commercial Agreements</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Authorize formal bilateral host commission contracts.
            </p>
          </Link>

          <Link
            href="/admin/audit"
            className="p-5 bg-white rounded-3xl border border-forest/15 shadow-soft hover:shadow-md transition-shadow group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                <FileText className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest transition-colors" />
            </div>
            <h3 className="font-serif text-base font-bold text-forest">Administrator Audit Log</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              Review immutable audit trail of all platform interventions.
            </p>
          </Link>
        </div>

        {/* Audit Log & Activity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-forest/15 shadow-soft space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-forest/10">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-forest" />
              <h2 className="font-serif text-2xl font-bold text-forest">Recent Administrative Activity</h2>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-forest hover:underline flex items-center gap-1"
            >
              <span>Explore All Logs</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {logs.length > 0 ? (
            <div className="divide-y divide-forest/10 text-xs">
              {logs.map((log: any) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-forest uppercase tracking-wider">{log.action?.replace(/_/g, ' ')}</span>
                    <p className="text-charcoal-muted">
                      Target: <span className="font-semibold text-charcoal">{log.target_type}</span> ({log.target_id?.slice(0, 8)}...)
                      {log.details?.admin_email && ` • by ${log.details.admin_email}`}
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
