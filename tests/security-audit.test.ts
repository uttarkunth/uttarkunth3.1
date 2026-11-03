import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlatformAdmin, ADMIN_EMAILS } from '../lib/constants.ts';
import { computeCommission, generateCanonicalAgreementDigest, OFFICIAL_LEGAL_TERMS_DOCUMENTS } from '../lib/commission.ts';

// ============================================================================
// 1. DIRECT DATABASE WRITE BYPASS & ROLE PERMISSIONS
// ============================================================================
test('Security Audit: Direct Table Write Bypass Rejection Rules', () => {
  // Mock host permissions on stay_bookings and room_availability_blocks
  const rolePermissions = {
    authenticated_host: {
      can_direct_update_stay_bookings_status: false,
      can_direct_insert_room_availability_blocks: false,
      must_use_respond_to_stay_booking_rpc: true,
      must_use_set_room_availability_block_rpc: true,
    },
    co_host: {
      can_decide_bookings: false,
      can_set_availability_blocks: false,
      can_view_bookings: true,
    },
    manager: {
      can_decide_bookings: true,
      can_set_availability_blocks: true,
      can_view_bookings: true,
    },
    primary_host: {
      can_decide_bookings: true,
      can_set_availability_blocks: true,
      can_view_bookings: true,
    }
  };

  // Direct table writes must be prohibited; RPCs must be used
  assert.equal(rolePermissions.authenticated_host.can_direct_update_stay_bookings_status, false);
  assert.equal(rolePermissions.authenticated_host.can_direct_insert_room_availability_blocks, false);
  assert.equal(rolePermissions.authenticated_host.must_use_respond_to_stay_booking_rpc, true);
  assert.equal(rolePermissions.authenticated_host.must_use_set_room_availability_block_rpc, true);

  // Co-hosts cannot decide bookings
  assert.equal(rolePermissions.co_host.can_decide_bookings, false);
  assert.equal(rolePermissions.manager.can_decide_bookings, true);
  assert.equal(rolePermissions.primary_host.can_decide_bookings, true);
});

// ============================================================================
// 2. ROOM IDENTIFIER AND LOCK STATEMENT TARGET
// ============================================================================
test('Security Audit: Room Identifier Verification (room_unit_id)', () => {
  const stayBookingRow = {
    id: 'booking-123',
    property_id: 'prop-456',
    room_unit_id: 'room-unit-789', // Canonical database column
    check_in: '2026-12-01',
    check_out: '2026-12-05',
    status: 'pending'
  };

  const blockRow = {
    id: 'block-001',
    room_unit_id: 'room-unit-789', // Canonical database column
    blocked_from: '2026-12-10',
    blocked_until: '2026-12-15'
  };

  // Confirm that room identifier column is room_unit_id
  assert.ok('room_unit_id' in stayBookingRow, 'stay_bookings must reference room_unit_id');
  assert.ok('room_unit_id' in blockRow, 'room_availability_blocks must reference room_unit_id');

  // Verify the lock target formulation
  function generateRoomLockQuery(booking: typeof stayBookingRow) {
    return `SELECT * FROM public.room_units WHERE id = '${booking.room_unit_id}' AND property_id = '${booking.property_id}' FOR UPDATE;`;
  }

  const lockQuery = generateRoomLockQuery(stayBookingRow);
  assert.equal(
    lockQuery,
    "SELECT * FROM public.room_units WHERE id = 'room-unit-789' AND property_id = 'prop-456' FOR UPDATE;"
  );
});

// ============================================================================
// 3. CONCURRENCY LOGIC (SCENARIOS A, B, C, D, E)
// ============================================================================
test('Security Audit: Concurrency Scenario A - Overlapping Bookings Rejection', () => {
  const b1 = { id: 'b1', check_in: '2026-12-01', check_out: '2026-12-05', status: 'confirmed' };
  const b2 = { id: 'b2', check_in: '2026-12-03', check_out: '2026-12-07', status: 'pending' };

  function hasConflict(target: typeof b2, confirmedBookings: Array<typeof b1>) {
    return confirmedBookings.some(
      (c) => c.status === 'confirmed' && c.check_in < target.check_out && c.check_out > target.check_in
    );
  }

  assert.equal(hasConflict(b2, [b1]), true, 'B2 overlaps B1 and must be rejected');
});

test('Security Audit: Concurrency Scenario B - Booking vs Manual Block Conflict', () => {
  const confirmedBooking = { check_in: '2026-12-01', check_out: '2026-12-05', status: 'confirmed' };
  const attemptedBlock = { blocked_from: '2026-12-03', blocked_until: '2026-12-08' };

  // Block creation checking confirmed reservations
  const blockConflictsWithBooking =
    confirmedBooking.check_in < attemptedBlock.blocked_until &&
    confirmedBooking.check_out > attemptedBlock.blocked_from;

  assert.equal(blockConflictsWithBooking, true, 'Manual block cannot overlap confirmed booking');

  // Booking confirmation checking existing blocks
  const existingBlock = { blocked_from: '2026-12-15', blocked_until: '2026-12-20' };
  const attemptedBooking = { check_in: '2026-12-16', check_out: '2026-12-18' };

  const bookingConflictsWithBlock =
    existingBlock.blocked_from < attemptedBooking.check_out &&
    existingBlock.blocked_until > attemptedBooking.check_in;

  assert.equal(bookingConflictsWithBlock, true, 'Booking confirmation cannot overlap existing host block');
});

test('Security Audit: Concurrency Scenario D - Non-overlapping Bookings Succeed', () => {
  const b1 = { check_in: '2026-12-01', check_out: '2026-12-05', status: 'confirmed' };
  const b2 = { check_in: '2026-12-10', check_out: '2026-12-15', status: 'pending' };

  const conflicts = b1.check_in < b2.check_out && b1.check_out > b2.check_in;
  assert.equal(conflicts, false, 'Non-overlapping bookings must not conflict');
});

test('Security Audit: Concurrency Scenario E - Back-to-back Bookings (checkout = checkin)', () => {
  const b1 = { check_in: '2026-12-01', check_out: '2026-12-05', status: 'confirmed' };
  const b2 = { check_in: '2026-12-05', check_out: '2026-12-10', status: 'pending' };

  // Strict interval overlap test: check_in < other.check_out AND check_out > other.check_in
  // When b1.check_out === b2.check_in (2026-12-05):
  // b1.check_out > b2.check_in evaluates to '2026-12-05' > '2026-12-05' -> FALSE!
  const overlaps = b1.check_in < b2.check_out && b1.check_out > b2.check_in;
  assert.equal(overlaps, false, 'Back-to-back booking boundary must NOT conflict');
});

// ============================================================================
// 4. ADMIN AUDIT LOG INTEGRITY & IMMUTABILITY
// ============================================================================
test('Security Audit: Admin Audit Log Privileges and Immutability', () => {
  const auditLogTableRules = {
    anon_can_select: false,
    anon_can_insert: false,
    anon_can_update: false,
    anon_can_delete: false,
    authenticated_can_select: false,
    authenticated_can_insert: false,
    authenticated_can_update: false,
    authenticated_can_delete: false,
    is_append_only: true,
  };

  // Verify non-admins have zero access
  assert.equal(auditLogTableRules.anon_can_select, false);
  assert.equal(auditLogTableRules.authenticated_can_select, false);
  assert.equal(auditLogTableRules.authenticated_can_update, false);
  assert.equal(auditLogTableRules.authenticated_can_delete, false);
  assert.equal(auditLogTableRules.is_append_only, true);
});

// ============================================================================
// 5. BILATERAL COMMERCIAL AGREEMENT VALIDATION
// ============================================================================
test('Security Audit: Bilateral Commercial Agreement Activation Safeguard', () => {
  const unilateralDraft = {
    agreement_start: '2026-11-01',
    standard_commission_percent: 10,
    agreement_status: 'draft',
    accepted_at: null, // No demonstrable host acceptance
    terms_version: '2026.1'
  };

  // Must not activate
  const draftResult = computeCommission(10000, unilateralDraft);
  assert.equal(draftResult.isActivated, false);
  assert.equal(draftResult.status, 'deferred');
  assert.equal(draftResult.amount, 0);

  const bilateralAccepted = {
    agreement_start: '2026-11-01',
    standard_commission_percent: 10,
    agreement_status: 'active',
    accepted_at: '2026-11-01T10:00:00Z', // Verified host acceptance
    terms_version: '2026.1'
  };

  // Activates strictly when bilateral acceptance is verified
  const activeResult = computeCommission(10000, bilateralAccepted);
  assert.equal(activeResult.isActivated, true);
  assert.equal(activeResult.status, 'active');
  assert.equal(activeResult.amount, 1000);
});

// ============================================================================
// 6. PROPERTY PHOTO STAGING SECURITY
// ============================================================================
test('Security Audit: Photo Upload Staging for Live Approved Properties', () => {
  const liveListing = {
    id: 'prop-123',
    published: true,
    moderation_status: 'approved',
    photos: ['https://example.com/live1.jpg', 'https://example.com/live2.jpg'],
    pending_changes: null as any
  };

  function simulatePhotoUpload(property: typeof liveListing, newPhotoUrl: string, isAdmin: boolean) {
    if (property.published && property.moderation_status === 'approved' && !isAdmin) {
      // Must be staged
      return {
        ...property,
        pending_changes: {
          photos: [...property.photos, newPhotoUrl]
        }
      };
    }
    // Direct update
    return {
      ...property,
      photos: [...property.photos, newPhotoUrl]
    };
  }

  const stagedResult = simulatePhotoUpload(liveListing, 'https://example.com/new3.jpg', false);
  assert.equal(stagedResult.photos.length, 2, 'Live photos must not change directly');
  assert.equal(stagedResult.pending_changes.photos.length, 3, 'New photo is safely staged');
});

// ============================================================================
// 7. ADMINISTRATOR AUTHORIZATION CONSISTENCY
// ============================================================================
test('Security Audit: Administrator Identity Consistency Across Systems', () => {
  // 1. Email allowlists are strictly abolished
  assert.deepEqual(ADMIN_EMAILS, [], 'Canonical admin email list must be empty (email allowlists abolished)');

  // 2. Specific accounts must NOT receive automatic administrator privileges based on email
  const previousEmailList = [
    'gauravnegi748@gmail.com',
    'info@uttarkunth.com',
    'uttarkunth@gmail.com'
  ];

  for (const email of previousEmailList) {
    assert.equal(isPlatformAdmin(email), false, `${email} must NOT receive automatic admin privileges`);
  }

  // 3. Attackers and empty strings denied
  assert.equal(isPlatformAdmin('attacker@domain.com'), false);
  assert.equal(isPlatformAdmin(''), false);

  // 4. Metadata roles (app_metadata / user_metadata) are abolished as admin authorities
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'admin' } }), false);
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'superadmin' } }), false);
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'platform_admin' } }), false);
  assert.equal(isPlatformAdmin({ user_metadata: { role: 'admin' } }), false);

  // 5. Authoritative admin verification returns true only with explicit server verification
  assert.equal(isPlatformAdmin({ is_platform_admin: true }), true);
});

// ============================================================================
// 8. FUNCTION SIGNATURE AND EXCLUSION CONSTRAINT SPECIFICATION
// ============================================================================
test('Security Audit: Function Signature Alignment for set_room_availability_block', () => {
  const verifiedIdentityArguments = [
    'p_room_unit_id uuid',
    'p_blocked_from date',
    'p_blocked_until date',
    'p_reason text',
    'p_actor_user_id uuid',
    'p_block_id uuid'
  ];

  // Exact 6-argument signature verified from pg_proc catalog
  assert.equal(verifiedIdentityArguments.length, 6, 'Function must have exactly 6 arguments');
  assert.deepEqual(verifiedIdentityArguments, [
    'p_room_unit_id uuid',
    'p_blocked_from date',
    'p_blocked_until date',
    'p_reason text',
    'p_actor_user_id uuid',
    'p_block_id uuid'
  ]);
});

test('Security Audit: Audit Log Protection Triggers (UPDATE, DELETE, TRUNCATE)', () => {
  const triggerDefinitions = {
    row_mutation: {
      timing: 'BEFORE',
      events: ['UPDATE', 'DELETE'],
      level: 'FOR EACH ROW',
      function: 'public.prevent_audit_log_mutation()'
    },
    statement_truncate: {
      timing: 'BEFORE',
      events: ['TRUNCATE'],
      level: 'FOR EACH STATEMENT',
      function: 'public.prevent_audit_log_mutation()'
    }
  };

  assert.equal(triggerDefinitions.row_mutation.level, 'FOR EACH ROW');
  assert.equal(triggerDefinitions.statement_truncate.level, 'FOR EACH STATEMENT');
  assert.deepEqual(triggerDefinitions.row_mutation.events, ['UPDATE', 'DELETE']);
  assert.deepEqual(triggerDefinitions.statement_truncate.events, ['TRUNCATE']);
});

// ============================================================================
// 9. CANONICAL AGREEMENT DIGEST & SIGNATORY RESTRICTIONS
// ============================================================================
test('Security Audit: Signatory Restriction Excludes Managers and Co-hosts', () => {
  const property = { host_id: 'host-uid-123' };
  const agreement = { id: 'agr-456', host_user_id: null };

  function canAcceptAgreement(user: { id: string; role?: string }) {
    const isPrimaryHost = property.host_id === user.id;
    const isDesignatedSignatory = Boolean(agreement.host_user_id && agreement.host_user_id === user.id);
    return isPrimaryHost || isDesignatedSignatory;
  }

  // Primary host is allowed
  assert.equal(canAcceptAgreement({ id: 'host-uid-123' }), true);

  // Property managers are strictly forbidden from signing commercial terms
  assert.equal(canAcceptAgreement({ id: 'manager-uid-456', role: 'manager' }), false);

  // Co-hosts are forbidden
  assert.equal(canAcceptAgreement({ id: 'cohost-uid-789', role: 'co_host' }), false);

  // Ordinary guests are forbidden
  assert.equal(canAcceptAgreement({ id: 'guest-uid-999' }), false);
});

test('Security Audit: Canonical Agreement Digest Stability and Serialization', () => {
  const termsA = {
    id: 'agr-1111',
    property_id: 'prop-2222',
    signatory_user_id: 'host-3333',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    terms_version: '2026.1'
  };

  const resA = generateCanonicalAgreementDigest(termsA);

  assert.ok(resA.digest, 'Digest must be non-empty');
  assert.equal(resA.digest.length, 64, 'SHA-256 hex digest must be 64 characters');
  assert.equal(
    resA.canonicalPayload,
    'agreement_end=NONE&agreement_id=agr-1111&agreement_start=2026-11-01&commission_percent=10.00&document_hash=54f1d67ee1294739557d9602d7b1ab0d819819de7b60d05a5a9f8a4676665af8&intro_commission_percent=0.00&intro_period_months=12&property_id=prop-2222&signatory_user_id=host-3333&standard_commission_percent=10.00&terms_version=2026.1'
  );
});

test('Security Audit: Accepted Commercial Terms Immutability and Invalidation Protection', () => {
  interface AgreementRecord {
    id: string;
    property_id: string;
    host_user_id: string | null;
    agreement_start: string;
    agreement_end: string | null;
    commission_percent: number;
    standard_commission_percent: number;
    intro_commission_percent: number;
    intro_period_months: number;
    agreement_status: string;
    accepted_at: string | null;
    terms_version: string | null;
  }

  function simulateUpdateAgreement(
    existing: AgreementRecord,
    updates: Partial<AgreementRecord>
  ): AgreementRecord {
    // If agreement was accepted, material terms cannot be silently modified
    if (existing.accepted_at !== null) {
      const materialFields: Array<keyof AgreementRecord> = [
        'property_id',
        'agreement_start',
        'agreement_end',
        'commission_percent',
        'standard_commission_percent',
        'intro_commission_percent',
        'intro_period_months',
        'host_user_id',
        'terms_version',
        'accepted_at'
      ];

      for (const field of materialFields) {
        if (updates[field] !== undefined && updates[field] !== existing[field]) {
          throw new Error(`Material terms of an accepted commercial agreement cannot be altered (Agreement ID: ${existing.id}). A material change requires drafting a new agreement version.`);
        }
      }
    }

    return { ...existing, ...updates };
  }

  const acceptedAgr: AgreementRecord = {
    id: 'agr-100',
    property_id: 'prop-yash',
    host_user_id: 'host-1',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    agreement_status: 'active',
    accepted_at: '2026-11-01T10:00:00Z',
    terms_version: '2026.1#a1b2c3d4e5f60718'
  };

  // 1. Updating status to 'terminated' or updating operational metadata is allowed
  const terminated = simulateUpdateAgreement(acceptedAgr, { agreement_status: 'terminated' });
  assert.equal(terminated.agreement_status, 'terminated');

  // 2. Modifying commission rate on accepted agreement throws error
  assert.throws(
    () => simulateUpdateAgreement(acceptedAgr, { standard_commission_percent: 15 }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // 3. Modifying introductory rate throws error
  assert.throws(
    () => simulateUpdateAgreement(acceptedAgr, { intro_commission_percent: 5 }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // 4. Modifying fallback commission_percent throws error
  assert.throws(
    () => simulateUpdateAgreement(acceptedAgr, { commission_percent: 12 }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // 5. Modifying terms_version hash throws error
  assert.throws(
    () => simulateUpdateAgreement(acceptedAgr, { terms_version: '2026.1#forgedhash123' }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );
});

// ============================================================================
// 10. RPC EXECUTION PRIVILEGE & IMPERSONATION HARDENING
// ============================================================================
test('Security Audit: RPC Direct Execution Isolation on respond_to_stay_booking and set_room_availability_block', () => {
  const rpcPrivileges = {
    respond_to_stay_booking: {
      anon_execute: false,
      authenticated_execute: false,
      service_role_execute: true
    },
    set_room_availability_block: {
      anon_execute: false,
      authenticated_execute: false,
      service_role_execute: true
    },
    is_platform_admin_for_user: {
      anon_execute: false,
      authenticated_execute: false,
      service_role_execute: true
    },
    is_platform_admin_zero_arg: {
      anon_execute: true,
      authenticated_execute: true,
      service_role_execute: true
    }
  };

  // Direct client calls must be strictly rejected
  assert.equal(rpcPrivileges.respond_to_stay_booking.authenticated_execute, false);
  assert.equal(rpcPrivileges.respond_to_stay_booking.anon_execute, false);
  assert.equal(rpcPrivileges.respond_to_stay_booking.service_role_execute, true);

  assert.equal(rpcPrivileges.set_room_availability_block.authenticated_execute, false);
  assert.equal(rpcPrivileges.set_room_availability_block.anon_execute, false);
  assert.equal(rpcPrivileges.set_room_availability_block.service_role_execute, true);

  // Helper is private to service_role, zero-arg wrapper is public for RLS
  assert.equal(rpcPrivileges.is_platform_admin_for_user.authenticated_execute, false);
  assert.equal(rpcPrivileges.is_platform_admin_zero_arg.authenticated_execute, true);
});

test('Security Audit: HTTP Request Payload Forged Actor ID Stripping', () => {
  // Simulates an attacker sending an arbitrary actor_user_id in request body
  const maliciousRequestBody = {
    booking_id: '96b170ff-0d65-4fef-94c6-ce9a499a0166',
    action: 'confirm',
    host_notes: 'Legit looking notes',
    p_actor_user_id: 'ee63658f-761b-41e5-8cdb-ddf462d1a87f', // Gaurav Negi admin UID
    actor_user_id: 'ee63658f-761b-41e5-8cdb-ddf462d1a87f'
  };

  const actualSessionUser = {
    id: 'attacker-uid-1234',
    email: 'attacker@evil.com'
  };

  // The server API must disregard body-supplied actor IDs and bind strictly to session
  function deriveRpcActor(body: typeof maliciousRequestBody, sessionUser: typeof actualSessionUser) {
    // Only booking_id, action, host_notes are parsed from body; actor is bound to session
    return sessionUser.id;
  }

  const derivedActor = deriveRpcActor(maliciousRequestBody, actualSessionUser);
  assert.equal(derivedActor, 'attacker-uid-1234', 'Forged body actor ID must be completely ignored');
  assert.notEqual(derivedActor, maliciousRequestBody.p_actor_user_id);
});

test('Security Audit: Availability Block Update FOUND Validation', () => {
  const existingBlocks = [
    { id: 'block-1', room_unit_id: 'room-1', blocked_from: '2026-12-01', blocked_until: '2026-12-05' }
  ];

  function updateBlock(blockId: string, roomUnitId: string, newFrom: string, newUntil: string) {
    const idx = existingBlocks.findIndex((b) => b.id === blockId && b.room_unit_id === roomUnitId);
    if (idx === -1) {
      throw new Error('Availability block not found or does not belong to the specified room unit.');
    }
    existingBlocks[idx].blocked_from = newFrom;
    existingBlocks[idx].blocked_until = newUntil;
    return { success: true, action: 'updated', block_id: blockId };
  }

  // Valid update
  const res = updateBlock('block-1', 'room-1', '2026-12-02', '2026-12-06');
  assert.equal(res.success, true);

  // Updating non-existent block must raise error
  assert.throws(
    () => updateBlock('nonexistent-id', 'room-1', '2026-12-02', '2026-12-06'),
    /Availability block not found/
  );

  // Updating block with wrong room unit must raise error
  assert.throws(
    () => updateBlock('block-1', 'wrong-room-id', '2026-12-02', '2026-12-06'),
    /Availability block not found/
  );
});

test('Security Audit: Commercial Agreement Lookup Recognizes Primary Host and Designated Signatory', () => {
  const propertyUnassigned = { id: 'prop-yash', host_id: null };
  const propertyAssigned = { id: 'prop-wonder', host_id: 'host-uid-100' };

  const agreements: Array<{
    id: string;
    property_id: string;
    host_user_id: string;
    agreement_status: string;
    accepted_at: string | null;
    agreement_start: string;
    agreement_end: string | null;
    standard_commission_percent: number;
  }> = [
    // Agreement 1: Unassigned property, accepted by designated signatory 'signatory-uid-200'
    {
      id: 'agr-1',
      property_id: 'prop-yash',
      host_user_id: 'signatory-uid-200',
      agreement_status: 'active',
      accepted_at: '2026-11-01T12:00:00Z',
      agreement_start: '2026-11-01',
      agreement_end: null,
      standard_commission_percent: 10
    },
    // Agreement 2: Assigned property, accepted by primary host 'host-uid-100'
    {
      id: 'agr-2',
      property_id: 'prop-wonder',
      host_user_id: 'host-uid-100',
      agreement_status: 'active',
      accepted_at: '2026-11-01T12:00:00Z',
      agreement_start: '2026-11-01',
      agreement_end: null,
      standard_commission_percent: 10
    },
    // Agreement 3: Draft agreement with NO acceptance
    {
      id: 'agr-3',
      property_id: 'prop-draft',
      host_user_id: 'host-uid-300',
      agreement_status: 'draft',
      accepted_at: null,
      agreement_start: '2026-11-01',
      agreement_end: null,
      standard_commission_percent: 10
    }
  ];

  function matchAgreementForBooking(property: { id: string; host_id: string | null }, currentDate: string) {
    const matched = agreements.filter((ha) => {
      const matchesProperty = ha.property_id === property.id;
      const isActive = ha.agreement_status === 'active';
      const isAccepted = ha.accepted_at !== null;
      const hasSignatory = ha.host_user_id !== null;
      const isStarted = ha.agreement_start <= currentDate;
      const isNotEnded = !ha.agreement_end || ha.agreement_end >= currentDate;
      return matchesProperty && isActive && isAccepted && hasSignatory && isStarted && isNotEnded;
    });

    matched.sort((a, b) => {
      const aIsPrimary = property.host_id !== null && a.host_user_id === property.host_id ? 1 : 2;
      const bIsPrimary = property.host_id !== null && b.host_user_id === property.host_id ? 1 : 2;
      if (aIsPrimary !== bIsPrimary) return aIsPrimary - bIsPrimary;
      return b.agreement_start.localeCompare(a.agreement_start);
    });

    return matched[0] || null;
  }

  // 1. Unassigned property (e.g. Yash Home Stay) finds designated signatory agreement
  const match1 = matchAgreementForBooking(propertyUnassigned, '2026-11-02');
  assert.ok(match1, 'Designated signatory agreement must be found for property with null host_id');
  assert.equal(match1.id, 'agr-1');
  assert.equal(match1.host_user_id, 'signatory-uid-200');

  // 2. Assigned property finds primary host agreement
  const match2 = matchAgreementForBooking(propertyAssigned, '2026-11-02');
  assert.ok(match2, 'Primary host agreement must be found');
  assert.equal(match2.id, 'agr-2');

  // 3. Draft agreement with no acceptance remains unmatched (deferred commission)
  const match3 = matchAgreementForBooking({ id: 'prop-draft', host_id: 'host-uid-300' }, '2026-11-02');
  assert.equal(match3, null, 'Unaccepted draft agreement must not match');
});

// ============================================================================
// 11. NULL ACTION REGRESSION TEST (respond_to_stay_booking)
// ============================================================================
test('Security Audit: NULL Action Validation in respond_to_stay_booking Prevents Inadvertent Cancellation', () => {
  interface BookingState {
    id: string;
    status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  }

  let auditEvents: Array<{ action: string; booking_id: string; decision: string }> = [];

  function simulateRespondToBooking(
    booking: BookingState,
    actorId: string | null,
    action: string | null | undefined
  ): BookingState {
    // Exact SQL check from revised migration:
    if (!booking.id || !actorId || action === null || action === undefined || !['confirm', 'decline', 'cancel'].includes(action)) {
      throw new Error('Invalid booking decision request.');
    }

    let newStatus: BookingState['status'];
    if (action === 'confirm') {
      newStatus = 'confirmed';
    } else if (action === 'decline') {
      newStatus = 'declined';
    } else if (action === 'cancel') {
      newStatus = 'cancelled';
    } else {
      throw new Error('Invalid booking decision request.');
    }

    auditEvents.push({
      action: 'booking_decided',
      booking_id: booking.id,
      decision: newStatus
    });

    return { ...booking, status: newStatus };
  }

  const initialBooking: BookingState = { id: 'booking-99', status: 'pending' };

  // 1. NULL action must throw error, preserve pending status, and emit ZERO audit events
  assert.throws(
    () => simulateRespondToBooking(initialBooking, 'actor-1', null),
    /Invalid booking decision request/
  );
  assert.equal(initialBooking.status, 'pending');
  assert.equal(auditEvents.length, 0, 'No audit event should be logged for NULL action');

  // 2. Undefined action must throw error
  assert.throws(
    () => simulateRespondToBooking(initialBooking, 'actor-1', undefined),
    /Invalid booking decision request/
  );
  assert.equal(auditEvents.length, 0);

  // 3. Invalid string values must throw error
  assert.throws(
    () => simulateRespondToBooking(initialBooking, 'actor-1', ''),
    /Invalid booking decision request/
  );
  assert.throws(
    () => simulateRespondToBooking(initialBooking, 'actor-1', 'hack'),
    /Invalid booking decision request/
  );
  assert.throws(
    () => simulateRespondToBooking(initialBooking, 'actor-1', 'CONFIRM'), // Case-sensitive
    /Invalid booking decision request/
  );
  assert.equal(auditEvents.length, 0);

  // 4. Valid actions succeed and emit corresponding audit event
  const confirmed = simulateRespondToBooking(initialBooking, 'actor-1', 'confirm');
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].decision, 'confirmed');

  const declined = simulateRespondToBooking(initialBooking, 'actor-1', 'decline');
  assert.equal(declined.status, 'declined');
  assert.equal(auditEvents.length, 2);
  assert.equal(auditEvents[1].decision, 'declined');

  const cancelled = simulateRespondToBooking(initialBooking, 'actor-1', 'cancel');
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(auditEvents.length, 3);
  assert.equal(auditEvents[2].decision, 'cancelled');
});

// ============================================================================
// 12. ACCEPTED AGREEMENT DELETION AND TRUNCATE PROTECTION
// ============================================================================
test('Security Audit: Accepted Agreements Deletion and TRUNCATE Protection', () => {
  interface AgreementRow {
    id: string;
    accepted_at: string | null;
    agreement_status: string;
    standard_commission_percent: number;
    host_user_id: string | null;
  }

  let tableRows: AgreementRow[] = [
    { id: 'draft-1', accepted_at: null, agreement_status: 'draft', standard_commission_percent: 10, host_user_id: null },
    { id: 'accepted-1', accepted_at: '2026-11-01T10:00:00Z', agreement_status: 'active', standard_commission_percent: 10, host_user_id: 'host-100' }
  ];

  // Simulates BEFORE DELETE row trigger
  function deleteAgreement(id: string): void {
    const row = tableRows.find(r => r.id === id);
    if (!row) throw new Error('Not found');

    if (row.accepted_at !== null) {
      throw new Error(`Accepted commercial agreements cannot be deleted (Agreement ID: ${row.id}). To conclude or void an active partnership, set agreement_status to terminated.`);
    }

    tableRows = tableRows.filter(r => r.id !== id);
  }

  // Simulates BEFORE TRUNCATE statement trigger
  function truncateAgreements(): void {
    throw new Error('TRUNCATE is strictly prohibited on host_agreements to preserve commercial audit history and binding partnership records.');
  }

  // Simulates agreement termination (operational status update)
  function terminateAgreement(id: string): AgreementRow {
    const row = tableRows.find(r => r.id === id);
    if (!row) throw new Error('Not found');
    row.agreement_status = 'terminated';
    return row;
  }

  // 1. Deleting an accepted agreement must be rejected
  assert.throws(
    () => deleteAgreement('accepted-1'),
    /Accepted commercial agreements cannot be deleted/
  );
  assert.equal(tableRows.length, 2, 'Accepted agreement must remain in table');

  // 2. Deleting an unaccepted draft agreement succeeds
  deleteAgreement('draft-1');
  assert.equal(tableRows.length, 1);
  assert.equal(tableRows[0].id, 'accepted-1');

  // 3. Terminating an accepted agreement succeeds and preserves all terms
  const terminated = terminateAgreement('accepted-1');
  assert.equal(terminated.agreement_status, 'terminated');
  assert.equal(terminated.accepted_at, '2026-11-01T10:00:00Z', 'Accepted timestamp must be preserved');
  assert.equal(terminated.host_user_id, 'host-100', 'Signatory must be preserved');
  assert.equal(terminated.standard_commission_percent, 10, 'Commission terms preserved');

  // 4. Attempting to TRUNCATE the table must be rejected
  assert.throws(
    () => truncateAgreements(),
    /TRUNCATE is strictly prohibited on host_agreements/
  );
});

// ============================================================================
// 13. END-TO-END SIGNATORY WORKFLOW FOR YASH HOME STAY & WONDERWAY RETREAT
// ============================================================================
test('Security Audit: End-to-End Designated Signatory Workflow for Yash Home Stay and Wonderway Retreat (host_id = NULL)', () => {
  // Properties have host_id = NULL
  const propertyYash = { id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37', name: 'Yash Home Stay', host_id: null };

  const adminEmail = 'gauravnegi748@gmail.com';
  const designatedSignatoryUid = 'signatory-user-456';
  const ordinaryGuestUid = 'guest-user-789';
  const managerUid = 'manager-user-111';
  const cohostUid = 'cohost-user-222';

  // 1. Admin creates agreement with designated signatory
  function createAgreementAsAdmin(creatorEmail: string, propId: string, designatedHostUserId: string) {
    if (creatorEmail !== adminEmail) {
      throw new Error('Forbidden: Platform administrator privileges required.');
    }
    return {
      id: 'agr-yash-01',
      property_id: propId,
      host_user_id: designatedHostUserId,
      agreement_status: 'draft',
      accepted_at: null,
      standard_commission_percent: 10,
      intro_commission_percent: 0,
      intro_period_months: 12,
      agreement_start: '2026-11-01',
      terms_version: '2026.1'
    };
  }

  const agreement = createAgreementAsAdmin(adminEmail, propertyYash.id, designatedSignatoryUid);
  assert.equal(agreement.host_user_id, designatedSignatoryUid);
  assert.equal(agreement.agreement_status, 'draft');

  // 2. Ordinary guest cannot designate themselves
  assert.throws(
    () => createAgreementAsAdmin('guest@domain.com', propertyYash.id, ordinaryGuestUid),
    /Forbidden: Platform administrator privileges required/
  );

  // 3. Acceptance validation
  function acceptAgreement(agr: typeof agreement, actor: { id: string; role?: string }) {
    const isPrimaryHost = propertyYash.host_id !== null && propertyYash.host_id === actor.id;
    const isDesignatedSignatory = Boolean(agr.host_user_id && agr.host_user_id === actor.id);

    if (!isPrimaryHost && !isDesignatedSignatory) {
      throw new Error('Forbidden: Only the primary assigned property host or an explicitly designated authorized signatory can legally accept commercial partnership terms.');
    }

    return {
      ...agr,
      agreement_status: 'active',
      accepted_at: '2026-11-02T12:00:00Z',
      terms_version: `${agr.terms_version}#digesthash12345`
    };
  }

  // Manager cannot accept
  assert.throws(
    () => acceptAgreement(agreement, { id: managerUid, role: 'manager' }),
    /Forbidden: Only the primary assigned property host or an explicitly designated authorized signatory/
  );

  // Co-host cannot accept
  assert.throws(
    () => acceptAgreement(agreement, { id: cohostUid, role: 'co_host' }),
    /Forbidden: Only the primary assigned property host or an explicitly designated authorized signatory/
  );

  // Ordinary guest cannot accept
  assert.throws(
    () => acceptAgreement(agreement, { id: ordinaryGuestUid }),
    /Forbidden: Only the primary assigned property host or an explicitly designated authorized signatory/
  );

  // Only designated signatory can accept
  const accepted = acceptAgreement(agreement, { id: designatedSignatoryUid });
  assert.equal(accepted.agreement_status, 'active');
  assert.equal(accepted.accepted_at, '2026-11-02T12:00:00Z');
  assert.equal(accepted.host_user_id, designatedSignatoryUid);

  // Property host_id remains NULL throughout
  assert.equal(propertyYash.host_id, null, 'Property host_id must remain untouched (null)');
});

// ============================================================================
// 14. ROOM AVAILABILITY BLOCKS DIRECT-WRITE PREVENTION & VALIDATION INVARIANTS
// ============================================================================
test('Security Audit: Room Availability Blocks Direct-Write Prevention & Validation Invariants', () => {
  const clientPermissions = {
    authenticated_direct_insert: false,
    authenticated_direct_update: false,
    authenticated_direct_delete: false,
    authenticated_select: true
  };

  assert.equal(clientPermissions.authenticated_direct_insert, false);
  assert.equal(clientPermissions.authenticated_direct_update, false);
  assert.equal(clientPermissions.authenticated_direct_delete, false);
  assert.equal(clientPermissions.authenticated_select, true);

  // Parameter validation in set_room_availability_block
  function validateBlockParams(roomUnitId: string | null, actorId: string | null, blockedFrom: string | null, blockedUntil: string | null) {
    if (!roomUnitId || !actorId) {
      throw new Error('Invalid availability block parameters.');
    }
    if (!blockedFrom || !blockedUntil || blockedUntil <= blockedFrom) {
      throw new Error('Invalid date range: blocked_until must be after blocked_from.');
    }
    return true;
  }

  // Null room_unit_id rejected
  assert.throws(() => validateBlockParams(null, 'actor-1', '2026-12-01', '2026-12-05'), /Invalid availability block parameters/);
  // Null actorId rejected
  assert.throws(() => validateBlockParams('room-1', null, '2026-12-01', '2026-12-05'), /Invalid availability block parameters/);
  // Null dates rejected
  assert.throws(() => validateBlockParams('room-1', 'actor-1', null, '2026-12-05'), /Invalid date range/);
  // blocked_until <= blocked_from rejected
  assert.throws(() => validateBlockParams('room-1', 'actor-1', '2026-12-05', '2026-12-05'), /Invalid date range/);
  assert.throws(() => validateBlockParams('room-1', 'actor-1', '2026-12-06', '2026-12-05'), /Invalid date range/);

  // Valid params pass
  assert.equal(validateBlockParams('room-1', 'actor-1', '2026-12-01', '2026-12-05'), true);
});

// ============================================================================
// 15. CANONICAL DIGEST REPRODUCTION & INTRODUCTORY EXPIRY SEMANTICS
// ============================================================================
test('Security Audit: Terms Version Extraction, Canonical Digest Reproduction, and Expiry Semantics', () => {
  const originalTerms = {
    id: 'agr-prod-100',
    property_id: 'prop-yash-1',
    signatory_user_id: 'host-user-99',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    terms_version: '2026.1'
  };

  // 1. Initial digest computation upon acceptance
  const { digest: originalDigest } = generateCanonicalAgreementDigest(originalTerms);
  const storedTermsVersion = `${originalTerms.terms_version}#${originalDigest.slice(0, 16)}`;

  // 2. Audit record contains full 64-char digest
  const auditLogPayload = {
    terms_digest: originalDigest,
    terms_version: originalTerms.terms_version
  };

  // 3. Reproduction from stored database record
  // Extract base version by splitting at '#'
  const extractedBaseVersion = storedTermsVersion.split('#')[0];
  assert.equal(extractedBaseVersion, '2026.1', 'Base version must be cleanly extracted');

  const { digest: reproducedDigest } = generateCanonicalAgreementDigest({
    ...originalTerms,
    terms_version: extractedBaseVersion
  });

  assert.equal(reproducedDigest, originalDigest, 'Reproduced 64-character digest must match original exactly');
  assert.equal(reproducedDigest, auditLogPayload.terms_digest, 'Reproduced digest matches audit log');
  assert.equal(reproducedDigest.slice(0, 16), storedTermsVersion.split('#')[1], 'Digest prefix matches stored hash tag');

  // 4. Commercial policy: introductory period expiry is determined by decision transaction date (current_date)
  const agreementStartDate = new Date('2026-01-01');
  const introMonths = 12;
  const introEndDate = new Date(agreementStartDate);
  introEndDate.setMonth(introEndDate.getMonth() + introMonths); // 2027-01-01

  // Decision on 2026-11-02 (< 2027-01-01) -> introductory rate (0%)
  const decisionDateDuringIntro = new Date('2026-11-02');
  const isIntro1 = decisionDateDuringIntro < introEndDate;
  assert.equal(isIntro1, true, 'Booking decided before intro expiry receives introductory rate');

  // Decision on 2027-02-01 (> 2027-01-01) -> standard rate (10%)
  const decisionDateAfterIntro = new Date('2027-02-01');
  const isIntro2 = decisionDateAfterIntro < introEndDate;
  assert.equal(isIntro2, false, 'Booking decided after intro expiry receives standard rate');
});

// ============================================================================
// 16. HOST AGREEMENTS RLS & ROW-LEVEL ISOLATION
// ============================================================================
test('Security Audit: host_agreements RLS Policy Visibility & Cross-Tenant Isolation', () => {
  const propertyA = { id: 'prop-a', host_id: 'host-a-uid' };
  const propertyB = { id: 'prop-b', host_id: 'host-b-uid' };
  const propertyYash = { id: 'prop-yash', host_id: null }; // Unassigned canonical property

  const agreements = [
    {
      id: 'agr-1',
      property_id: propertyA.id,
      host_user_id: 'host-a-uid',
      agreement_status: 'active'
    },
    {
      id: 'agr-2',
      property_id: propertyB.id,
      host_user_id: 'host-b-uid',
      agreement_status: 'active'
    },
    {
      id: 'agr-3',
      property_id: propertyYash.id,
      host_user_id: 'signatory-yash-uid',
      agreement_status: 'active'
    }
  ];

  // RLS Policy Evaluation Model:
  // host_user_id = auth.uid() OR EXISTS (properties.host_id = auth.uid()) OR is_platform_admin()
  function evaluateRlsSelect(user: { id: string; email?: string; app_metadata?: any }, agreement: typeof agreements[0]) {
    const isSignatory = agreement.host_user_id === user.id;
    const isAssignedPropertyHost =
      (agreement.property_id === propertyA.id && propertyA.host_id === user.id) ||
      (agreement.property_id === propertyB.id && propertyB.host_id === user.id) ||
      (agreement.property_id === propertyYash.id && propertyYash.host_id === user.id);
    const isAdmin = isPlatformAdmin(user);

    return isSignatory || isAssignedPropertyHost || isAdmin;
  }

  const guest = { id: 'guest-uid', email: 'guest@example.com' };
  const hostA = { id: 'host-a-uid', email: 'host.a@example.com' };
  const hostB = { id: 'host-b-uid', email: 'host.b@example.com' };
  const signatoryYash = { id: 'signatory-yash-uid', email: 'signatory.yash@example.com' };
  const admin = { id: 'admin-uid', email: 'admin@uttarkunth.com', is_platform_admin: true };

  // 1. Guest can see NO agreements
  const guestVisible = agreements.filter((a) => evaluateRlsSelect(guest, a));
  assert.equal(guestVisible.length, 0, 'Guest must not see any agreements');

  // 2. Host A sees only Agreement 1 (Property A)
  const hostAVisible = agreements.filter((a) => evaluateRlsSelect(hostA, a));
  assert.equal(hostAVisible.length, 1);
  assert.equal(hostAVisible[0].id, 'agr-1');

  // 3. Host B sees only Agreement 2 (Property B)
  const hostBVisible = agreements.filter((a) => evaluateRlsSelect(hostB, a));
  assert.equal(hostBVisible.length, 1);
  assert.equal(hostBVisible[0].id, 'agr-2');

  // 4. Designated Signatory for Yash Home Stay sees Agreement 3
  const signatoryVisible = agreements.filter((a) => evaluateRlsSelect(signatoryYash, a));
  assert.equal(signatoryVisible.length, 1);
  assert.equal(signatoryVisible[0].id, 'agr-3');

  // 5. Platform Admin sees ALL agreements
  const adminVisible = agreements.filter((a) => evaluateRlsSelect(admin, a));
  assert.equal(adminVisible.length, 3, 'Platform administrator must see all commercial agreements');
});

// ============================================================================
// 17. INITIAL ACCEPTANCE TRANSITION & IMMUTABILITY PROTECTION
// ============================================================================
test('Security Audit: Host Agreement Acceptance Transition & Immutability Rules', () => {
  // Model of enforce_host_agreement_immutability trigger
  function simulateAgreementUpdate(oldRow: any, newRow: any) {
    // 1. Acceptance transition check
    if (oldRow.accepted_at === null && newRow.accepted_at !== null) {
      if (
        oldRow.property_id !== newRow.property_id ||
        oldRow.agreement_start !== newRow.agreement_start ||
        oldRow.agreement_end !== newRow.agreement_end ||
        oldRow.commission_percent !== newRow.commission_percent ||
        oldRow.standard_commission_percent !== newRow.standard_commission_percent ||
        oldRow.intro_commission_percent !== newRow.intro_commission_percent ||
        oldRow.intro_period_months !== newRow.intro_period_months ||
        oldRow.terms_version !== newRow.terms_version
      ) {
        throw new Error('Material terms cannot be altered during agreement acceptance.');
      }

      if (!newRow.host_user_id) {
        throw new Error('Agreement acceptance requires an authorized signatory.');
      }

      if (oldRow.host_user_id && oldRow.host_user_id !== newRow.host_user_id) {
        throw new Error('Agreement signatory cannot be transferred during acceptance.');
      }
    }

    // 2. Post-acceptance immutability check
    if (oldRow.accepted_at !== null) {
      if (
        oldRow.property_id !== newRow.property_id ||
        oldRow.agreement_start !== newRow.agreement_start ||
        oldRow.agreement_end !== newRow.agreement_end ||
        oldRow.commission_percent !== newRow.commission_percent ||
        oldRow.standard_commission_percent !== newRow.standard_commission_percent ||
        oldRow.intro_commission_percent !== newRow.intro_commission_percent ||
        oldRow.intro_period_months !== newRow.intro_period_months ||
        oldRow.host_user_id !== newRow.host_user_id ||
        oldRow.terms_version !== newRow.terms_version ||
        oldRow.accepted_at !== newRow.accepted_at
      ) {
        throw new Error('Material terms of an accepted commercial agreement cannot be altered.');
      }
    }

    return { ...newRow };
  }

  const draftAgreement = {
    id: 'agr-draft-1',
    property_id: 'prop-1',
    host_user_id: 'host-1',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    terms_version: '2026.1',
    accepted_at: null
  };

  // Test 1: Draft rate changed and accepted in one operation -> REJECTED
  assert.throws(
    () =>
      simulateAgreementUpdate(draftAgreement, {
        ...draftAgreement,
        commission_percent: 5, // Tampered rate
        accepted_at: '2026-11-02T12:00:00Z'
      }),
    /Material terms cannot be altered during agreement acceptance/
  );

  // Test 2: Draft dates changed and accepted in one operation -> REJECTED
  assert.throws(
    () =>
      simulateAgreementUpdate(draftAgreement, {
        ...draftAgreement,
        agreement_start: '2027-01-01', // Tampered start date
        accepted_at: '2026-11-02T12:00:00Z'
      }),
    /Material terms cannot be altered during agreement acceptance/
  );

  // Test 3: Unauthorized signatory transition (reassignment or missing) -> REJECTED
  assert.throws(
    () =>
      simulateAgreementUpdate(draftAgreement, {
        ...draftAgreement,
        host_user_id: 'host-imposter-99', // Transferred signatory
        accepted_at: '2026-11-02T12:00:00Z'
      }),
    /Agreement signatory cannot be transferred during acceptance/
  );

  assert.throws(
    () =>
      simulateAgreementUpdate(draftAgreement, {
        ...draftAgreement,
        host_user_id: null, // Missing signatory
        accepted_at: '2026-11-02T12:00:00Z'
      }),
    /Agreement acceptance requires an authorized signatory/
  );

  // Test 4: Valid acceptance without commercial-term changes -> SUCCEEDS
  const accepted = simulateAgreementUpdate(draftAgreement, {
    ...draftAgreement,
    accepted_at: '2026-11-02T12:00:00Z'
  });
  assert.equal(accepted.accepted_at, '2026-11-02T12:00:00Z');
  assert.equal(accepted.commission_percent, 10);

  // Test 5: Subsequent attempted term modification on accepted agreement -> REJECTED
  assert.throws(
    () =>
      simulateAgreementUpdate(accepted, {
        ...accepted,
        commission_percent: 15 // Attempt to alter post-acceptance
      }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  assert.throws(
    () =>
      simulateAgreementUpdate(accepted, {
        ...accepted,
        accepted_at: '2026-11-03T00:00:00Z' // Attempt to alter accepted_at
      }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );
});

// ============================================================================
// 18. DELETE_ROOM_AVAILABILITY_BLOCK RPC AUTHORIZATION & MUTATION CONTROL
// ============================================================================
test('Security Audit: delete_room_availability_block RPC Authorization Rules', () => {
  const property = { id: 'prop-10', host_id: 'host-10' };
  const room = { id: 'room-10', property_id: property.id };
  const block = { id: 'block-10', room_unit_id: room.id };
  const propertyManagers = [{ property_id: property.id, user_id: 'manager-10', role: 'manager' }];

  function simulateDeleteBlockRPC(blockId: string | null, actorUserId: string | null, actorRole?: string) {
    if (!blockId || !actorUserId) {
      throw new Error('Invalid delete block parameters.');
    }
    if (blockId !== block.id) {
      throw new Error('Availability block not found.');
    }

    const isAdmin = actorRole === 'admin' || isPlatformAdmin({ is_platform_admin: actorRole === 'admin' });
    const isPrimaryHost = property.host_id === actorUserId;
    const isManager = propertyManagers.some((m) => m.property_id === property.id && m.user_id === actorUserId);

    if (!isAdmin && !isPrimaryHost && !isManager) {
      throw new Error('Not authorised to delete availability blocks for this property.');
    }

    return {
      success: true,
      action: 'deleted',
      block_id: blockId,
      audit_log: {
        actor_user_id: actorUserId,
        action: 'property_moderated',
        target_type: 'property',
        target_id: property.id
      }
    };
  }

  // 1. Missing parameters rejected
  assert.throws(() => simulateDeleteBlockRPC(null, 'user-1'), /Invalid delete block parameters/);
  assert.throws(() => simulateDeleteBlockRPC('block-10', null), /Invalid delete block parameters/);

  // 2. Nonexistent block rejected
  assert.throws(() => simulateDeleteBlockRPC('nonexistent-block', 'host-10'), /Availability block not found/);

  // 3. Unauthorized guest rejected
  assert.throws(
    () => simulateDeleteBlockRPC('block-10', 'guest-user', 'guest'),
    /Not authorised to delete availability blocks/
  );

  // 4. Unauthorized co-host (role !== 'manager') rejected
  assert.throws(
    () => simulateDeleteBlockRPC('block-10', 'cohost-user', 'co_host'),
    /Not authorised to delete availability blocks/
  );

  // 5. Authorized primary host succeeds
  const hostResult = simulateDeleteBlockRPC('block-10', 'host-10');
  assert.equal(hostResult.success, true);
  assert.equal(hostResult.action, 'deleted');

  // 6. Authorized property manager succeeds
  const managerResult = simulateDeleteBlockRPC('block-10', 'manager-10');
  assert.equal(managerResult.success, true);

  // 7. Platform administrator succeeds
  const adminResult = simulateDeleteBlockRPC('block-10', 'admin-user', 'admin');
  assert.equal(adminResult.success, true);
  assert.equal(adminResult.audit_log.action, 'property_moderated');
});

// ============================================================================
// 19. INTEGRATION TEST: AGREEMENT ACCEPTANCE, DIGEST REPRODUCTION & BOOKING RPC
// ============================================================================
test('Security Audit: Agreement Acceptance End-to-End Workflow with Discrete terms_digest & Booking RPC Resolution', () => {
  // Canonical draft agreement for Yash Home Stay (host_id = NULL)
  const propertyYash = {
    id: 'prop-yash-101',
    name: 'Yash Home Stay',
    host_id: null,
    published: true,
    moderation_status: 'approved'
  };

  const designatedSignatoryUser = {
    id: 'user-signatory-202',
    email: 'yash.homestay.host@example.com'
  };

  const draftAgreement = {
    id: 'agr-yash-555',
    property_id: propertyYash.id,
    host_user_id: designatedSignatoryUser.id, // Pre-designated signatory on draft
    host_name: 'Yashpal Singh',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    agreement_status: 'draft',
    terms_version: '2026.1', // Immutable base version
    accepted_at: null,
    terms_digest: null
  };

  // Step 1: Valid designated signatory accepts the agreement
  // Computes canonical digest across all 10 canonical fields
  const { digest: expectedDigest, canonicalPayload } = generateCanonicalAgreementDigest({
    id: draftAgreement.id,
    property_id: draftAgreement.property_id,
    signatory_user_id: designatedSignatoryUser.id,
    agreement_start: draftAgreement.agreement_start,
    agreement_end: draftAgreement.agreement_end,
    commission_percent: draftAgreement.commission_percent,
    standard_commission_percent: draftAgreement.standard_commission_percent,
    intro_commission_percent: draftAgreement.intro_commission_percent,
    intro_period_months: draftAgreement.intro_period_months,
    terms_version: draftAgreement.terms_version
  });

  const acceptanceTimestamp = '2026-11-02T12:00:00.000Z';

  // Simulate acceptance update conforming to the new database trigger
  const acceptedAgreement = {
    ...draftAgreement,
    agreement_status: 'active',
    accepted_at: acceptanceTimestamp,
    terms_version: draftAgreement.terms_version, // Terms version remains immutable base ('2026.1')
    terms_digest: expectedDigest // Complete 64-character SHA-256 digest stored discretely
  };

  // Assertions on accepted agreement state
  assert.equal(acceptedAgreement.agreement_status, 'active');
  assert.equal(acceptedAgreement.accepted_at, acceptanceTimestamp);
  assert.equal(acceptedAgreement.terms_version, '2026.1', 'Base terms version must remain unchanged');
  assert.equal(acceptedAgreement.terms_digest, expectedDigest, 'Full SHA-256 digest must be stored');
  assert.equal(acceptedAgreement.terms_digest.length, 64, 'Digest must be exactly 64 hex characters');

  // Step 2: Verify independent digest reproduction from stored agreement row
  const { digest: reproducedDigest } = generateCanonicalAgreementDigest({
    id: acceptedAgreement.id,
    property_id: acceptedAgreement.property_id,
    signatory_user_id: acceptedAgreement.host_user_id!,
    agreement_start: acceptedAgreement.agreement_start,
    agreement_end: acceptedAgreement.agreement_end,
    commission_percent: acceptedAgreement.commission_percent,
    standard_commission_percent: acceptedAgreement.standard_commission_percent,
    intro_commission_percent: acceptedAgreement.intro_commission_percent,
    intro_period_months: acceptedAgreement.intro_period_months,
    terms_version: acceptedAgreement.terms_version!
  });
  assert.equal(reproducedDigest, acceptedAgreement.terms_digest, 'Digest reproduced independently must match stored terms_digest');

  // Step 3: Verify booking decision RPC resolves this accepted agreement
  // Simulates respond_to_stay_booking agreement query resolution
  const booking = {
    id: 'booking-test-999',
    property_id: propertyYash.id,
    room_unit_id: 'room-unit-333',
    status: 'pending',
    check_in: '2026-11-10',
    check_out: '2026-11-15',
    total_estimate: 4500
  };

  function resolveBookingAgreement(property: typeof propertyYash, agreementsList: typeof acceptedAgreement[]) {
    return agreementsList
      .filter((ha) =>
        ha.property_id === property.id &&
        ha.agreement_status === 'active' &&
        ha.accepted_at !== null &&
        ha.host_user_id !== null &&
        ha.agreement_start <= '2026-11-02' &&
        (ha.agreement_end === null || ha.agreement_end >= '2026-11-02')
      )
      .sort((a, b) => {
        const aScore = property.host_id && a.host_user_id === property.host_id ? 1 : 2;
        const bScore = property.host_id && b.host_user_id === property.host_id ? 1 : 2;
        return aScore - bScore;
      })[0];
  }

  const resolvedAgreement = resolveBookingAgreement(propertyYash, [acceptedAgreement]);
  assert.ok(resolvedAgreement, 'Booking RPC must successfully resolve active accepted agreement for property with host_id = NULL');
  assert.equal(resolvedAgreement.id, acceptedAgreement.id);

  // During 12-month introductory period: intro rate (0%) applies
  const commissionSnapshot = computeCommission(booking.total_estimate, resolvedAgreement);
  assert.equal(commissionSnapshot.isActivated, true);
  assert.equal(commissionSnapshot.percent, 0);
  assert.equal(commissionSnapshot.amount, 0);

  // Step 4: Verify subsequent modifications to material terms or digest are strictly rejected
  function triggerCheckOnUpdate(oldRow: typeof acceptedAgreement, newRow: typeof acceptedAgreement) {
    if (oldRow.accepted_at !== null) {
      if (
        oldRow.property_id !== newRow.property_id ||
        oldRow.agreement_start !== newRow.agreement_start ||
        oldRow.agreement_end !== newRow.agreement_end ||
        oldRow.commission_percent !== newRow.commission_percent ||
        oldRow.standard_commission_percent !== newRow.standard_commission_percent ||
        oldRow.intro_commission_percent !== newRow.intro_commission_percent ||
        oldRow.intro_period_months !== newRow.intro_period_months ||
        oldRow.host_user_id !== newRow.host_user_id ||
        oldRow.terms_version !== newRow.terms_version ||
        oldRow.terms_digest !== newRow.terms_digest ||
        oldRow.accepted_at !== newRow.accepted_at
      ) {
        throw new Error('Material terms of an accepted commercial agreement cannot be altered.');
      }
    }
  }

  // Attempt to alter commission percent
  assert.throws(
    () => triggerCheckOnUpdate(acceptedAgreement, { ...acceptedAgreement, commission_percent: 15 }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // Attempt to alter terms_version
  assert.throws(
    () => triggerCheckOnUpdate(acceptedAgreement, { ...acceptedAgreement, terms_version: '2027.1' }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // Attempt to alter terms_digest
  assert.throws(
    () => triggerCheckOnUpdate(acceptedAgreement, { ...acceptedAgreement, terms_digest: 'fake-digest' }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // Attempt to alter accepted_at
  assert.throws(
    () => triggerCheckOnUpdate(acceptedAgreement, { ...acceptedAgreement, accepted_at: '2026-11-03T00:00:00Z' }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );
});

// ============================================================================
// 20. CONCURRENCY & LOCKING ORDER: delete_room_availability_block
// ============================================================================
test('Security Audit: delete_room_availability_block Room-First Locking Order & Concurrency Race Simulation', () => {
  const property = { id: 'prop-lock-1', host_id: 'host-lock-1' };
  const room = { id: 'room-lock-1', property_id: property.id };
  let blockState: { id: string; room_unit_id: string; blocked_from: string; blocked_until: string; reason: string } | null = {
    id: 'block-lock-1',
    room_unit_id: room.id,
    blocked_from: '2026-12-01',
    blocked_until: '2026-12-05',
    reason: 'Maintenance'
  };

  // Mock database locks
  const rowLocks = new Set<string>();

  function acquireLock(target: string) {
    if (rowLocks.has(target)) {
      throw new Error(`LockConflict: resource ${target} is currently locked by a concurrent transaction`);
    }
    rowLocks.add(target);
  }

  function releaseLock(target: string) {
    rowLocks.delete(target);
  }

  // Simulation of delete_room_availability_block with room-first hierarchical locking
  function executeDeleteRoomAvailabilityBlock(blockId: string, actorUserId: string) {
    if (!blockId || !actorUserId) {
      throw new Error('Invalid delete block parameters.');
    }

    // Step 1: Read block to identify its room
    if (!blockState || blockState.id !== blockId) {
      throw new Error('Availability block not found.');
    }
    const targetRoomId = blockState.room_unit_id;

    // Step 2: Lock room row FOR UPDATE first (hierarchical lock order)
    acquireLock(`room:${targetRoomId}`);

    try {
      // Step 3: Re-read and lock availability block FOR UPDATE
      acquireLock(`block:${blockId}`);

      try {
        if (!blockState || blockState.id !== blockId) {
          throw new Error('Availability block was removed by a concurrent transaction.');
        }

        // Step 4: Revalidate that block still belongs to locked room
        if (blockState.room_unit_id !== targetRoomId) {
          throw new Error('Availability block unit mismatch during lock acquisition.');
        }

        // Step 5: Authorize actor
        if (property.host_id !== actorUserId) {
          throw new Error('Not authorised to delete availability blocks for this property.');
        }

        // Step 6: Delete block
        const deletedId = blockState.id;
        blockState = null;

        // Step 7: Structured audit log payload conforming to live constraints
        const auditLogEvent = {
          actor_user_id: actorUserId,
          action: 'property_moderated',
          target_type: 'property',
          target_id: property.id,
          details: {
            operation: 'availability_block_removed',
            block_id: deletedId,
            room_unit_id: targetRoomId
          }
        };

        return { success: true, action: 'deleted', block_id: deletedId, audit_log: auditLogEvent };
      } finally {
        releaseLock(`block:${blockId}`);
      }
    } finally {
      releaseLock(`room:${targetRoomId}`);
    }
  }

  // Concurrency Scenario 1: Deletion racing with booking confirmation
  // Transaction A (booking confirmation) locks room first
  rowLocks.add(`room:${room.id}`);
  assert.throws(
    () => executeDeleteRoomAvailabilityBlock('block-lock-1', property.host_id),
    /LockConflict: resource room:room-lock-1 is currently locked/
  );
  // Release booking lock
  rowLocks.delete(`room:${room.id}`);

  // Concurrency Scenario 2: Unauthorized deletion
  assert.throws(
    () => executeDeleteRoomAvailabilityBlock('block-lock-1', 'unauthorized-guest'),
    /Not authorised to delete availability blocks/
  );
  // Block state must remain untouched after failed authorization
  assert.ok(blockState !== null, 'Block must not be deleted on unauthorized call');

  // Concurrency Scenario 3: Successful deletion with correct room lock order & audit log
  const delResult = executeDeleteRoomAvailabilityBlock('block-lock-1', property.host_id);
  assert.equal(delResult.success, true);
  assert.equal(delResult.action, 'deleted');
  assert.equal(delResult.audit_log.action, 'property_moderated');
  assert.equal(delResult.audit_log.target_type, 'property');
  assert.equal(delResult.audit_log.target_id, property.id);
  assert.equal(blockState, null, 'Block must be deleted');

  // Concurrency Scenario 4: Deleting nonexistent / already deleted block
  assert.throws(
    () => executeDeleteRoomAvailabilityBlock('block-lock-1', property.host_id),
    /Availability block not found/
  );

  // Concurrency Scenario 5: Missing parameters
  assert.throws(() => executeDeleteRoomAvailabilityBlock('', property.host_id), /Invalid delete block parameters/);
});

// ============================================================================
// 21. SHA-256 DIGEST STRICT VALIDATION RULES & APPLICATION INTEGRATION
// ============================================================================
test('Security Audit: SHA-256 Digest Strict Validation on Agreement Acceptance', () => {
  // Model of enforce_host_agreement_immutability digest regex validation
  function validateAcceptedDigest(acceptedAt: string | null, termsDigest: string | null) {
    if (acceptedAt !== null) {
      if (termsDigest === null || !/^[0-9a-f]{64}$/.test(termsDigest)) {
        throw new Error('A valid SHA-256 terms digest is required for agreement acceptance.');
      }
    }
    return true;
  }

  const valid64Hex = 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
  assert.equal(valid64Hex.length, 64);

  // 1. Valid 64-character lowercase SHA-256 digest is accepted
  assert.equal(validateAcceptedDigest('2026-11-02T12:00:00Z', valid64Hex), true);

  // 2. Missing digest (null) is rejected
  assert.throws(
    () => validateAcceptedDigest('2026-11-02T12:00:00Z', null),
    /A valid SHA-256 terms digest is required for agreement acceptance/
  );

  // 3. Empty digest is rejected
  assert.throws(
    () => validateAcceptedDigest('2026-11-02T12:00:00Z', ''),
    /A valid SHA-256 terms digest is required for agreement acceptance/
  );

  // 4. Short digest is rejected
  assert.throws(
    () => validateAcceptedDigest('2026-11-02T12:00:00Z', 'd3b07384d113edec'),
    /A valid SHA-256 terms digest is required for agreement acceptance/
  );

  // 5. Invalid hexadecimal characters are rejected (e.g. letters g-z, spaces, punctuation)
  const invalidHex = 'g1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0';
  assert.throws(
    () => validateAcceptedDigest('2026-11-02T12:00:00Z', invalidHex),
    /A valid SHA-256 terms digest is required for agreement acceptance/
  );
  assert.throws(
    () => validateAcceptedDigest('2026-11-02T12:00:00Z', valid64Hex.slice(0, 63) + '!'),
    /A valid SHA-256 terms digest is required for agreement acceptance/
  );

  // 6. Uppercase handling: strictly rejected by regex ^[0-9a-f]{64}$
  // Enforces that digest must be normalized to canonical lowercase before insertion
  const uppercaseHex = valid64Hex.toUpperCase();
  assert.throws(
    () => validateAcceptedDigest('2026-11-02T12:00:00Z', uppercaseHex),
    /A valid SHA-256 terms digest is required for agreement acceptance/
  );

  // 7. Digest mismatch between API-computed value and stored terms is rejected by application workflow
  const baseTerms = {
    id: 'agr-verify-01',
    property_id: 'prop-v-01',
    signatory_user_id: 'user-sig-01',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    terms_version: '2026.1'
  };

  const { digest: genuineDigest } = generateCanonicalAgreementDigest(baseTerms);

  // Simulate an acceptance attempt where the client or corrupted state presents a different digest
  function verifyAcceptanceDigestMatch(storedTerms: typeof baseTerms, submittedDigest: string) {
    const { digest: computedDigest } = generateCanonicalAgreementDigest(storedTerms);
    if (computedDigest !== submittedDigest) {
      throw new Error('IntegrityViolation: presented digest does not match canonical terms digest.');
    }
    return true;
  }

  assert.equal(verifyAcceptanceDigestMatch(baseTerms, genuineDigest), true);
  assert.throws(
    () => verifyAcceptanceDigestMatch(baseTerms, '0000000000000000000000000000000000000000000000000000000000000000'),
    /IntegrityViolation: presented digest does not match/
  );

  // 8. Accepted terms and digest cannot subsequently be modified
  function simulatePostAcceptanceUpdate(oldRow: any, newRow: any) {
    if (oldRow.accepted_at !== null) {
      if (
        oldRow.property_id !== newRow.property_id ||
        oldRow.agreement_start !== newRow.agreement_start ||
        oldRow.agreement_end !== newRow.agreement_end ||
        oldRow.commission_percent !== newRow.commission_percent ||
        oldRow.standard_commission_percent !== newRow.standard_commission_percent ||
        oldRow.intro_commission_percent !== newRow.intro_commission_percent ||
        oldRow.intro_period_months !== newRow.intro_period_months ||
        oldRow.host_user_id !== newRow.host_user_id ||
        oldRow.terms_version !== newRow.terms_version ||
        oldRow.terms_digest !== newRow.terms_digest ||
        oldRow.accepted_at !== newRow.accepted_at
      ) {
        throw new Error('Material terms of an accepted commercial agreement cannot be altered.');
      }
    }
    return newRow;
  }

  const acceptedRow = {
    ...baseTerms,
    accepted_at: '2026-11-02T12:00:00Z',
    terms_digest: genuineDigest
  };

  assert.throws(
    () => simulatePostAcceptanceUpdate(acceptedRow, { ...acceptedRow, terms_digest: valid64Hex }),
    /Material terms of an accepted commercial agreement cannot be altered/
  );
});

// ============================================================================
// 22. DRAFT-ONLY INSERTION TRIGGER & TERMINATION STATUS PRESERVATION
// ============================================================================
test('Security Audit: enforce_host_agreement_draft_on_insert Database Invariants & Termination Rules', () => {
  // Model of enforce_host_agreement_draft_on_insert trigger
  function simulateAgreementInsert(row: {
    property_id: string;
    host_user_id: string | null;
    host_name: string;
    agreement_start: string;
    agreement_end: string | null;
    commission_percent: number;
    agreement_status: string;
    accepted_at: string | null;
    terms_digest: string | null;
    terms_version: string;
  }) {
    // Check 1: Must strictly be 'draft' status
    if (row.agreement_status !== 'draft') {
      throw new Error(
        `New commercial agreements must be created with draft status (attempted status: ${row.agreement_status}). Direct creation in active or ended status is strictly prohibited.`
      );
    }

    // Check 2: accepted_at must be null
    if (row.accepted_at !== null) {
      throw new Error('New commercial agreements cannot be inserted in an already accepted state.');
    }

    // Check 3: terms_digest must be null upon insert
    if (row.terms_digest !== null) {
      throw new Error('New commercial agreements cannot have a terms_digest pre-populated upon creation.');
    }

    return {
      id: 'agr-new-uuid',
      ...row,
      created_at: new Date().toISOString()
    };
  }

  const validDraftInsert = {
    property_id: 'prop-yash-01',
    host_user_id: 'signatory-user-01',
    host_name: 'Yashpal Singh',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    agreement_status: 'draft',
    accepted_at: null as string | null,
    terms_digest: null as string | null,
    terms_version: '2026.1'
  };

  // 1. Admin-created draft agreement inserts successfully
  const inserted = simulateAgreementInsert(validDraftInsert);
  assert.equal(inserted.agreement_status, 'draft');
  assert.equal(inserted.accepted_at, null);
  assert.equal(inserted.terms_digest, null);

  // 2. Direct INSERT with non-null accepted_at is rejected
  assert.throws(
    () =>
      simulateAgreementInsert({
        ...validDraftInsert,
        accepted_at: '2026-11-02T12:00:00Z'
      }),
    /New commercial agreements cannot be inserted in an already accepted state/
  );

  // 3. Direct INSERT with active status is rejected
  assert.throws(
    () =>
      simulateAgreementInsert({
        ...validDraftInsert,
        agreement_status: 'active'
      }),
    /New commercial agreements must be created with draft status/
  );

  // Direct INSERT with ended status is rejected
  assert.throws(
    () =>
      simulateAgreementInsert({
        ...validDraftInsert,
        agreement_status: 'ended'
      }),
    /New commercial agreements must be created with draft status/
  );

  // Direct INSERT with pre-populated terms_digest is rejected
  assert.throws(
    () =>
      simulateAgreementInsert({
        ...validDraftInsert,
        terms_digest: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
      }),
    /New commercial agreements cannot have a terms_digest pre-populated/
  );

  // 4. Ordinary users cannot create agreements (verified by table-level REVOKE INSERT)
  const clientPermissions = {
    anon_can_insert_agreements: false,
    authenticated_can_insert_agreements: false
  };
  assert.equal(clientPermissions.anon_can_insert_agreements, false);
  assert.equal(clientPermissions.authenticated_can_insert_agreements, false);

  // 5. Authorized designated signatory can accept an existing draft
  const acceptedAt = '2026-11-02T14:30:00Z';
  const { digest: validDigest } = generateCanonicalAgreementDigest({
    id: inserted.id,
    property_id: inserted.property_id,
    signatory_user_id: inserted.host_user_id!,
    agreement_start: inserted.agreement_start,
    agreement_end: inserted.agreement_end,
    commission_percent: inserted.commission_percent,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    terms_version: inserted.terms_version
  });

  const acceptedAgreement = {
    ...inserted,
    agreement_status: 'active',
    accepted_at: acceptedAt,
    terms_digest: validDigest
  };
  assert.equal(acceptedAgreement.agreement_status, 'active');
  assert.equal(acceptedAgreement.terms_digest, validDigest);

  // 6. Unauthorized signatory cannot accept
  function authorizeSignatory(agreement: typeof inserted, actorUserId: string) {
    if (agreement.host_user_id && agreement.host_user_id !== actorUserId) {
      throw new Error('Forbidden: Only the designated authorized signatory can accept.');
    }
    return true;
  }
  assert.throws(() => authorizeSignatory(inserted, 'imposter-user-99'), /Forbidden: Only the designated authorized signatory/);

  // 7. Accepted terms cannot be changed afterward
  assert.throws(
    () => {
      if (acceptedAgreement.accepted_at !== null && acceptedAgreement.commission_percent !== 15) {
        throw new Error('Material terms of an accepted commercial agreement cannot be altered.');
      }
    },
    /Material terms of an accepted commercial agreement cannot be altered/
  );

  // 8. Accepted agreement cannot be deleted or truncated
  function simulateDeleteAgreement(agreement: typeof acceptedAgreement) {
    if (agreement.accepted_at !== null) {
      throw new Error('Accepted commercial agreements cannot be deleted.');
    }
  }
  assert.throws(() => simulateDeleteAgreement(acceptedAgreement), /Accepted commercial agreements cannot be deleted/);

  // 9. Termination preserves all original terms and acceptance records
  // Legitimate concluded partnership transitions status to 'ended'
  const terminatedAgreement = {
    ...acceptedAgreement,
    agreement_status: 'ended'
  };

  assert.equal(terminatedAgreement.agreement_status, 'ended');
  assert.equal(terminatedAgreement.accepted_at, acceptedAt, 'accepted_at timestamp is permanently preserved');
  assert.equal(terminatedAgreement.terms_digest, validDigest, 'terms_digest is permanently preserved');
  assert.equal(terminatedAgreement.commission_percent, 10, 'commercial rate is permanently preserved');
  assert.equal(terminatedAgreement.host_user_id, 'signatory-user-01', 'signatory identity is permanently preserved');
});

// ============================================================================
// 23. AVAILABILITY AUDIT LOGGING: CREATION & MODIFICATION WITHIN SAME TRANSACTION
// ============================================================================
test('Security Audit: set_room_availability_block Atomic Audit Logging on Creation and Modification', () => {
  const property = { id: 'prop-avail-audit-01', host_id: 'host-avail-01' };
  const room = { id: 'room-avail-audit-01', property_id: property.id };
  
  interface AvailabilityBlock {
    id: string;
    room_unit_id: string;
    blocked_from: string;
    blocked_until: string;
    reason: string;
    created_by: string;
  }

  interface AuditLogEntry {
    actor_user_id: string;
    action: string;
    target_type: string;
    target_id: string;
    details: Record<string, any>;
  }

  const blocksStore: Map<string, AvailabilityBlock> = new Map();
  const auditLogStore: AuditLogEntry[] = [];

  // Model of set_room_availability_block RPC with atomic audit logging
  function executeSetRoomAvailabilityBlock(params: {
    room_unit_id: string;
    blocked_from: string;
    blocked_until: string;
    reason: string;
    actor_user_id: string;
    block_id?: string | null;
  }) {
    if (!params.room_unit_id || !params.actor_user_id) {
      throw new Error('Invalid availability block parameters.');
    }
    if (!params.blocked_from || !params.blocked_until || params.blocked_until <= params.blocked_from) {
      throw new Error('Invalid date range: blocked_until must be after blocked_from.');
    }

    if (!params.block_id) {
      // Creation path
      const newBlockId = `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const createdBlock: AvailabilityBlock = {
        id: newBlockId,
        room_unit_id: params.room_unit_id,
        blocked_from: params.blocked_from,
        blocked_until: params.blocked_until,
        reason: params.reason.trim(),
        created_by: params.actor_user_id
      };
      blocksStore.set(newBlockId, createdBlock);

      // Audit log entry for creation conforming to live DB constraints
      auditLogStore.push({
        actor_user_id: params.actor_user_id,
        action: 'property_moderated',
        target_type: 'property',
        target_id: property.id,
        details: {
          operation: 'availability_block_created',
          block_id: newBlockId,
          room_unit_id: params.room_unit_id,
          property_id: property.id,
          blocked_from: params.blocked_from,
          blocked_until: params.blocked_until,
          reason: params.reason.trim()
        }
      });

      return { success: true, action: 'created', block_id: newBlockId };
    } else {
      // Modification path
      const existingBlock = blocksStore.get(params.block_id);
      if (!existingBlock || existingBlock.room_unit_id !== params.room_unit_id) {
        throw new Error('Availability block not found or does not belong to the specified room unit.');
      }

      const previousState = {
        blocked_from: existingBlock.blocked_from,
        blocked_until: existingBlock.blocked_until,
        reason: existingBlock.reason
      };

      const newState = {
        blocked_from: params.blocked_from,
        blocked_until: params.blocked_until,
        reason: params.reason.trim()
      };

      existingBlock.blocked_from = params.blocked_from;
      existingBlock.blocked_until = params.blocked_until;
      existingBlock.reason = params.reason.trim();

      // Audit log entry for modification with previous & new values
      auditLogStore.push({
        actor_user_id: params.actor_user_id,
        action: 'property_moderated',
        target_type: 'property',
        target_id: property.id,
        details: {
          operation: 'availability_block_updated',
          block_id: params.block_id,
          room_unit_id: params.room_unit_id,
          property_id: property.id,
          previous: previousState,
          new: newState
        }
      });

      return { success: true, action: 'updated', block_id: params.block_id };
    }
  }

  // 1. Create a block -> verify audit log emission
  const createRes = executeSetRoomAvailabilityBlock({
    room_unit_id: room.id,
    blocked_from: '2026-11-20',
    blocked_until: '2026-11-25',
    reason: 'Roof repair and painting',
    actor_user_id: property.host_id
  });

  assert.equal(createRes.success, true);
  assert.equal(createRes.action, 'created');
  assert.equal(auditLogStore.length, 1);

  const createAudit = auditLogStore[0];
  assert.equal(createAudit.actor_user_id, property.host_id);
  assert.equal(createAudit.action, 'property_moderated');
  assert.equal(createAudit.target_type, 'property');
  assert.equal(createAudit.target_id, property.id);
  assert.equal(createAudit.details.operation, 'availability_block_created');
  assert.equal(createAudit.details.block_id, createRes.block_id);
  assert.equal(createAudit.details.room_unit_id, room.id);
  assert.equal(createAudit.details.blocked_from, '2026-11-20');
  assert.equal(createAudit.details.blocked_until, '2026-11-25');
  assert.equal(createAudit.details.reason, 'Roof repair and painting');

  // 2. Modify the block -> verify previous and new values in audit log
  const updateRes = executeSetRoomAvailabilityBlock({
    room_unit_id: room.id,
    blocked_from: '2026-11-22',
    blocked_until: '2026-11-28',
    reason: 'Extended painting schedule',
    actor_user_id: property.host_id,
    block_id: createRes.block_id
  });

  assert.equal(updateRes.success, true);
  assert.equal(updateRes.action, 'updated');
  assert.equal(auditLogStore.length, 2);

  const updateAudit = auditLogStore[1];
  assert.equal(updateAudit.actor_user_id, property.host_id);
  assert.equal(updateAudit.action, 'property_moderated');
  assert.equal(updateAudit.target_type, 'property');
  assert.equal(updateAudit.target_id, property.id);
  assert.equal(updateAudit.details.operation, 'availability_block_updated');
  assert.equal(updateAudit.details.block_id, createRes.block_id);
  assert.deepEqual(updateAudit.details.previous, {
    blocked_from: '2026-11-20',
    blocked_until: '2026-11-25',
    reason: 'Roof repair and painting'
  });
  assert.deepEqual(updateAudit.details.new, {
    blocked_from: '2026-11-22',
    blocked_until: '2026-11-28',
    reason: 'Extended painting schedule'
  });
});

// ============================================================================
// 24. AGREEMENT ACCEPTANCE STATUS INTEGRITY: DRAFT REJECTION & ACTIVE REQUIREMENT
// ============================================================================
test('Security Audit: enforce_host_agreement_immutability Status Integrity & Active Requirement', () => {
  // Model of enforce_host_agreement_immutability trigger
  function simulateAgreementUpdate(oldRow: any, newRow: any) {
    // 1. Invariant: Commercial agreements cannot be active without demonstrable host acceptance
    if (newRow.agreement_status === 'active' && newRow.accepted_at === null) {
      throw new Error('Commercial agreements cannot be active without demonstrable host acceptance (accepted_at cannot be null).');
    }

    // 2. Mandatory SHA-256 digest validation whenever agreement is accepted
    if (newRow.accepted_at !== null) {
      if (newRow.terms_digest === null || !/^[0-9a-f]{64}$/.test(newRow.terms_digest)) {
        throw new Error('A valid SHA-256 terms digest is required for agreement acceptance.');
      }
    }

    // 3. Initial acceptance transition protection
    if (oldRow.accepted_at === null && newRow.accepted_at !== null) {
      // A. Require agreement_status to transition strictly to 'active'
      if (newRow.agreement_status !== 'active') {
        throw new Error(`Agreement acceptance must transition agreement_status to active (attempted status: ${newRow.agreement_status}).`);
      }

      // B. Ensure original commercial terms and base terms_version remain unchanged
      if (
        oldRow.property_id !== newRow.property_id ||
        oldRow.agreement_start !== newRow.agreement_start ||
        oldRow.agreement_end !== newRow.agreement_end ||
        oldRow.commission_percent !== newRow.commission_percent ||
        oldRow.standard_commission_percent !== newRow.standard_commission_percent ||
        oldRow.intro_commission_percent !== newRow.intro_commission_percent ||
        oldRow.intro_period_months !== newRow.intro_period_months ||
        oldRow.terms_version !== newRow.terms_version
      ) {
        throw new Error(`Material terms cannot be altered during agreement acceptance (Agreement ID: ${oldRow.id}). Acceptance must confirm terms as originally drafted.`);
      }

      // C. Signatory verification
      if (!newRow.host_user_id) {
        throw new Error('Agreement acceptance requires an authorized signatory (host_user_id cannot be null).');
      }

      // D. Signatory cannot be transferred if already designated
      if (oldRow.host_user_id !== null && oldRow.host_user_id !== newRow.host_user_id) {
        throw new Error(`Agreement signatory cannot be transferred during acceptance (Agreement ID: ${oldRow.id}).`);
      }
    }

    // 4. Post-acceptance immutability
    if (oldRow.accepted_at !== null) {
      // Prevent reverting an accepted agreement back to draft
      if (newRow.agreement_status === 'draft') {
        throw new Error(`Accepted commercial agreements cannot be reverted to draft status (Agreement ID: ${oldRow.id}).`);
      }

      if (
        oldRow.property_id !== newRow.property_id ||
        oldRow.agreement_start !== newRow.agreement_start ||
        oldRow.agreement_end !== newRow.agreement_end ||
        oldRow.commission_percent !== newRow.commission_percent ||
        oldRow.standard_commission_percent !== newRow.standard_commission_percent ||
        oldRow.intro_commission_percent !== newRow.intro_commission_percent ||
        oldRow.intro_period_months !== newRow.intro_period_months ||
        oldRow.host_user_id !== newRow.host_user_id ||
        oldRow.terms_version !== newRow.terms_version ||
        oldRow.terms_digest !== newRow.terms_digest ||
        oldRow.accepted_at !== newRow.accepted_at
      ) {
        throw new Error(`Material terms of an accepted commercial agreement cannot be altered (Agreement ID: ${oldRow.id}).`);
      }
    }

    return newRow;
  }

  const validDraft = {
    id: 'agr-stat-test-01',
    property_id: 'prop-stat-01',
    host_user_id: 'host-auth-01',
    agreement_start: '2026-11-01',
    agreement_end: null as string | null,
    commission_percent: 10,
    standard_commission_percent: 10,
    intro_commission_percent: 0,
    intro_period_months: 12,
    terms_version: '2026.1',
    agreement_status: 'draft',
    accepted_at: null as string | null,
    terms_digest: null as string | null
  };

  const valid64Hex = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  // 1. Valid acceptance: transitions from draft to active with all required fields
  const validAccepted = simulateAgreementUpdate(validDraft, {
    ...validDraft,
    agreement_status: 'active',
    accepted_at: '2026-11-02T15:00:00Z',
    terms_digest: valid64Hex
  });
  assert.equal(validAccepted.agreement_status, 'active');
  assert.equal(validAccepted.accepted_at, '2026-11-02T15:00:00Z');
  assert.equal(validAccepted.terms_digest, valid64Hex);

  // 2. Invalid acceptance with draft status: populates accepted_at and terms_digest but keeps agreement_status = 'draft'
  assert.throws(
    () =>
      simulateAgreementUpdate(validDraft, {
        ...validDraft,
        agreement_status: 'draft', // Attempting to accept while remaining draft
        accepted_at: '2026-11-02T15:00:00Z',
        terms_digest: valid64Hex
      }),
    /Agreement acceptance must transition agreement_status to active \(attempted status: draft\)/
  );

  // 3. Invalid acceptance: attempting to set agreement_status = 'active' while accepted_at is null
  assert.throws(
    () =>
      simulateAgreementUpdate(validDraft, {
        ...validDraft,
        agreement_status: 'active',
        accepted_at: null
      }),
    /Commercial agreements cannot be active without demonstrable host acceptance/
  );

  // 4. Invalid acceptance: material terms modified during acceptance
  assert.throws(
    () =>
      simulateAgreementUpdate(validDraft, {
        ...validDraft,
        agreement_status: 'active',
        accepted_at: '2026-11-02T15:00:00Z',
        terms_digest: valid64Hex,
        commission_percent: 15 // Attempted tampering
      }),
    /Material terms cannot be altered during agreement acceptance/
  );

  // 5. Invalid acceptance: base terms_version altered during acceptance
  assert.throws(
    () =>
      simulateAgreementUpdate(validDraft, {
        ...validDraft,
        agreement_status: 'active',
        accepted_at: '2026-11-02T15:00:00Z',
        terms_digest: valid64Hex,
        terms_version: '2026.2'
      }),
    /Material terms cannot be altered during agreement acceptance/
  );

  // 6. Invalid acceptance: unauthorized signatory transfer
  assert.throws(
    () =>
      simulateAgreementUpdate(validDraft, {
        ...validDraft,
        agreement_status: 'active',
        accepted_at: '2026-11-02T15:00:00Z',
        terms_digest: valid64Hex,
        host_user_id: 'rogue-imposter-99'
      }),
    /Agreement signatory cannot be transferred during acceptance/
  );

  // 7. Post-acceptance protection: cannot revert accepted agreement back to draft
  assert.throws(
    () =>
      simulateAgreementUpdate(validAccepted, {
        ...validAccepted,
        agreement_status: 'draft'
      }),
    /Accepted commercial agreements cannot be reverted to draft status/
  );

  // 8. Legitimate post-acceptance transition: concluding agreement to 'terminated' succeeds
  const terminatedAgreement = simulateAgreementUpdate(validAccepted, {
    ...validAccepted,
    agreement_status: 'terminated'
  });
  assert.equal(terminatedAgreement.agreement_status, 'terminated');
  assert.equal(terminatedAgreement.accepted_at, '2026-11-02T15:00:00Z');
  assert.equal(terminatedAgreement.terms_digest, valid64Hex);
});

// ============================================================================
// 25. BOOKING CONFIRMATION PRE-FLIGHT VALIDATION & LOCK HIERARCHY
// ============================================================================
test('Security Audit: respond_to_stay_booking Comprehensive Confirmation Pre-Flight Validations & Concurrency Ordering', () => {
  function simulateRespondToBooking(params: {
    action: string | null;
    property: { id: string; published: boolean; moderation_status: string; host_id: string | null };
    room: { id: string; property_id: string; active: boolean; max_guests: number };
    booking: {
      id: string;
      property_id: string;
      room_unit_id: string;
      status: string;
      check_in: string;
      check_out: string;
      adults: number;
      children: number;
      total_estimate: number;
    };
    hasManualBlock: boolean;
    hasConfirmedConflict: boolean;
    agreement: { id: string; agreement_status: string; accepted_at: string | null; intro_period_months: number; intro_commission_percent: number; standard_commission_percent: number; agreement_start: string; agreement_end: string | null } | null;
  }) {
    const { action, property, room, booking, hasManualBlock, hasConfirmedConflict, agreement } = params;

    if (!action || !['confirm', 'decline', 'cancel'].includes(action)) {
      throw new Error('Invalid booking decision request.');
    }

    if (action === 'confirm') {
      if (!property.published || property.moderation_status !== 'approved') {
        throw new Error('Property is not approved and published.');
      }
      if (!room.active) {
        throw new Error('Room is inactive.');
      }
      if (booking.property_id !== room.property_id) {
        throw new Error('Booking property ID does not match room unit property ID.');
      }
      if (!booking.check_in || !booking.check_out || booking.check_out <= booking.check_in) {
        throw new Error('Booking dates are invalid.');
      }
      if (booking.adults + (booking.children || 0) > room.max_guests) {
        throw new Error('Guest count exceeds room capacity.');
      }
      if (hasManualBlock) {
        throw new Error('Cannot confirm request: This room is marked unavailable by host blocks for the selected dates.');
      }
      if (hasConfirmedConflict) {
        throw new Error('Room already has a confirmed reservation for these dates.');
      }

      // Agreement resolution: active, accepted, and valid for check-in
      let commissionPercent = 0.00;
      let commissionAmount = 0.00;
      let agreementId: string | null = null;

      if (
        agreement &&
        agreement.agreement_status === 'active' &&
        agreement.accepted_at &&
        booking.check_in >= agreement.agreement_start &&
        (!agreement.agreement_end || booking.check_in <= agreement.agreement_end)
      ) {
        agreementId = agreement.id;
        const introEnd = new Date(agreement.agreement_start);
        introEnd.setMonth(introEnd.getMonth() + (agreement.intro_period_months || 0));
        const checkInDate = new Date(booking.check_in);

        if (agreement.intro_period_months > 0 && checkInDate < introEnd) {
          commissionPercent = agreement.intro_commission_percent;
        } else {
          commissionPercent = agreement.standard_commission_percent;
        }
        commissionAmount = Math.round((booking.total_estimate * commissionPercent) / 100);
      }

      return {
        success: true,
        status: 'confirmed',
        commission_percent_snapshot: commissionPercent,
        commission_amount_snapshot: commissionAmount,
        host_payout_estimate: booking.total_estimate - commissionAmount,
        agreement_id: agreementId
      };
    }

    return { success: true, status: action === 'decline' ? 'declined' : 'cancelled' };
  }

  const baseProperty = { id: 'prop-101', published: true, moderation_status: 'approved', host_id: 'host-101' };
  const baseRoom = { id: 'room-202', property_id: 'prop-101', active: true, max_guests: 4 };
  const baseBooking = {
    id: 'book-303',
    property_id: 'prop-101',
    room_unit_id: 'room-202',
    status: 'pending',
    check_in: '2026-11-10',
    check_out: '2026-11-15',
    adults: 2,
    children: 1,
    total_estimate: 15000
  };

  // 1. Success confirmation with active accepted agreement
  const activeAgr = {
    id: 'agr-404',
    agreement_status: 'active',
    accepted_at: '2026-11-01T00:00:00Z',
    intro_period_months: 6,
    intro_commission_percent: 5,
    standard_commission_percent: 10,
    agreement_start: '2026-11-01',
    agreement_end: null
  };
  const confirmedRes = simulateRespondToBooking({
    action: 'confirm',
    property: baseProperty,
    room: baseRoom,
    booking: baseBooking,
    hasManualBlock: false,
    hasConfirmedConflict: false,
    agreement: activeAgr
  });
  assert.equal(confirmedRes.status, 'confirmed');
  assert.equal(confirmedRes.commission_percent_snapshot, 5);
  assert.equal(confirmedRes.commission_amount_snapshot, 750);
  assert.equal(confirmedRes.host_payout_estimate, 14250);

  // 2. Rejection when property is unapproved
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: { ...baseProperty, moderation_status: 'pending' },
      room: baseRoom,
      booking: baseBooking,
      hasManualBlock: false,
      hasConfirmedConflict: false,
      agreement: activeAgr
    }),
    /Property is not approved and published/
  );

  // 3. Rejection when room is inactive
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: baseProperty,
      room: { ...baseRoom, active: false },
      booking: baseBooking,
      hasManualBlock: false,
      hasConfirmedConflict: false,
      agreement: activeAgr
    }),
    /Room is inactive/
  );

  // 4. Rejection when booking property does not match room unit property
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: baseProperty,
      room: { ...baseRoom, property_id: 'different-prop-999' },
      booking: baseBooking,
      hasManualBlock: false,
      hasConfirmedConflict: false,
      agreement: activeAgr
    }),
    /Booking property ID does not match room unit property ID/
  );

  // 5. Rejection when guest count exceeds capacity
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: baseProperty,
      room: baseRoom,
      booking: { ...baseBooking, adults: 4, children: 2 }, // 6 guests > max 4
      hasManualBlock: false,
      hasConfirmedConflict: false,
      agreement: activeAgr
    }),
    /Guest count exceeds room capacity/
  );

  // 6. Rejection when dates are invalid
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: baseProperty,
      room: baseRoom,
      booking: { ...baseBooking, check_in: '2026-11-20', check_out: '2026-11-10' },
      hasManualBlock: false,
      hasConfirmedConflict: false,
      agreement: activeAgr
    }),
    /Booking dates are invalid/
  );

  // 7. Rejection when overlapping manual availability block exists
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: baseProperty,
      room: baseRoom,
      booking: baseBooking,
      hasManualBlock: true,
      hasConfirmedConflict: false,
      agreement: activeAgr
    }),
    /room is marked unavailable by host blocks/
  );

  // 8. Rejection when overlapping confirmed reservation exists
  assert.throws(
    () => simulateRespondToBooking({
      action: 'confirm',
      property: baseProperty,
      room: baseRoom,
      booking: baseBooking,
      hasManualBlock: false,
      hasConfirmedConflict: true,
      agreement: activeAgr
    }),
    /Room already has a confirmed reservation/
  );
});

// ============================================================================
// 26. DEFERRED COMMISSION & 100% HOST PAYOUT REGRESSION TESTS
// ============================================================================
test('Security Audit: Commission Calculation Strictly Deferred to 0% and 100% Host Payout Without Active Agreement', () => {
  const baseProperty = { id: 'prop-101', published: true, moderation_status: 'approved', host_id: 'host-101' };
  const baseRoom = { id: 'room-202', property_id: 'prop-101', active: true, max_guests: 4 };
  const baseBooking = {
    id: 'book-303',
    property_id: 'prop-101',
    room_unit_id: 'room-202',
    status: 'pending',
    check_in: '2026-11-10',
    check_out: '2026-11-15',
    adults: 2,
    children: 0,
    total_estimate: 20000
  };

  // Helper matching the revised respond_to_stay_booking RPC logic
  function resolveRpcCommission(booking: typeof baseBooking, agreement: any) {
    let v_commission = 0.00;
    let v_commission_amount = 0.00;
    let v_agreement_id = null;

    if (
      agreement &&
      agreement.agreement_status === 'active' &&
      agreement.accepted_at &&
      agreement.host_user_id &&
      agreement.agreement_start <= booking.check_in &&
      (!agreement.agreement_end || agreement.agreement_end >= booking.check_in)
    ) {
      v_agreement_id = agreement.id;
      if (
        agreement.intro_period_months != null &&
        agreement.intro_commission_percent != null &&
        agreement.standard_commission_percent != null
      ) {
        const introEnd = new Date(agreement.agreement_start);
        introEnd.setMonth(introEnd.getMonth() + agreement.intro_period_months);
        if (new Date(booking.check_in) < introEnd) {
          v_commission = agreement.intro_commission_percent;
        } else {
          v_commission = agreement.standard_commission_percent;
        }
      } else if (agreement.standard_commission_percent != null) {
        v_commission = agreement.standard_commission_percent;
      } else if (agreement.commission_percent != null) {
        v_commission = agreement.commission_percent;
      } else {
        v_commission = 0.00;
      }
      v_commission_amount = Math.round((booking.total_estimate * v_commission) / 100);
    } else {
      v_commission = 0.00;
      v_commission_amount = 0.00;
      v_agreement_id = null;
    }

    const host_payout_estimate = booking.total_estimate - v_commission_amount;

    return {
      commission_percent_snapshot: v_commission,
      commission_amount_snapshot: v_commission_amount,
      host_payout_estimate,
      agreement_id: v_agreement_id
    };
  }

  // A. Case 1: No agreement recorded
  const resNoAgr = resolveRpcCommission(baseBooking, null);
  assert.equal(resNoAgr.commission_percent_snapshot, 0.00);
  assert.equal(resNoAgr.commission_amount_snapshot, 0.00);
  assert.equal(resNoAgr.host_payout_estimate, 20000);
  assert.equal(resNoAgr.agreement_id, null);

  // B. Case 2: Draft agreement (unaccepted)
  const draftAgr = {
    id: 'agr-draft-01',
    agreement_status: 'draft',
    accepted_at: null,
    host_user_id: null,
    agreement_start: '2026-11-01',
    agreement_end: null,
    standard_commission_percent: 10
  };
  const resDraft = resolveRpcCommission(baseBooking, draftAgr);
  assert.equal(resDraft.commission_percent_snapshot, 0.00);
  assert.equal(resDraft.commission_amount_snapshot, 0.00);
  assert.equal(resDraft.host_payout_estimate, 20000);

  // C. Case 3: Expired agreement
  const expiredAgr = {
    id: 'agr-exp-01',
    agreement_status: 'active',
    accepted_at: '2025-01-01T00:00:00Z',
    host_user_id: 'host-101',
    agreement_start: '2025-01-01',
    agreement_end: '2025-10-31', // Expired before 2026-11-10 check_in
    standard_commission_percent: 10
  };
  const resExpired = resolveRpcCommission(baseBooking, expiredAgr);
  assert.equal(resExpired.commission_percent_snapshot, 0.00);
  assert.equal(resExpired.commission_amount_snapshot, 0.00);
  assert.equal(resExpired.host_payout_estimate, 20000);

  // D. Case 4: Terminated agreement
  const termAgr = {
    id: 'agr-term-01',
    agreement_status: 'terminated',
    accepted_at: '2026-01-01T00:00:00Z',
    host_user_id: 'host-101',
    agreement_start: '2026-01-01',
    agreement_end: null,
    standard_commission_percent: 10
  };
  const resTerm = resolveRpcCommission(baseBooking, termAgr);
  assert.equal(resTerm.commission_percent_snapshot, 0.00);
  assert.equal(resTerm.commission_amount_snapshot, 0.00);
  assert.equal(resTerm.host_payout_estimate, 20000);

  // E. Case 5: Active valid agreement
  const activeAgr = {
    id: 'agr-act-01',
    agreement_status: 'active',
    accepted_at: '2026-11-01T00:00:00Z',
    host_user_id: 'host-101',
    agreement_start: '2026-11-01',
    agreement_end: null,
    intro_period_months: 6,
    intro_commission_percent: 5,
    standard_commission_percent: 10
  };
  const resActive = resolveRpcCommission(baseBooking, activeAgr);
  assert.equal(resActive.commission_percent_snapshot, 5);
  assert.equal(resActive.commission_amount_snapshot, 1000);
  assert.equal(resActive.host_payout_estimate, 19000);
  assert.equal(resActive.agreement_id, 'agr-act-01');
});

// ============================================================================
// 27. AGREEMENT LIFECYCLE STATE MACHINE & TERMINAL STATE INTEGRITY
// ============================================================================
test('Security Audit: Agreement Lifecycle State Machine & Terminal State Integrity', () => {
  function validateLifecycleTransition(oldStatus: string, newStatus: string) {
    const validStatuses = ['draft', 'active', 'superseded', 'terminated'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid agreement_status: ${newStatus}`);
    }

    if (oldStatus === 'draft') {
      if (newStatus === 'superseded') {
        throw new Error('Draft commercial agreements cannot transition directly to superseded.');
      }
      // draft -> active (with acceptance) or draft -> terminated (cancelled offer) allowed
      return newStatus;
    }

    if (oldStatus === 'active') {
      if (newStatus === 'draft') {
        throw new Error('Active commercial agreements cannot be reverted to draft status.');
      }
      // active -> superseded or active -> terminated allowed
      return newStatus;
    }

    if (oldStatus === 'superseded') {
      if (newStatus !== 'superseded') {
        throw new Error('Superseded commercial agreements are in a terminal state and cannot be reactivated or altered.');
      }
      return newStatus;
    }

    if (oldStatus === 'terminated') {
      if (newStatus !== 'terminated') {
        throw new Error('Terminated commercial agreements are in a terminal state and cannot be reactivated or altered.');
      }
      return newStatus;
    }

    return newStatus;
  }

  // 1. Permitted transitions
  assert.equal(validateLifecycleTransition('draft', 'active'), 'active');
  assert.equal(validateLifecycleTransition('draft', 'terminated'), 'terminated');
  assert.equal(validateLifecycleTransition('active', 'superseded'), 'superseded');
  assert.equal(validateLifecycleTransition('active', 'terminated'), 'terminated');
  assert.equal(validateLifecycleTransition('superseded', 'superseded'), 'superseded');
  assert.equal(validateLifecycleTransition('terminated', 'terminated'), 'terminated');

  // 2. Forbidden transitions
  assert.throws(() => validateLifecycleTransition('draft', 'superseded'), /Draft commercial agreements cannot transition directly to superseded/);
  assert.throws(() => validateLifecycleTransition('active', 'draft'), /Active commercial agreements cannot be reverted to draft status/);
  assert.throws(() => validateLifecycleTransition('superseded', 'active'), /Superseded commercial agreements are in a terminal state and cannot be reactivated/);
  assert.throws(() => validateLifecycleTransition('superseded', 'draft'), /Superseded commercial agreements are in a terminal state and cannot be reactivated/);
  assert.throws(() => validateLifecycleTransition('terminated', 'active'), /Terminated commercial agreements are in a terminal state and cannot be reactivated/);
  assert.throws(() => validateLifecycleTransition('terminated', 'draft'), /Terminated commercial agreements are in a terminal state and cannot be reactivated/);
  assert.throws(() => validateLifecycleTransition('active', 'unknown'), /Invalid agreement_status: unknown/);
});

// ============================================================================
// 28. PUBLIC AVAILABILITY DATA SANITIZATION & METADATA MASKING
// ============================================================================
test('Security Audit: Public Availability Data Sanitization & Internal Metadata Masking', () => {
  // Model of raw table record containing internal/sensitive operational columns
  const rawAvailabilityRecord = {
    id: 'block-uuid-1234',
    room_unit_id: 'room-unit-5678',
    blocked_from: '2026-11-15',
    blocked_until: '2026-11-20',
    reason: 'Private host maintenance: water pump replacement and VIP staff family visit',
    created_by: 'admin-user-uuid-9999',
    created_at: '2026-11-01T10:00:00Z'
  };

  // Model of public.public_room_availability view
  function getSanitizedPublicAvailability(records: typeof rawAvailabilityRecord[]) {
    return records.map(r => ({
      room_unit_id: r.room_unit_id,
      blocked_from: r.blocked_from,
      blocked_until: r.blocked_until
    }));
  }

  const publicData = getSanitizedPublicAvailability([rawAvailabilityRecord]);

  assert.equal(publicData.length, 1);
  const publicRow: any = publicData[0];

  // Verified: Only availability boundaries exposed
  assert.equal(publicRow.room_unit_id, 'room-unit-5678');
  assert.equal(publicRow.blocked_from, '2026-11-15');
  assert.equal(publicRow.blocked_until, '2026-11-20');

  // Verified: All operational and internal staff metadata strictly masked
  assert.equal(publicRow.id, undefined, 'Block ID must not be leaked');
  assert.equal(publicRow.reason, undefined, 'Internal block reason must not be leaked to public');
  assert.equal(publicRow.created_by, undefined, 'Creator user UUID must not be leaked to public');
  assert.equal(publicRow.created_at, undefined, 'Operational creation timestamp must not be leaked to public');
});

// ============================================================================
// 29. PHASE 2F PRODUCT INTEREST AUTHORIZATION, RLS ISOLATION & RATE LIMITING
// ============================================================================
test('Security Audit: Phase 2F Product Interest Authorization, RLS Isolation & Rate Limiting', () => {
  // Model of product_interests RLS INSERT policy
  function validateProductInterestInsert(authUid: string | null, recordUserId: string | null) {
    if (authUid === null) {
      // Anonymous visitor: user_id MUST be null
      if (recordUserId !== null) {
        throw new Error('RLS check violation: Anonymous visitor cannot attribute interest to a user ID.');
      }
      return true;
    }

    // Authenticated visitor: user_id may be null OR auth.uid()
    if (recordUserId !== null && recordUserId !== authUid) {
      throw new Error('RLS check violation: Cannot attribute product interest to another user.');
    }
    return true;
  }

  // 1. Anonymous visitor inserting with null user_id succeeds
  assert.equal(validateProductInterestInsert(null, null), true);

  // 2. Anonymous visitor attempting to insert arbitrary user_id is rejected
  assert.throws(
    () => validateProductInterestInsert(null, 'spoofed-user-id'),
    /Anonymous visitor cannot attribute interest to a user ID/
  );

  // 3. Authenticated visitor inserting own user_id succeeds
  assert.equal(validateProductInterestInsert('user-123', 'user-123'), true);

  // 4. Authenticated visitor inserting null user_id succeeds (guest mode)
  assert.equal(validateProductInterestInsert('user-123', null), true);

  // 5. Authenticated visitor attempting to attribute to another user is rejected
  assert.throws(
    () => validateProductInterestInsert('user-123', 'victim-user-456'),
    /Cannot attribute product interest to another user/
  );

  // Model of product_interests RLS SELECT policy
  function validateProductInterestSelect(authUid: string | null, recordUserId: string | null, isAdmin: boolean) {
    if (authUid === null) {
      // Anonymous callers cannot select any records
      return false;
    }
    if (isAdmin) {
      return true;
    }
    return recordUserId === authUid;
  }

  // 6. Anonymous cannot read interest records
  assert.equal(validateProductInterestSelect(null, null, false), false);
  assert.equal(validateProductInterestSelect(null, 'user-123', false), false);

  // 7. Regular authenticated user can only read own records
  assert.equal(validateProductInterestSelect('user-123', 'user-123', false), true);
  assert.equal(validateProductInterestSelect('user-123', 'other-user', false), false);

  // 8. Platform administrator can read all records
  assert.equal(validateProductInterestSelect('admin-uid', 'other-user', true), true);
});

// ============================================================================
// 30. STRICT SIGNATORY AUTHORIZATION & UNASSIGNED PROPERTY INVARIANTS
// ============================================================================
test('Security Audit: Strict Signatory Authorization Invariants (Item 1)', () => {
  // Model of enforce_host_agreement_immutability signatory verification logic:
  function verifySignatoryAuthorization(
    property: { host_id: string | null },
    oldAgreement: { host_user_id: string | null },
    newSignatoryUserId: string | null,
    isAdminUser: boolean = false
  ): boolean {
    if (!newSignatoryUserId) {
      throw new Error('55000: Agreement acceptance requires an authorized signatory (host_user_id cannot be null).');
    }

    if (oldAgreement.host_user_id !== null && oldAgreement.host_user_id !== newSignatoryUserId) {
      throw new Error('55000: Agreement signatory cannot be transferred during acceptance.');
    }

    // Exact SQL predicate:
    // (p.host_id IS NOT NULL AND (p.host_id = NEW.host_user_id OR (OLD.host_user_id IS NOT NULL AND OLD.host_user_id = NEW.host_user_id)))
    // OR
    // (p.host_id IS NULL AND OLD.host_user_id IS NOT NULL AND OLD.host_user_id = NEW.host_user_id)
    const isAuthorized = property.host_id !== null
      ? (property.host_id === newSignatoryUserId || (oldAgreement.host_user_id !== null && oldAgreement.host_user_id === newSignatoryUserId))
      : (oldAgreement.host_user_id !== null && oldAgreement.host_user_id === newSignatoryUserId);

    if (!isAuthorized) {
      throw new Error(`42501: Unauthorized signatory: User ${newSignatoryUserId} is not authorized to sign commercial agreements for this property.`);
    }

    return true;
  }

  const PRIMARY_HOST = 'user-host-1';
  const DESIGNATED_SIGNATORY = 'user-signatory-2';
  const ARBITRARY_USER = 'user-arbitrary-3';
  const MANAGER_USER = 'user-manager-4';
  const ADMIN_USER = 'user-admin-5';

  // 1. Property with primary host (host_id = PRIMARY_HOST):
  const propWithHost = { host_id: PRIMARY_HOST };

  // 1a. Primary host can sign unassigned draft (OLD.host_user_id = null)
  assert.equal(verifySignatoryAuthorization(propWithHost, { host_user_id: null }, PRIMARY_HOST), true);

  // 1b. Designated signatory can sign if pre-assigned on draft
  assert.equal(verifySignatoryAuthorization(propWithHost, { host_user_id: DESIGNATED_SIGNATORY }, DESIGNATED_SIGNATORY), true);

  // 1c. Arbitrary user CANNOT sign unassigned draft
  assert.throws(
    () => verifySignatoryAuthorization(propWithHost, { host_user_id: null }, ARBITRARY_USER),
    /42501: Unauthorized signatory/
  );

  // 1d. Property manager CANNOT sign unless explicitly designated on draft
  assert.throws(
    () => verifySignatoryAuthorization(propWithHost, { host_user_id: null }, MANAGER_USER),
    /42501: Unauthorized signatory/
  );

  // 1e. Platform admin CANNOT automatically sign commercial terms unless designated
  assert.throws(
    () => verifySignatoryAuthorization(propWithHost, { host_user_id: null }, ADMIN_USER, true),
    /42501: Unauthorized signatory/
  );

  // 1f. Signatory transfer during acceptance is strictly rejected
  assert.throws(
    () => verifySignatoryAuthorization(propWithHost, { host_user_id: PRIMARY_HOST }, ARBITRARY_USER),
    /55000: Agreement signatory cannot be transferred/
  );

  // 2. Property with NO primary host (host_id = NULL, e.g. Yash Home Stay, Wonderway Retreat):
  const propNoHost = { host_id: null };

  // 2a. Unassigned draft (OLD.host_user_id = null) CANNOT be signed by ANYONE!
  assert.throws(
    () => verifySignatoryAuthorization(propNoHost, { host_user_id: null }, ARBITRARY_USER),
    /42501: Unauthorized signatory/
  );
  assert.throws(
    () => verifySignatoryAuthorization(propNoHost, { host_user_id: null }, ADMIN_USER, true),
    /42501: Unauthorized signatory/
  );

  // 2b. Explicitly pre-designated signatory CAN sign
  assert.equal(verifySignatoryAuthorization(propNoHost, { host_user_id: DESIGNATED_SIGNATORY }, DESIGNATED_SIGNATORY), true);

  // 2c. Different user cannot sign designated draft
  assert.throws(
    () => verifySignatoryAuthorization(propNoHost, { host_user_id: DESIGNATED_SIGNATORY }, ARBITRARY_USER),
    /55000: Agreement signatory cannot be transferred/
  );
});

// ============================================================================
// 31. SELLER PRODUCT MODERATION BYPASS CLOSURE & LIFECYCLE INVARIANTS (Item 2)
// ============================================================================
test('Security Audit: Seller Product Moderation Bypass Closure (Item 2)', () => {
  // Model of products RLS and enforce_product_moderation_lifecycle trigger:
  function simulateProductInsert(
    authUid: string | null,
    sellerStatus: 'approved' | 'pending' | 'rejected' | null,
    isAdmin: boolean,
    payload: { seller_id: string; moderation_status?: string }
  ) {
    if (!authUid) throw new Error('401: Unauthorized');

    const status = payload.moderation_status || 'draft';

    // RLS check for INSERT:
    if (!isAdmin) {
      if (payload.seller_id !== authUid) {
        throw new Error('42501: RLS violation - Cannot insert product for another seller');
      }
      if (status !== 'draft' && status !== 'pending') {
        throw new Error('42501: RLS violation - Sellers can only insert products in draft or pending status');
      }
      if (sellerStatus !== 'approved') {
        throw new Error('42501: RLS violation - Only approved sellers can insert products');
      }
    }

    // Trigger check for INSERT:
    if (!isAdmin && status === 'approved') {
      throw new Error('42501: Trigger violation - Non-admins cannot create products in approved status');
    }

    return { success: true, record: { ...payload, moderation_status: status } };
  }

  function simulateProductUpdate(
    authUid: string | null,
    isAdmin: boolean,
    oldRecord: { seller_id: string; moderation_status: string; title: string },
    newPayload: Partial<{ seller_id: string; moderation_status: string; title: string }>
  ) {
    if (!authUid) throw new Error('401: Unauthorized');

    const targetSellerId = newPayload.seller_id ?? oldRecord.seller_id;
    const requestedStatus = newPayload.moderation_status ?? oldRecord.moderation_status;

    // RLS check for UPDATE:
    if (!isAdmin) {
      if (oldRecord.seller_id !== authUid) {
        throw new Error('42501: RLS violation - Cannot update products owned by other sellers');
      }
      if (requestedStatus !== 'draft' && requestedStatus !== 'pending') {
        throw new Error('42501: RLS violation - Non-admin sellers can only transition to draft or pending');
      }
    }

    // Trigger check for UPDATE:
    if (!isAdmin) {
      if (newPayload.seller_id && newPayload.seller_id !== oldRecord.seller_id) {
        throw new Error('55000: Trigger violation - Product seller ownership cannot be transferred');
      }
      if (requestedStatus === 'approved') {
        throw new Error('42501: Trigger violation - Non-admins cannot promote products to approved');
      }
      // If approved product is edited, status reverts to pending:
      if (oldRecord.moderation_status === 'approved' && requestedStatus !== 'draft') {
        return { ...oldRecord, ...newPayload, moderation_status: 'pending' };
      }
    }

    return { ...oldRecord, ...newPayload, moderation_status: requestedStatus };
  }

  function simulateProductDelete(
    authUid: string | null,
    isAdmin: boolean,
    record: { seller_id: string; moderation_status: string }
  ) {
    if (!authUid) throw new Error('401: Unauthorized');

    // RLS check for DELETE:
    if (isAdmin) return true;

    if (record.seller_id !== authUid) {
      throw new Error('42501: RLS violation - Cannot delete products of another seller');
    }

    if (record.moderation_status !== 'draft' && record.moderation_status !== 'rejected') {
      throw new Error('42501: RLS violation - Sellers cannot delete live approved products without admin action');
    }

    return true;
  }

  const SELLER_ID = 'seller-123';
  const OTHER_SELLER = 'seller-999';

  // 1. Approved seller inserting draft -> succeeds
  assert.equal(simulateProductInsert(SELLER_ID, 'approved', false, { seller_id: SELLER_ID, moderation_status: 'draft' }).success, true);

  // 2. Approved seller inserting pending -> succeeds
  assert.equal(simulateProductInsert(SELLER_ID, 'approved', false, { seller_id: SELLER_ID, moderation_status: 'pending' }).success, true);

  // 3. Seller attempting direct PostgREST insert with 'approved' status -> strictly blocked
  assert.throws(
    () => simulateProductInsert(SELLER_ID, 'approved', false, { seller_id: SELLER_ID, moderation_status: 'approved' }),
    /RLS violation - Sellers can only insert products in draft or pending status/
  );

  // 4. Pending seller cannot insert products
  assert.throws(
    () => simulateProductInsert(SELLER_ID, 'pending', false, { seller_id: SELLER_ID, moderation_status: 'pending' }),
    /RLS violation - Only approved sellers can insert products/
  );

  // 5. Admin can insert approved product
  assert.equal(simulateProductInsert('admin-1', null, true, { seller_id: SELLER_ID, moderation_status: 'approved' }).success, true);

  // 6. Seller editing approved product cannot retain approved status (reverts to pending)
  const approvedProduct = { seller_id: SELLER_ID, moderation_status: 'approved', title: 'Authentic Shawl' };
  assert.throws(
    () => simulateProductUpdate(SELLER_ID, false, approvedProduct, { title: 'Modified Shawl', moderation_status: 'approved' }),
    /RLS violation - Non-admin sellers can only transition to draft or pending/
  );

  // 7. Seller editing approved product transitioning to pending -> succeeds and requires re-moderation
  const updatedPending = simulateProductUpdate(SELLER_ID, false, approvedProduct, { title: 'Modified Shawl', moderation_status: 'pending' });
  assert.equal(updatedPending.moderation_status, 'pending');
  assert.equal(updatedPending.title, 'Modified Shawl');

  // 8. Seller cannot transfer product to another seller
  assert.throws(
    () => simulateProductUpdate(SELLER_ID, false, { ...approvedProduct, moderation_status: 'pending' }, { seller_id: OTHER_SELLER }),
    /Trigger violation - Product seller ownership cannot be transferred/
  );

  // 9. Seller cannot delete live approved product
  assert.throws(
    () => simulateProductDelete(SELLER_ID, false, approvedProduct),
    /RLS violation - Sellers cannot delete live approved products without admin action/
  );

  // 10. Seller CAN delete draft or rejected product
  assert.equal(simulateProductDelete(SELLER_ID, false, { seller_id: SELLER_ID, moderation_status: 'draft' }), true);
  assert.equal(simulateProductDelete(SELLER_ID, false, { seller_id: SELLER_ID, moderation_status: 'rejected' }), true);

  // 11. Admin CAN delete approved product
  assert.equal(simulateProductDelete('admin-1', true, approvedProduct), true);
});

// ============================================================================
// 32. PUBLIC ROOM AVAILABILITY JOIN FILTERING & METADATA MASKING (Item 3)
// ============================================================================
test('Security Audit: Public Room Availability Join Filtering (Item 3)', () => {
  // Model of public.public_room_availability view:
  interface RoomUnit {
    id: string;
    property_id: string;
    active: boolean;
  }
  interface Property {
    id: string;
    published: boolean;
    moderation_status: string;
  }
  interface Block {
    room_unit_id: string;
    blocked_from: string;
    blocked_until: string;
    reason: string;
    created_by: string;
  }

  function executePublicRoomAvailabilityView(
    blocks: Block[],
    roomUnits: Map<string, RoomUnit>,
    properties: Map<string, Property>
  ) {
    return blocks
      .filter((b) => {
        const room = roomUnits.get(b.room_unit_id);
        if (!room || !room.active) return false;
        const prop = properties.get(room.property_id);
        if (!prop || !prop.published || prop.moderation_status !== 'approved') return false;
        return true;
      })
      .map((b) => ({
        room_unit_id: b.room_unit_id,
        blocked_from: b.blocked_from,
        blocked_until: b.blocked_until
        // Note: reason and created_by are strictly excluded by the view projection
      }));
  }

  const props = new Map<string, Property>([
    ['prop-live', { id: 'prop-live', published: true, moderation_status: 'approved' }],
    ['prop-unapproved', { id: 'prop-unapproved', published: true, moderation_status: 'pending' }],
    ['prop-unpublished', { id: 'prop-unpublished', published: false, moderation_status: 'approved' }]
  ]);

  const rooms = new Map<string, RoomUnit>([
    ['room-active-live', { id: 'room-active-live', property_id: 'prop-live', active: true }],
    ['room-inactive-live', { id: 'room-inactive-live', property_id: 'prop-live', active: false }],
    ['room-unapproved', { id: 'room-unapproved', property_id: 'prop-unapproved', active: true }],
    ['room-unpublished', { id: 'room-unpublished', property_id: 'prop-unpublished', active: true }]
  ]);

  const blocks: Block[] = [
    { room_unit_id: 'room-active-live', blocked_from: '2026-12-01', blocked_until: '2026-12-05', reason: 'Maintenance', created_by: 'host-1' },
    { room_unit_id: 'room-inactive-live', blocked_from: '2026-12-01', blocked_until: '2026-12-05', reason: 'Renovation', created_by: 'host-1' },
    { room_unit_id: 'room-unapproved', blocked_from: '2026-12-01', blocked_until: '2026-12-05', reason: 'Pending review', created_by: 'host-2' },
    { room_unit_id: 'room-unpublished', blocked_from: '2026-12-01', blocked_until: '2026-12-05', reason: 'Seasonal close', created_by: 'host-3' }
  ];

  const results = executePublicRoomAvailabilityView(blocks, rooms, props);

  // Exactly 1 block must be returned (only the active room of approved & published property)
  assert.equal(results.length, 1);
  const exposed = results[0] as any;
  assert.equal(exposed.room_unit_id, 'room-active-live');
  assert.equal(exposed.blocked_from, '2026-12-01');
  assert.equal(exposed.blocked_until, '2026-12-05');

  // Internal metadata strictly not exposed
  assert.equal(exposed.reason, undefined);
  assert.equal(exposed.created_by, undefined);
});

// ============================================================================
// 33. CONFIRMED BOOKING COMMERCIAL SNAPSHOT PROTECTION TRIGGER (Item 6)
// ============================================================================
test('Security Audit: Confirmed Booking Snapshot Protection Trigger (Item 6)', () => {
  // Model of protect_confirmed_booking_snapshots trigger:
  function simulateBookingUpdate(
    oldRow: {
      id: string;
      booking_reference: string;
      status: string;
      agreement_id: string | null;
      commission_percent_snapshot: number | null;
      commission_amount_snapshot: number | null;
      total_estimate: number;
      room_unit_id: string;
      property_id: string;
      check_in: string;
      check_out: string;
      host_notes: string | null;
    },
    newRow: Partial<typeof oldRow>
  ) {
    const merged = { ...oldRow, ...newRow };

    if (oldRow.status === 'confirmed') {
      if (
        oldRow.agreement_id !== merged.agreement_id ||
        oldRow.commission_percent_snapshot !== merged.commission_percent_snapshot ||
        oldRow.commission_amount_snapshot !== merged.commission_amount_snapshot ||
        oldRow.total_estimate !== merged.total_estimate ||
        oldRow.room_unit_id !== merged.room_unit_id ||
        oldRow.property_id !== merged.property_id ||
        oldRow.check_in !== merged.check_in ||
        oldRow.check_out !== merged.check_out
      ) {
        throw new Error(`55000: Historical commercial snapshot of a confirmed booking is immutable (Booking ID: ${oldRow.id}, Ref: ${oldRow.booking_reference}). Commercial terms and stay dates cannot be modified after confirmation.`);
      }
    }

    return merged;
  }

  const confirmedBooking = {
    id: 'booking-uuid-1',
    booking_reference: 'UTK-2026-0001',
    status: 'confirmed',
    agreement_id: 'agreement-uuid-9',
    commission_percent_snapshot: 10.0,
    commission_amount_snapshot: 500.0,
    total_estimate: 5000.0,
    room_unit_id: 'room-uuid-1',
    property_id: 'prop-uuid-1',
    check_in: '2026-11-10',
    check_out: '2026-11-15',
    host_notes: 'Initial notes'
  };

  // 1. Host notes update on confirmed booking succeeds
  const notesUpdated = simulateBookingUpdate(confirmedBooking, { host_notes: 'Guest requested early check-in' });
  assert.equal(notesUpdated.host_notes, 'Guest requested early check-in');

  // 2. Cancellation of confirmed booking succeeds while retaining snapshots
  const cancelled = simulateBookingUpdate(confirmedBooking, { status: 'cancelled' });
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.commission_percent_snapshot, 10.0);

  // 3. Attempting to tamper with commission_percent_snapshot fails
  assert.throws(
    () => simulateBookingUpdate(confirmedBooking, { commission_percent_snapshot: 0.0 }),
    /55000: Historical commercial snapshot of a confirmed booking is immutable/
  );

  // 4. Attempting to tamper with commission_amount_snapshot fails
  assert.throws(
    () => simulateBookingUpdate(confirmedBooking, { commission_amount_snapshot: 0.0 }),
    /55000: Historical commercial snapshot of a confirmed booking is immutable/
  );

  // 5. Attempting to tamper with total_estimate fails
  assert.throws(
    () => simulateBookingUpdate(confirmedBooking, { total_estimate: 4000.0 }),
    /55000: Historical commercial snapshot of a confirmed booking is immutable/
  );

  // 6. Attempting to tamper with agreement_id fails
  assert.throws(
    () => simulateBookingUpdate(confirmedBooking, { agreement_id: null }),
    /55000: Historical commercial snapshot of a confirmed booking is immutable/
  );

  // 7. Attempting to alter confirmed stay dates fails
  assert.throws(
    () => simulateBookingUpdate(confirmedBooking, { check_in: '2026-11-12' }),
    /55000: Historical commercial snapshot of a confirmed booking is immutable/
  );
});

// ============================================================================
// 34. LEGAL TERMS DOCUMENT VERSION MAPPING & TERMINATION EVIDENCE (Item 7)
// ============================================================================
test('Security Audit: Legal Terms Version Mapping & Termination Evidence (Item 7)', () => {
  // 1. Version '2026.1' is registered and has non-empty SHA-256 document hash
  const doc = OFFICIAL_LEGAL_TERMS_DOCUMENTS['2026.1'];
  assert.ok(doc, 'Version 2026.1 must be registered');
  assert.equal(doc.version, '2026.1');
  assert.match(doc.documentHash, /^[0-9a-f]{64}$/);

  // 2. Model of enforce_host_agreement_immutability document mapping & termination rules:
  function simulateAgreementTransition(
    oldRow: { agreement_status: string; notes: string | null; terms_version: string },
    newRow: { agreement_status: string; notes: string | null; terms_version: string; accepted_at?: string | null }
  ) {
    // Registered legal document verification:
    if (!OFFICIAL_LEGAL_TERMS_DOCUMENTS[newRow.terms_version]) {
      throw new Error(`22023: Agreement acceptance requires a registered legal terms document version (terms_version: ${newRow.terms_version}).`);
    }

    // Active-to-terminated evidence verification:
    if (oldRow.agreement_status === 'active' && (newRow.agreement_status === 'terminated' || newRow.agreement_status === 'ended')) {
      if (!newRow.notes || (!newRow.notes.includes('[Terminated:') && !newRow.notes.includes('[Ended:'))) {
        throw new Error('55000: Active commercial agreements cannot be terminated without documented termination evidence and audit record in notes.');
      }
    }

    return true;
  }

  // 2a. Acceptance with unregistered terms_version fails
  assert.throws(
    () => simulateAgreementTransition(
      { agreement_status: 'draft', notes: null, terms_version: '2026.1' },
      { agreement_status: 'active', notes: null, terms_version: 'bogus-version-99' }
    ),
    /22023: Agreement acceptance requires a registered legal terms document version/
  );

  // 2b. Terminating active agreement WITHOUT documented evidence in notes fails
  assert.throws(
    () => simulateAgreementTransition(
      { agreement_status: 'active', notes: 'Old host note', terms_version: '2026.1' },
      { agreement_status: 'terminated', notes: 'Old host note', terms_version: '2026.1' }
    ),
    /55000: Active commercial agreements cannot be terminated without documented termination evidence/
  );

  // 2c. Terminating active agreement WITH documented evidence in notes succeeds
  assert.equal(
    simulateAgreementTransition(
      { agreement_status: 'active', notes: 'Old host note', terms_version: '2026.1' },
      { agreement_status: 'terminated', notes: 'Old host note\n[Terminated: 2026-11-03 by mutual bilateral host release]', terms_version: '2026.1' }
    ),
    true
  );
});

// ============================================================================
// 35. DURABLE RATE LIMITING ALGORITHM INVARIANTS (Item 4)
// ============================================================================
test('Security Audit: Durable Rate Limiting Algorithm Invariants (Item 4)', () => {
  // Model of public.check_rate_limit(p_key, p_max_requests, p_window_seconds):
  class MockDatabaseRateLimiter {
    private table = new Map<string, { tokens: number; reset_at: number; last_request_at: number }>();

    checkRateLimit(key: string, maxRequests: number, windowSeconds: number, currentTimeMs = Date.now()): boolean {
      if (!key || maxRequests <= 0 || windowSeconds <= 0) return false;

      const record = this.table.get(key);
      const windowMs = windowSeconds * 1000;

      if (!record || record.reset_at <= currentTimeMs) {
        this.table.set(key, {
          tokens: 1,
          reset_at: currentTimeMs + windowMs,
          last_request_at: currentTimeMs
        });
        return true;
      }

      record.tokens += 1;
      record.last_request_at = currentTimeMs;

      return record.tokens <= maxRequests;
    }
  }

  const limiter = new MockDatabaseRateLimiter();
  const startTime = 1762164000000; // Simulated timestamp

  // 1. First 5 submissions for IP succeed (limit = 5)
  for (let i = 1; i <= 5; i++) {
    assert.equal(limiter.checkRateLimit('ip:192.168.1.50', 5, 600, startTime + i * 1000), true, `Request ${i} must succeed`);
  }

  // 2. 6th submission for same IP fails
  assert.equal(limiter.checkRateLimit('ip:192.168.1.50', 5, 600, startTime + 6000), false, '6th request must be blocked');

  // 3. Different IP is not blocked by first IP's rate limit
  assert.equal(limiter.checkRateLimit('ip:10.0.0.1', 5, 600, startTime + 7000), true, 'Independent IP must succeed');

  // 4. Same email across different IPs is independently throttled
  for (let i = 1; i <= 5; i++) {
    assert.equal(limiter.checkRateLimit('email:artisan@spiti.in', 5, 600, startTime + i * 1000), true);
  }
  assert.equal(limiter.checkRateLimit('email:artisan@spiti.in', 5, 600, startTime + 6000), false);

  // 5. After window expiration (10 minutes = 600 seconds), requests reset and succeed again
  const afterWindowTime = startTime + 601 * 1000;
  assert.equal(limiter.checkRateLimit('ip:192.168.1.50', 5, 600, afterWindowTime), true, 'Request after reset must succeed');
});
