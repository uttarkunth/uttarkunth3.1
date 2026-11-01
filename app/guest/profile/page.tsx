import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { User, Mail, Shield, CheckCircle2, Compass, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GuestProfilePage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/guest/profile');
  }

  const meta = user.user_metadata || {};
  const fullName = meta.full_name || 'Himalayan Traveler';
  const role = meta.role || 'Guest';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Account Details</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">My Profile</h1>
        <p className="text-sm text-charcoal-muted mt-1">Manage your account information and preferences</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-forest/15 shadow-soft space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-forest/10">
          <div className="w-16 h-16 rounded-full bg-forest text-ivory flex items-center justify-center font-serif text-2xl font-bold">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-forest">{fullName}</h2>
            <p className="text-xs text-charcoal-muted flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-ukorange" />
              <span>{user.email}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
            <span className="text-charcoal-muted uppercase tracking-wider block">Account Type</span>
            <span className="font-semibold text-forest text-sm capitalize">{role}</span>
          </div>
          <div className="p-4 bg-ivory-warm rounded-xl border border-forest/10 space-y-1">
            <span className="text-charcoal-muted uppercase tracking-wider block">Email Status</span>
            <span className="font-semibold text-green-700 text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Verified
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-forest/10 flex flex-wrap gap-4">
          <Link
            href="/guest/trips"
            className="px-4 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>View My Trips</span>
          </Link>
          <Link
            href="/host/dashboard"
            className="px-4 py-2.5 bg-ivory-warm hover:bg-forest/10 text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-colors flex items-center gap-1.5"
          >
            <Home className="w-4 h-4 text-ukorange" />
            <span>Host Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
