import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EXISTING_PROPERTIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query published and approved properties
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, slug, name, description, address, village, district, state, property_type, booking_mode, amenities, photos, published, moderation_status')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .order('name', { ascending: true });

    if (propError || !properties || properties.length === 0) {
      // Fallback to verified existing properties if database query fails or returns empty
      return NextResponse.json({
        ok: true,
        count: EXISTING_PROPERTIES.length,
        properties: EXISTING_PROPERTIES,
        source: 'static_fallback'
      });
    }

    // Fetch active room units for these properties
    const propertyIds = properties.map(p => p.id);
    const { data: rooms, error: roomError } = await supabase
      .from('room_units')
      .select('id, property_id, room_name, description, max_guests, base_price, active')
      .in('property_id', propertyIds)
      .eq('active', true);

    const propertiesWithRooms = properties.map(p => ({
      ...p,
      rooms: rooms ? rooms.filter(r => r.property_id === p.id) : []
    }));

    return NextResponse.json({
      ok: true,
      count: propertiesWithRooms.length,
      properties: propertiesWithRooms,
      source: 'live_supabase'
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: true,
      count: EXISTING_PROPERTIES.length,
      properties: EXISTING_PROPERTIES,
      warning: err.message
    });
  }
}
