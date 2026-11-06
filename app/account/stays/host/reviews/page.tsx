import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHostProperties } from '@/lib/host';
import { HostSubnav } from '@/components/host-subnav';
import { Star, MessageSquare, ShieldCheck, Home, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HostReviewsPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/stays/host/reviews');
  }

  const { properties, isHost, isAdmin } = await getHostProperties(user.id);
  const propertyIds = properties.map((p) => p.id);

  const adminClient = createAdminClient();
  let reviews: any[] = [];

  if (propertyIds.length > 0) {
    const { data } = await adminClient
      .from('reviews')
      .select('id, property_id, reviewer_name, rating, comment, moderation_status, created_at, properties(name)')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });

    if (data) {
      reviews = data;
    }
  }

  return (
    <div className="space-y-6">
      <HostSubnav propertiesCount={properties.length} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ukorange">
              Feedback &amp; Hospitality Ratings
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest mt-1">
            Guest Reviews &amp; Experiences
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Verified feedback from guests who have stayed at your homestays.
          </p>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="p-6 bg-white rounded-3xl border border-forest/15 shadow-soft space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-forest ml-1">{r.rating}/5</span>
                  </div>
                  <span className="text-[11px] text-charcoal-muted">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-charcoal leading-relaxed italic">
                  "{r.comment}"
                </p>
              </div>

              <div className="pt-3 border-t border-forest/10 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-forest block">{r.reviewer_name}</strong>
                  <span className="text-charcoal-muted text-[11px]">
                    {(r.properties as any)?.name || 'Homestay'}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Verified Stay
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-forest/15 shadow-soft max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mx-auto">
            <Star className="w-6 h-6 text-ukorange" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-forest">No Guest Reviews Yet</h2>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            As soon as guests complete confirmed stays at your homestay, their authentic reflections, mountain hospitality reviews, and ratings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
