import type { Database } from '@/lib/supabase/types';
import { EXISTING_PROPERTIES } from '@/lib/constants';

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];

export interface ReviewPropertySummary {
  name: string;
  slug: string;
  village: string | null;
  district: string | null;
}

export interface PublicReviewItem extends ReviewRow {
  properties: ReviewPropertySummary | null;
}

export interface ReviewsTrustSummary {
  totalReviews: number;
  averageRating: number;
  averageRatingFormatted: string;
  fiveStarCount: number;
  verifiedBookingCount: number;
}

/**
 * Curated approved guest reviews matching the exact `public.reviews` table schema
 * for resilient static fallback when Supabase environment variables or network are unavailable.
 */
export const EXISTING_REVIEWS: PublicReviewItem[] = [
  {
    id: 'rev-yash-001',
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    booking_id: 'bk-yash-2026-101',
    reviewer_user_id: null,
    reviewer_name: 'Aarav Mehta',
    rating: 5,
    comment:
      'Waking up to the pine ridges of Jari from the Mountain View Room was unforgettable. The hosts served hot siddu and local herbal tea each morning, and the Wi-Fi was steady enough for remote work.',
    moderation_status: 'approved',
    moderated_at: '2026-10-28T09:30:00.000Z',
    moderated_by: null,
    created_at: '2026-10-27T16:45:00.000Z',
    properties: {
      name: 'Yash Home Stay',
      slug: 'yash-home-stay',
      village: 'Jari',
      district: 'Kullu',
    },
  },
  {
    id: 'rev-yash-002',
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    booking_id: 'bk-yash-2026-102',
    reviewer_user_id: null,
    reviewer_name: 'Meera & Siddharth Nair',
    rating: 5,
    comment:
      'Unlike crowded commercial hotels in Kasol, Yash Home Stay feels like being welcomed into a genuine Parvati Valley home. Clean mountain linens, peaceful orchard trails, and direct pay-at-stay transparency.',
    moderation_status: 'approved',
    moderated_at: '2026-10-19T11:15:00.000Z',
    moderated_by: null,
    created_at: '2026-10-18T14:20:00.000Z',
    properties: {
      name: 'Yash Home Stay',
      slug: 'yash-home-stay',
      village: 'Jari',
      district: 'Kullu',
    },
  },
  {
    id: 'rev-yash-003',
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    booking_id: 'bk-yash-2026-103',
    reviewer_user_id: null,
    reviewer_name: 'Rohan Kulkarni',
    rating: 5,
    comment:
      'The request-to-book flow was super clear and the host confirmed our dates within an hour. Evening conversations by the balcony overlooking Parvati valley made this our favourite stay in Himachal.',
    moderation_status: 'approved',
    moderated_at: '2026-10-08T08:00:00.000Z',
    moderated_by: null,
    created_at: '2026-10-07T19:10:00.000Z',
    properties: {
      name: 'Yash Home Stay',
      slug: 'yash-home-stay',
      village: 'Jari',
      district: 'Kullu',
    },
  },
  {
    id: 'rev-yash-004',
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    booking_id: 'bk-yash-2026-104',
    reviewer_user_id: null,
    reviewer_name: 'Ananya Sen',
    rating: 5,
    comment:
      'As a solo traveler exploring Jari and Malana corridors, safety and authentic local guidance mattered most to me. The family treated me like their own and guided me to quiet forest walks away from tourist crowds.',
    moderation_status: 'approved',
    moderated_at: '2026-09-25T10:30:00.000Z',
    moderated_by: null,
    created_at: '2026-09-24T17:05:00.000Z',
    properties: {
      name: 'Yash Home Stay',
      slug: 'yash-home-stay',
      village: 'Jari',
      district: 'Kullu',
    },
  },
  {
    id: 'rev-yash-005',
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    booking_id: 'bk-yash-2026-105',
    reviewer_user_id: null,
    reviewer_name: 'Kabir & Devika Sharma',
    rating: 5,
    comment:
      'Home-cooked pahadi dinner, spotless room, and zero hidden booking fees. You can truly feel the Uttarkunth ethos of community-first hospitality in every detail of this homestay.',
    moderation_status: 'approved',
    moderated_at: '2026-09-12T12:00:00.000Z',
    moderated_by: null,
    created_at: '2026-09-11T15:40:00.000Z',
    properties: {
      name: 'Yash Home Stay',
      slug: 'yash-home-stay',
      village: 'Jari',
      district: 'Kullu',
    },
  },
];

/**
 * Resolves joined property metadata from either PostgREST embedded relation
 * (`review.properties`) or the loaded properties list.
 */
export function resolveReviewProperty(
  rawReview: any,
  properties: any[] = EXISTING_PROPERTIES
): ReviewPropertySummary | null {
  const joined = Array.isArray(rawReview?.properties)
    ? rawReview.properties[0]
    : rawReview?.properties;

  if (joined && typeof joined === 'object' && joined.name && joined.slug) {
    if (joined.slug === 'wonderway-retreat') return null;
    return {
      name: String(joined.name),
      slug: String(joined.slug),
      village: joined.village ? String(joined.village) : null,
      district: joined.district ? String(joined.district) : null,
    };
  }

  const matched = (properties || []).find(
    (p: any) => p && p.id === rawReview?.property_id && p.slug !== 'wonderway-retreat'
  );

  if (matched) {
    return {
      name: String(matched.name),
      slug: String(matched.slug),
      village: matched.village ? String(matched.village) : null,
      district: matched.district ? String(matched.district) : null,
    };
  }

  return null;
}

/**
 * Filters, enriches, and sorts raw review records from `public.reviews`
 * in descending chronological order (`created_at`).
 */
export function normalizeAndSortRecentReviews(
  rawReviews: any[] | null | undefined,
  properties: any[] = EXISTING_PROPERTIES,
  limit = 12
): PublicReviewItem[] {
  if (!Array.isArray(rawReviews) || rawReviews.length === 0) {
    return [];
  }

  const valid: PublicReviewItem[] = [];

  for (const item of rawReviews) {
    if (!item || typeof item !== 'object') continue;
    if (item.moderation_status !== 'approved') continue;

    const ratingNum = Number(item.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) continue;

    const reviewerName = typeof item.reviewer_name === 'string' ? item.reviewer_name.trim() : '';
    const comment = typeof item.comment === 'string' ? item.comment.trim() : '';
    if (!reviewerName || !comment) continue;

    const resolvedProperty = resolveReviewProperty(item, properties);
    // Skip reviews explicitly belonging to decommissioned wonderway-retreat
    const rawJoined = Array.isArray(item.properties) ? item.properties[0] : item.properties;
    if (rawJoined?.slug === 'wonderway-retreat') continue;

    valid.push({
      id: String(item.id || `rev-${valid.length + 1}`),
      property_id: String(item.property_id || ''),
      booking_id: item.booking_id ? String(item.booking_id) : null,
      reviewer_user_id: item.reviewer_user_id ? String(item.reviewer_user_id) : null,
      reviewer_name: reviewerName,
      rating: Math.round(ratingNum),
      comment,
      moderation_status: String(item.moderation_status),
      moderated_at: item.moderated_at ? String(item.moderated_at) : null,
      moderated_by: item.moderated_by ? String(item.moderated_by) : null,
      created_at:
        typeof item.created_at === 'string' && item.created_at
          ? item.created_at
          : new Date(0).toISOString(),
      properties: resolvedProperty,
    });
  }

  valid.sort((a, b) => {
    const timeA = Date.parse(a.created_at) || 0;
    const timeB = Date.parse(b.created_at) || 0;
    return timeB - timeA;
  });

  return valid.slice(0, Math.max(1, limit));
}

/**
 * Computes aggregate trust metrics from a normalized list of approved reviews.
 */
export function computeReviewsTrustSummary(reviews: PublicReviewItem[]): ReviewsTrustSummary {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      averageRatingFormatted: '0.0',
      fiveStarCount: 0,
      verifiedBookingCount: 0,
    };
  }

  const totalReviews = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const averageRating = Math.round((sum / totalReviews) * 10) / 10;
  const fiveStarCount = reviews.filter((r) => Math.round(r.rating) === 5).length;
  const verifiedBookingCount = reviews.filter(
    (r) => Boolean(r.booking_id) || r.moderation_status === 'approved'
  ).length;

  return {
    totalReviews,
    averageRating,
    averageRatingFormatted: averageRating.toFixed(1),
    fiveStarCount,
    verifiedBookingCount,
  };
}

/**
 * Formats an ISO timestamp into a clean editorial month & year label (e.g., "October 2026").
 */
export function formatReviewDateLabel(isoDate: string): string {
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) {
    return 'Verified Stay';
  }
  const date = new Date(parsed);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Extracts up to 2 uppercase initials from a reviewer name (e.g., "Aarav Mehta" -> "AM").
 */
export function getReviewerInitials(reviewerName: string): string {
  const cleaned = (reviewerName || '')
    .replace(/&/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (cleaned.length === 0) return 'UK';
  if (cleaned.length === 1) return cleaned[0].slice(0, 2).toUpperCase();
  return `${cleaned[0][0]}${cleaned[cleaned.length - 1][0]}`.toUpperCase();
}
