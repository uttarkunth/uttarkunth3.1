import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { HostApplySchema } from '@/lib/validations';

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
        description: data.description,
        amenities: data.amenities,
        photos: [],
        booking_mode: 'request',
        host_id: user.id,
        published: false,
        moderation_status: 'pending',
        moderation_notes: data.host_phone
          ? `Host application submitted by ${user.email} (Contact: ${data.host_phone}). Pending Property Reviewer verification.`
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

    // Insert initial room into room_units and inspect error for honest failure handling
    const { error: roomErr } = await adminClient.from('room_units').insert({
      property_id: createdProperty.id,
      room_name: data.initial_room_name,
      max_guests: data.initial_room_guests,
      base_price: data.initial_room_price,
      description: data.initial_room_description || null,
      active: true,
    });

    if (roomErr) {
      // Rollback draft property insertion if room unit creation fails to prevent orphaned listings
      console.error('Room creation failed, rolling back draft property:', roomErr);
      await adminClient.from('properties').delete().eq('id', createdProperty.id);
      return NextResponse.json(
        { ok: false, error: `Failed to configure initial room unit: ${roomErr.message}` },
        { status: 500 }
      );
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
