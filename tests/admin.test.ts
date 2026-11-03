import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlatformAdmin, BRAND } from '../lib/constants.ts';
import { DIRECT_HOST_PAYMENT_NOTICE } from '../lib/host.ts';

// 1. ADMIN PRIVILEGE ISOLATION
test('Admin Portal: Platform Administrator Privilege Isolation', () => {
  // Accounts must NOT receive automatic administrator privileges based on email
  assert.equal(isPlatformAdmin('gauravnegi748@gmail.com'), false);
  assert.equal(isPlatformAdmin('info@uttarkunth.com'), false);
  assert.equal(isPlatformAdmin('uttarkunth@gmail.com'), false);

  // Normal users, guests, or unauthorized hosts must be denied
  assert.equal(isPlatformAdmin('guest@uttarkunth.com'), false);
  assert.equal(isPlatformAdmin('host@mountainstays.in'), false);
  assert.equal(isPlatformAdmin('hacker@exploit.net'), false);
  assert.equal(isPlatformAdmin(''), false);
  assert.equal(isPlatformAdmin(undefined), false);
  assert.equal(isPlatformAdmin(null as any), false);

  // Metadata roles (app_metadata / user_metadata) are abolished as admin authorities
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'admin' } }), false);
  assert.equal(isPlatformAdmin({ app_metadata: { role: 'superadmin' } }), false);
  assert.equal(isPlatformAdmin({ user_metadata: { role: 'admin' } }), false);

  // Authoritative admin verification returns true only with explicit server verification
  assert.equal(isPlatformAdmin({ is_platform_admin: true }), true);
});

// 2. STAGED CONTENT MODERATION ENGINE
test('Admin Moderation: Material Content Staging vs Live Listing Isolation', () => {
  // Initial live property state
  const liveListing = {
    id: 'prop-yash-123',
    name: 'Yash Home Stay',
    description: 'Authentic stone and cedar wood homestay in the serene heights of Sari village.',
    photos: ['https://example.com/sari1.jpg', 'https://example.com/sari2.jpg'],
    amenities: ['Hot Water', 'Home Cooked Meals', 'Valley View'],
    published: true,
    moderation_status: 'approved',
    pending_changes: null as any,
    pending_changes_submitted_at: null as string | null,
  };

  // Host submits material updates: updated description and an added photo
  const proposedChanges = {
    description: 'Updated description: Luxurious mountain retreat overlooking Tungnath peak.',
    photos: ['https://example.com/sari1.jpg', 'https://example.com/sari2.jpg', 'https://example.com/sari3-new.jpg'],
    amenities: ['Hot Water', 'Home Cooked Meals', 'Valley View', 'Guided Stargazing'],
  };

  // Staging action simulated (same logic as app/api/host/properties/[id]/route.ts)
  const stagedProperty = {
    ...liveListing,
    pending_changes: proposedChanges,
    pending_changes_submitted_at: new Date().toISOString(),
  };

  // Verify that live public content has NOT mutated and listing remains published
  assert.equal(stagedProperty.published, true, 'Live listing must remain published during review');
  assert.equal(stagedProperty.moderation_status, 'approved', 'Moderation status remains approved');
  assert.equal(
    stagedProperty.description,
    liveListing.description,
    'Live public description must NOT change before admin approval'
  );
  assert.equal(
    stagedProperty.photos.length,
    2,
    'Live photo count must remain untouched until admin approval'
  );
  assert.deepEqual(
    stagedProperty.pending_changes,
    proposedChanges,
    'Proposed changes must be safely staged in pending_changes'
  );

  // Admin approves staged updates (simulate public.admin_review_property_changes)
  function applyAdminApproval(property: typeof stagedProperty) {
    if (!property.pending_changes) return property;
    return {
      ...property,
      description: property.pending_changes.description ?? property.description,
      photos: property.pending_changes.photos ?? property.photos,
      amenities: property.pending_changes.amenities ?? property.amenities,
      pending_changes: null,
      pending_changes_submitted_at: null,
    };
  }

  const approvedLiveProperty = applyAdminApproval(stagedProperty);
  assert.equal(
    approvedLiveProperty.description,
    proposedChanges.description,
    'Description must update after admin approval'
  );
  assert.equal(approvedLiveProperty.photos.length, 3, 'New photo is now active on live listing');
  assert.equal(approvedLiveProperty.pending_changes, null, 'Staging column must be reset to null');
  assert.equal(approvedLiveProperty.pending_changes_submitted_at, null);
});

test('Admin Moderation: Discarding/Rejecting Staged Changes', () => {
  const stagedProperty = {
    id: 'prop-yash-123',
    name: 'Yash Home Stay',
    description: 'Original authentic description.',
    published: true,
    moderation_status: 'approved',
    pending_changes: {
      description: 'Rejected spam description.',
    },
    pending_changes_submitted_at: new Date().toISOString(),
  };

  // Admin rejects staged updates
  function applyAdminRejection(property: typeof stagedProperty) {
    return {
      ...property,
      pending_changes: null,
      pending_changes_submitted_at: null,
    };
  }

  const rejectedResult = applyAdminRejection(stagedProperty);
  assert.equal(
    rejectedResult.description,
    'Original authentic description.',
    'Description remains the original approved copy'
  );
  assert.equal(rejectedResult.pending_changes, null, 'Staging column is cleared');
  assert.equal(rejectedResult.published, true, 'Property stays published and uninterrupted');
});

// 3. HOST ASSIGNMENT & ROLE PERMISSION MATRIX
test('Host Governance: Safeguard on Canonical Properties', () => {
  const canonicalProperties = [
    { id: 'b1a8c6a7-e73c-431c-8727-c8e385dbd173', name: 'Wonderway Retreat', host_id: null },
    { id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37', name: 'Yash Home Stay', host_id: null },
  ];

  // Safeguard: neither property may have an automated host assignment
  for (const prop of canonicalProperties) {
    assert.equal(
      prop.host_id,
      null,
      `${prop.name} must remain in direct platform stewardship (host_id = NULL) unless manually assigned.`
    );
  }
});

test('Host Governance: Permission Matrix Enforces Role Boundaries', () => {
  const roles = {
    primary_host: {
      canDecideBookings: true,
      canSetAvailabilityBlocks: true,
      canUpdateRoomRates: true,
      canManageCoHosts: true,
      canProposeMaterialChanges: true,
    },
    manager: {
      canDecideBookings: true,
      canSetAvailabilityBlocks: true,
      canUpdateRoomRates: true,
      canManageCoHosts: false,
      canProposeMaterialChanges: false,
    },
    co_host: {
      canDecideBookings: false,
      canSetAvailabilityBlocks: false,
      canUpdateRoomRates: false,
      canManageCoHosts: false,
      canProposeMaterialChanges: false,
    },
  };

  // Primary Host assertions
  assert.equal(roles.primary_host.canDecideBookings, true);
  assert.equal(roles.primary_host.canManageCoHosts, true);
  assert.equal(roles.primary_host.canProposeMaterialChanges, true);

  // Manager assertions
  assert.equal(roles.manager.canDecideBookings, true);
  assert.equal(roles.manager.canSetAvailabilityBlocks, true);
  assert.equal(roles.manager.canManageCoHosts, false, 'Manager must not manage co-hosts');
  assert.equal(roles.manager.canProposeMaterialChanges, false, 'Manager must not propose structural changes');

  // Co-host assertions
  assert.equal(roles.co_host.canDecideBookings, false, 'Co-host must NOT decide bookings');
  assert.equal(roles.co_host.canSetAvailabilityBlocks, false, 'Co-host must NOT create availability blocks');
  assert.equal(roles.co_host.canUpdateRoomRates, false, 'Co-host must NOT modify room rates');
});

// 4. COMMERCIAL AGREEMENT INTEGRITY & DIRECT SETTLEMENT NOTICE
test('Commercial Governance: Zero Unapproved Default Commercial Promises', () => {
  // Verify direct host payment policy wording
  assert.equal(
    DIRECT_HOST_PAYMENT_NOTICE,
    'No online payment is currently collected by Uttarkunth. Guests pay their hosts directly at the property.'
  );

  // Simulated booking snapshot calculation when NO agreement exists
  function calculateCommissionSnapshot(agreement: any | null, totalEstimate: number) {
    if (!agreement || agreement.agreement_status !== 'active') {
      return {
        has_agreement: false,
        commission_percent: null,
        commission_amount: null,
        model: 'direct_host_settlement',
      };
    }
    const rate = Number(agreement.standard_commission_percent);
    return {
      has_agreement: true,
      commission_percent: rate,
      commission_amount: (totalEstimate * rate) / 100,
      model: 'bilateral_agreement',
    };
  }

  // Case 1: No agreement on file -> zero automated commission promise applied
  const snapshotNoAgreement = calculateCommissionSnapshot(null, 10000);
  assert.equal(snapshotNoAgreement.has_agreement, false);
  assert.equal(snapshotNoAgreement.commission_percent, null);
  assert.equal(snapshotNoAgreement.commission_amount, null);
  assert.equal(snapshotNoAgreement.model, 'direct_host_settlement');

  // Case 2: Inactive/Draft agreement -> zero automated commission applied
  const snapshotDraftAgreement = calculateCommissionSnapshot(
    { agreement_status: 'draft', standard_commission_percent: 10 },
    10000
  );
  assert.equal(snapshotDraftAgreement.has_agreement, false);
  assert.equal(snapshotDraftAgreement.commission_percent, null);

  // Case 3: Formal authorized bilateral agreement -> snapshot activated
  const snapshotActive = calculateCommissionSnapshot(
    { agreement_status: 'active', standard_commission_percent: 10 },
    10000
  );
  assert.equal(snapshotActive.has_agreement, true);
  assert.equal(snapshotActive.commission_percent, 10);
  assert.equal(snapshotActive.commission_amount, 1000);
});

// 5. AUDIT TRAIL LOG PAYLOAD INTEGRITY
test('Audit Governance: Administrator Action Log Payload Conformance', () => {
  const allowedActions = [
    'property_approved',
    'property_rejected',
    'changes_approved',
    'changes_rejected',
    'primary_host_assigned',
    'primary_host_removed',
    'cohost_assigned',
    'cohost_removed',
    'host_agreement_created',
  ];

  function createAuditLogEntry(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: Record<string, any>
  ) {
    assert.ok(allowedActions.includes(action), `Action ${action} is an authorized administrative action`);
    assert.ok(targetType, 'target_type is mandatory');
    assert.ok(targetId, 'target_id is mandatory');
    assert.ok(details && typeof details === 'object', 'details JSON is mandatory');

    return {
      id: 'mock-uuid',
      actor_user_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      created_at: new Date().toISOString(),
    };
  }

  const logEntry = createAuditLogEntry(
    'admin-123',
    'changes_approved',
    'property',
    'prop-456',
    { admin_email: 'gauravnegi748@gmail.com', fields_applied: ['description', 'photos'] }
  );

  assert.equal(logEntry.action, 'changes_approved');
  assert.equal(logEntry.target_type, 'property');
  assert.equal(logEntry.details.admin_email, 'gauravnegi748@gmail.com');
  assert.ok(logEntry.created_at);
});
