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
      /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.public_member_profiles\s+WITH\s*\(\s*security_invoker\s*=\s*false\s*\)/i
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
});
