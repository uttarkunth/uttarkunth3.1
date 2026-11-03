import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNights, calculateBookingPrice, isDateConflict, generateBookingReference } from '../lib/booking-calculator.ts';

test('Nights calculation - normal 2-night stay', () => {
  const nights = calculateNights('2026-11-01', '2026-11-03');
  assert.equal(nights, 2);
});

test('Nights calculation - same day checkout returns 0', () => {
  const nights = calculateNights('2026-11-01', '2026-11-01');
  assert.equal(nights, 0);
});

test('Nights calculation - checkout before checkin returns 0', () => {
  const nights = calculateNights('2026-11-05', '2026-11-01');
  assert.equal(nights, 0);
});

test('Booking price calculation for Yash Home Stay (₹900/night for 3 nights)', () => {
  const breakdown = calculateBookingPrice(900, '2026-11-01', '2026-11-04');
  assert.equal(breakdown.nights, 3);
  assert.equal(breakdown.basePricePerNight, 900);
  assert.equal(breakdown.roomTotal, 2700);
  assert.equal(breakdown.totalEstimate, 2700);
  assert.equal(breakdown.taxes, 0);
});

test('Booking price calculation for Wonderway Retreat (₹3,500/night for 2 nights)', () => {
  const breakdown = calculateBookingPrice(3500, '2026-11-10', '2026-11-12');
  assert.equal(breakdown.nights, 2);
  assert.equal(breakdown.basePricePerNight, 3500);
  assert.equal(breakdown.roomTotal, 7000);
  assert.equal(breakdown.totalEstimate, 7000);
});

test('Date conflict check - overlapping dates inside range', () => {
  // Existing: Nov 5 to Nov 10
  // New: Nov 7 to Nov 9 (Inside) -> CONFLICT
  assert.equal(isDateConflict('2026-11-05', '2026-11-10', '2026-11-07', '2026-11-09'), true);
});

test('Date conflict check - checkout exclusive boundary (Back-to-back stays)', () => {
  // Guest A departs Nov 5. Guest B arrives Nov 5.
  // Existing: Nov 1 to Nov 5. New: Nov 5 to Nov 8 -> NO CONFLICT!
  assert.equal(isDateConflict('2026-11-01', '2026-11-05', '2026-11-05', '2026-11-08'), false);
});

test('Date conflict check - non-overlapping future stay', () => {
  assert.equal(isDateConflict('2026-11-01', '2026-11-05', '2026-11-10', '2026-11-15'), false);
});

test('Generate booking reference format', () => {
  const ref = generateBookingReference();
  assert.match(ref, /^UK-[A-F0-9]{20}$/);
});
