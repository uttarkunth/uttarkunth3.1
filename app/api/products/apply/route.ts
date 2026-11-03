import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SellerApplicationSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required. Please sign in to submit a seller application.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = SellerApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid application details' },
        { status: 400 }
      );
    }

    const {
      business_name,
      maker_name,
      craft_type,
      valley,
      state,
      contact_email,
      contact_phone,
      bio,
      materials,
    } = parsed.data;

    const adminClient = createAdminClient();

    // Check if seller record already exists
    const { data: existingSeller } = await adminClient
      .from('sellers')
      .select('user_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSeller) {
      if (existingSeller.status === 'approved') {
        return NextResponse.json(
          { ok: false, error: 'Your seller profile is already approved. Visit your Seller Workspace.' },
          { status: 400 }
        );
      }
      if (existingSeller.status === 'pending') {
        return NextResponse.json(
          { ok: false, error: 'Your seller application is already under review by our curation team.' },
          { status: 400 }
        );
      }
    }

    // Insert or update seller application
    const { data: seller, error: upsertErr } = await adminClient
      .from('sellers')
      .upsert({
        user_id: user.id,
        business_name,
        maker_name,
        craft_type,
        valley,
        state,
        status: 'pending',
        contact_email: contact_email.toLowerCase(),
        contact_phone: contact_phone || null,
        bio: bio || null,
        materials: materials || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertErr) {
      console.error('Error saving seller application:', upsertErr);
      return NextResponse.json(
        { ok: false, error: 'Failed to record application. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Application submitted successfully. Our curation team will review your mountain provenance within 48 hours.',
      seller,
    });
  } catch (err: any) {
    console.error('Seller apply error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
