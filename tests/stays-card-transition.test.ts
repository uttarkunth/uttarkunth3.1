import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePropertyRatingSummary,
  formatCardAmenities,
  getPropertyStartingRate,
  computeSharedElementTransform,
  matchesTransitionProperty,
  isTransitionRecordFresh,
  type QuickViewTransitionRecord,
} from '../lib/stays-card-transition';
import { EXISTING_PROPERTIES } from '../lib/constants';
import { EXISTING_REVIEWS } from '../lib/reviews';

test('computePropertyRatingSummary returns genuine rating only when supported by approved reviews', () => {
  const yash = EXISTING_PROPERTIES[0]!;
  const yashSummary = computePropertyRatingSummary(yash, EXISTING_REVIEWS);

  assert.equal(yashSummary.hasGenuineReviews, true);
  assert.ok(yashSummary.reviewCount >= 1);
  assert.equal(yashSummary.averageRating, 5.0);
  assert.equal(yashSummary.averageRatingLabel, '5.0');
  assert.equal(yashSummary.isGuestFavourite, true);

  // Unreviewed property must never fabricate ratings
  const unreviewed = {
    id: 'prop-unreviewed-99',
    slug: 'quiet-pine-cottage',
    name: 'Quiet Pine Cottage',
  };
  const emptySummary = computePropertyRatingSummary(unreviewed, EXISTING_REVIEWS);
  assert.equal(emptySummary.hasGenuineReviews, false);
  assert.equal(emptySummary.reviewCount, 0);
  assert.equal(emptySummary.averageRating, null);
  assert.equal(emptySummary.averageRatingLabel, null);
  assert.equal(emptySummary.isGuestFavourite, false);
});

test('formatCardAmenities caps desktop at 3 and mobile at 2 genuine amenities', () => {
  const yash = EXISTING_PROPERTIES[0]!;
  const formatted = formatCardAmenities(yash.amenities);

  assert.equal(formatted.desktopAmenities.length, 3);
  assert.equal(formatted.mobileAmenities.length, 2);
  assert.equal(
    formatted.mobileInlineText,
    `${formatted.mobileAmenities[0]!.label} · ${formatted.mobileAmenities[1]!.label}`
  );

  // Gracefully handles missing or empty amenities without inventing items
  const emptyFormatted = formatCardAmenities(null);
  assert.equal(emptyFormatted.desktopAmenities.length, 0);
  assert.equal(emptyFormatted.mobileAmenities.length, 0);
  assert.equal(emptyFormatted.mobileInlineText, '');
});

test('getPropertyStartingRate computes lowest active room price or returns null when absent', () => {
  const yash = EXISTING_PROPERTIES[0]!;
  assert.equal(getPropertyStartingRate(yash), 900);

  const multiRoom = {
    rooms: [
      { id: 'r1', base_price: 1800, active: true },
      { id: 'r2', base_price: 1250, active: true },
      { id: 'r3', base_price: 700, active: false },
    ],
  };
  assert.equal(getPropertyStartingRate(multiRoom), 1250);

  assert.equal(getPropertyStartingRate({ rooms: [] }), null);
});

test('computeSharedElementTransform aligns scaled target center with Quick View CTA center', () => {
  const ctaRect = {
    left: 1020,
    top: 520,
    width: 164,
    height: 44,
  };
  const targetRect = {
    left: 80,
    top: 96,
    width: 1280,
    height: 820,
  };

  const flip = computeSharedElementTransform(ctaRect, targetRect);

  assert.ok(flip.scaleX > 0.08 && flip.scaleX < 0.25);
  assert.ok(flip.scaleY >= 0.06 && flip.scaleY < 0.2);

  // Verify the transformed center of targetRect lands within 1px of ctaRect center
  const ctaCenterX = ctaRect.left + ctaRect.width / 2;
  const ctaCenterY = ctaRect.top + ctaRect.height / 2;

  const transformedCenterX =
    targetRect.left + flip.translateX + (targetRect.width * flip.scaleX) / 2;
  const transformedCenterY =
    targetRect.top + flip.translateY + (targetRect.height * flip.scaleY) / 2;

  assert.ok(Math.abs(transformedCenterX - ctaCenterX) <= 1.5);
  assert.ok(Math.abs(transformedCenterY - ctaCenterY) <= 1.5);
  assert.ok(flip.initialTransform.includes('translate3d('));
  assert.equal(flip.settledTransform, 'translate3d(0px, 0px, 0) scale(1, 1)');
});

test('matchesTransitionProperty and isTransitionRecordFresh validate transition identity', () => {
  const record: QuickViewTransitionRecord = {
    propertyId: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    propertySlug: 'yash-home-stay-jari-4u07',
    propertyName: 'Yash Home Stay',
    propertyTypeLabel: 'Traditional Homestay',
    locationLabel: 'Jari, Kullu',
    startingPrice: 900,
    coverPhoto: '/assets/stays-card.webp',
    sourcePath: '/stays',
    scrollY: 420,
    ctaRect: { top: 480, left: 980, width: 160, height: 44 },
    cardRect: { top: 320, left: 120, width: 1080, height: 220 },
    viewportWidth: 1440,
    viewportHeight: 900,
    phase: 'opening',
    timestamp: 10000,
  };

  assert.equal(
    matchesTransitionProperty(
      record,
      'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
      'yash-home-stay'
    ),
    true
  );
  assert.equal(
    matchesTransitionProperty(record, 'other-id', 'yash-home-stay-jari-4u07'),
    true
  );
  assert.equal(
    matchesTransitionProperty(record, 'other-id', 'unrelated-property'),
    false
  );

  assert.equal(isTransitionRecordFresh(record, 15000, 60000), true);
  assert.equal(isTransitionRecordFresh(record, 95000, 60000), false);
});
