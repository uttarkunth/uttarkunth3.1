import React from 'react';
import Link from 'next/link';
import { BRAND, COMMUNITY_STORIES } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import { CommunityStoryForm } from '@/components/community-story-form';
import { BookOpen, ArrowLeft, MapPin, Calendar, Clock, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: `Oral Archives & Field Stories — ${BRAND.name} Community`,
  description: `Authentic mountain stories, oral folklore transcriptions, and field reflections from Himalayan hamlets.`,
  alternates: {
    canonical: '/community/stories',
  },
};

export default async function CommunityStoriesPage() {
  let stories: any[] = COMMUNITY_STORIES;
  let isDbReady = false;
  try {
    const adminClient = createAdminClient();
    const { data: dbStories, error: storyErr } = await adminClient
      .from('community_stories')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    isDbReady = !storyErr;
    if (dbStories && dbStories.length > 0) {
      stories = dbStories;
    }
  } catch {
    isDbReady = false;
    stories = COMMUNITY_STORIES;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24 space-y-12">
      {/* Back button */}
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community Hub</span>
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 text-forest text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-ukorange" />
          Living Oral History Archive
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-forest">
          Field Stories &amp; Oral Folklore
        </h1>
        <p className="text-sm sm:text-base text-charcoal-muted max-w-2xl leading-relaxed">
          Transcriptions and personal dispatches from Himalayan hamlets. Preserving ancestral timber wisdom, ecological stewardship, and the living poetry of the mountain valleys.
        </p>
      </div>

      {/* Stories list */}
      <div className="space-y-8">
        {stories.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-forest/15 shadow-soft text-center space-y-4">
            <BookOpen className="w-10 h-10 text-ukorange mx-auto" />
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="inline-block px-3 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                Archive Preparation Stage
              </span>
              <h2 className="font-serif text-2xl font-bold text-forest">
                No Published Community Stories Yet
              </h2>
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                We do not publish fabricated dispatches. Verified oral histories, elder interviews, and field notes will appear here only after they are recorded with explicit community consent and approved in our production archive.
              </p>
            </div>
          </div>
        ) : (
          stories.map((story: any) => (
            <article
              key={story.id}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-6"
            >
              <div className="space-y-2 border-b border-forest/10 pb-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-muted">
                  <span className="font-semibold text-forest">{story.author || story.author_name}</span>
                  <span>•</span>
                  <span>{story.role || story.author_role}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-ukorange" />
                    {story.village}, {story.valley}
                  </span>
                  {story.date && (
                    <>
                      <span>•</span>
                      <span>{story.date}</span>
                    </>
                  )}
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                  {story.title}
                </h2>
              </div>

              <div className="prose prose-sm text-charcoal leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {story.content}
              </div>

              {story.excerpt && !story.content && (
                <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed italic">
                  &ldquo;{story.excerpt}&rdquo;
                </p>
              )}
            </article>
          ))
        )}
      </div>

      {/* Contribute Story Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-forest/15 shadow-soft space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ukorange flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Preserve Mountain Voices
          </span>
          <h2 className="font-serif text-2xl font-bold text-forest">
            Submit a Field Reflection or Folk Narrative
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
            Are you a local elder, traveler, or folklorist with a genuine story from Parvati, Kullu, or Spiti valleys? Submit your draft for community archive review.
          </p>
        </div>

        <CommunityStoryForm isDbReady={isDbReady} />
      </div>
    </div>
  );
}
