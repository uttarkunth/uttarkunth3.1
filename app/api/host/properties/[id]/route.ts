import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function checkHostAuthorization(adminClient: any, propertyId: string, userId: string) {
  const isAdmin = await checkIsPlatformAdmin(userId);
  if (isAdmin) {
    return { authorized: true, role: 'admin' };
  }

  const { data: prop } = await adminClient
    .from('properties')
    .select('id, host_id')
    .eq('id', propertyId)
    .single();

  if (!prop) return { authorized: false, role: null };
  if (prop.host_id === userId) return { authorized: true, role: 'owner' };

  const { data: coHost } = await adminClient
    .from('property_hosts')
    .select('id, role')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .in('role', ['co_host', 'manager'])
    .maybeSingle();

  if (coHost) {
    return { authorized: true, role: coHost.role };
  }

  return { authorized: false, role: null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const authResult = await checkHostAuthorization(adminClient, params.id, user.id);

    if (!authResult.authorized) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data: property, error: propErr } = await adminClient
      .from('properties')
      .select('*, room_units(*)')
      .eq('id', params.id)
      .single();

    if (propErr || !property) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, property, role: authResult.role });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const authResult = await checkHostAuthorization(adminClient, params.id, user.id);

    if (!authResult.authorized) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    // Role check: Co-hosts cannot modify property details or rates
    if (authResult.role === 'co_host') {
      return NextResponse.json({
        ok: false,
        error: 'Co-hosts have read-only access to property specifications. Only the primary host or manager can update rates or submit changes.'
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      address,
      village,
      district,
      state,
      property_type,
      amenities,
      photos,
      rooms,
      contact_phone,
      contact_whatsapp,
      contact_email,
      notify_email,
      notify_whatsapp,
      house_rules,
      check_in_time,
      check_out_time,
    } = body;

    // Fetch existing property
    const { data: existingProp } = await adminClient
      .from('properties')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!existingProp) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });
    }

    const isLiveApproved = existingProp.published === true && existingProp.moderation_status === 'approved';
    const isMaterialContentChange =
      (name !== undefined && name.trim() !== existingProp.name) ||
      (description !== undefined && description.trim() !== existingProp.description) ||
      (address !== undefined && address.trim() !== existingProp.address) ||
      (village !== undefined && village.trim() !== existingProp.village) ||
      (district !== undefined && district.trim() !== existingProp.district) ||
      (state !== undefined && state.trim() !== existingProp.state) ||
      (property_type !== undefined && property_type !== existingProp.property_type) ||
      (amenities !== undefined && JSON.stringify(amenities) !== JSON.stringify(existingProp.amenities)) ||
      (photos !== undefined && JSON.stringify(photos) !== JSON.stringify(existingProp.photos));

    let stagedForReview = false;

    if (isLiveApproved && isMaterialContentChange) {
      // Primary host check for content changes
      if (authResult.role !== 'owner' && authResult.role !== 'admin') {
        return NextResponse.json({
          ok: false,
          error: 'Only the primary property host can propose public content or structural changes.'
        }, { status: 403 });
      }

      // Stage proposed changes in pending_changes so live listing remains visible
      const stagedPayload = {
        name: name !== undefined ? name.trim() : existingProp.name,
        description: description !== undefined ? description.trim() : existingProp.description,
        address: address !== undefined ? address.trim() : existingProp.address,
        village: village !== undefined ? village.trim() : existingProp.village,
        district: district !== undefined ? district.trim() : existingProp.district,
        state: state !== undefined ? state.trim() : existingProp.state,
        property_type: property_type !== undefined ? property_type : existingProp.property_type,
        amenities: amenities !== undefined ? amenities : existingProp.amenities,
        photos: photos !== undefined ? photos : existingProp.photos,
      };

      const { error: stageErr } = await adminClient
        .from('properties')
        .update({
          pending_changes: stagedPayload,
          pending_changes_submitted_at: new Date().toISOString(),
          moderation_notes: 'Proposed updates staged for administrative review. Approved listing remains live.',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (stageErr) throw stageErr;
      stagedForReview = true;
    } else if (!isLiveApproved && isMaterialContentChange) {
      // Unapproved draft: updates apply directly to draft
      const updateData: any = {
        updated_at: new Date().toISOString(),
        published: false,
        moderation_status: 'pending'
      };
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description.trim();
      if (address !== undefined) updateData.address = address.trim();
      if (village !== undefined) updateData.village = village.trim();
      if (district !== undefined) updateData.district = district.trim();
      if (state !== undefined) updateData.state = state.trim();
      if (property_type !== undefined) updateData.property_type = property_type;
      if (amenities !== undefined) updateData.amenities = amenities;
      if (photos !== undefined) updateData.photos = photos;
      if (contact_phone !== undefined) updateData.contact_phone = contact_phone.trim();
      if (contact_whatsapp !== undefined) updateData.contact_whatsapp = contact_whatsapp.trim();
      if (contact_email !== undefined) updateData.contact_email = contact_email.trim();
      if (notify_email !== undefined) updateData.notify_email = Boolean(notify_email);
      if (notify_whatsapp !== undefined) updateData.notify_whatsapp = Boolean(notify_whatsapp);
      if (house_rules !== undefined) updateData.house_rules = house_rules.trim();
      if (check_in_time !== undefined) updateData.check_in_time = check_in_time.trim();
      if (check_out_time !== undefined) updateData.check_out_time = check_out_time.trim();

      const { error: draftUpdateErr } = await adminClient
        .from('properties')
        .update(updateData)
        .eq('id', params.id);

      if (draftUpdateErr) throw draftUpdateErr;
    } else {
      // Direct operational contact info updates
      const contactUpdates: any = {};
      if (contact_phone !== undefined) contactUpdates.contact_phone = contact_phone.trim();
      if (contact_whatsapp !== undefined) contactUpdates.contact_whatsapp = contact_whatsapp.trim();
      if (contact_email !== undefined) contactUpdates.contact_email = contact_email.trim();
      if (notify_email !== undefined) contactUpdates.notify_email = Boolean(notify_email);
      if (notify_whatsapp !== undefined) contactUpdates.notify_whatsapp = Boolean(notify_whatsapp);
      if (house_rules !== undefined) contactUpdates.house_rules = house_rules.trim();
      if (check_in_time !== undefined) contactUpdates.check_in_time = check_in_time.trim();
      if (check_out_time !== undefined) contactUpdates.check_out_time = check_out_time.trim();

      if (Object.keys(contactUpdates).length > 0) {
        contactUpdates.updated_at = new Date().toISOString();
        await adminClient.from('properties').update(contactUpdates).eq('id', params.id);
      }
    }

    // Operational updates: Room units & nightly rates (Primary Host or Manager can update)
    if (Array.isArray(rooms)) {
      for (const room of rooms) {
        if (room.id) {
          const roomUpdates: any = {
            room_name: room.room_name?.trim(),
            description: room.description?.trim(),
            max_guests: Number(room.max_guests),
            base_price: Number(room.base_price),
            active: room.active !== undefined ? Boolean(room.active) : true,
          };
          if (room.attached_washroom !== undefined) roomUpdates.attached_washroom = Boolean(room.attached_washroom);
          if (room.view_type !== undefined) roomUpdates.view_type = room.view_type;
          if (room.bed_type !== undefined) roomUpdates.bed_type = room.bed_type.trim();
          if (room.features !== undefined) roomUpdates.features = room.features;
          if (room.photos !== undefined) roomUpdates.photos = room.photos;

          await adminClient
            .from('room_units')
            .update(roomUpdates)
            .eq('id', room.id)
            .eq('property_id', params.id);
        } else if (room.room_name && room.base_price) {
          await adminClient
            .from('room_units')
            .insert({
              property_id: params.id,
              room_name: room.room_name.trim(),
              description: room.description?.trim() || '',
              max_guests: Number(room.max_guests) || 2,
              base_price: Number(room.base_price),
              attached_washroom: room.attached_washroom ? Boolean(room.attached_washroom) : false,
              view_type: room.view_type || 'mountain',
              bed_type: room.bed_type?.trim() || 'King / Double Bed',
              features: room.features || [],
              photos: room.photos || [],
              active: true
            });
        }
      }
    }

    // Fetch refreshed property
    const { data: updatedProperty } = await adminClient
      .from('properties')
      .select('*, room_units(*)')
      .eq('id', params.id)
      .single();

    return NextResponse.json({
      ok: true,
      staged_for_review: stagedForReview,
      message: stagedForReview
        ? 'Public content changes submitted for administrator moderation. Your currently approved listing remains live.'
        : 'Operational settings and room rates successfully updated.',
      property: updatedProperty
    });
  } catch (err: any) {
    console.error('Property update error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to update property' }, { status: 500 });
  }
}
