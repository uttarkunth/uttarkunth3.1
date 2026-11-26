'use client';

import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import { useHostWorkspace } from '@/components/host/host-workspace-shell';
import {
  computeReviewDistribution,
  filterReviewsByProperty,
  getPropertyDisplayName,
  type HostReviewRecord,
} from '@/lib/host-dashboard';

interface ReviewsManagerProps {
  initialReviews: HostReviewRecord[];
}

export function ReviewsManager({ initialReviews }: ReviewsManagerProps) {
  const { selectedPropertyId, setSelectedPropertyId, properties } = useHostWorkspace();

  const scopedReviews = useMemo(
    () => filterReviewsByProperty(initialReviews, selectedPropertyId),
    [initialReviews, selectedPropertyId]
  );

  const summary = useMemo(
    () => computeReviewDistribution(initialReviews, selectedPropertyId),
    [initialReviews, selectedPropertyId]
  );

  return (
    <div className="space-y-4" data-testid="host-reviews-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#665E52]">
            <span>Host Workspace</span>
            <span>/</span>
            <span>Manage Stays</span>
            <span>/</span>
            <strong className="text-[#263D32]">Guest Reviews</strong>
          </div>
          <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-[#29251F] leading-tight mt-0.5">
            Guest Reviews
          </h1>
          <p className="text-[13px] text-[#665E52] mt-0.5">
            Verified feedback from travellers who completed confirmed stays at your properties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter reviews by property"
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="px-3 py-2 rounded-[10px] bg-[#FFFDF9] border border-[#D9CCB8] text-xs font-bold text-[#29251F] focus:outline-none focus:border-[#263D32] cursor-pointer"
          >
            <option value="all">All properties ({properties.length})</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {getPropertyDisplayName(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Layout: Overall Rating Distribution + Verified Guest Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left: Overall Guest Rating */}
        <section className="lg:col-span-4 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-4">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">Overall Guest Rating</h2>
            <p className="text-xs text-[#665E52]">Across verified guest stays</p>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="font-serif text-[44px] font-bold text-[#263D32] leading-none tabular-nums">
              {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '—'}
            </div>
            <div>
              <div className="flex items-center gap-0.5 text-[#D88924]">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-4 h-4 ${
                      idx < Math.round(summary.averageRating)
                        ? 'fill-[#D88924] text-[#D88924]'
                        : 'text-[#D9CCB8]'
                    }`}
                  />
                ))}
              </div>
              <span className="block text-xs text-[#665E52] mt-1">
                Based on {summary.totalReviews} verified{' '}
                {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <div
                key={star}
                className="grid grid-cols-[44px_1fr_36px] items-center gap-2 text-xs"
              >
                <span className="font-bold text-[#29251F]">{star} ★</span>
                <div className="h-2 rounded-full bg-[#EAE2D3] overflow-hidden">
                  <div
                    style={{ width: `${summary.percentagesByStar[star]}%` }}
                    className="h-full rounded-full bg-[#263D32] transition-all duration-300"
                  />
                </div>
                <span className="text-right text-[#665E52] tabular-nums">
                  {summary.percentagesByStar[star]}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Verified Guest Feedback List */}
        <section className="lg:col-span-8 p-4 sm:p-5 rounded-[16px] bg-[#FFFDF9] border border-[#D9CCB8] shadow-[0_1px_2px_rgba(24,22,18,0.04)] space-y-3.5">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#29251F]">Verified Guest Feedback</h2>
            <p className="text-xs text-[#665E52]">
              Recent reviews shared after completed stays
            </p>
          </div>

          {scopedReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scopedReviews.map((r) => (
                <article
                  key={r.id}
                  className="p-4 rounded-[14px] bg-[#F5F0E6]/75 border border-[#E5DEC9] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5 text-[#D88924]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating
                                ? 'fill-[#D88924] text-[#D88924]'
                                : 'text-[#D9CCB8]'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs font-extrabold text-[#29251F]">
                          {Number(r.rating).toFixed(1)}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E8F4EC] text-[#1F6A3B]">
                        Verified stay
                      </span>
                    </div>

                    <p className="text-[13px] text-[#29251F] leading-relaxed italic">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#E5DEC9] flex items-center justify-between gap-2 text-xs">
                    <div>
                      <strong className="block font-extrabold text-[#29251F]">
                        {r.reviewer_name || 'Verified Guest'}
                      </strong>
                      <span className="text-[11px] text-[#665E52]">
                        {r.properties?.name || r.properties?.title || 'Assigned Homestay'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#665E52] tabular-nums">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 rounded-[14px] bg-[#F5F0E6]/60 border border-[#E5DEC9] text-center space-y-2">
              <Star className="w-7 h-7 text-[#C55B23] mx-auto" />
              <h3 className="font-serif text-xl font-bold text-[#29251F]">
                No guest reviews yet
              </h3>
              <p className="text-xs text-[#665E52] max-w-md mx-auto leading-relaxed">
                As soon as guests complete confirmed stays at your homestay, their verified reflections and hospitality ratings will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
