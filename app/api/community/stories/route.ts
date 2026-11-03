import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CommunityStorySubmissionSchema } from '@/lib/validations';
import { COMMUNITY_STORIES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { data: dbStories, error } = await adminClient
      .from('community_stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      return NextResponse.json({
        ok: true,
        available: false,
        stories: [],
        message: 'Online oral stories archive is not yet open (pending database activation).',
      });
    }

    return NextResponse.json({
      ok: true,
      available: true,
      stories: dbStories || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const parsed = CommunityStorySubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.errors[0]?.message || 'Invalid story submission' },
        { status: 400 }
      );
    }

    const {
      author_name,
      author_role,
      village,
      valley,
      title,
      excerpt,
      content,
      consent_given,
    } = parsed.data;

    const adminClient = createAdminClient();

    const { data: story, error: insertErr } = await adminClient
      .from('community_stories')
      .insert({
        user_id: user?.id || null,
        author_name,
        author_role,
        village,
        valley,
        title,
        excerpt,
        content,
        consent_given,
        status: 'submitted',
      })
      .select()
      .maybeSingle();

    if (insertErr) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FEATURE_NOT_YET_OPEN',
          error:
            'Online story submissions are not yet open while our Oral History database archive awaits production activation. Please share your dispatch directly via info@uttarkunth.com.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Story submitted successfully! Our cultural archive team will review the submission.',
      story,
    });
  } catch (err: any) {
    console.error('Story POST error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
