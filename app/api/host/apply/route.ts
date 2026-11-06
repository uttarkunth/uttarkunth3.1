import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { HostApplySchema } from '@/lib/validations';
import { notifyHostPropertySubmitted } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

function slugifyProperty(name: string, village: string): string {
  const base = `${name}-${village}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'himalayan-stay'}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Please sign in to your Uttarkunth Member account to submit a homestay application.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = HostApplySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error:
            validation.error.errors[0]?.message ||
            'Property name, village, district, and an authentic property description (min 20 characters) are required.',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;
    const adminClient = createAdminClient();
    const slug = slugifyProperty(data.name, data.village);

    const contactPhone = data.contact_phone || data.host_phone || '';
    const contactWhatsapp = data.contact_whatsapp || contactPhone;
    const contactEmail = data.contact_email || user.email || '';

    const { data: createdProperty, error: propErr } = await adminClient
      .from('properties')
      .insert({
        name: data.name,
        slug,
        property_type: data.property_type,
        village: data.village,
        district: data.district,
        state: data.state,
        address: data.address || `${data.village}, ${data.district}, ${data.state}`,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        cover_photo: data.cover_photo || (data.photos && data.photos[0]) || null,
        description: data.description,
        amenities: data.amenities || [],
        photos: data.photos || [],
        contact_phone: contactPhone || null,
        contact_whatsapp: contactWhatsapp || null,
        contact_email: contactEmail || null,
        notify_email: data.notify_email ?? true,
        notify_whatsapp: data.notify_whatsapp ?? false,
        house_rules: data.house_rules || null,
        check_in_time: data.check_in_time || '12:00 PM',
        check_out_time: data.check_out_time || '11:00 AM',
        booking_mode: 'request',
        host_id: user.id,
        published: false,
        moderation_status: 'pending',
        moderation_notes: contactPhone
          ? `Host application submitted by ${user.email} (Contact: ${contactPhone}, WhatsApp: ${contactWhatsapp || contactPhone}). Pending Curation Review.`
          : `Host application submitted by ${user.email}. Pending Curation Review.`,
      })
      .select()
      .single();

    if (propErr || !createdProperty) {
      return NextResponse.json(
        { ok: false, error: propErr?.message || 'Failed to submit property application.' },
        { status: 500 }
      );
    }

    // Prepare room records: either from multi-room array or fallback to initial_room_*
    const roomsToInsert: any[] = [];
    if (Array.isArray(data.rooms) && data.rooms.length > 0) {
      data.rooms.forEach((r, idx) => {
        const roomPhotos = Array.isArray(r.photos) ? r.photos : [];
        const washroomPhotos = Array.isArray(r.washroom_photos) ? r.washroom_photos : [];
        const allPhotos = [...roomPhotos, ...washroomPhotos];

        roomsToInsert.push({
          property_id: createdProperty.id,
          room_name: r.room_name,
          max_guests: r.max_guests || 2,
          base_price: r.base_price,
          description: r.description || null,
          attached_washroom: r.attached_washroom ?? false,
          view_type: r.view_type || 'mountain',
          bed_type: r.bed_type || 'King / Double Bed',
          features: r.features || [],
          photos: allPhotos,
          sort_order: idx + 1,
          active: r.active ?? true,
        });
      });
    } else {
      roomsToInsert.push({
        property_id: createdProperty.id,
        room_name: data.initial_room_name || 'Mountain View Room',
        max_guests: data.initial_room_guests || 2,
        base_price: data.initial_room_price || 2000,
        description: data.initial_room_description || null,
        attached_washroom: data.attached_washroom ?? false,
        view_type: (data.view_type as any) || 'mountain',
        bed_type: 'King / Double Bed',
        features: [],
        photos: [],
        sort_order: 1,
        active: true,
      });
    }

    const { error: roomErr } = await adminClient.from('room_units').insert(roomsToInsert);

    if (roomErr) {
      console.error('Room creation failed, rolling back draft property:', roomErr);
      await adminClient.from('properties').delete().eq('id', createdProperty.id);
      return NextResponse.json(
        { ok: false, error: `Failed to configure room units: ${roomErr.message}` },
        { status: 500 }
      );
    }

    // Send in-app, WhatsApp, and Email notifications confirming property submission is under review
    await notifyHostPropertySubmitted({
      hostUserId: user.id,
      propertyName: createdProperty.name,
      village: createdProperty.village || data.village,
      hostEmail: contactEmail || user.email,
      hostPhone: contactPhone,
      hostWhatsapp: contactWhatsapp,
    });

    return NextResponse.json({
      ok: true,
      property: createdProperty,
      message:
        'Your homestay application has been submitted to the Uttarkunth Stays Curation team. It remains unpublished until verified and approved.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
