import test from 'node:test';
import assert from 'node:assert/strict';
import { BookingRequestSchema, HostDecisionSchema, PropertyFormSchema } from '../lib/validations.ts';

test('BookingRequestSchema validates valid input', () => {
  const input = {
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    room_unit_id: 'c7391669-92a0-4456-8e13-c7bab6661681',
    guest_name: 'Rahul Negi',
    guest_email: 'rahul@example.com',
    guest_phone: '+91 9876543210',
    check_in: '2026-11-01',
    check_out: '2026-11-04',
    adults: 2,
    children: 0,
    special_requests: 'Quiet room with mountain view please.'
  };

  const parsed = BookingRequestSchema.safeParse(input);
  assert.equal(parsed.success, true);
});

test('BookingRequestSchema rejects invalid email', () => {
  const input = {
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    room_unit_id: 'c7391669-92a0-4456-8e13-c7bab6661681',
    guest_name: 'Rahul Negi',
    guest_email: 'not-an-email',
    guest_phone: '+91 9876543210',
    check_in: '2026-11-01',
    check_out: '2026-11-04',
    adults: 2
  };

  const parsed = BookingRequestSchema.safeParse(input);
  assert.equal(parsed.success, false);
});

test('BookingRequestSchema rejects same-day checkout', () => {
  const input = {
    property_id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
    room_unit_id: 'c7391669-92a0-4456-8e13-c7bab6661681',
    guest_name: 'Rahul Negi',
    guest_email: 'rahul@example.com',
    guest_phone: '+91 9876543210',
    check_in: '2026-11-01',
    check_out: '2026-11-01',
    adults: 2
  };

  const parsed = BookingRequestSchema.safeParse(input);
  assert.equal(parsed.success, false);
});

test('HostDecisionSchema accepts valid decisions', () => {
  const confirmDecision = HostDecisionSchema.safeParse({
    booking_id: 'c7391669-92a0-4456-8e13-c7bab6661681',
    action: 'confirm',
    host_notes: 'Looking forward to hosting you in Jari!'
  });
  assert.equal(confirmDecision.success, true);

  const declineDecision = HostDecisionSchema.safeParse({
    booking_id: 'c7391669-92a0-4456-8e13-c7bab6661681',
    action: 'decline',
    host_notes: 'Property under maintenance on those dates.'
  });
  assert.equal(declineDecision.success, true);
});

test('HostDecisionSchema rejects illegal action', () => {
  const invalid = HostDecisionSchema.safeParse({
    booking_id: 'c7391669-92a0-4456-8e13-c7bab6661681',
    action: 'arbitrary_status'
  });
  assert.equal(invalid.success, false);
});
