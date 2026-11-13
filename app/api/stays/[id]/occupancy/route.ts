import { NextRequest, NextResponse } from 'next/server';
import { createPublicServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const from = searchParams.get('from') || today;
    const to = searchParams.get('to') || threeMonthsLater;

    const supabase = createPublicServerSupabaseClient();
    const { data, error } = await (supabase.rpc as any)('get_public_room_occupancy', {
      p_property_id: params.id,
      p_from: from,
      p_to: to,
    });

    if (error) {
      console.error('get_public_room_occupancy error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      occupancy: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
