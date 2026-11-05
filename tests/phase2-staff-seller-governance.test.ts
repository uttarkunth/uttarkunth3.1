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
} from '../lib/staff-rbac.ts';
import {
  computeGstinCheckDigit,
  validateIndianGSTIN,
  validateGstinVerificationCheck,
  validatePrivateDocumentUpload,
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
