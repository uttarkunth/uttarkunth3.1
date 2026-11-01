import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStayDates } from '../lib/booking-calculator.ts';

test('Valid future dates pass validation', () => {
  const result = validateStayDates('2026-12-01', '2026-12-05');
  assert.equal(result.valid, true);
});

test('Missing dates fail validation', () => {
  const result = validateStayDates('', '2026-12-05');
  assert.equal(result.valid, false);
  assert.match(result.error || '', /required/i);
});

test('Past check-in date fails validation', () => {
  const result = validateStayDates('2020-01-01', '2020-01-05');
  assert.equal(result.valid, false);
  assert.match(result.error || '', /past/i);
});

test('Check-out before check-in fails validation', () => {
  const result = validateStayDates('2026-12-10', '2026-12-05');
  assert.equal(result.valid, false);
  assert.match(result.error || '', /strictly after/i);
});

test('Stay exceeding 60 nights fails validation', () => {
  const result = validateStayDates('2026-11-01', '2027-02-01');
  assert.equal(result.valid, false);
  assert.match(result.error || '', /cannot exceed 60 nights/i);
});
