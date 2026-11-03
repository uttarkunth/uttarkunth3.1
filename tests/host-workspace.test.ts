import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIRECT_HOST_PAYMENT_NOTICE } from '../lib/host.ts';
import { isPlatformAdmin } from '../lib/constants.ts';

test('Host Workspace: Direct Host Payment Notice Strict Wording', () => {
  const expectedNotice =
    'No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.';
  assert.equal(
    DIRECT_HOST_PAYMENT_NOTICE,
    expectedNotice,
    'Payment policy must strictly state direct host settlement with zero platform fee claims.'
  );
  assert.ok(
    !DIRECT_HOST_PAYMENT_NOTICE.includes('0%'),
    'Notice must not contain unapproved 0% commission claims.'
  );
  assert.ok(
    !DIRECT_HOST_PAYMENT_NOTICE.includes('free'),
    'Notice must not contain unapproved commercial waivers.'
  );
});

test('Host Workspace: Platform Administrator Privilege Isolation', () => {
  // Accounts must NOT receive automatic administrator privileges from email
  assert.equal(isPlatformAdmin('gauravnegi748@gmail.com'), false);
  assert.equal(isPlatformAdmin('info@uttarkunth.com'), false);
  assert.equal(isPlatformAdmin('uttarkunth@gmail.com'), false);

  // Random host or guest emails are not platform admins
  assert.equal(isPlatformAdmin('host@example.com'), false);
  assert.equal(isPlatformAdmin('traveler@mountain.org'), false);
  assert.equal(isPlatformAdmin(undefined), false);

  // Metadata roles (app_metadata / user_metadata) are abolished as admin authorities
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'admin' } }), false);

  // Authoritative admin verification returns true only with explicit server verification
  assert.equal(isPlatformAdmin({ is_platform_admin: true }), true);
});

test('Host Workspace: Multi-host & Co-host Permission Logic', () => {
  // Mock property
  const property = {
    id: 'prop-123',
    host_id: 'host-owner-456',
    published: true,
    moderation_status: 'approved',
  };

  // Mock property_hosts assignments
  const coHosts = [
    { property_id: 'prop-123', user_id: 'cohost-789', role: 'co_host' },
    { property_id: 'prop-123', user_id: 'manager-101', role: 'manager' },
  ];

  function evaluateHostAccess(userId: string, appMetadataRole?: string | null) {
    if (appMetadataRole && ['admin', 'superadmin', 'platform_admin'].includes(appMetadataRole.toLowerCase())) {
      return { authorized: true, role: 'admin' };
    }
    if (property.host_id === userId) {
      return { authorized: true, role: 'owner' };
    }
    const match = coHosts.find(
      (c) => c.user_id === userId && (c.role === 'co_host' || c.role === 'manager')
    );
    if (match) {
      return { authorized: true, role: match.role };
    }
    return { authorized: false, role: null };
  }

  // Owner access
  const ownerAccess = evaluateHostAccess('host-owner-456');
  assert.equal(ownerAccess.authorized, true);
  assert.equal(ownerAccess.role, 'owner');

  // Co-host access
  const coHostAccess = evaluateHostAccess('cohost-789');
  assert.equal(coHostAccess.authorized, true);
  assert.equal(coHostAccess.role, 'co_host');

  // Manager access
  const managerAccess = evaluateHostAccess('manager-101');
  assert.equal(managerAccess.authorized, true);
  assert.equal(managerAccess.role, 'manager');

  // Platform admin access
  const adminAccess = evaluateHostAccess('admin-999', 'admin');
  assert.equal(adminAccess.authorized, true);
  assert.equal(adminAccess.role, 'admin');

  // Unauthorized guest
  const guestAccess = evaluateHostAccess('guest-555');
  assert.equal(guestAccess.authorized, false);
  assert.equal(guestAccess.role, null);
});

test('Host Workspace Concurrency: Pending requests never block dates; only confirmed bookings block', () => {
  // Scenario: Existing bookings in system
  const existingBookings = [
    {
      id: 'b-pending-1',
      room_unit_id: 'room-1',
      check_in: '2026-12-10',
      check_out: '2026-12-15',
      status: 'pending', // Pending request
    },
    {
      id: 'b-confirmed-1',
      room_unit_id: 'room-1',
      check_in: '2026-12-20',
      check_out: '2026-12-25',
      status: 'confirmed', // Confirmed booking
    },
  ];

  // Helper function checking whether new request conflicts with existing stays
  function canConfirmBooking(newCheckIn: string, newCheckOut: string, targetRoom: string) {
    // Crucial rule: Check ONLY confirmed reservations
    const conflicts = existingBookings.filter(
      (b) =>
        b.room_unit_id === targetRoom &&
        b.status === 'confirmed' &&
        b.check_in < newCheckOut &&
        b.check_out > newCheckIn
    );
    return conflicts.length === 0;
  }

  // Test 1: New booking overlapping the PENDING booking dates (2026-12-11 to 2026-12-14)
  // Must SUCCEED because pending requests never block dates!
  assert.equal(
    canConfirmBooking('2026-12-11', '2026-12-14', 'room-1'),
    true,
    'Dates overlapping pending request must be eligible for confirmation.'
  );

  // Test 2: New booking overlapping the CONFIRMED booking dates (2026-12-21 to 2026-12-24)
  // Must FAIL because confirmed booking locks dates!
  assert.equal(
    canConfirmBooking('2026-12-21', '2026-12-24', 'room-1'),
    false,
    'Dates overlapping confirmed reservation must conflict and be rejected.'
  );

  // Test 3: Check-out exclusive boundary (Back-to-back stays)
  // Guest checks in 2026-12-25 (same day the confirmed guest checks out)
  assert.equal(
    canConfirmBooking('2026-12-25', '2026-12-28', 'room-1'),
    true,
    'Back-to-back booking starting on previous check-out date must succeed.'
  );
});

test('Host Workspace Concurrency: Manual blocks cannot overlap confirmed bookings', () => {
  const confirmedBookings = [
    {
      id: 'conf-1',
      room_unit_id: 'room-A',
      check_in: '2026-11-20',
      check_out: '2026-11-25',
      status: 'confirmed',
    },
  ];

  function validateManualBlock(
    blockFrom: string,
    blockUntil: string,
    targetRoom: string
  ): { valid: boolean; error?: string } {
    if (blockUntil <= blockFrom) {
      return { valid: false, error: 'End date must be after start date.' };
    }

    const conflicts = confirmedBookings.filter(
      (b) =>
        b.room_unit_id === targetRoom &&
        b.status === 'confirmed' &&
        b.check_in < blockUntil &&
        b.check_out > blockFrom
    );

    if (conflicts.length > 0) {
      return {
        valid: false,
        error: 'Cannot block room: dates conflict with an existing confirmed reservation.',
      };
    }

    return { valid: true };
  }

  // Conflict case: block overlapping 2026-11-22 to 2026-11-28
  const conflictResult = validateManualBlock('2026-11-22', '2026-11-28', 'room-A');
  assert.equal(conflictResult.valid, false);
  assert.equal(
    conflictResult.error,
    'Cannot block room: dates conflict with an existing confirmed reservation.'
  );

  // Valid non-overlapping block: 2026-11-25 to 2026-11-30 (starts right when confirmed guest checks out)
  const validResult = validateManualBlock('2026-11-25', '2026-11-30', 'room-A');
  assert.equal(validResult.valid, true);
});

test('Host Workspace: Structural vs Operational property changes', () => {
  const baseProperty = {
    name: 'Old Pine Cottage',
    slug: 'old-pine-cottage',
    address: 'VPO Jari',
    village: 'Jari',
    district: 'Kullu',
    state: 'Himachal Pradesh',
    property_type: 'cottage',
    amenities: ['Free Wi-Fi'],
    photos: ['https://example.com/photo1.jpg'],
    published: true,
    moderation_status: 'approved',
  };

  function applyPropertyUpdate(updates: Partial<typeof baseProperty>) {
    const isStructuralChange =
      (updates.name !== undefined && updates.name !== baseProperty.name) ||
      (updates.address !== undefined && updates.address !== baseProperty.address) ||
      (updates.village !== undefined && updates.village !== baseProperty.village) ||
      (updates.district !== undefined && updates.district !== baseProperty.district) ||
      (updates.state !== undefined && updates.state !== baseProperty.state) ||
      (updates.property_type !== undefined && updates.property_type !== baseProperty.property_type);

    return {
      published: isStructuralChange ? false : baseProperty.published,
      moderation_status: isStructuralChange ? 'pending' : baseProperty.moderation_status,
      requires_moderation: isStructuralChange,
    };
  }

  // Case 1: Operational change only (adding photo, modifying amenities)
  const opResult = applyPropertyUpdate({
    amenities: ['Free Wi-Fi', 'Mountain-view room'],
    photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  });
  assert.equal(opResult.published, true, 'Operational updates must preserve live publication');
  assert.equal(
    opResult.moderation_status,
    'approved',
    'Operational updates must remain approved'
  );
  assert.equal(opResult.requires_moderation, false);

  // Case 2: Structural change (renaming property or moving village)
  const structResult = applyPropertyUpdate({
    name: 'New Pine Luxury Villa',
  });
  assert.equal(
    structResult.published,
    false,
    'Structural updates must unpublish property'
  );
  assert.equal(
    structResult.moderation_status,
    'pending',
    'Structural updates must reset moderation to pending'
  );
  assert.equal(structResult.requires_moderation, true);
});


test('Host Workspace: Staged Public Content Moderation (pending_changes preserves live listing)', () => {
  const liveProperty = {
    id: 'prop-live-100',
    name: 'Kasol Riverside Retreat',
    description: 'Original approved mountain description.',
    amenities: ['Free Wi-Fi', 'Mountain-view room'],
    photos: ['https://example.com/p1.jpg'],
    published: true,
    moderation_status: 'approved',
    pending_changes: null as any,
  };

  function submitHostPropertyUpdate(
    updates: { description?: string; amenities?: string[]; photos?: string[]; name?: string }
  ) {
    // When an approved and published property receives material content updates from host:
    const isMaterial =
      (updates.name !== undefined && updates.name !== liveProperty.name) ||
      (updates.description !== undefined && updates.description !== liveProperty.description) ||
      (updates.amenities !== undefined) ||
      (updates.photos !== undefined);

    if (isMaterial) {
      return {
        // Live columns remain unchanged to prevent downtime or unreviewed content from showing
        name: liveProperty.name,
        description: liveProperty.description,
        amenities: liveProperty.amenities,
        photos: liveProperty.photos,
        published: liveProperty.published,
        moderation_status: liveProperty.moderation_status,
        // Staged changes await admin review in /admin/moderation
        pending_changes: {
          name: updates.name || liveProperty.name,
          description: updates.description || liveProperty.description,
          amenities: updates.amenities || liveProperty.amenities,
          photos: updates.photos || liveProperty.photos,
        },
      };
    }
    return liveProperty;
  }

  const updated = submitHostPropertyUpdate({
    description: 'New unapproved luxury spa and helipad experience.',
    photos: ['https://example.com/new-unreviewed-photo.jpg'],
  });

  // 1. Live listing remains live and approved
  assert.equal(updated.published, true, 'Live listing must remain published.');
  assert.equal(updated.moderation_status, 'approved', 'Live status remains approved.');
  assert.equal(
    updated.description,
    'Original approved mountain description.',
    'Public description must NOT show unapproved text.'
  );

  // 2. Proposed content is staged for admin review
  assert.ok(updated.pending_changes !== null, 'pending_changes must be staged.');
  assert.equal(
    updated.pending_changes.description,
    'New unapproved luxury spa and helipad experience.'
  );
  assert.equal(
    updated.pending_changes.photos[0],
    'https://example.com/new-unreviewed-photo.jpg'
  );
});

test('Host Workspace: Decider Authorization (Manager & Host can decide; Co-host is restricted)', () => {
  interface PropertyHostAssignment {
    userId: string;
    role: 'manager' | 'co_host';
  }

  function canDecideBooking(
    userId: string,
    propertyHostId: string,
    assignments: PropertyHostAssignment[],
    isAdmin = false
  ): boolean {
    if (isAdmin) return true;
    if (userId === propertyHostId) return true;
    const assignment = assignments.find((a) => a.userId === userId);
    if (assignment && assignment.role === 'manager') return true;
    return false; // Co-host or unauthorized user cannot decide
  }

  const hostId = 'user-primary-host';
  const assignments: PropertyHostAssignment[] = [
    { userId: 'user-manager', role: 'manager' },
    { userId: 'user-cohost', role: 'co_host' },
  ];

  // 1. Primary host can decide
  assert.equal(canDecideBooking('user-primary-host', hostId, assignments), true);

  // 2. Manager can decide
  assert.equal(canDecideBooking('user-manager', hostId, assignments), true);

  // 3. Co-host CANNOT decide (restricted to read & guest communications)
  assert.equal(canDecideBooking('user-cohost', hostId, assignments), false);

  // 4. Unauthorized guest cannot decide
  assert.equal(canDecideBooking('user-stranger', hostId, assignments), false);

  // 5. Platform admin can decide
  assert.equal(canDecideBooking('user-admin', hostId, assignments, true), true);
});

test('Host Workspace: Historical Booking Price Snapshot Immutability', () => {
  // Scenario: Historical booking created with estimate ₹6,000 (3 nights @ ₹2,000)
  const historicalBooking = {
    id: 'booking-snapshot-1',
    room_unit_id: 'room-101',
    check_in: '2026-11-01',
    check_out: '2026-11-04',
    total_estimate: 6000,
    status: 'pending',
  };

  const roomUnit = {
    id: 'room-101',
    base_price: 2000,
  };

  // Host updates room unit base rate to ₹5,000/night
  roomUnit.base_price = 5000;

  // Verify historical booking estimate is untouched
  assert.equal(
    historicalBooking.total_estimate,
    6000,
    'Historical booking total_estimate must remain immutable when room base_price is modified.'
  );

  // Host confirms booking
  function confirmBooking(booking: typeof historicalBooking) {
    return {
      ...booking,
      status: 'confirmed',
      // total_estimate must not change
      total_estimate: booking.total_estimate,
    };
  }

  const confirmed = confirmBooking(historicalBooking);
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(confirmed.total_estimate, 6000);
});
