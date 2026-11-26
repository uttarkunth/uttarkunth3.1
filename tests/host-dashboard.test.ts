import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeHostDashboardKpis,
  computeOccupancySnapshot,
  computeReviewDistribution,
  computeListingQualityChecklist,
  getEventsForCalendarDate,
  formatBookingReference,
  formatInrCurrency,
  type HostPropertyRecord,
  type HostBookingRecord,
  type HostAvailabilityBlockRecord,
  type HostReviewRecord,
} from '../lib/host-dashboard';

const sampleProperties: HostPropertyRecord[] = [
  {
    id: 'prop-1',
    title: 'Sankri Riverstone Homestay',
    slug: 'sankri-riverstone-homestay',
    type: 'homestay',
    description: 'Traditional wooden and stone mountain home overlooking the Supin river valley in Sankri.',
    village: 'Sankri',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    approval_status: 'approved',
    is_published: true,
    cover_image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    rooms: [
      { id: 'room-1', name: 'Pine Suite', capacity: 3, total_rooms: 2, price_per_night: 3200, is_active: true },
    ],
  },
  {
    id: 'prop-2',
    title: 'Harsil Cedar Retreat',
    slug: 'harsil-cedar-retreat',
    type: 'lodge',
    description: 'Quiet orchard retreat near Bhagirathi river with warm timber interiors.',
    village: 'Harsil',
    district: 'Uttarkashi',
    state: 'Uttarakhand',
    approval_status: 'approved',
    is_published: true,
    cover_image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
    rooms: [
      { id: 'room-2', name: 'Valley View Room', capacity: 2, total_rooms: 1, price_per_night: 3600, is_active: true },
    ],
  },
];

const sampleBookings: HostBookingRecord[] = [
  {
    id: '8921abcd-1111-2222-3333-444455556666',
    property_id: 'prop-1',
    room_id: 'room-1',
    guest_name: 'Aarav Mehta',
    guest_phone: '+91 98111 23456',
    guests_count: 2,
    check_in: '2026-04-12',
    check_out: '2026-04-15',
    total_price: 9600,
    booking_status: 'pending',
    created_at: '2026-04-10T10:00:00Z',
    properties: { title: 'Sankri Riverstone Homestay' },
    rooms: { name: 'Pine Suite', price_per_night: 3200 },
  },
  {
    id: '8914efgh-1111-2222-3333-444455556666',
    property_id: 'prop-2',
    room_id: 'room-2',
    guest_name: 'Rohan Kapoor',
    guest_phone: '+91 98201 77410',
    guests_count: 2,
    check_in: '2026-04-14',
    check_out: '2026-04-18',
    total_price: 14400,
    booking_status: 'confirmed',
    created_at: '2026-04-09T10:00:00Z',
    properties: { title: 'Harsil Cedar Retreat' },
    rooms: { name: 'Valley View Room', price_per_night: 3600 },
  },
  {
    id: '8878ijkl-1111-2222-3333-444455556666',
    property_id: 'prop-1',
    room_id: 'room-1',
    guest_name: 'Kavita Joshi',
    guest_phone: '+91 97118 60219',
    guests_count: 2,
    check_in: '2026-04-03',
    check_out: '2026-04-05',
    total_price: 6400,
    booking_status: 'rejected',
    created_at: '2026-04-01T10:00:00Z',
    properties: { title: 'Sankri Riverstone Homestay' },
    rooms: { name: 'Pine Suite', price_per_night: 3200 },
  },
];

const sampleBlocks: HostAvailabilityBlockRecord[] = [
  {
    id: 'blk-1',
    room_id: 'room-1',
    start_date: '2026-04-12',
    end_date: '2026-04-14',
    blocked_count: 1,
    reason: 'Roof woodwork check',
    rooms: {
      id: 'room-1',
      name: 'Pine Suite',
      property_id: 'prop-1',
      properties: { title: 'Sankri Riverstone Homestay' },
    },
  },
];

test('computeHostDashboardKpis separates pending requests from confirmed booking nights and value', () => {
  const allKpis = computeHostDashboardKpis(sampleProperties, sampleBookings, 'all', '2026-04-10');
  assert.equal(allKpis.totalPropertiesCount, 2);
  assert.equal(allKpis.activePropertiesCount, 2);
  assert.equal(allKpis.totalRoomUnitsCount, 3);
  assert.equal(allKpis.pendingRequestsCount, 1);
  assert.equal(allKpis.confirmedStaysCount, 1);
  assert.equal(allKpis.declinedOrCancelledCount, 1);
  // Only confirmed/completed bookings count towards bookedRoomNights & estimatedConfirmedValue
  assert.equal(allKpis.bookedRoomNights, 4);
  assert.equal(allKpis.estimatedConfirmedValue, 14400);

  // Scoped to prop-1
  const prop1Kpis = computeHostDashboardKpis(sampleProperties, sampleBookings, 'prop-1', '2026-04-10');
  assert.equal(prop1Kpis.totalPropertiesCount, 1);
  assert.equal(prop1Kpis.pendingRequestsCount, 1);
  assert.equal(prop1Kpis.confirmedStaysCount, 0);
  assert.equal(prop1Kpis.bookedRoomNights, 0);
});

test('computeOccupancySnapshot calculates current month booked nights vs available unit nights without counting pending', () => {
  const snapshot = computeOccupancySnapshot(
    sampleProperties,
    sampleBookings,
    'all',
    new Date('2026-04-10T00:00:00Z')
  );
  // 3 room units * 30 days in April = 90 available room nights
  assert.equal(snapshot.totalAvailableRoomNights, 90);
  // Confirmed stay is 4 nights in April; pending stay does not block occupancy
  assert.equal(snapshot.bookedRoomNights, 4);
  assert.equal(snapshot.pendingRequestsCount, 1);
  assert.equal(snapshot.occupancyPercent, 4);
});

test('getEventsForCalendarDate marks pending requests as non-blocking alongside confirmed and manual blocks', () => {
  const eventsOnApr12 = getEventsForCalendarDate('2026-04-12', sampleBookings, sampleBlocks, 'all', 'all');
  assert.equal(eventsOnApr12.length, 2);
  const pendingEvent = eventsOnApr12.find((e) => e.kind === 'pending');
  const blockedEvent = eventsOnApr12.find((e) => e.kind === 'blocked');
  assert.ok(pendingEvent);
  assert.ok(blockedEvent);
  assert.match(pendingEvent.statusBadge, /Does not block dates/);
  assert.match(blockedEvent.statusBadge, /Unavailable/);

  // Checkout day (2026-04-15 for pending booking) is exclusive
  const eventsOnApr15 = getEventsForCalendarDate('2026-04-15', sampleBookings, sampleBlocks, 'all', 'all');
  assert.equal(eventsOnApr15.length, 1);
  assert.equal(eventsOnApr15[0].kind, 'confirmed');
});

test('computeReviewDistribution and computeListingQualityChecklist work accurately', () => {
  const reviews: HostReviewRecord[] = [
    { id: 'r1', entity_id: 'prop-1', rating: 5, comment: 'Wonderful host', created_at: '2026-04-01' },
    { id: 'r2', entity_id: 'prop-1', rating: 4, comment: 'Great mountain view', created_at: '2026-04-02' },
    { id: 'r3', entity_id: 'prop-2', rating: 5, comment: 'Peaceful stay', created_at: '2026-04-03' },
  ];

  const distAll = computeReviewDistribution(reviews, 'all');
  assert.equal(distAll.totalReviews, 3);
  assert.equal(distAll.averageRating, 4.7);
  assert.equal(distAll.countsByStar[5], 2);
  assert.equal(distAll.countsByStar[4], 1);

  const checklist = computeListingQualityChecklist(sampleProperties, 'all');
  assert.equal(checklist.length, 4);
  assert.ok(checklist.every((item) => item.isComplete));
});

test('formatBookingReference and formatInrCurrency format values cleanly', () => {
  assert.equal(formatBookingReference('8921abcd-1111'), 'UTK-8921AB');
  assert.equal(formatInrCurrency(14400), '₹14,400');
});
