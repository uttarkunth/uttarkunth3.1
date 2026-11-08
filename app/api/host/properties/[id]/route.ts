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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const adminClient = createAdminClient();
    const authResult = await checkHostAuthorization(adminClient, params.id, user.id);
    if (!authResult.authorized) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    if (authResult.role === 'co_host') return NextResponse.json({
      ok: false,
      error: 'Co-hosts have read-only access to property specifications. Only the primary host or manager can submit listing changes.'
    }, { status: 403 });

    const body = await req.json();
    const {
      name, description, address, village, district, state, google_maps_url,
      location_confirmed, cover_photo, property_type, amenities, photos,
      shared_washroom_photos, rooms, contact_phone, contact_whatsapp,
      contact_email, notify_email, notify_whatsapp, house_rules,
      check_in_time, check_out_time,
    } = body;

    const { data: existingProp, error: propertyFetchError } = await adminClient
      .from('properties').select('*, room_units(*), property_private_locations(*)')
      .eq('id', params.id).single();
    if (propertyFetchError || !existingProp) return NextResponse.json({ ok: false, error: 'Property not found' }, { status: 404 });

    const rawPrivateLoc = existingProp.property_private_locations;
    const existingPrivateLoc = Array.isArray(rawPrivateLoc) ? rawPrivateLoc[0] : rawPrivateLoc;
    const currentExactAddress = (existingPrivateLoc?.exact_address ?? existingProp.address ?? '').trim();
    const currentGoogleMapsUrl = (existingPrivateLoc?.google_maps_url ?? '').trim();
    let normalizedGoogleMapsUrl: string | undefined;

    if (google_maps_url !== undefined && String(google_maps_url).trim() !== '') {
      const mapsValidation = validateGoogleMapsUrl(String(google_maps_url));
      if (!mapsValidation.valid || !mapsValidation.normalizedUrl) return NextResponse.json({
        ok: false, error: mapsValidation.error || 'Please enter a valid Google Maps share link.'
      }, { status: 400 });
      normalizedGoogleMapsUrl = mapsValidation.normalizedUrl;
      if (normalizedGoogleMapsUrl !== currentGoogleMapsUrl && location_confirmed !== true) return NextResponse.json({
        ok: false, error: 'Please confirm that your Google Maps link points to your actual property location.'
      }, { status: 400 });
    }

    const isLiveApproved = existingProp.published === true && existingProp.moderation_status === 'approved';
    const isHostSubmission = isLiveApproved && authResult.role !== 'admin';

    if (isHostSubmission) {
      const currentRooms = Array.isArray(existingProp.room_units) ? existingProp.room_units : [];
      const existingPending = (existingProp.pending_changes || {}) as any;
      const roomSnapshot = Array.isArray(rooms)
        ? rooms.map((room: any, index: number) => ({
            ...room,
            id: room.id || null,
            deleted: Boolean(room.deleted),
            sort_order: index + 1,
            photos: Array.isArray(room.photos) ? room.photos : [],
            washroom_photos: room.attached_washroom && Array.isArray(room.washroom_photos) ? room.washroom_photos : [],
            features: Array.isArray(room.features) ? room.features : [],
          }))
        : (Array.isArray(existingPending.rooms) ? existingPending.rooms : currentRooms.map((room: any) => ({ ...room, deleted: false })));

      const snapshot = {
        name: name !== undefined ? String(name).trim() : existingProp.name,
        description: description !== undefined ? String(description).trim() : existingProp.description,
        village: village !== undefined ? String(village).trim() : existingProp.village,
        district: district !== undefined ? String(district).trim() : existingProp.district,
        state: state !== undefined ? String(state).trim() : existingProp.state,
        property_type: property_type !== undefined ? property_type : existingProp.property_type,
        amenities: Array.isArray(amenities) ? amenities : existingProp.amenities,
        photos: Array.isArray(photos) ? photos : existingProp.photos,
        shared_washroom_photos: Array.isArray(shared_washroom_photos) ? shared_washroom_photos : existingProp.shared_washroom_photos,
        cover_photo: cover_photo !== undefined ? cover_photo : existingProp.cover_photo,
        contact_phone: contact_phone !== undefined ? String(contact_phone).trim() : existingProp.contact_phone,
        contact_whatsapp: contact_whatsapp !== undefined ? String(contact_whatsapp).trim() : existingProp.contact_whatsapp,
        contact_email: contact_email !== undefined ? String(contact_email).trim() : existingProp.contact_email,
        notify_email: notify_email !== undefined ? Boolean(notify_email) : existingProp.notify_email,
        notify_whatsapp: notify_whatsapp !== undefined ? Boolean(notify_whatsapp) : existingProp.notify_whatsapp,
        house_rules: house_rules !== undefined ? String(house_rules).trim() : existingProp.house_rules,
        check_in_time: check_in_time !== undefined ? String(check_in_time).trim() : existingProp.check_in_time,
        check_out_time: check_out_time !== undefined ? String(check_out_time).trim() : existingProp.check_out_time,
        location: {
          exact_address: address !== undefined ? String(address).trim() : currentExactAddress,
          google_maps_url: normalizedGoogleMapsUrl !== undefined ? normalizedGoogleMapsUrl : (currentGoogleMapsUrl || null),
          location_confirmed: normalizedGoogleMapsUrl !== undefined ? true : Boolean(existingPrivateLoc?.location_confirmed),
        },
        rooms: roomSnapshot,
      };

      const { error: stageError } = await adminClient.from('properties').update({
        pending_changes: snapshot,
        pending_changes_status: 'pending',
        pending_changes_admin_notes: null,
        pending_changes_submitted_at: new Date().toISOString(),
        moderation_notes: 'Complete host update staged for Uttarkunth administrator review. The approved live listing remains unchanged.',
        updated_at: new Date().toISOString(),
      }).eq('id', params.id);
      if (stageError) throw stageError;

      const { data: stagedProperty, error: stagedFetchError } = await adminClient
        .from('properties').select('*, room_units(*), property_private_locations(*)')
        .eq('id', params.id).single();
      if (stagedFetchError) throw stagedFetchError;

      return NextResponse.json({
        ok: true, staged_for_review: true,
        message: 'Your complete update has been submitted for Uttarkunth approval. The current live listing remains unchanged until an administrator approves it.',
        property: attachPrivateLocationToProperty(stagedProperty),
      });
    }

    // Draft applications stay unpublished, and approved platform administrators may maintain records directly.
    const nextVillage = village !== undefined ? String(village).trim() : existingProp.village;
    const nextDistrict = district !== undefined ? String(district).trim() : existingProp.district;
    const nextState = state !== undefined ? String(state).trim() : existingProp.state;
    const directUpdates: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) directUpdates.name = String(name).trim();
    if (description !== undefined) directUpdates.description = String(description).trim();
    if (village !== undefined) directUpdates.village = nextVillage;
    if (district !== undefined) directUpdates.district = nextDistrict;
    if (state !== undefined) directUpdates.state = nextState;
    if (village !== undefined || district !== undefined || state !== undefined) directUpdates.address = [nextVillage, nextDistrict, nextState].filter(Boolean).join(', ');
    if (property_type !== undefined) directUpdates.property_type = property_type;
    if (amenities !== undefined) directUpdates.amenities = amenities;
    if (photos !== undefined) directUpdates.photos = photos;
    if (shared_washroom_photos !== undefined) directUpdates.shared_washroom_photos = shared_washroom_photos;
    if (cover_photo !== undefined) directUpdates.cover_photo = cover_photo;
    if (contact_phone !== undefined) directUpdates.contact_phone = String(contact_phone).trim();
    if (contact_whatsapp !== undefined) directUpdates.contact_whatsapp = String(contact_whatsapp).trim();
    if (contact_email !== undefined) directUpdates.contact_email = String(contact_email).trim();
    if (notify_email !== undefined) directUpdates.notify_email = Boolean(notify_email);
    if (notify_whatsapp !== undefined) directUpdates.notify_whatsapp = Boolean(notify_whatsapp);
    if (house_rules !== undefined) directUpdates.house_rules = String(house_rules).trim();
    if (check_in_time !== undefined) directUpdates.check_in_time = String(check_in_time).trim();
    if (check_out_time !== undefined) directUpdates.check_out_time = String(check_out_time).trim();

    const { error: updateError } = await adminClient.from('properties').update(directUpdates).eq('id', params.id);
    if (updateError) throw updateError;

    if (address !== undefined || normalizedGoogleMapsUrl !== undefined) {
      const { error: locationError } = await adminClient.from('property_private_locations').upsert({
        property_id: params.id,
        exact_address: address !== undefined ? String(address).trim() : currentExactAddress,
        google_maps_url: normalizedGoogleMapsUrl !== undefined ? normalizedGoogleMapsUrl : (currentGoogleMapsUrl || null),
        location_confirmed: normalizedGoogleMapsUrl !== undefined ? true : Boolean(existingPrivateLoc?.location_confirmed),
        pending_exact_address: null, pending_google_maps_url: null, updated_at: new Date().toISOString(),
      }, { onConflict: 'property_id' });
      if (locationError) throw locationError;
    }

    if (Array.isArray(rooms)) {
      for (let index = 0; index < rooms.length; index++) {
        const room = rooms[index];
        if (room.deleted && room.id) {
          const { error } = await adminClient.from('room_units').update({ active: false }).eq('id', room.id).eq('property_id', params.id);
          if (error) throw error;
        } else if (room.id) {
          const { error } = await adminClient.from('room_units').update({
            room_name: String(room.room_name || 'Room').trim(),
            description: room.description?.trim() || null,
            max_guests: Number(room.max_guests) || 2,
            base_price: Number(room.base_price) || 0,
            active: room.active !== undefined ? Boolean(room.active) : true,
            attached_washroom: Boolean(room.attached_washroom),
            view_type: room.view_type || 'none',
            bed_type: room.bed_type?.trim() || null,
            features: room.features || [], photos: room.photos || [],
            washroom_photos: room.attached_washroom ? (room.washroom_photos || []) : [],
            sort_order: index + 1,
          }).eq('id', room.id).eq('property_id', params.id);
          if (error) throw error;
        } else if (room.room_name && room.base_price) {
          const { error } = await adminClient.from('room_units').insert({
            property_id: params.id, room_name: room.room_name.trim(),
            description: room.description?.trim() || null,
            max_guests: Number(room.max_guests) || 2,
            base_price: Number(room.base_price) || 0,
            attached_washroom: Boolean(room.attached_washroom),
            view_type: room.view_type || 'none', bed_type: room.bed_type?.trim() || null,
            features: room.features || [], photos: room.photos || [],
            washroom_photos: room.attached_washroom ? (room.washroom_photos || []) : [],
            sort_order: index + 1, active: true,
          });
          if (error) throw error;
        }
      }
    }

    const { data: updatedProperty, error: finalFetchError } = await adminClient
      .from('properties').select('*, room_units(*), property_private_locations(*)')
      .eq('id', params.id).single();
    if (finalFetchError) throw finalFetchError;
    return NextResponse.json({
      ok: true, staged_for_review: false,
      message: 'Unpublished application changes saved. The listing will remain hidden until Uttarkunth approval.',
      property: attachPrivateLocationToProperty(updatedProperty),
    });
  } catch (err: any) {
    console.error('Property update error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to update property' }, { status: 500 });
  }
}
