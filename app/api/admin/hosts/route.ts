import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    const isAdmin = user ? await checkIsPlatformAdmin(user.id) : false;
    if (authErr || !user || !isAdmin) {
      return NextResponse.json({
        ok: false,
        error: 'Forbidden: Platform administrator privileges required.'
      }, { status: 403 });
    }

    const body = await req.json();
    const { action, property_id, user_id, role } = body;

    if (!action || !property_id) {
      return NextResponse.json({
        ok: false,
        error: 'Missing action or property_id.'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (action === 'set_primary_host') {
      if (!user_id) {
        return NextResponse.json({ ok: false, error: 'User ID is required to assign primary host.' }, { status: 400 });
      }

      const { error: updateErr } = await adminClient
        .from('properties')
        .update({
          host_id: user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', property_id);

      if (updateErr) throw updateErr;

      await adminClient.from('admin_audit_log').insert({
        actor_user_id: user.id,
        action: 'primary_host_assigned',
        target_type: 'property',
        target_id: property_id,
        details: { assigned_host_id: user_id, admin_email: user.email }
      });

      return NextResponse.json({ ok: true, message: 'Primary host assigned successfully.' });
    }

    if (action === 'remove_primary_host') {
      const { error: updateErr } = await adminClient
        .from('properties')
        .update({
          host_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', property_id);

      if (updateErr) throw updateErr;

      await adminClient.from('admin_audit_log').insert({
        actor_user_id: user.id,
        action: 'primary_host_removed',
        target_type: 'property',
        target_id: property_id,
        details: { admin_email: user.email }
      });

      return NextResponse.json({ ok: true, message: 'Primary host removed.' });
    }

    if (action === 'add_cohost') {
      if (!user_id || !role || !['manager', 'co_host'].includes(role)) {
        return NextResponse.json({ ok: false, error: 'Valid user_id and role (manager | co_host) required.' }, { status: 400 });
      }

      // Check existing assignment
      const { data: existing } = await (adminClient.from('property_hosts') as any)
        .select('id')
        .eq('property_id', property_id)
        .eq('user_id', user_id)
        .maybeSingle();

      if (existing) {
        await (adminClient.from('property_hosts') as any)
          .update({ role })
          .eq('id', existing.id);
      } else {
        const { error: insertErr } = await (adminClient.from('property_hosts') as any)
          .insert({
            property_id,
            user_id,
            role
          });
        if (insertErr) throw insertErr;
      }

      await adminClient.from('admin_audit_log').insert({
        actor_user_id: user.id,
        action: 'cohost_assigned',
        target_type: 'property',
        target_id: property_id,
        details: { assigned_user_id: user_id, role, admin_email: user.email }
      });

      return NextResponse.json({ ok: true, message: `${role === 'manager' ? 'Manager' : 'Co-host'} assigned successfully.` });
    }

    if (action === 'remove_cohost') {
      if (!user_id) {
        return NextResponse.json({ ok: false, error: 'User ID is required to remove co-host.' }, { status: 400 });
      }

      const { error: deleteErr } = await (adminClient.from('property_hosts') as any)
        .delete()
        .eq('property_id', property_id)
        .eq('user_id', user_id);

      if (deleteErr) throw deleteErr;

      await adminClient.from('admin_audit_log').insert({
        actor_user_id: user.id,
        action: 'cohost_removed',
        target_type: 'property',
        target_id: property_id,
        details: { removed_user_id: user_id, admin_email: user.email }
      });

      return NextResponse.json({ ok: true, message: 'Co-host assignment removed.' });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Host assignment action error:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Failed to update host assignment.'
    }, { status: 500 });
  }
}
