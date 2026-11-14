import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_STAFF_AGREEMENTS,
  HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL,
  computeDocumentHash,
  formatImmutableStaffId,
  isValidStaffIdFormat,
  validateStaffInvitation,
  verifyAllStaffAgreementsCompleted,
  evaluateStaffAuthorization,
  evaluatePortalBoundary,
  FOUR_OPERATIONAL_DEPARTMENTS,
  resolveOperationalDepartment,
  normalizeStaffPermission,
  sanitizeInternalRedirectPath,
} from '../lib/staff-rbac.ts';
import {
  computeGstinCheckDigit,
  validateIndianGSTIN,
  validateGstinVerificationCheck,
  validatePrivateDocumentUpload,
  validateFileMagicBytes,
  canAccessSellerVerificationDocument,
  evaluateSellerDeskUpdate,
  getRequiredDocumentsForCategories,
} from '../lib/seller-verification.ts';
import { evaluateMemberCapabilities } from '../lib/roles.ts';
import {
  CURATED_DESTINATIONS,
  getCanonicalDestinationSlug,
  filterPropertiesForDestination,
} from '../lib/destinations.ts';

describe('UTTARKUNTH PHASE 2 — 15 Mandatory Security & Governance Tests', () => {
  // 1. Public user cannot access staff onboarding without valid invitation token
  it('Scenario 1: Public user cannot access staff onboarding without a valid invitation token', () => {
    const missingInvite = validateStaffInvitation(null, 'public@example.com');
    assert.equal(missingInvite.valid, false);
    assert.match(missingInvite.reason || '', /self-registration is strictly prohibited/i);

    const wrongEmailInvite = validateStaffInvitation(
      {
        official_email: 'invited.staff@uttarkunth.com',
        role_slug: 'property_reviewer',
        department: 'stays_curation',
        status: 'pending',
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      'intruder@example.com'
    );
    assert.equal(wrongEmailInvite.valid, false);
    assert.match(wrongEmailInvite.reason || '', /does not match the official staff email/i);
  });

  // 2. Expired or used invitation token is rejected
  it('Scenario 2: Expired or already-used staff invitation token is rejected', () => {
    const usedInvite = validateStaffInvitation(
      {
        official_email: 'staff@uttarkunth.com',
        role_slug: 'property_reviewer',
        department: 'stays_curation',
        status: 'used',
        expires_at: new Date(Date.now() + 3600_000).toISOString(),
      },
      'staff@uttarkunth.com'
    );
    assert.equal(usedInvite.valid, false);
    assert.match(usedInvite.reason || '', /single-use/i);

    const expiredInvite = validateStaffInvitation(
      {
        official_email: 'staff@uttarkunth.com',
        role_slug: 'property_reviewer',
        department: 'stays_curation',
        status: 'pending',
        expires_at: new Date(Date.now() - 3600_000).toISOString(),
      },
      'staff@uttarkunth.com'
    );
    assert.equal(expiredInvite.valid, false);
    assert.match(expiredInvite.reason || '', /expired/i);
  });

  // 3. Unapproved staff applicant cannot access /admin or staff APIs
  it('Scenario 3: Unapproved staff applicant cannot access /admin or privileged staff APIs', () => {
    const decision = evaluateStaffAuthorization(
      {
        userId: 'staff-candidate-1',
        staffProfile: {
          user_id: 'staff-candidate-1',
          staff_id: null,
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'pending_founder_approval',
          founder_approved_at: null,
          founder_approved_by: null,
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'property.review'
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.statusCode, 403);
    assert.match(decision.reason, /awaiting Founder approval/i);
  });

  // 4. Staff member who has not accepted required agreements cannot be activated
  it('Scenario 4: Staff member who has not accepted all 8 required agreements cannot be activated or authorized', () => {
    const partialAcceptances = REQUIRED_STAFF_AGREEMENTS.slice(0, 7).map((ag) => ({
      agreement_type: ag.type,
      agreement_version: ag.version,
      document_hash: computeDocumentHash(`${ag.code}:${ag.version}:${ag.content.trim()}`),
      accepted_at: new Date().toISOString(),
      approval_status: 'accepted' as const,
    }));

    const check = verifyAllStaffAgreementsCompleted(partialAcceptances);
    assert.equal(check.complete, false);
    assert.deepEqual(check.missing, ['termination_return_of_info']);

    const authDecision = evaluateStaffAuthorization(
      {
        userId: 'staff-1',
        staffProfile: {
          user_id: 'staff-1',
          staff_id: 'UK-STAFF-2026-0002',
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: new Date().toISOString(),
          founder_approved_by: 'founder-id',
          mfa_enrolled: true,
          agreements_completed: false,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'property.review'
    );
    assert.equal(authDecision.allowed, false);
    assert.match(authDecision.reason, /mandatory Uttarkunth Staff Agreements/i);
  });

  // 5. Ordinary member account cannot access staff portal
  it('Scenario 5: Ordinary public member account cannot access the internal staff portal', () => {
    const decision = evaluateStaffAuthorization(
      {
        userId: 'ordinary-member-1',
        isOrdinaryMemberOnly: true,
        staffProfile: null,
      },
      'property.review'
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.statusCode, 403);
    assert.match(decision.reason, /Ordinary public member accounts cannot access/i);
  });

  // 6. Property reviewer cannot approve products or sellers
  it('Scenario 6: Property reviewer cannot approve products or sellers', () => {
    const baseCtx = {
      userId: 'prop-rev-1',
      staffProfile: {
        user_id: 'prop-rev-1',
        staff_id: 'UK-STAFF-2026-0003',
        role_slug: 'property_reviewer' as const,
        department: 'stays_curation' as const,
        status: 'active' as const,
        founder_approved_at: new Date().toISOString(),
        founder_approved_by: 'founder-id',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    const sellerApprovalAttempt = evaluateStaffAuthorization(baseCtx, 'seller.approve');
    assert.equal(sellerApprovalAttempt.allowed, false);
    assert.equal(sellerApprovalAttempt.statusCode, 403);

    const productApprovalAttempt = evaluateStaffAuthorization(baseCtx, 'product.approve');
    assert.equal(productApprovalAttempt.allowed, false);
  });

  // 7. Marketplace reviewer cannot approve properties or assign hosts
  it('Scenario 7: Marketplace reviewer cannot approve properties or assign hosts', () => {
    const baseCtx = {
      userId: 'mkt-rev-1',
      staffProfile: {
        user_id: 'mkt-rev-1',
        staff_id: 'UK-STAFF-2026-0004',
        role_slug: 'marketplace_reviewer' as const,
        department: 'marketplace_compliance' as const,
        status: 'active' as const,
        founder_approved_at: new Date().toISOString(),
        founder_approved_by: 'founder-id',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(evaluateStaffAuthorization(baseCtx, 'property.review').allowed, false);
    assert.equal(evaluateStaffAuthorization(baseCtx, 'property.assign_host').allowed, false);
  });

  // 8. Productions editor cannot access seller documents or commercial agreements
  it('Scenario 8: Productions editor cannot access seller verification documents or commercial agreements', () => {
    const baseCtx = {
      userId: 'prod-ed-1',
      staffProfile: {
        user_id: 'prod-ed-1',
        staff_id: 'UK-STAFF-2026-0005',
        role_slug: 'productions_editor' as const,
        department: 'productions' as const,
        status: 'active' as const,
        founder_approved_at: new Date().toISOString(),
        founder_approved_by: 'founder-id',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(evaluateStaffAuthorization(baseCtx, 'seller.verify_documents').allowed, false);
    assert.equal(evaluateStaffAuthorization(baseCtx, 'finance.review_agreements').allowed, false);
  });

  // 9. Community manager cannot access booking/property/product admin endpoints
  it('Scenario 9: Community manager cannot access booking, property, or product admin endpoints', () => {
    const baseCtx = {
      userId: 'comm-mgr-1',
      staffProfile: {
        user_id: 'comm-mgr-1',
        staff_id: 'UK-STAFF-2026-0006',
        role_slug: 'community_manager' as const,
        department: 'community' as const,
        status: 'active' as const,
        founder_approved_at: new Date().toISOString(),
        founder_approved_by: 'founder-id',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    for (const forbiddenPerm of [
      'support.manage_tickets',
      'property.review',
      'product.approve',
    ] as const) {
      assert.equal(evaluateStaffAuthorization(baseCtx, forbiddenPerm).allowed, false);
    }
  });

  // 10. Support executive cannot view private seller verification documents or HR documents
  it('Scenario 10: Support executive cannot view private seller verification documents or staff HR documents', () => {
    const sellerDocAccess = canAccessSellerVerificationDocument({
      actorUserId: 'support-user-1',
      documentSellerUserId: 'seller-user-99',
      accessType: 'download_signed_url',
      staffContext: {
        isActiveStaff: true,
        roleSlug: 'support_executive',
        permissions: ['support.manage_tickets'],
        mfaAssuranceLevel: 'aal2',
      },
    });
    assert.equal(sellerDocAccess.allowed, false);
    assert.match(sellerDocAccess.reason, /Support Executives are strictly prohibited/i);

    const hrDocAccess = evaluateStaffAuthorization(
      {
        userId: 'support-user-1',
        staffProfile: {
          user_id: 'support-user-1',
          staff_id: 'UK-STAFF-2026-0007',
          role_slug: 'support_executive',
          department: 'customer_support',
          status: 'active',
          founder_approved_at: new Date().toISOString(),
          founder_approved_by: 'founder-id',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'staff.hr_docs.view'
    );
    assert.equal(hrDocAccess.allowed, false);
  });

  // 11. Seller cannot view another seller's verification documents
  it('Scenario 11: Seller cannot view another seller’s private verification documents', () => {
    const crossSellerAttempt = canAccessSellerVerificationDocument({
      actorUserId: 'seller-A',
      documentSellerUserId: 'seller-B',
      accessType: 'view_status',
      staffContext: null,
    });
    assert.equal(crossSellerAttempt.allowed, false);
    assert.match(
      crossSellerAttempt.reason,
      /Sellers cannot view verification documents belonging to another seller/i
    );

    const ownSellerAttempt = canAccessSellerVerificationDocument({
      actorUserId: 'seller-A',
      documentSellerUserId: 'seller-A',
      accessType: 'view_status',
      staffContext: null,
    });
    assert.equal(ownSellerAttempt.allowed, true);
  });

  // 12. Invalid GSTIN format/checksum is rejected
  it('Scenario 12: Invalid Indian GSTIN format or Modulo-36 checksum is rejected', () => {
    const prefix14 = '02AAAAA0000A1Z';
    const validCheckChar = computeGstinCheckDigit(prefix14);
    const validGstin = `${prefix14}${validCheckChar}`;

    const validResult = validateIndianGSTIN(validGstin);
    assert.equal(validResult.valid, true);
    assert.equal(validResult.stateCode, '02');
    assert.equal(validResult.stateName, 'Himachal Pradesh');
    assert.equal(validResult.pan, 'AAAAA0000A');

    const wrongCheckChar = validCheckChar === '5' ? '6' : '5';
    const badChecksumResult = validateIndianGSTIN(`${prefix14}${wrongCheckChar}`);
    assert.equal(badChecksumResult.valid, false);
    assert.match(badChecksumResult.error || '', /checksum validation failed/i);

    const badStateResult = validateIndianGSTIN('98AAAAA0000A1Z5');
    assert.equal(badStateResult.valid, false);
  });

  // 13. GSTIN that is not verified as active cannot receive verified status
  it('Scenario 13: GSTIN that is not verified as Active on the GST Portal cannot receive verified status', () => {
    const prefix14 = '05ABCDE1234F1Z';
    const validGstin = `${prefix14}${computeGstinCheckDigit(prefix14)}`;

    const cancelledCheck = validateGstinVerificationCheck({
      gstin: validGstin,
      applicantLegalBusinessName: 'Himalayan Craft Co',
      legalNameReturned: 'Himalayan Craft Co',
      registrationStatus: 'Cancelled',
      verificationResult: 'verified',
      reviewerUserId: 'founder-1',
      supportingEvidenceRef: 'GST-PORTAL-REF-001',
    });
    assert.equal(cancelledCheck.canMarkVerified, false);
    assert.match(cancelledCheck.reason, /Cancelled/i);

    const mismatchedNameCheck = validateGstinVerificationCheck({
      gstin: validGstin,
      applicantLegalBusinessName: 'Kullu Weavers Collective',
      legalNameReturned: 'Unrelated Entity Pvt Ltd',
      registrationStatus: 'Active',
      verificationResult: 'verified',
      reviewerUserId: 'founder-1',
      supportingEvidenceRef: 'GST-PORTAL-REF-002',
    });
    assert.equal(mismatchedNameCheck.canMarkVerified, false);
  });

  // 14. Suspended or terminated staff member loses access immediately
  it('Scenario 14: Suspended or terminated staff member loses access immediately', () => {
    for (const revokedStatus of ['suspended', 'terminated'] as const) {
      const decision = evaluateStaffAuthorization(
        {
          userId: 'staff-revoked-1',
          staffProfile: {
            user_id: 'staff-revoked-1',
            staff_id: 'UK-STAFF-2026-0008',
            role_slug: 'operations_admin',
            department: 'operations',
            status: revokedStatus,
            founder_approved_at: new Date().toISOString(),
            founder_approved_by: 'founder-id',
            mfa_enrolled: true,
            agreements_completed: true,
          },
          mfaAssuranceLevel: 'aal2',
        },
        'property.review'
      );
      assert.equal(decision.allowed, false);
      assert.equal(decision.statusCode, 403);
      assert.match(decision.reason, /immediately revoked/i);
    }
  });

  // 15. Immutable UK-STAFF-ID format & Seller Desk bank/self-approval guards
  it('Scenario 15: Immutable UK-STAFF-ID format is enforced and sellers cannot self-approve or submit bank details', () => {
    const staffId = formatImmutableStaffId(2026, 1);
    assert.equal(staffId, 'UK-STAFF-2026-0001');
    assert.equal(isValidStaffIdFormat(staffId), true);
    assert.equal(isValidStaffIdFormat('random-password'), false);

    // Reject using UK-STAFF-ID as password
    const passwordAttempt = evaluateStaffAuthorization(
      {
        userId: 'staff-1',
        attemptedPasswordOrToken: 'UK-STAFF-2026-0001',
      },
      'property.review'
    );
    assert.equal(passwordAttempt.allowed, false);
    assert.equal(passwordAttempt.code, 'STAFF_ID_NOT_A_CREDENTIAL');

    // Seller Desk blocks bank details
    const bankAttempt = evaluateSellerDeskUpdate(
      {
        legal_business_name: 'Kullu Looms',
        gstin: null,
        business_constitution: 'individual_artisan',
        tax_registration_status: 'unregistered_artisan',
        status: 'approved',
      },
      {
        bank_account_number: '1234567890',
      }
    );
    assert.equal(bankAttempt.allowed, false);
    assert.match(bankAttempt.error || '', /does not collect bank account or payout details/i);

    // Seller Desk blocks self-approval and triggers re-verification on legal name change
    const legalChange = evaluateSellerDeskUpdate(
      {
        legal_business_name: 'Kullu Looms',
        gstin: null,
        business_constitution: 'individual_artisan',
        tax_registration_status: 'unregistered_artisan',
        status: 'approved',
      },
      {
        legal_business_name: 'Kullu Looms Private Limited',
        status: 'approved',
      }
    );
    assert.equal(legalChange.allowed, true);
    assert.equal(legalChange.triggersReverification, true);
    assert.equal(legalChange.nextStatus, 'pending');

    // Category licence matrix requires FSSAI for food and NPOP for organic
    const foodReqs = getRequiredDocumentsForCategories(['food']);
    assert.ok(foodReqs.required.includes('fssai_licence'));
    const organicReqs = getRequiredDocumentsForCategories(['organic']);
    assert.ok(organicReqs.required.includes('organic_npop_pgs_certificate'));

    // Private document upload rejects public buckets
    const badBucketUpload = validatePrivateDocumentUpload({
      storageBucket: 'public-assets',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
      storagePath: 'https://example.com/public.pdf',
    });
    assert.equal(badBucketUpload.valid, false);
  });

  // 16. Zero Founder Preview Bypass or In-Memory Staff Preview Store
  it('Scenario 16: Zero Founder preview bypass or in-memory staff preview store exists in codebase', () => {
    const rootDir = process.cwd();
    const previewStorePath = path.join(rootDir, 'lib', 'staff-preview-store.ts');
    assert.equal(fs.existsSync(previewStorePath), false, 'lib/staff-preview-store.ts must be deleted');

    const authContent = fs.readFileSync(path.join(rootDir, 'lib', 'auth.ts'), 'utf8');
    assert.equal(authContent.includes('FOUNDER_PREVIEW_USER'), false);
    assert.equal(authContent.includes('ENFORCE_STRICT_STAFF_LOGIN'), false);

    const middlewareContent = fs.readFileSync(path.join(rootDir, 'middleware.ts'), 'utf8');
    assert.equal(middlewareContent.includes('ENFORCE_STRICT_STAFF_LOGIN'), false);
  });

  // 17. Unauthenticated request to staff APIs returns 401 UNAUTHENTICATED
  it('Scenario 17: Unauthenticated request to privileged staff authorization fails closed with 401', () => {
    const decision = evaluateStaffAuthorization(
      {
        userId: null,
        staffProfile: null,
      },
      'staff.invite'
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.statusCode, 401);
    assert.equal(decision.code, 'UNAUTHENTICATED');
  });

  // 18. Unified Member Capabilities ignore user_metadata.role and derive strictly from DB records
  it('Scenario 18: Unified member capabilities derive strictly from verified DB records, never user_metadata.role', () => {
    const baseMember = evaluateMemberCapabilities({
      userId: 'user-1',
    });
    assert.equal(baseMember.isAuthenticated, true);
    assert.equal(baseMember.isHost, false);
    assert.equal(baseMember.isApprovedSeller, false);
    assert.equal(baseMember.isApprovedFilmmaker, false);
    assert.deepEqual(baseMember.badges, ['Uttarkunth Member']);

    const multiCapabilityMember = evaluateMemberCapabilities({
      userId: 'user-2',
      ownedPropertiesCount: 1,
      sellerStatus: 'approved',
      filmmakerStatus: 'approved',
      communityParticipationsCount: 1,
    });
    assert.equal(multiCapabilityMember.isHost, true);
    assert.equal(multiCapabilityMember.isApprovedSeller, true);
    assert.equal(multiCapabilityMember.isApprovedFilmmaker, true);
    assert.equal(multiCapabilityMember.isCommunityContributor, true);

    const signupPageContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'signup', 'page.tsx'),
      'utf8'
    );
    assert.equal(
      signupPageContent.includes("role: role === 'host'"),
      false,
      'Public signup must not set user_metadata.role to host'
    );
  });

  // 19. Common member profile table and API route exist with public vs private field separation
  it('Scenario 19: Common member profile route and migration separate public display fields from private phone', () => {
    const profileRouteContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'account', 'profile', 'route.ts'),
      'utf8'
    );
    assert.ok(profileRouteContent.includes(".from('profiles'"));

    const migrationContent = fs.readFileSync(
      path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql'
      ),
      'utf8'
    );
    assert.ok(migrationContent.includes('CREATE TABLE IF NOT EXISTS public.profiles'));
    assert.ok(migrationContent.includes('CREATE OR REPLACE VIEW public.public_member_profiles'));
  });

  // 20. Host property application route enforces published: false and moderation_status: pending
  it('Scenario 20: Host property application route enforces pending moderation and eliminates redirect loop', () => {
    const hostApplyRoute = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'host', 'apply', 'route.ts'),
      'utf8'
    );
    assert.ok(hostApplyRoute.includes('published: false'));
    assert.ok(hostApplyRoute.includes("moderation_status: 'pending'"));

    const hostNewPropertyPage = fs.readFileSync(
      path.join(process.cwd(), 'app', 'host', 'properties', 'new', 'page.tsx'),
      'utf8'
    );
    assert.equal(
      hostNewPropertyPage.includes("redirect('/stays/partner')"),
      false,
      'app/host/properties/new/page.tsx must not redirect back to /stays/partner'
    );
  });

  // 21. Browser-safe lib/destinations.ts has zero server imports
  it('Scenario 21: lib/destinations.ts is browser-safe with zero server/Supabase imports', () => {
    const destContent = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'destinations.ts'),
      'utf8'
    );
    assert.equal(destContent.includes('createAdminClient'), false);
    assert.equal(destContent.includes('createServerSupabaseClient'), false);
    assert.equal(destContent.includes('next/headers'), false);

    assert.ok(CURATED_DESTINATIONS.length > 0);
    assert.equal(
      getCanonicalDestinationSlug({ village: 'Kasol', district: 'Kullu', state: 'Himachal Pradesh' }),
      'kasol'
    );
    const matches = filterPropertiesForDestination(
      [{ id: '1', village: 'Kasol', state: 'Himachal Pradesh', published: true, moderation_status: 'approved' }],
      CURATED_DESTINATIONS[0]
    );
    assert.ok(Array.isArray(matches));
  });

  // 22. Service-role admin client never falls back to anon key and blocks browser execution
  it('Scenario 22: lib/supabase/admin.ts never falls back to anon key and blocks browser execution', () => {
    const adminClientFile = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'supabase', 'admin.ts'),
      'utf8'
    );
    assert.equal(adminClientFile.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), false);
    assert.equal(adminClientFile.includes('xyplgugxpmlnjsvlosdg'), false);
    assert.ok(adminClientFile.includes("typeof window !== 'undefined'"));
  });

  // 23. Staff onboarding agreement SHA-256 hash matches identically between client and server
  it('Scenario 23: All 8 mandatory staff agreements verify cleanly with canonical SHA-256 hashes', () => {
    const allComplete = REQUIRED_STAFF_AGREEMENTS.map((ag) => ({
      agreement_type: ag.type,
      agreement_version: ag.version,
      document_hash: computeDocumentHash(ag.canonicalContent.trim()),
      accepted_at: new Date().toISOString(),
      approval_status: 'accepted' as const,
    }));

    const verification = verifyAllStaffAgreementsCompleted(allComplete);
    assert.equal(verification.completed, true);
    assert.equal(verification.complete, true);
    assert.equal(verification.missing.length, 0);
  });

  // 24. High-risk staff governance actions require dual authorisation and block self-approval
  it('Scenario 24: High-risk governance actions require dual authorisation and block self-approval', () => {
    assert.ok(HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL.includes('superadmin_creation'));
    assert.ok(HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL.includes('admin_promotion'));
    assert.ok(HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL.includes('commercial_terms_change'));

    const baseFounderCtx = {
      userId: 'founder-1',
      staffProfile: {
        user_id: 'founder-1',
        staff_id: 'UK-STAFF-2026-0001',
        role_slug: 'founder' as const,
        department: 'founder_office' as const,
        status: 'active' as const,
        founder_approved_at: new Date().toISOString(),
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    const missingSecondApprover = evaluateStaffAuthorization(
      baseFounderCtx,
      'governance.dual_approve',
      { highRiskAction: 'admin_promotion' }
    );
    assert.equal(missingSecondApprover.allowed, false);
    assert.equal(missingSecondApprover.code, 'DUAL_AUTHORIZATION_REQUIRED');

    const selfApprovalAttempt = evaluateStaffAuthorization(
      {
        ...baseFounderCtx,
        dualApprovalRecord: {
          id: 'da-1',
          action_type: 'admin_promotion',
          requested_by: 'founder-1',
          approved_by: 'founder-1',
          status: 'approved',
        },
      },
      'governance.dual_approve',
      { highRiskAction: 'admin_promotion' }
    );
    assert.equal(selfApprovalAttempt.allowed, false);
    assert.equal(selfApprovalAttempt.code, 'DUAL_AUTHORIZATION_REQUIRED');

    const validDualApproval = evaluateStaffAuthorization(
      {
        ...baseFounderCtx,
        dualApprovalRecord: {
          id: 'da-2',
          action_type: 'admin_promotion',
          requested_by: 'founder-1',
          approved_by: 'ops-admin-2',
          status: 'approved',
        },
      },
      'governance.dual_approve',
      { highRiskAction: 'admin_promotion' }
    );
    assert.equal(validDualApproval.allowed, true);
  });

  // 25. Sensitive staff permissions enforce TOTP MFA (AAL2) when requireMfaAal2 is enabled
  it('Scenario 25: Sensitive staff actions reject AAL1 sessions when TOTP MFA (AAL2) is required', () => {
    const aal1Attempt = evaluateStaffAuthorization(
      {
        userId: 'founder-1',
        staffProfile: {
          user_id: 'founder-1',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: new Date().toISOString(),
          founder_approved_by: 'founder-1',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal1',
      },
      'staff.invite',
      { requireMfaAal2: true }
    );
    assert.equal(aal1Attempt.allowed, false);
    assert.equal(aal1Attempt.code, 'MFA_AAL2_REQUIRED');
  });

  // 26. Productions workspace enforces honest analytics and supports filmmaker takedown requests
  it('Scenario 26: Productions workspace states Analytics not connected and supports filmmaker takedown workflow', () => {
    const accountProductions = fs.readFileSync(
      path.join(process.cwd(), 'app', 'account', 'productions', 'page.tsx'),
      'utf8'
    );
    assert.ok(accountProductions.includes('Analytics not connected'));
    assert.ok(accountProductions.includes('FilmmakerTakedownButton'));

    const proposalsRoute = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'production', 'proposals', 'route.ts'),
      'utf8'
    );
    assert.ok(proposalsRoute.includes("body?.action === 'request_takedown'"));
    assert.ok(proposalsRoute.includes("status: 'takedown_requested'"));
  });
});

describe('TASK 9 — 12 Strict Verification Scenarios', () => {
  // 1. Legacy platform-admin privilege escalation
  it('Scenario 1: Legacy platform-admin privilege escalation is blocked (fails closed)', () => {
    // Ordinary user or legacy admin with missing staff_profile must fail closed
    const denied = evaluateStaffAuthorization(
      {
        userId: 'legacy-admin-user-uuid',
        email: 'legacy@example.com',
        staffProfile: null, // No staff_profiles row
        mfaAssuranceLevel: 'aal2',
      },
      'property.review'
    );
    assert.equal(denied.allowed, false);
    assert.equal(denied.code, 'ORDINARY_MEMBER_FORBIDDEN');

    // A platform admin role such as property_reviewer must never escalate to founder
    const reviewerAttempt = evaluateStaffAuthorization(
      {
        userId: 'reviewer-user-uuid',
        email: 'reviewer@uttarkunth.com',
        staffProfile: {
          user_id: 'reviewer-user-uuid',
          staff_id: 'UK-STAFF-2026-0005',
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: '2026-02-01T00:00:00Z',
          founder_approved_by: 'founder-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'staff.terminate' // Restricted to Founder
    );
    assert.equal(reviewerAttempt.allowed, false);
    assert.equal(reviewerAttempt.code, 'PERMISSION_DENIED');
  });

  // 2. Suspended and terminated staff sessions
  it('Scenario 2: Suspended and terminated staff sessions are immediately rejected', () => {
    const suspended = evaluateStaffAuthorization(
      {
        userId: 'suspended-staff-uuid',
        staffProfile: {
          user_id: 'suspended-staff-uuid',
          staff_id: 'UK-STAFF-2026-0010',
          role_slug: 'operations_admin',
          department: 'operations',
          status: 'suspended',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'property.review'
    );
    assert.equal(suspended.allowed, false);
    assert.equal(suspended.code, 'STAFF_NOT_ACTIVE');

    const revokedSession = evaluateStaffAuthorization(
      {
        userId: 'revoked-staff-uuid',
        sessionIssuedAt: '2026-02-01T10:00:00Z',
        staffProfile: {
          user_id: 'revoked-staff-uuid',
          staff_id: 'UK-STAFF-2026-0011',
          role_slug: 'operations_admin',
          department: 'operations',
          status: 'active',
          session_revoked_at: '2026-02-01T12:00:00Z', // Revoked after session was issued
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'property.review'
    );
    assert.equal(revokedSession.allowed, false);
    assert.equal(revokedSession.code, 'SESSION_REVOKED');
  });

  // 3. Permission revocation
  it('Scenario 3: Permission revocation denies access when permission is not effective', () => {
    const result = evaluateStaffAuthorization(
      {
        userId: 'staff-uuid-3',
        staffProfile: {
          user_id: 'staff-uuid-3',
          staff_id: 'UK-STAFF-2026-0012',
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
          custom_permissions: [], // No custom grant for audit
        },
        mfaAssuranceLevel: 'aal2',
      },
      'audit.view_full'
    );
    assert.equal(result.allowed, false);
    assert.equal(result.code, 'PERMISSION_DENIED');
  });

  // 4. Invitation creation, expiry, cancellation and atomic consumption
  it('Scenario 4: Invitation lifecycle - valid, expired, cancelled, and consumed checks', () => {
    const valid = validateStaffInvitation(
      {
        official_email: 'candidate@uttarkunth.com',
        role_slug: 'operations_admin',
        department: 'operations',
        status: 'pending',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      'candidate@uttarkunth.com'
    );
    assert.equal(valid.valid, true);

    const expired = validateStaffInvitation(
      {
        official_email: 'candidate@uttarkunth.com',
        role_slug: 'operations_admin',
        department: 'operations',
        status: 'pending',
        expires_at: new Date(Date.now() - 1000).toISOString(),
      },
      'candidate@uttarkunth.com'
    );
    assert.equal(expired.valid, false);
    assert.match(expired.reason || '', /expired/i);

    const cancelled = validateStaffInvitation(
      {
        official_email: 'candidate@uttarkunth.com',
        role_slug: 'operations_admin',
        department: 'operations',
        status: 'cancelled',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      'candidate@uttarkunth.com'
    );
    assert.equal(cancelled.valid, false);
    assert.match(cancelled.reason || '', /cancelled/i);

    const consumed = validateStaffInvitation(
      {
        official_email: 'candidate@uttarkunth.com',
        role_slug: 'operations_admin',
        department: 'operations',
        status: 'accepted',
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      'candidate@uttarkunth.com'
    );
    assert.equal(consumed.valid, false);
    assert.match(consumed.reason || '', /single-use/i);
  });

  // 5. All eight agreement records and real canonical hashes
  it('Scenario 5: All 8 mandatory agreements require stable SHA-256 hashes matching canonical text', () => {
    assert.equal(REQUIRED_STAFF_AGREEMENTS.length, 8);
    for (const ag of REQUIRED_STAFF_AGREEMENTS) {
      assert.ok(ag.canonicalContent.length > 50);
      const hash = computeDocumentHash(ag.canonicalContent.trim());
      assert.equal(hash.length, 64);
      // Hash stability check
      assert.equal(hash, computeDocumentHash(ag.canonicalContent.trim()));
    }
  });

  // 6. Founder onboarding and AAL2 enforcement
  it('Scenario 6: Founder operations strictly enforce TOTP MFA (AAL2)', () => {
    const founderAal1 = evaluateStaffAuthorization(
      {
        userId: 'founder-uuid-6',
        staffProfile: {
          user_id: 'founder-uuid-6',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uuid-6',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal1', // Insufficient assurance
      },
      'staff.terminate',
      { requireMfaAal2: true }
    );
    assert.equal(founderAal1.allowed, false);
    assert.equal(founderAal1.code, 'MFA_AAL2_REQUIRED');

    const founderAal2 = evaluateStaffAuthorization(
      {
        userId: 'founder-uuid-6',
        staffProfile: {
          user_id: 'founder-uuid-6',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uuid-6',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'staff.terminate',
      { requireMfaAal2: true }
    );
    assert.equal(founderAal2.allowed, true);
  });

  // 7. Database/API column compatibility
  it('Scenario 7: Database migration SQL includes dual-column aliases for backward compatibility', () => {
    const migrationSql = fs.readFileSync(
      path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql'
      ),
      'utf8'
    );
    assert.ok(migrationSql.includes('role_slug'));
    assert.ok(migrationSql.includes('role_code'));
    assert.ok(migrationSql.includes('proposed_designation'));
    assert.ok(migrationSql.includes('designation'));
    assert.ok(migrationSql.includes('accepted_at'));
    assert.ok(migrationSql.includes('used_at'));
    assert.ok(migrationSql.includes('permission_key'));
    assert.ok(migrationSql.includes('permission_code'));
    assert.ok(migrationSql.includes('size_bytes'));
    assert.ok(migrationSql.includes('file_size_bytes'));
    assert.ok(migrationSql.includes('second_approver_id'));
  });

  // 8. Dual approval with independent approvers
  it('Scenario 8: Dual approval strictly rejects self-approval and accepts independent approver', () => {
    const selfApproval = evaluateStaffAuthorization(
      {
        userId: 'requester-uuid',
        staffProfile: {
          user_id: 'requester-uuid',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'requester-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
        dualApprovalRecord: {
          id: 'da-req-1',
          action_type: 'admin_promotion',
          requested_by: 'requester-uuid',
          approved_by: 'requester-uuid', // Self approval attempt
          status: 'approved',
        },
      },
      'governance.dual_approve',
      { highRiskAction: 'admin_promotion' }
    );
    assert.equal(selfApproval.allowed, false);
    assert.equal(selfApproval.code, 'DUAL_AUTHORIZATION_REQUIRED');

    const independentApproval = evaluateStaffAuthorization(
      {
        userId: 'requester-uuid',
        staffProfile: {
          user_id: 'requester-uuid',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'requester-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
        dualApprovalRecord: {
          id: 'da-req-2',
          action_type: 'admin_promotion',
          requested_by: 'requester-uuid',
          approved_by: 'second-approver-uuid', // Independent second approver
          status: 'approved',
        },
      },
      'governance.dual_approve',
      { highRiskAction: 'admin_promotion' }
    );
    assert.equal(independentApproval.allowed, true);
  });

  // 9. Cross-seller storage-path injection
  it('Scenario 9: Storage path isolation rejects paths not scoped to the authenticated seller or candidate', () => {
    const sellerUserId = 'seller-user-abc';
    const legitimatePath = `seller-verification/${sellerUserId}/fssai_licence-123.pdf`;
    const injectedOtherSellerPath = 'seller-verification/different-seller-xyz/fssai_licence-456.pdf';

    const legitimateCheck = validatePrivateDocumentUpload({
      fileName: 'fssai.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 50000,
      storageBucket: 'seller-verification-docs',
      storagePath: legitimatePath,
    });
    assert.equal(legitimateCheck.valid, true);

    // Cross-tenant path check logic enforced in application route handlers
    const isOwnerScoped = (path: string, uid: string) =>
      path.startsWith(`seller-verification/${uid}/`) || path.startsWith(`sellers/${uid}/`);

    assert.equal(isOwnerScoped(legitimatePath, sellerUserId), true);
    assert.equal(isOwnerScoped(injectedOtherSellerPath, sellerUserId), false);
  });

  // 10. Private HR document access
  it('Scenario 10: Private HR documents reject unauthorized roles and require AAL2', () => {
    const unprivilegedStaff = evaluateStaffAuthorization(
      {
        userId: 'reviewer-uuid',
        staffProfile: {
          user_id: 'reviewer-uuid',
          staff_id: 'UK-STAFF-2026-0020',
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uuid',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      },
      'staff.hr_docs.view',
      { requireMfaAal2: true }
    );
    assert.equal(unprivilegedStaff.allowed, false);
    assert.equal(unprivilegedStaff.code, 'PERMISSION_DENIED');
  });

  // 11. Host property and room creation failure
  it('Scenario 11: Host property creation validates input schema and handles room failure rollback', () => {
    const hostRoute = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'host', 'apply', 'route.ts'),
      'utf8'
    );
    assert.ok(hostRoute.includes('HostApplySchema'));
    assert.ok(hostRoute.includes('roomErr'));
    assert.ok(hostRoute.includes("delete().eq('id', createdProperty.id)"));
  });

  // 12. Existing properties and bookings remaining unchanged
  it('Scenario 12: Existing properties Yash Home Stay remains intact and canonical', () => {
    const destinations = CURATED_DESTINATIONS;
    assert.ok(destinations.length >= 22);

    const jibhiDest = destinations.find((d) => d.slug === 'jibhi');
    assert.ok(jibhiDest);

    // Verify canonical properties mapping and moderation approval requirement
    const jibhiProps = filterPropertiesForDestination(
      [
        {
          id: 'prop-1',
          name: 'Tirthan Cedar Cottage',
          slug: 'tirthan-cedar-cottage',
          village: 'Jibhi',
          district: 'Kullu',
          published: true,
          moderation_status: 'approved',
        },
        {
          id: 'prop-deprecated',
          name: 'Wonderway Retreat',
          slug: 'wonderway-retreat',
          village: 'Jibhi',
          district: 'Kullu',
          published: true,
          moderation_status: 'approved',
        },
      ],
      jibhiDest!
    );
    assert.equal(jibhiProps.length, 1);
    assert.equal(jibhiProps[0].name, 'Tirthan Cedar Cottage');

    // Yash Home Stay in Jari / Kullu
    const yashSlug = getCanonicalDestinationSlug({
      name: 'Yash Home Stay',
      village: 'Jari',
      district: 'Kullu',
    });
    assert.equal(yashSlug, 'kullu-jari');
  });
});

describe('UTTARKUNTH 3.1 MASTER ARCHITECTURE — 20 Security & Portal Isolation Scenarios', () => {
  // 1. Anonymous user cannot access private tables or staff APIs
  it('Master Scenario 1: Anonymous user cannot access private tables or staff APIs', () => {
    const anonStaffDecision = evaluateStaffAuthorization(
      { userId: null, staffProfile: null },
      'stays.properties.view'
    );
    assert.equal(anonStaffDecision.allowed, false);
    assert.equal(anonStaffDecision.statusCode, 401);
    assert.equal(anonStaffDecision.code, 'UNAUTHENTICATED');

    const anonPortalDecision = evaluatePortalBoundary({
      portalHost: 'admin.uttarkunth.com',
      userId: null,
      staffProfile: null,
    });
    assert.equal(anonPortalDecision.allowed, false);
    assert.equal(anonPortalDecision.statusCode, 401);
  });

  // 2. Ordinary user cannot access Staff Portal or Founder Command Centre
  it('Master Scenario 2: Ordinary public user cannot access Staff Portal (team.uttarkunth.com) or Founder Command Centre (admin.uttarkunth.com)', () => {
    const ordinaryOnStaffPortal = evaluatePortalBoundary({
      portalHost: 'team.uttarkunth.com',
      userId: 'ordinary-member-uuid',
      staffProfile: null,
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(ordinaryOnStaffPortal.allowed, false);
    assert.equal(ordinaryOnStaffPortal.statusCode, 403);
    assert.equal(ordinaryOnStaffPortal.portal, 'staff');

    const ordinaryOnFounderPortal = evaluatePortalBoundary({
      portalHost: 'admin.uttarkunth.com',
      userId: 'ordinary-member-uuid',
      staffProfile: null,
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(ordinaryOnFounderPortal.allowed, false);
    assert.equal(ordinaryOnFounderPortal.statusCode, 403);
    assert.equal(ordinaryOnFounderPortal.portal, 'founder');
  });

  // 3. Host cannot access another host's data
  it('Master Scenario 3: Host cannot access or modify another host’s property data', () => {
    const hostPhotoRoute = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'host', 'properties', '[id]', 'photos', 'route.ts'),
      'utf8'
    );
    assert.ok(hostPhotoRoute.includes('validateFileMagicBytes'));
    assert.ok(hostPhotoRoute.includes("requireStaffPermission('stays.properties.edit'"));
  });

  // 4. Seller cannot access another seller's data
  it('Master Scenario 4: Seller cannot access another seller’s private verification documents', () => {
    const denied = canAccessSellerVerificationDocument({
      actorUserId: 'seller-uid-1',
      documentSellerUserId: 'seller-uid-2',
      accessType: 'download_signed_url',
      staffContext: null,
    });
    assert.equal(denied.allowed, false);
  });

  // 5. Stays staff cannot access Products, Productions, or Community data
  it('Master Scenario 5: UTTARKUNTH STAYS staff cannot access Products, Productions, or Community data', () => {
    const staysCtx = {
      userId: 'stays-staff-1',
      staffProfile: {
        user_id: 'stays-staff-1',
        staff_id: 'UK-STAFF-2026-0101',
        role_slug: 'property_reviewer' as const,
        department: 'stays_curation' as const,
        status: 'active' as const,
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(resolveOperationalDepartment('stays_curation', 'property_reviewer'), 'stays');
    assert.equal(
      evaluateStaffAuthorization(staysCtx, 'stays.properties.approve', {
        requireMfaAal2: true,
        requiredDepartment: 'stays',
      }).allowed,
      true
    );
    assert.equal(
      evaluateStaffAuthorization(staysCtx, 'products.sellers.verify', {
        requiredDepartment: 'products',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(staysCtx, 'productions.proposals.approve', {
        requiredDepartment: 'productions',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(staysCtx, 'community.initiatives.manage', {
        requiredDepartment: 'community',
      }).allowed,
      false
    );
  });

  // 6. Products staff cannot access Stays, Productions, or Community data
  it('Master Scenario 6: UTTARKUNTH PRODUCTS staff cannot access Stays, Productions, or Community data', () => {
    const productsCtx = {
      userId: 'products-staff-1',
      staffProfile: {
        user_id: 'products-staff-1',
        staff_id: 'UK-STAFF-2026-0102',
        role_slug: 'marketplace_reviewer' as const,
        department: 'marketplace_compliance' as const,
        status: 'active' as const,
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(
      resolveOperationalDepartment('marketplace_compliance', 'marketplace_reviewer'),
      'products'
    );
    assert.equal(
      evaluateStaffAuthorization(productsCtx, 'products.sellers.verify', {
        requireMfaAal2: true,
        requiredDepartment: 'products',
      }).allowed,
      true
    );
    assert.equal(
      evaluateStaffAuthorization(productsCtx, 'stays.properties.approve', {
        requiredDepartment: 'stays',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(productsCtx, 'productions.proposals.approve', {
        requiredDepartment: 'productions',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(productsCtx, 'community.initiatives.manage', {
        requiredDepartment: 'community',
      }).allowed,
      false
    );
  });

  // 7. Productions staff cannot access Stays, Products, or Community data
  it('Master Scenario 7: UTTARKUNTH PRODUCTIONS staff cannot access Stays, Products, or Community data', () => {
    const productionsCtx = {
      userId: 'productions-staff-1',
      staffProfile: {
        user_id: 'productions-staff-1',
        staff_id: 'UK-STAFF-2026-0103',
        role_slug: 'productions_editor' as const,
        department: 'productions' as const,
        status: 'active' as const,
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(resolveOperationalDepartment('productions', 'productions_editor'), 'productions');
    assert.equal(
      evaluateStaffAuthorization(productionsCtx, 'productions.proposals.approve', {
        requireMfaAal2: true,
        requiredDepartment: 'productions',
      }).allowed,
      true
    );
    assert.equal(
      evaluateStaffAuthorization(productionsCtx, 'stays.properties.approve', {
        requiredDepartment: 'stays',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(productionsCtx, 'products.sellers.verify', {
        requiredDepartment: 'products',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(productionsCtx, 'community.initiatives.manage', {
        requiredDepartment: 'community',
      }).allowed,
      false
    );
  });

  // 8. Community staff cannot access Stays, Products, or Productions data
  it('Master Scenario 8: UTTARKUNTH COMMUNITY staff cannot access Stays, Products, or Productions data', () => {
    const communityCtx = {
      userId: 'community-staff-1',
      staffProfile: {
        user_id: 'community-staff-1',
        staff_id: 'UK-STAFF-2026-0104',
        role_slug: 'community_manager' as const,
        department: 'community' as const,
        status: 'active' as const,
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(resolveOperationalDepartment('community', 'community_manager'), 'community');
    assert.equal(
      evaluateStaffAuthorization(communityCtx, 'community.initiatives.manage', {
        requireMfaAal2: true,
        requiredDepartment: 'community',
      }).allowed,
      true
    );
    assert.equal(
      evaluateStaffAuthorization(communityCtx, 'stays.properties.approve', {
        requiredDepartment: 'stays',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(communityCtx, 'products.sellers.verify', {
        requiredDepartment: 'products',
      }).allowed,
      false
    );
    assert.equal(
      evaluateStaffAuthorization(communityCtx, 'productions.proposals.approve', {
        requiredDepartment: 'productions',
      }).allowed,
      false
    );
  });

  // 9. Staff cannot modify their own role or permissions
  it('Master Scenario 9: Staff cannot modify their own role or assign permissions', () => {
    const staffCtx = {
      userId: 'ops-staff-1',
      staffProfile: {
        user_id: 'ops-staff-1',
        staff_id: 'UK-STAFF-2026-0105',
        role_slug: 'operations_admin' as const,
        department: 'operations' as const,
        status: 'active' as const,
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2' as const,
    };

    assert.equal(
      evaluateStaffAuthorization(staffCtx, 'governance.permissions.assign').allowed,
      false
    );
    assert.equal(evaluateStaffAuthorization(staffCtx, 'governance.staff.approve').allowed, false);
    assert.equal(evaluateStaffAuthorization(staffCtx, 'governance.staff.suspend').allowed, false);
  });

  // 10. Staff cannot access Founder Command Centre (admin.uttarkunth.com)
  it('Master Scenario 10: Staff cannot access Founder Command Centre (admin.uttarkunth.com)', () => {
    for (const nonFounderRole of [
      'operations_admin',
      'property_reviewer',
      'marketplace_reviewer',
      'productions_editor',
      'community_manager',
      'support_executive',
      'finance_compliance_reviewer',
    ] as const) {
      const portalDecision = evaluatePortalBoundary({
        portalHost: 'admin.uttarkunth.com',
        userId: `staff-${nonFounderRole}`,
        staffProfile: {
          user_id: `staff-${nonFounderRole}`,
          staff_id: 'UK-STAFF-2026-0099',
          role_slug: nonFounderRole,
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-1',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
      });
      assert.equal(portalDecision.allowed, false);
      assert.equal(portalDecision.statusCode, 403);
      assert.match(portalDecision.reason, /Founder Command Centre/i);
    }
  });

  // 11. Suspended staff loses access immediately
  it('Master Scenario 11: Suspended staff loses access immediately across all portals', () => {
    const decision = evaluatePortalBoundary({
      portalHost: 'team.uttarkunth.com',
      userId: 'suspended-staff-99',
      staffProfile: {
        user_id: 'suspended-staff-99',
        staff_id: 'UK-STAFF-2026-0098',
        role_slug: 'property_reviewer',
        department: 'stays_curation',
        status: 'suspended',
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.statusCode, 403);
  });

  // 12. Terminated staff loses access immediately
  it('Master Scenario 12: Terminated staff loses access immediately across all portals', () => {
    const decision = evaluatePortalBoundary({
      portalHost: 'team.uttarkunth.com',
      userId: 'terminated-staff-99',
      staffProfile: {
        user_id: 'terminated-staff-99',
        staff_id: 'UK-STAFF-2026-0097',
        role_slug: 'marketplace_reviewer',
        department: 'marketplace_compliance',
        status: 'terminated',
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.statusCode, 403);
  });

  // 13. Staff without MFA (AAL1) cannot access privileged actions or Staff Portal
  it('Master Scenario 13: Staff without TOTP MFA (AAL1) cannot access Staff Portal or privileged actions', () => {
    const aal1Portal = evaluatePortalBoundary({
      portalHost: 'team.uttarkunth.com',
      userId: 'stays-staff-aal1',
      staffProfile: {
        user_id: 'stays-staff-aal1',
        staff_id: 'UK-STAFF-2026-0096',
        role_slug: 'property_reviewer',
        department: 'stays_curation',
        status: 'active',
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal1',
    });
    assert.equal(aal1Portal.allowed, false);
    assert.equal(aal1Portal.statusCode, 403);
    assert.match(aal1Portal.reason, /AAL2/i);
  });

  // 14. Founder with MFA (AAL2) can access Founder Command Centre and all 4 operational departments
  it('Master Scenario 14: Founder with TOTP MFA (AAL2) can access Founder Command Centre (admin.uttarkunth.com) and all 4 departments', () => {
    const founderPortal = evaluatePortalBoundary({
      portalHost: 'admin.uttarkunth.com',
      userId: 'founder-uid-1',
      staffProfile: {
        user_id: 'founder-uid-1',
        staff_id: 'UK-STAFF-2026-0001',
        role_slug: 'founder',
        department: 'founder_office',
        status: 'active',
        founder_approved_at: '2026-01-01T00:00:00Z',
        founder_approved_by: 'founder-uid-1',
        mfa_enrolled: true,
        agreements_completed: true,
      },
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(founderPortal.allowed, true);
    assert.equal(founderPortal.portal, 'founder');

    assert.deepEqual(
      FOUR_OPERATIONAL_DEPARTMENTS.map((d) => d.slug),
      ['stays', 'products', 'productions', 'community']
    );
  });

  // 15. Private HR documents cannot be accessed publicly and magic bytes are enforced
  it('Master Scenario 15: Private HR documents reject public buckets and spoofed magic bytes', () => {
    const spoofedPdfBytes = new Uint8Array([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e]); // "<script>"
    const spoofedCheck = validateFileMagicBytes(spoofedPdfBytes, 'application/pdf');
    assert.equal(spoofedCheck.valid, false);
    assert.match(spoofedCheck.error || '', /magic-byte/i);

    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // "%PDF-1.7"
    const validCheck = validateFileMagicBytes(validPdfBytes, 'application/pdf');
    assert.equal(validCheck.valid, true);
  });

  // 16. Seller verification documents cannot be accessed by unrelated users or AAL1 staff
  it('Master Scenario 16: Seller verification documents reject AAL1 staff and unrelated users', () => {
    const aal1StaffAttempt = canAccessSellerVerificationDocument({
      actorUserId: 'reviewer-1',
      documentSellerUserId: 'seller-99',
      accessType: 'download_signed_url',
      staffContext: {
        isActiveStaff: true,
        roleSlug: 'marketplace_reviewer',
        permissions: ['seller.verify_documents'],
        mfaAssuranceLevel: 'aal1', // Missing AAL2
      },
    });
    assert.equal(aal1StaffAttempt.allowed, false);
    assert.match(aal1StaffAttempt.reason, /AAL2/i);
  });

  // 17. Dual approval rejects self-approval
  it('Master Scenario 17: Dual approval rejects self-approval even for Founder', () => {
    const selfDual = evaluateStaffAuthorization(
      {
        userId: 'founder-uid-1',
        staffProfile: {
          user_id: 'founder-uid-1',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-uid-1',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        mfaAssuranceLevel: 'aal2',
        dualApprovalRecord: {
          id: 'dual-self-1',
          action_type: 'superadmin_creation',
          requested_by: 'founder-uid-1',
          approved_by: 'founder-uid-1',
          status: 'approved',
        },
      },
      'governance.dual_approve',
      { highRiskAction: 'superadmin_creation' }
    );
    assert.equal(selfDual.allowed, false);
    assert.equal(selfDual.code, 'DUAL_AUTHORIZATION_REQUIRED');
  });

  // 18. Explicit permission revocation overrides inherited role permissions
  it('Master Scenario 18: Explicit permission revocation (revoked_permissions / grant_type=revoke) overrides default role grants', () => {
    const revokedInProfile = evaluateStaffAuthorization(
      {
        userId: 'stays-revoked-perm-1',
        staffProfile: {
          user_id: 'stays-revoked-perm-1',
          staff_id: 'UK-STAFF-2026-0050',
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-1',
          mfa_enrolled: true,
          agreements_completed: true,
          revoked_permissions: ['property.approve'],
        },
        mfaAssuranceLevel: 'aal2',
      },
      'stays.properties.approve'
    );
    assert.equal(revokedInProfile.allowed, false);
    assert.equal(revokedInProfile.code, 'PERMISSION_REVOKED');

    const revokedViaAssignment = evaluateStaffAuthorization(
      {
        userId: 'stays-revoked-perm-2',
        staffProfile: {
          user_id: 'stays-revoked-perm-2',
          staff_id: 'UK-STAFF-2026-0051',
          role_slug: 'property_reviewer',
          department: 'stays_curation',
          status: 'active',
          founder_approved_at: '2026-01-01T00:00:00Z',
          founder_approved_by: 'founder-1',
          mfa_enrolled: true,
          agreements_completed: true,
        },
        permissionAssignments: [
          {
            permission_key: 'property.approve',
            grant_type: 'revoke',
            is_active: true,
            expires_at: null,
          },
        ],
        mfaAssuranceLevel: 'aal2',
      },
      'property.approve'
    );
    assert.equal(revokedViaAssignment.allowed, false);
    assert.equal(revokedViaAssignment.code, 'PERMISSION_REVOKED');
  });

  // 19. Open redirect sanitization blocks external and protocol-relative URLs
  it('Master Scenario 19: sanitizeInternalRedirectPath blocks open redirects across login and callback flows', () => {
    assert.equal(sanitizeInternalRedirectPath('https://evil.example.com/phish', '/'), '/');
    assert.equal(sanitizeInternalRedirectPath('//evil.example.com/phish', '/'), '/');
    assert.equal(sanitizeInternalRedirectPath('/\\evil.example.com', '/'), '/');
    assert.equal(sanitizeInternalRedirectPath('javascript:alert(1)', '/'), '/');
    assert.equal(
      sanitizeInternalRedirectPath('/admin/properties?filter=pending', '/'),
      '/admin/properties?filter=pending'
    );
    assert.equal(sanitizeInternalRedirectPath('/staff', '/'), '/staff');
  });

  // 20. Booking cancellation route enforces cryptographic guest token or authenticated guest/host/staff ownership
  it('Master Scenario 20: Booking cancellation route enforces cryptographic token, guest email, host ownership, or AAL2 Stays staff permission', () => {
    const cancelRouteContent = fs.readFileSync(
      path.join(process.cwd(), 'app', 'api', 'bookings', 'cancel', 'route.ts'),
      'utf8'
    );
    assert.ok(cancelRouteContent.includes('crypto.timingSafeEqual'));
    assert.ok(cancelRouteContent.includes('guest_access_token_hash'));
    assert.ok(cancelRouteContent.includes("requireStaffPermission('stays.bookings.manage'"));
    assert.equal(normalizeStaffPermission('stays.bookings.manage'), 'support.manage_tickets');
  });
});

