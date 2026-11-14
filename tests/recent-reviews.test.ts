import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXISTING_REVIEWS,
  normalizeAndSortRecentReviews,
  computeReviewsTrustSummary,
  resolveReviewProperty,
  formatReviewDateLabel,
  getReviewerInitials,
} from '../lib/reviews.ts';
import { EXISTING_PROPERTIES } from '../lib/constants.ts';

test('Recent Reviews: EXISTING_REVIEWS conforms to public.reviews schema and links to approved stay', () => {
  assert.ok(EXISTING_REVIEWS.length >= 4, 'Should provide multiple verified guest reviews for carousel');
  for (const rev of EXISTING_REVIEWS) {
    assert.equal(rev.moderation_status, 'approved');
    assert.ok(rev.rating >= 1 && rev.rating <= 5);
    assert.ok(rev.reviewer_name.length > 0);
    assert.ok(rev.comment.length > 20);
    assert.equal(rev.property_id, EXISTING_PROPERTIES[0].id);
    assert.equal(rev.properties?.slug, 'yash-home-stay');
  }
});

test('Recent Reviews: normalizeAndSortRecentReviews filters unapproved/invalid reviews and sorts newest first', () => {
  const rawInput = [
    {
      id: 'r-older',
      property_id: EXISTING_PROPERTIES[0].id,
      booking_id: 'b-1',
      reviewer_name: 'Vikram Singh',
      rating: 4,
      comment: 'Peaceful mountain mornings in Jari.',
      moderation_status: 'approved',
      created_at: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'r-pending',
      property_id: EXISTING_PROPERTIES[0].id,
      booking_id: 'b-2',
      reviewer_name: 'Unmoderated Guest',
      rating: 5,
      comment: 'Should not appear until approved by staff.',
      moderation_status: 'pending',
      created_at: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'r-newest',
      property_id: EXISTING_PROPERTIES[0].id,
      booking_id: 'b-3',
      reviewer_name: 'Neha Verma',
      rating: 5,
      comment: 'Warm hospitality and authentic Pahadi meals.',
      moderation_status: 'approved',
      created_at: '2026-10-29T12:00:00.000Z',
    },
    {
      id: 'r-invalid-rating',
      property_id: EXISTING_PROPERTIES[0].id,
      booking_id: 'b-4',
      reviewer_name: 'Bad Rating',
      rating: 9,
      comment: 'Out of range rating should be ignored.',
      moderation_status: 'approved',
      created_at: '2026-10-30T12:00:00.000Z',
    },
    {
      id: 'r-wonderway',
      property_id: 'b1a8c6a7-e73c-431c-8727-c8e385dbd173',
      reviewer_name: 'Excluded Property Guest',
      rating: 5,
      comment: 'Decommissioned property review must be excluded.',
      moderation_status: 'approved',
      created_at: '2026-10-31T12:00:00.000Z',
      properties: {
        name: 'Wonderway Retreat',
        slug: 'wonderway-retreat',
        village: 'Jari',
        district: 'Kullu',
      },
    },
  ];

  const normalized = normalizeAndSortRecentReviews(rawInput, EXISTING_PROPERTIES);
  assert.equal(normalized.length, 2, 'Only approved, valid reviews for active properties should remain');
  assert.equal(normalized[0].id, 'r-newest', 'Newest review must be sorted first');
  assert.equal(normalized[1].id, 'r-older', 'Older review must be sorted second');
  assert.equal(normalized[0].properties?.slug, 'yash-home-stay', 'Property metadata enriched from properties list');
});

test('Recent Reviews: computeReviewsTrustSummary calculates accurate rating averages and counts', () => {
  const normalized = normalizeAndSortRecentReviews(EXISTING_REVIEWS, EXISTING_PROPERTIES);
  const summary = computeReviewsTrustSummary(normalized);

  assert.equal(summary.totalReviews, EXISTING_REVIEWS.length);
  assert.equal(summary.averageRating, 5);
  assert.equal(summary.averageRatingFormatted, '5.0');
  assert.equal(summary.fiveStarCount, EXISTING_REVIEWS.length);
  assert.equal(summary.verifiedBookingCount, EXISTING_REVIEWS.length);

  const emptySummary = computeReviewsTrustSummary([]);
  assert.equal(emptySummary.totalReviews, 0);
  assert.equal(emptySummary.averageRatingFormatted, '0.0');
});

test('Recent Reviews: resolveReviewProperty, formatReviewDateLabel, and getReviewerInitials handle edge cases', () => {
  const joinedArrayReview = {
    property_id: 'custom-prop',
    properties: [{ name: 'Parvati Pine House', slug: 'parvati-pine-house', village: 'Kasol', district: 'Kullu' }],
  };
  const resolved = resolveReviewProperty(joinedArrayReview, []);
  assert.equal(resolved?.slug, 'parvati-pine-house');
  assert.equal(resolved?.village, 'Kasol');

  assert.equal(getReviewerInitials('Aarav Mehta'), 'AM');
  assert.equal(getReviewerInitials('Meera & Siddharth Nair'), 'MN');
  assert.equal(getReviewerInitials('Rohan'), 'RO');
  assert.equal(getReviewerInitials(''), 'UK');

  assert.equal(formatReviewDateLabel('invalid-date'), 'Verified Stay');
  assert.match(formatReviewDateLabel('2026-10-27T16:45:00.000Z'), /2026/);
});
