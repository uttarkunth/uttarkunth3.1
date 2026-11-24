import { NextRequest, NextResponse } from 'next/server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const from = searchParams.get('from') || ninetyDaysAgo;
    const to = searchParams.get('to') || oneYearLater;

    const supabase = createPublicServerSupabaseClient();
    const [occRes, availRes] = await Promise.all([
      (supabase.rpc as any)('get_public_room_occupancy', {
        p_property_id: params.id,
        p_from: from,
        p_to: to,
      }),
      (supabase.rpc as any)('get_public_room_availability', {
        p_property_id: params.id,
      }),
    ]);

    if (occRes.error) {
      console.error('get_public_room_occupancy error:', occRes.error);
      return NextResponse.json(
        { ok: false, error: occRes.error.message },
        { status: 500 }
      );
    }

    const occupancyList: Array<{
      room_unit_id: string;
      start_date: string;
      end_date: string;
      kind: string;
    }> = Array.isArray(occRes.data) ? [...occRes.data] : [];

    if (Array.isArray(availRes.data)) {
      for (const blk of availRes.data) {
        if (!blk?.blocked_from || !blk?.blocked_until) continue;
        const alreadyExists = occupancyList.some(
          (o) =>
            o.room_unit_id === blk.room_unit_id &&
            o.start_date === blk.blocked_from &&
            o.end_date === blk.blocked_until
        );
        if (!alreadyExists) {
          occupancyList.push({
            room_unit_id: blk.room_unit_id,
            start_date: blk.blocked_from,
            end_date: blk.blocked_until,
            kind: 'blocked',
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      occupancy: occupancyList,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

