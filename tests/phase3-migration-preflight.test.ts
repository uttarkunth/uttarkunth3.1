import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const phase2Path = path.join(
  process.cwd(),
  'supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql'
);
const phase3Path = path.join(
  process.cwd(),
  'supabase/migrations/20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql'
);

const phase2Sql = fs.readFileSync(phase2Path, 'utf8');
const phase3Sql = fs.readFileSync(phase3Path, 'utf8');

describe('Phase A & B — Database Migration Preflight & Contract Verification', () => {
  it('1. Both migrations are wrapped in atomic BEGIN ... COMMIT transactions', () => {
    assert.match(phase2Sql, /^\s*BEGIN;/m);
    assert.match(phase2Sql, /COMMIT;\s*$/m);
    assert.match(phase3Sql, /^\s*BEGIN;/m);
    assert.match(phase3Sql, /COMMIT;\s*$/m);
  });

  it('2. Zero destructive DROP TABLE, TRUNCATE, or DELETE on business data tables', () => {
    const combined = `${phase2Sql}\n${phase3Sql}`;
    assert.doesNotMatch(combined, /DROP\s+TABLE/i);
    assert.doesNotMatch(combined, /TRUNCATE\s+/i);
    assert.doesNotMatch(
      combined,
      /DELETE\s+FROM\s+public\.(properties|room_units|stay_bookings|sellers|products|platform_admins)/i
    );
  });

  it('3. Phase 2 migration creates all 16 governance & verification tables + public_member_profiles view', () => {
    const expectedTables = [
      'profiles',
      'staff_roles',
      'staff_permissions',
      'staff_role_permissions',
      'staff_invitations',
      'staff_profiles',
      'staff_permission_assignments',
      'staff_documents',
      'staff_agreements',
      'staff_agreement_acceptances',
      'staff_employment_history',
      'staff_dual_approvals',
      'staff_audit_log',
      'seller_verification_documents',
      'seller_verification_checks',
      'marketplace_category_requirements',
    ];

    for (const tbl of expectedTables) {
      assert.match(
        phase2Sql,
        new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+public\\.${tbl}\\b`, 'i'),
        `Missing CREATE TABLE IF NOT EXISTS public.${tbl} in Phase 2 migration`
      );
    }

    assert.match(
      phase2Sql,
      /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.public_member_profiles\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)/i
    );
  });

  it('4. Phase 2 migration reconciles all columns required by /api/account/profile, /api/admin/staff, and /api/products/apply', () => {
    // profiles columns for /api/account/profile
    assert.match(phase2Sql, /mountain_interests\s+text\[\]/i);
    assert.match(phase2Sql, /contact_verified\s+boolean/i);
    assert.match(phase2Sql, /address\s+text/i);
    assert.match(phase2Sql, /location\s+text/i);

    // staff_profiles columns & status values for /api/admin/staff
    assert.match(phase2Sql, /approved_by\s+uuid/i);
    assert.match(phase2Sql, /approved_at\s+timestamptz/i);
    assert.match(phase2Sql, /moderation_notes\s+text/i);
    assert.match(phase2Sql, /'info_requested'/);
    assert.match(phase2Sql, /'under_review'/);
    assert.match(phase2Sql, /'full_time_employee'/);

    // staff_permission_assignments expires_at & grant_type ('allow', 'grant', 'revoke')
    assert.match(phase2Sql, /expires_at\s+timestamptz/i);
    assert.match(phase2Sql, /grant_type\s+IN\s*\(\s*'allow'\s*,\s*'grant'\s*,\s*'revoke'\s*\)/i);

    // staff_audit_log columns for recordStaffAuditLog()
    assert.match(phase2Sql, /result\s+text\s+NOT\s+NULL\s+DEFAULT\s+'success'/i);
    assert.match(phase2Sql, /before_state\s+jsonb/i);
    assert.match(phase2Sql, /after_state\s+jsonb/i);

    // sellers extended columns for /api/products/apply
    assert.match(phase2Sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+business_constitution/i);
    assert.match(phase2Sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+tax_registration_status/i);
    assert.match(phase2Sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+primary_category/i);
    assert.match(phase2Sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+secondary_categories/i);

    // seller_verification_checks reviewer_user_id for /api/admin/products
    assert.match(phase2Sql, /reviewer_user_id\s+uuid\s+REFERENCES\s+auth\.users\(id\)/i);
  });

  it('5. Phase 3 migration adds property_hosts.status before is_property_host() and cleans up legacy property_hosts policies', () => {
    const alterIdx = phase3Sql.indexOf('ALTER TABLE public.property_hosts');
    const fnIdx = phase3Sql.indexOf('CREATE OR REPLACE FUNCTION public.is_property_host');
    assert.ok(alterIdx !== -1 && fnIdx !== -1 && alterIdx < fnIdx);

    // Dynamic cleanup of legacy policies referencing property_hosts on properties and room_units
    assert.match(phase3Sql, /FROM\s+pg_policies/i);
    assert.match(phase3Sql, /ILIKE\s+'%property_hosts%'/i);
  });

  it('6. Phase 3 migration updates both is_platform_admin_for_user(uuid) and is_platform_admin() and preserves FORCE RLS safety for SECURITY DEFINER', () => {
    assert.match(
      phase3Sql,
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_platform_admin_for_user\(p_user_id\s+uuid\)/i
    );
    assert.match(
      phase3Sql,
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.is_platform_admin\(\)/i
    );
    assert.match(
      phase3Sql,
      /CREATE\s+POLICY\s+"service_and_definer_internal_access"\s+ON\s+public\.%I\s+FOR\s+ALL\s+TO\s+postgres,\s*supabase_admin,\s*service_role/i
    );
  });

  it('7. Phase 3 migration provisions all 6 storage buckets and supports 1- and 2-segment owner paths with AAL2 staff review', () => {
    const buckets = [
      'property-photos',
      'staff-hr-docs',
      'seller-verification-docs',
      'host-verification-docs',
      'production-private-docs',
      'community-private-docs',
    ];
    for (const b of buckets) {
      assert.ok(phase3Sql.includes(`'${b}'`), `Missing bucket ${b} in Phase 3 migration`);
    }
    assert.match(phase3Sql, /\(storage\.foldername\(name\)\)\[1\]\s*=\s*auth\.uid\(\)::text/);
    assert.match(phase3Sql, /\(storage\.foldername\(name\)\)\[2\]\s*=\s*auth\.uid\(\)::text/);
  });

  it('8. Confirmed Founder identity & provision_founder_account() enforces confirmed email, Founder & Chief Executive designation, UK-STAFF-2026-0001, non-fabricated consent/MFA state, and prevents duplicate Founders', async () => {
    assert.match(phase2Sql, /IF\s+v_auth_user\.email_confirmed_at\s+IS\s+NULL\s+THEN/i);
    assert.match(phase2Sql, /'UK-STAFF-2026-0001'/);
    assert.match(phase2Sql, /'Founder & Chief Executive'/);
    assert.match(phase2Sql, /Duplicate Founder provisioning is forbidden/i);
    assert.match(phase2Sql, /FROM\s+auth\.mfa_factors\s+mf/i);
    assert.match(phase2Sql, /'privacy_notice_accepted',\s*false/i);
    assert.match(phase2Sql, /'agreements_completed',\s*false/i);
    assert.match(
      phase2Sql,
      /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.provision_founder_account\(uuid,\s*text,\s*text,\s*text\)\s+FROM\s+PUBLIC/i
    );
    assert.match(
      phase2Sql,
      /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.provision_founder_account\(uuid,\s*text,\s*text,\s*text\)\s+FROM\s+authenticated/i
    );
    assert.doesNotMatch(phase2Sql, /gauravnegi748@gmail\.com/i);
    assert.doesNotMatch(phase3Sql, /gauravnegi748@gmail\.com/i);

    const {
      evaluateStaffAuthorization,
      evaluatePortalBoundary,
      STAFF_ROLE_DEFINITIONS,
    } = await import('../lib/staff-rbac.ts');

    // Verify all 8 roles use the canonical 4 operational departments + founder_office
    const canonicalDepts = new Set(['stays', 'products', 'productions', 'community', 'founder_office']);
    for (const roleDef of Object.values(STAFF_ROLE_DEFINITIONS)) {
      assert.ok(
        canonicalDepts.has(roleDef.department),
        `Role ${roleDef.slug} has non-canonical department ${roleDef.department}`
      );
    }

    // Verify Founder holds onboarding agreement exemption while non-Founder employees require agreements_completed = true
    const founderAuth = evaluateStaffAuthorization(
      {
        userId: '28ba1250-9e0c-4daf-9348-0484175646ba',
        email: 'uttarkunth@gmail.com',
        mfaAssuranceLevel: 'aal2',
        staffProfile: {
          user_id: '28ba1250-9e0c-4daf-9348-0484175646ba',
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: 'founder',
          department: 'founder_office',
          status: 'active',
          founder_approved_at: '2026-11-05T18:00:00Z',
          founder_approved_by: '28ba1250-9e0c-4daf-9348-0484175646ba',
          mfa_enrolled: true,
          agreements_completed: false,
        },
      },
      'staff.invite'
    );
    assert.equal(founderAuth.authorized, true);

    const portalCheck = evaluatePortalBoundary({
      hostname: 'admin.uttarkunth.com',
      userId: '28ba1250-9e0c-4daf-9348-0484175646ba',
      mfaAssuranceLevel: 'aal2',
      staffProfile: {
        user_id: '28ba1250-9e0c-4daf-9348-0484175646ba',
        staff_id: 'UK-STAFF-2026-0001',
        role_slug: 'founder',
        department: 'founder_office',
        status: 'active',
        founder_approved_at: '2026-11-05T18:00:00Z',
        founder_approved_by: '28ba1250-9e0c-4daf-9348-0484175646ba',
        mfa_enrolled: true,
        agreements_completed: false,
      },
    });
    assert.equal(portalCheck.allowed, true);
  });

  it('8b. Phase 3 migration remediates all Supabase Security Advisor findings (0008, 0010, 0014, 0028, 0029)', () => {
    assert.match(phase3Sql, /ALTER\s+VIEW\s+IF\s+EXISTS\s+public\.public_room_availability\s+SET\s*\(\s*security_invoker\s*=\s*true\s*\)/i);
    assert.match(phase3Sql, /ALTER\s+EXTENSION\s+btree_gist\s+SET\s+SCHEMA\s+extensions/i);
    assert.match(phase3Sql, /'booking_rate_limits'/);
    assert.match(phase3Sql, /'booking_requests'/);
    assert.match(phase3Sql, /'bookings'/);
    assert.match(phase3Sql, /'admin_review_property_changes'/);
  });

  it('9. Future Founder email change support: trg_sync_auth_user_email_change synchronizes email by UUID without resetting permissions', () => {
    assert.match(
      phase2Sql,
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.sync_auth_user_email_change\(\)/i
    );
    assert.match(
      phase2Sql,
      /CREATE\s+TRIGGER\s+trg_sync_auth_user_email_change\s+AFTER\s+UPDATE\s+OF\s+email\s+ON\s+auth\.users/i
    );
    assert.match(phase2Sql, /'staff_auth_email_changed'/);
  });

  it('10. /api/account/security/email validator enforces AAL2 MFA and fresh password re-authentication for Founder & Staff', async () => {
    const { validateEmailChangeRequest } = await import('../lib/staff-rbac.ts');

    // Rejects Founder/Staff when MFA is only aal1
    const aal1Result = validateEmailChangeRequest({
      userId: '28ba1250-9e0c-4daf-9348-0484175646ba',
      currentEmail: 'uttarkunth@gmail.com',
      newEmail: 'founder@uttarkunth.com',
      currentPassword: 'StrongPassword!123',
      isPrivilegedStaffOrFounder: true,
      mfaAssuranceLevel: 'aal1',
    });
    assert.equal(aal1Result.valid, false);
    assert.equal(aal1Result.code, 'MFA_AAL2_REQUIRED');
    assert.equal(aal1Result.statusCode, 403);

    // Rejects missing current password
    const noPassResult = validateEmailChangeRequest({
      userId: '28ba1250-9e0c-4daf-9348-0484175646ba',
      currentEmail: 'uttarkunth@gmail.com',
      newEmail: 'founder@uttarkunth.com',
      currentPassword: '',
      isPrivilegedStaffOrFounder: true,
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(noPassResult.valid, false);
    assert.equal(noPassResult.code, 'PASSWORD_REQUIRED');

    // Allows Founder with AAL2 + password + valid distinct email
    const validFounderResult = validateEmailChangeRequest({
      userId: '28ba1250-9e0c-4daf-9348-0484175646ba',
      currentEmail: 'uttarkunth@gmail.com',
      newEmail: '  Founder@Uttarkunth.com ',
      currentPassword: 'StrongPassword!123',
      isPrivilegedStaffOrFounder: true,
      mfaAssuranceLevel: 'aal2',
    });
    assert.equal(validFounderResult.valid, true);
    assert.equal(validFounderResult.code, 'OK');
    assert.equal(validFounderResult.normalizedNewEmail, 'founder@uttarkunth.com');
  });
});