import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
        { ok: false, error: 'Please sign in to your Uttarkunth Member account to submit a homestay application.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const name = String(body.name || '').trim();
    const propertyType = String(body.property_type || 'homestay').trim();
    const village = String(body.village || '').trim();
    const district = String(body.district || '').trim();
    const state = String(body.state || 'Himachal Pradesh').trim();
    const address = String(body.address || '').trim();
    const description = String(body.description || '').trim();
    const hostPhone = String(body.host_phone || '').trim();
    const amenities = Array.isArray(body.amenities)
      ? body.amenities.map((a: any) => String(a).trim()).filter(Boolean)
      : [];

    const initialRoomName = String(body.initial_room_name || 'Mountain View Room').trim();
    const initialRoomGuests = Math.max(1, Math.min(16, Number(body.initial_room_guests || 2)));
    const initialRoomPrice = Math.max(500, Number(body.initial_room_price || 2000));
    const initialRoomDesc = String(body.initial_room_description || '').trim();

    if (!name || name.length < 3 || !village || !district || description.length < 20) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Property name, village, district, and an authentic property description (min 20 characters) are required.',
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const slug = slugifyProperty(name, village);

    const { data: createdProperty, error: propErr } = await adminClient
      .from('properties')
      .insert({
        name,
        slug,
        property_type: propertyType,
        village,
        district,
        state,
        address: address || `${village}, ${district}, ${state}`,
        description,
        amenities,
        photos: [],
        booking_mode: 'request',
        host_id: user.id,
        published: false,
        moderation_status: 'pending',
        moderation_notes: hostPhone
          ? `Host application submitted by ${user.email} (Contact: ${hostPhone}). Pending Property Reviewer verification.`
          : `Host application submitted by ${user.email}. Pending Property Reviewer verification.`,
      })
      .select()
      .single();

    if (propErr || !createdProperty) {
      return NextResponse.json(
        { ok: false, error: propErr?.message || 'Failed to submit property application.' },
        { status: 500 }
      );
    }

    if (initialRoomName) {
      await adminClient.from('room_units').insert({
        property_id: createdProperty.id,
        room_name: initialRoomName,
        max_guests: initialRoomGuests,
        base_price: initialRoomPrice,
        description: initialRoomDesc || null,
        active: true,
      });
    }

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