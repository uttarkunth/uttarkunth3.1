import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BookingRequestSchema,
  HostDecisionSchema,
  PropertyFormSchema,
  HostApplySchema,
  validateGoogleMapsUrl,
  isValidGoogleMapsShareUrl,
} from '../lib/validations.ts';

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

test('validateGoogleMapsUrl accepts valid HTTPS Google Maps share and place links', () => {
  const validLinks = [
    'https://maps.app.goo.gl/7XyZ123abcDEF',
    'https://maps.app.goo.gl/7XyZ123abcDEF?g_st=ic',
    'https://goo.gl/maps/9AbCdEfGhIjK',
    'https://www.google.com/maps/place/Jari,+Himachal+Pradesh/@32.001,77.251,15z',
    'https://google.com/maps/@30.7268,78.4354,16z',
    'https://maps.google.com/?q=30.7268,78.4354',
    'https://www.google.co.in/maps/place/Uttarkashi',
  ];

  for (const link of validLinks) {
    const res = validateGoogleMapsUrl(link);
    assert.equal(res.valid, true, `Expected valid for ${link}`);
    assert.equal(isValidGoogleMapsShareUrl(link), true);
  }
});

test('validateGoogleMapsUrl rejects non-HTTPS, non-Google, javascript/data, and open-redirect URLs', () => {
  const invalidLinks = [
    '',
    '   ',
    'Near Primary School Jari',
    'http://maps.app.goo.gl/7XyZ123abcDEF',
    'http://www.google.com/maps/place/Jari',
    'https://example.com/maps/place/Jari',
    'https://evil.com/https://maps.app.goo.gl/7XyZ123abcDEF',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'https://www.google.com/url?q=https://evil.com',
    'https://www.google.com/maps?redirect=https://evil.com',
    'https://maps.app.goo.gl/abc def',
  ];

  for (const link of invalidLinks) {
    const res = validateGoogleMapsUrl(link);
    assert.equal(res.valid, false, `Expected invalid for ${link}`);
    assert.equal(isValidGoogleMapsShareUrl(link), false);
  }
});

test('HostApplySchema and PropertyFormSchema enforce Google Maps share link and host confirmation', () => {
  const validApplication = HostApplySchema.safeParse({
    name: 'Mountain Pine Homestay',
    property_type: 'homestay',
    village: 'Harsil',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    address: 'Near Wilson Cottage, Harsil Village',
    google_maps_url: 'https://maps.app.goo.gl/7XyZ123abcDEF',
    location_confirmed: true,
    description: 'Traditional wooden homestay overlooking the Bhagirathi river and apple orchards.',
  });
  assert.equal(validApplication.success, true);

  const unconfirmedApplication = HostApplySchema.safeParse({
    name: 'Mountain Pine Homestay',
    property_type: 'homestay',
    village: 'Harsil',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    address: 'Near Wilson Cottage, Harsil Village',
    google_maps_url: 'https://maps.app.goo.gl/7XyZ123abcDEF',
    location_confirmed: false,
    description: 'Traditional wooden homestay overlooking the Bhagirathi river and apple orchards.',
  });
  assert.equal(unconfirmedApplication.success, false);

  const validPropertyForm = PropertyFormSchema.safeParse({
    name: 'Mountain Pine Homestay',
    property_type: 'homestay',
    village: 'Harsil',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    address: 'Near Wilson Cottage, Harsil Village',
    google_maps_url: 'https://www.google.com/maps/place/Harsil',
    location_confirmed: true,
    description: 'Traditional wooden homestay overlooking the Bhagirathi river and apple orchards.',
    rooms: [
      {
        room_name: 'Room 1',
        base_price: 2200,
        max_guests: 2,
      },
    ],
  });
  assert.equal(validPropertyForm.success, true);
});
