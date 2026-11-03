import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Bell,
  Luggage,
  ShoppingBag,
  Film,
  Heart,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AccountNotificationsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/notifications');
  }

  const adminClient = createAdminClient();

  // Aggregate user notifications across the 4 pillars
  const notifications: any[] = [];

  // 1. Stay Bookings
  const { data: bookings } = await adminClient
    .from('stay_bookings')
    .select('id, booking_reference, status, created_at, properties(name)')
    .or(`guest_user_id.eq.${user.id},guest_email.eq.${user.email}`)
    .order('created_at', { ascending: false })
    .limit(5);

  if (bookings) {
    for (const b of bookings) {
      notifications.push({
        id: `booking-${b.id}`,
        pillar: 'stays',
        title: `Booking Request: ${b.booking_reference}`,
        message: `Your booking request for ${(b.properties as any)?.name || 'Stay'} is ${b.status}. Direct host payment applies upon check-in.`,
        action_url: '/trips',
        created_at: b.created_at,
        icon: Luggage,
        color: 'text-forest bg-forest/10',
      });
    }
  }

  // 2. Film Proposals
  const { data: proposals } = await adminClient
    .from('production_proposals')
    .select('id, title, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  if (proposals) {
    for (const p of proposals) {
      notifications.push({
        id: `prop-${p.id}`,
        pillar: 'productions',
        title: `Film Pitch: ${p.title}`,
        message: `Your project proposal is currently ${p.status.replace('_', ' ')}.`,
        action_url: '/account/productions',
        created_at: p.created_at,
        icon: Film,
        color: 'text-ukorange bg-ukorange/10',
      });
    }
  }

  // 3. Community Participations
  const { data: participations } = await adminClient
    .from('community_participations')
    .select('id, initiative_slug, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  if (participations) {
    for (const part of participations) {
      notifications.push({
        id: `part-${part.id}`,
        pillar: 'community',
        title: `Field Initiative Application`,
        message: `Your application for ${part.initiative_slug} is ${part.status}.`,
        action_url: '/account/community',
        created_at: part.created_at,
        icon: Heart,
        color: 'text-ukblue-deep bg-ukblue-deep/10',
      });
    }
  }

  // System welcome
  if (notifications.length === 0) {
    notifications.push({
      id: 'welcome',
      pillar: 'system',
      title: 'Welcome to Uttarkunth Ecosystem',
      message: 'Your unified Himalayan account connects you across Stays, Products, Productions, and Community initiatives.',
      action_url: '/account',
      created_at: user.created_at || new Date().toISOString(),
      icon: Sparkles,
      color: 'text-terracotta bg-terracotta/10',
    });
  }

  // Sort descending by date
  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Uttarkunth</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-ukorange">Account Hub</span>
          <h1 className="font-serif text-3xl font-bold text-forest mt-1">Notifications &amp; Activity</h1>
          <p className="text-xs text-charcoal-muted mt-1">
            Real-time status updates across your stays, goods waitlists, film pitches, and community residencies.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-forest/10 text-forest flex items-center justify-center">
          <Bell className="w-5 h-5 text-ukorange" />
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              className="p-5 bg-white rounded-2xl border border-forest/15 shadow-soft flex items-start justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ukorange">
                      {notif.pillar}
                    </span>
                    <span className="text-[11px] text-charcoal-muted">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-serif text-base font-bold text-forest">{notif.title}</h3>
                  <p className="text-xs text-charcoal-muted leading-relaxed">{notif.message}</p>
                </div>
              </div>

              <div className="flex-shrink-0 pt-1">
                <Link
                  href={notif.action_url}
                  className="px-3 py-1.5 bg-ivory-warm hover:bg-forest hover:text-white text-forest text-xs font-semibold rounded-xl border border-forest/20 transition-all flex items-center gap-1"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
