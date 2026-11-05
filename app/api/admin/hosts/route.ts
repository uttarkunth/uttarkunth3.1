import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaffPermission, recordStaffAuditLog } from '@/lib/staff-rbac';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStaffPermission('property.assign_host', {
      requireMfaAal2: true,
      requiredDepartment: 'stays',
    });

    if (!auth.authorized || !auth.user || !auth.staffProfile) {
      return NextResponse.json(
        {
          ok: false,
          code: auth.code,
          error:
            auth.error ||
            'Forbidden: Host assignment permission (property.assign_host) and TOTP MFA (AAL2) required.',
        },
        { status: auth.status }
      );
    }

    const user = auth.user;
    const staffProfile = auth.staffProfile;

    const body = await req.json();
    const { action, property_id, user_id, role } = body;

    if (!action || !property_id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing action or property_id.',
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    if (action === 'set_primary_host') {
      if (!user_id) {
        return NextResponse.json(
          { ok: false, error: 'User ID is required to assign primary host.' },
          { status: 400 }
        );
      }

      const { error: updateErr } = await adminClient
        .from('properties')
        .update({
          host_id: user_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property_id);

      if (updateErr) throw updateErr;

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: 'primary_host_assigned',
        targetType: 'property',
        targetId: String(property_id),
        afterState: { assigned_host_id: user_id },
      });

      return NextResponse.json({ ok: true, message: 'Primary host assigned successfully.' });
    }

    if (action === 'remove_primary_host') {
      const { error: updateErr } = await adminClient
        .from('properties')
        .update({
          host_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', property_id);

      if (updateErr) throw updateErr;

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: 'primary_host_removed',
        targetType: 'property',
        targetId: String(property_id),
        afterState: { assigned_host_id: null },
      });

      return NextResponse.json({ ok: true, message: 'Primary host removed.' });
    }

    if (action === 'add_cohost') {
      if (!user_id || !role || !['manager', 'co_host'].includes(role)) {
        return NextResponse.json(
          { ok: false, error: 'Valid user_id and role (manager | co_host) required.' },
          { status: 400 }
        );
      }

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
        const { error: insertErr } = await (adminClient.from('property_hosts') as any).insert({
          property_id,
          user_id,
          role,
        });
        if (insertErr) throw insertErr;
      }

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: 'cohost_assigned',
        targetType: 'property',
        targetId: String(property_id),
        afterState: { assigned_user_id: user_id, role },
      });

      return NextResponse.json({
        ok: true,
        message: `${role === 'manager' ? 'Manager' : 'Co-host'} assigned successfully.`,
      });
    }

    if (action === 'remove_cohost') {
      if (!user_id) {
        return NextResponse.json(
          { ok: false, error: 'User ID is required to remove co-host.' },
          { status: 400 }
        );
      }

      const { error: deleteErr } = await (adminClient.from('property_hosts') as any)
        .delete()
        .eq('property_id', property_id)
        .eq('user_id', user_id);

      if (deleteErr) throw deleteErr;

      await recordStaffAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        staffId: staffProfile.staff_id,
        roleSlug: staffProfile.role_slug,
        action: 'cohost_removed',
        targetType: 'property',
        targetId: String(property_id),
        afterState: { removed_user_id: user_id },
      });

      return NextResponse.json({ ok: true, message: 'Co-host assignment removed.' });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Host assignment action error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Failed to update host assignment.',
      },
      { status: 500 }
    );
  }
}
