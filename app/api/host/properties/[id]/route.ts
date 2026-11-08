import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkIsPlatformAdmin } from '@/lib/auth';
import { attachPrivateLocationToProperty } from '@/lib/host';
import { validateGoogleMapsUrl } from '@/lib/validations';

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
      .select('*, room_units(*), property_private_locations(*)')
      .eq('id', params.id)
      .single();

    if (propErr || !property) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      property: attachPrivateLocationToProperty(property),
      role: authResult.role,
    });
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
      google_maps_url,
      location_confirmed,
      cover_photo,
      property_type,
      amenities,
      photos,
      shared_washroom_photos,
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

    // Fetch existing property and private location
    const { data: existingProp } = await adminClient
      .from('properties')
      .select('*, property_private_locations(*)')
      .eq('id', params.id)
      .single();

    if (!existingProp) {
      return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });
    }

    const rawPrivateLoc = existingProp.property_private_locations;
    const existingPrivateLoc = Array.isArray(rawPrivateLoc) ? rawPrivateLoc[0] : rawPrivateLoc;
    const currentExactAddress = (existingPrivateLoc?.exact_address ?? existingProp.address ?? '').trim();
    const currentGoogleMapsUrl = (existingPrivateLoc?.google_maps_url ?? '').trim();

    let normalizedGoogleMapsUrl: string | undefined;
    if (google_maps_url !== undefined && String(google_maps_url).trim() !== '') {
      const mapsValidation = validateGoogleMapsUrl(String(google_maps_url));
      if (!mapsValidation.valid || !mapsValidation.normalizedUrl) {
        return NextResponse.json(
          {
            ok: false,
            error:
              mapsValidation.error ||
              'Please enter a valid Google Maps share link (for example, https://maps.app.goo.gl/... or https://www.google.com/maps/...).',
          },
          { status: 400 }
        );
      }
      normalizedGoogleMapsUrl = mapsValidation.normalizedUrl;

      const isChangingMapsUrl = normalizedGoogleMapsUrl !== currentGoogleMapsUrl;
      if (isChangingMapsUrl && location_confirmed !== true) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Please confirm that your Google Maps link points to your actual property location.',
          },
          { status: 400 }
        );
      }
    }

    const isLiveApproved = existingProp.published === true && existingProp.moderation_status === 'approved';
    const isAddressChanged =
      address !== undefined && address.trim() !== '' && address.trim() !== currentExactAddress;
    const isMapsUrlChanged =
      normalizedGoogleMapsUrl !== undefined && normalizedGoogleMapsUrl !== currentGoogleMapsUrl;

    // Industry Standard Security Moderation:
    // Only core identity & legal location changes require moderation review.
    // Operational settings (amenities, photos, room rates, description, rules, contact) update directly.
    const isMaterialContentChange =
      (name !== undefined && name.trim() !== '' && name.trim() !== existingProp.name) ||
      isAddressChanged ||
      isMapsUrlChanged ||
      (village !== undefined && village.trim() !== '' && village.trim() !== existingProp.village) ||
      (district !== undefined && district.trim() !== '' && district.trim() !== existingProp.district) ||
      (state !== undefined && state.trim() !== '' && state.trim() !== existingProp.state) ||
      (property_type !== undefined && property_type !== existingProp.property_type);

    let stagedForReview = false;

    if (isLiveApproved && isMaterialContentChange) {
      // Primary host check for identity/location changes
      if (authResult.role !== 'owner' && authResult.role !== 'admin') {
        return NextResponse.json({
          ok: false,
          error: 'Only the primary property host can propose changes to property name or physical location.'
        }, { status: 403 });
      }

      // Stage proposed public identity changes in pending_changes (private address/URL are stored in property_private_locations)
      const stagedPayload = {
        name: name !== undefined ? name.trim() : existingProp.name,
        village: village !== undefined ? village.trim() : existingProp.village,
        district: district !== undefined ? district.trim() : existingProp.district,
        state: state !== undefined ? state.trim() : existingProp.state,
        property_type: property_type !== undefined ? property_type : existingProp.property_type,
        location_update_staged: isAddressChanged || isMapsUrlChanged,
      };

      const { error: stageErr } = await adminClient
        .from('properties')
        .update({
          pending_changes: stagedPayload,
          pending_changes_submitted_at: new Date().toISOString(),
          moderation_notes: 'Structural property details staged for administrative review. Approved listing remains live.',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (stageErr) throw stageErr;

      if (isAddressChanged || isMapsUrlChanged) {
        const { error: stageLocErr } = await adminClient
          .from('property_private_locations')
          .upsert(
            {
              property_id: params.id,
              exact_address: currentExactAddress,
              google_maps_url: currentGoogleMapsUrl || null,
              pending_exact_address: isAddressChanged
                ? address.trim()
                : (existingPrivateLoc?.pending_exact_address ?? null),
              pending_google_maps_url: isMapsUrlChanged
                ? normalizedGoogleMapsUrl!
                : (existingPrivateLoc?.pending_google_maps_url ?? null),
              location_confirmed: Boolean(existingPrivateLoc?.location_confirmed),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'property_id' }
          );

        if (stageLocErr) throw stageLocErr;
      }

      stagedForReview = true;
    }

    // Direct updates for operational data on live or draft properties
    const directUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (!isLiveApproved) {
      // For unapproved draft, apply everything directly
      const nextVillage = village !== undefined ? village.trim() : existingProp.village;
      const nextDistrict = district !== undefined ? district.trim() : existingProp.district;
      const nextState = state !== undefined ? state.trim() : existingProp.state;

      if (name !== undefined) directUpdates.name = name.trim();
      if (village !== undefined) directUpdates.village = nextVillage;
      if (district !== undefined) directUpdates.district = nextDistrict;
      if (state !== undefined) directUpdates.state = nextState;
      directUpdates.address = [nextVillage, nextDistrict, nextState]
        .map((p) => (p || '').trim())
        .filter(Boolean)
        .join(', ');
      if (property_type !== undefined) directUpdates.property_type = property_type;

      if (address !== undefined || normalizedGoogleMapsUrl !== undefined) {
        const { error: directLocErr } = await adminClient
          .from('property_private_locations')
          .upsert(
            {
              property_id: params.id,
              exact_address: address !== undefined ? address.trim() : currentExactAddress,
              google_maps_url:
                normalizedGoogleMapsUrl !== undefined
                  ? normalizedGoogleMapsUrl
                  : (currentGoogleMapsUrl || null),
              location_confirmed:
                normalizedGoogleMapsUrl !== undefined
                  ? true
                  : Boolean(existingPrivateLoc?.location_confirmed),
              pending_exact_address: null,
              pending_google_maps_url: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'property_id' }
          );

        if (directLocErr) throw directLocErr;
      }
    }

    if (description !== undefined) directUpdates.description = description.trim();
    if (amenities !== undefined) directUpdates.amenities = amenities;
    if (photos !== undefined) directUpdates.photos = photos;
    if (shared_washroom_photos !== undefined) directUpdates.shared_washroom_photos = shared_washroom_photos;
    if (cover_photo !== undefined) directUpdates.cover_photo = cover_photo;
    if (contact_phone !== undefined) directUpdates.contact_phone = contact_phone.trim();
    if (contact_whatsapp !== undefined) directUpdates.contact_whatsapp = contact_whatsapp.trim();
    if (contact_email !== undefined) directUpdates.contact_email = contact_email.trim();
    if (notify_email !== undefined) directUpdates.notify_email = Boolean(notify_email);
    if (notify_whatsapp !== undefined) directUpdates.notify_whatsapp = Boolean(notify_whatsapp);
    if (house_rules !== undefined) directUpdates.house_rules = house_rules.trim();
    if (check_in_time !== undefined) directUpdates.check_in_time = check_in_time.trim();
    if (check_out_time !== undefined) directUpdates.check_out_time = check_out_time.trim();

    if (Object.keys(directUpdates).length > 1) {
      await adminClient.from('properties').update(directUpdates).eq('id', params.id);
    }

    // Operational updates: Room units, rates, photos & features
    if (Array.isArray(rooms)) {
      for (const room of rooms) {
        if (room.deleted && room.id) {
          // Delete room unit
          await adminClient
            .from('room_units')
            .delete()
            .eq('id', room.id)
            .eq('property_id', params.id);
        } else if (room.id) {
          const roomUpdates: any = {
            room_name: room.room_name?.trim(),
            description: room.description?.trim(),
            max_guests: Number(room.max_guests) || 2,
            base_price: Number(room.base_price),
            active: room.active !== undefined ? Boolean(room.active) : true,
          };
          if (room.attached_washroom !== undefined) roomUpdates.attached_washroom = Boolean(room.attached_washroom);
          if (room.view_type !== undefined) roomUpdates.view_type = room.view_type;
          if (room.bed_type !== undefined) roomUpdates.bed_type = room.bed_type.trim();
          if (room.features !== undefined) roomUpdates.features = room.features;
          if (room.photos !== undefined) roomUpdates.photos = room.photos;
          if (room.washroom_photos !== undefined) roomUpdates.washroom_photos = room.attached_washroom ? room.washroom_photos : [];

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
              washroom_photos: room.attached_washroom ? (room.washroom_photos || []) : [],
              active: true
            });
        }
      }
    }

    // Fetch refreshed property
    const { data: updatedProperty } = await adminClient
      .from('properties')
      .select('*, room_units(*), property_private_locations(*)')
      .eq('id', params.id)
      .single();

    return NextResponse.json({
      ok: true,
      staged_for_review: stagedForReview,
      message: stagedForReview
        ? 'Public content changes submitted for administrator moderation. Your currently approved listing remains live.'
        : 'Operational settings and room rates successfully updated.',
      property: attachPrivateLocationToProperty(updatedProperty)
    });
  } catch (err: any) {
    console.error('Property update error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to update property' }, { status: 500 });
  }
}
