import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // 1. Try querying user_notifications table
    const { data: dbNotifications, error } = await adminClient
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && dbNotifications && dbNotifications.length > 0) {
      return NextResponse.json({ ok: true, notifications: dbNotifications });
    }

    // 2. Fallback: Aggregate live dynamic notifications from across the 4 pillars
    const notifications: any[] = [];

    // Stays bookings notifications
    const { data: bookings } = await adminClient
      .from('stay_bookings')
      .select('id, booking_reference, status, created_at, properties(name)')
      .or(`guest_user_id.eq.${user.id},guest_email.eq.${user.email}`)
      .limit(5);

    if (bookings) {
      for (const b of bookings) {
        notifications.push({
          id: `booking-${b.id}`,
          pillar: 'stays',
          title: `Booking Request ${b.booking_reference}`,
          message: `Your booking request for ${(b.properties as any)?.name || 'Stay'} is currently ${b.status}. Direct host payment applies upon check-in.`,
          action_url: '/trips',
          read: b.status === 'confirmed',
          created_at: b.created_at,
        });
      }
    }

    // Filmmaker proposals notifications
    const { data: proposals } = await adminClient
      .from('production_proposals')
      .select('id, title, status, created_at')
      .eq('user_id', user.id)
      .limit(3);

    if (proposals) {
      for (const p of proposals) {
        notifications.push({
          id: `prop-${p.id}`,
          pillar: 'productions',
          title: `Film Pitch: ${p.title}`,
          message: `Your film proposal is currently ${p.status.replace('_', ' ')}. Check your productions workspace for review notes.`,
          action_url: '/account/productions',
          read: p.status === 'approved',
          created_at: p.created_at,
        });
      }
    }

    // Community participations notifications
    const { data: participations } = await adminClient
      .from('community_participations')
      .select('id, initiative_slug, status, created_at')
      .eq('user_id', user.id)
      .limit(3);

    if (participations) {
      for (const part of participations) {
        notifications.push({
          id: `part-${part.id}`,
          pillar: 'community',
          title: `Community Initiative Application`,
          message: `Your participation application for ${part.initiative_slug} is ${part.status}.`,
          action_url: '/account/community',
          read: part.status === 'approved',
          created_at: part.created_at,
        });
      }
    }

    // Default welcome notification if empty
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        pillar: 'system',
        title: 'Welcome to Uttarkunth Ecosystem',
        message: 'Your unified Himalayan account connects you across Stays, Products, Productions, and Community initiatives.',
        action_url: '/account',
        read: true,
        created_at: user.created_at || new Date().toISOString(),
      });
    }

    // Sort descending by date
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      ok: true,
      notifications,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
