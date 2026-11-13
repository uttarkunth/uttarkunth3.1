import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query published and approved properties (public locality only)
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('published', true)
      .eq('moderation_status', 'approved')
      .neq('slug', 'wonderway-retreat')
      .order('name', { ascending: true });

    if (propError || !properties || properties.length === 0) {
      return NextResponse.json({
        ok: true,
        count: 0,
        properties: [],
        source: 'live_supabase'
      });
    }

    // Fetch active room units for these properties
    const propertyIds = properties.map(p => p.id);
    const { data: rooms } = await supabase
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
      ok: false,
      count: 0,
      properties: [],
      error: err.message
    }, { status: 500 });
  }
}
