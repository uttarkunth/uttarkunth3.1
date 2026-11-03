import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Authenticated account required.' }, { status: 401 });
    }

    const body = await req.json();
    const { room_unit_id, blocked_from, blocked_until, reason, block_id } = body;

    if (!room_unit_id || !blocked_from || !blocked_until) {
      return NextResponse.json({
        ok: false,
        error: 'Missing required fields: room_unit_id, blocked_from, blocked_until'
      }, { status: 400 });
    }

    if (blocked_until <= blocked_from) {
      return NextResponse.json({
        ok: false,
        error: 'End date must be after start date.'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Server-side verification: fetch room unit and verify caller permissions
    const { data: room, error: roomErr } = await adminClient
      .from('room_units')
      .select('id, property_id, properties(id, host_id)')
      .eq('id', room_unit_id)
      .single();

    if (roomErr || !room) {
      return NextResponse.json({ ok: false, error: 'Room unit not found.' }, { status: 404 });
    }

    const propertyId = room.property_id;
    const primaryHostId = (room.properties as any)?.host_id;
    const isAdmin = await checkIsPlatformAdmin(user.id);

    let isAuthorized = isAdmin || primaryHostId === user.id;

    if (!isAuthorized && propertyId) {
      const { data: managerAssignment } = await (adminClient.from('property_hosts') as any)
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .eq('role', 'manager') // Only manager role permitted; co_host is rejected
        .maybeSingle();

      isAuthorized = !!managerAssignment;
    }

    if (!isAuthorized) {
      return NextResponse.json({
        ok: false,
        error: 'Forbidden: Only the primary host, property manager, or platform administrators may manage room blocks.'
      }, { status: 403 });
    }

    // 2. Call set_room_availability_block RPC which handles room-level FOR UPDATE locking
    // Actor ID is strictly bound to the authenticated user.id from session
    const { data: result, error: rpcErr } = await (adminClient.rpc as any)('set_room_availability_block', {
      p_room_unit_id: room_unit_id,
      p_blocked_from: blocked_from,
      p_blocked_until: blocked_until,
      p_reason: reason?.trim() || 'Manual host block',
      p_actor_user_id: user.id, // Strictly derived from session, never browser request
      p_block_id: block_id || null
    });

    if (rpcErr) {
      const isConflict = rpcErr.message.toLowerCase().includes('conflict') ||
                         rpcErr.message.toLowerCase().includes('confirmed reservation') ||
                         rpcErr.message.toLowerCase().includes('exclusion');
      return NextResponse.json({
        ok: false,
        error: rpcErr.message
      }, { status: isConflict ? 409 : 400 });
    }

    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (err: any) {
    console.error('Availability block error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to update availability block' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Authenticated account required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let blockId = searchParams.get('id');

    if (!blockId) {
      try {
        const body = await req.json();
        blockId = body.id || body.block_id;
      } catch {
        // no body
      }
    }

    if (!blockId) {
      return NextResponse.json({ ok: false, error: 'Block ID is required.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Check block ownership and room unit association
    const { data: block, error: blockErr } = await adminClient
      .from('room_availability_blocks')
      .select('id, room_unit_id, blocked_from, blocked_until, reason, room_units(id, property_id, properties(id, host_id))')
      .eq('id', blockId)
      .single();

    if (blockErr || !block) {
      return NextResponse.json({ ok: false, error: 'Availability block not found.' }, { status: 404 });
    }

    const propertyId = (block as any).room_units?.property_id;
    const hostId = (block as any).room_units?.properties?.host_id;
    const isAdmin = await checkIsPlatformAdmin(user.id);

    let isAuthorized = isAdmin || hostId === user.id;

    if (!isAuthorized && propertyId) {
      // Co-hosts are strictly rejected; only manager or primary host can unblock
      const { data: managerAssignment } = await (adminClient.from('property_hosts') as any)
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();

      isAuthorized = !!managerAssignment;
    }

    if (!isAuthorized) {
      return NextResponse.json({
        ok: false,
        error: 'Forbidden: Only primary host, property manager, or platform administrators may remove availability blocks.'
      }, { status: 403 });
    }

    // 2. Perform deletion via dedicated RPC (SECURITY DEFINER) with trusted server-side fallback
    const { data: rpcResult, error: rpcErr } = await (adminClient.rpc as any)('delete_room_availability_block', {
      p_block_id: blockId,
      p_actor_user_id: user.id
    });

    if (rpcErr) {
      // If RPC is pending database migration deployment, perform trusted server-role deletion
      if (rpcErr.message?.toLowerCase().includes('function') && rpcErr.message?.toLowerCase().includes('does not exist')) {
        const { error: delErr } = await adminClient
          .from('room_availability_blocks')
          .delete()
          .eq('id', blockId);

        if (delErr) {
          throw delErr;
        }

        // Record audit trail in admin_audit_log
        await adminClient.from('admin_audit_log').insert({
          actor_user_id: user.id,
          action: 'property_moderated',
          target_type: 'property',
          target_id: propertyId,
          details: {
            operation: 'availability_block_removed',
            block_id: blockId,
            room_unit_id: block.room_unit_id,
            property_id: propertyId,
            blocked_from: block.blocked_from,
            blocked_until: block.blocked_until,
            reason: block.reason,
            remover_email: user.email
          }
        });
      } else {
        return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Availability block removed successfully.'
    });
  } catch (err: any) {
    console.error('Delete block error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to remove availability block' }, { status: 500 });
  }
}
