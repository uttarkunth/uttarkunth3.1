import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStayDates } from '../lib/booking-calculator.ts';

test('Valid future dates pass validation', () => {
  const checkIn = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const result = validateStayDates(checkIn, checkOut);
  assert.equal(result.valid, true);
});

test('Missing dates fail validation', () => {
  const checkOut = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const result = validateStayDates('', checkOut);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /required/i);
});

test('Past check-in date fails validation', () => {
  const result = validateStayDates('2020-01-01', '2020-01-05');
  assert.equal(result.valid, false);
  assert.match(result.error || '', /past/i);
});

test('Check-out before check-in fails validation', () => {
  const checkIn = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const result = validateStayDates(checkIn, checkOut);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /strictly after/i);
});

test('Stay exceeding 60 nights fails validation', () => {
  const checkIn = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0]; // 70 nights
  const result = validateStayDates(checkIn, checkOut);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /cannot exceed 60 nights/i);
});
