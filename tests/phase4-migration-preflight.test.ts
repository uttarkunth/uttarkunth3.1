import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20261106000100_correct_phase3_admin_host_and_private_storage_permissions.sql'
);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

describe('Phase 4 corrective security migration', () => {
  it('is atomic and never fabricates privacy or agreement acceptance', () => {
    assert.ok(migrationSql.split('\n').some((line) => line.trim() === 'BEGIN;'));
    assert.ok(migrationSql.trimEnd().endsWith('COMMIT;'));
    assert.ok(migrationSql.includes('SET onboarding_completed = false'));
    assert.ok(migrationSql.includes('privacy_notice_accepted'));
    assert.ok(migrationSql.includes('agreements_completed'));
    assert.ok(migrationSql.includes('all_agreements_accepted'));
    assert.ok(!migrationSql.includes('SET privacy_notice_accepted = true'));
    assert.ok(!migrationSql.includes('SET agreements_completed = true'));
  });


  it('limits staff permission lookup to the current AAL2 user with complete consent', () => {
    const start = migrationSql.indexOf('CREATE OR REPLACE FUNCTION public.has_staff_permission_for_user');
    const end = migrationSql.indexOf('REVOKE ALL ON FUNCTION public.has_staff_permission_for_user', start);
    assert.ok(start >= 0 && end > start);
    const helper = migrationSql.slice(start, end);
    assert.ok(helper.includes('SECURITY DEFINER'));
    assert.ok(helper.includes('auth.uid()'));
    assert.ok(!helper.includes('sp.user_id = p_user_id'));
    assert.ok(helper.includes('sp.privacy_notice_accepted = true'));
    assert.ok(helper.includes('sp.agreements_completed'));
    assert.ok(helper.includes('sp.all_agreements_accepted'));
    assert.ok(helper.includes('sp.onboarding_completed'));
    assert.ok(helper.includes('public.current_session_is_aal2()'));
    assert.ok(migrationSql.includes('GRANT EXECUTE ON FUNCTION public.has_staff_permission_for_user(uuid, text) TO authenticated, service_role'));
  });

  it('restricts staff metadata RLS policies to authenticated, consented users', () => {
    for (const policy of [
      'seller_own_verification_docs_select',
      'staff_agreements_self_or_reviewer_select',
      'staff_profiles_self_or_founder_select',
    ]) {
      assert.ok(migrationSql.includes('CREATE POLICY "' + policy + '"'));
    }
    assert.ok(migrationSql.includes('TO authenticated'));
    assert.ok(migrationSql.includes("auth.uid() = user_id"));
    assert.ok(!migrationSql.includes('TO public'));
  });

  it('replaces the profile trigger so timestamps or one aggregate flag cannot fabricate acceptance', () => {
    const start = migrationSql.indexOf('CREATE OR REPLACE FUNCTION public.sync_staff_profile_cols()');
    const end = migrationSql.indexOf('$func$;', start);
    assert.ok(start >= 0 && end > start);
    const trigger = migrationSql.slice(start, end);
    assert.ok(trigger.includes('Explicit consent only'));
    assert.ok(!trigger.includes('NEW.agreements_completed := true'));
    assert.ok(!trigger.includes('NEW.all_agreements_accepted := true'));
    assert.ok(!trigger.includes('NEW.privacy_notice_accepted := true'));
    assert.ok(!trigger.includes('NEW.privacy_notice_accepted_at IS NOT NULL'));
  });

  it('preserves the live host helper signature but derives identity only from auth.uid()', () => {
    const start = migrationSql.indexOf('CREATE OR REPLACE FUNCTION public.is_property_host');
    const end = migrationSql.indexOf('REVOKE ALL ON FUNCTION public.is_property_host', start);
    assert.ok(start >= 0 && end > start);
    const helper = migrationSql.slice(start, end);
    assert.ok(helper.includes('p_user_id uuid DEFAULT auth.uid()'));
    assert.ok(helper.includes('ph.user_id = auth.uid()'));
    assert.ok(!helper.includes('ph.user_id = p_user_id'));
    assert.ok(migrationSql.includes('REVOKE ALL ON FUNCTION public.is_property_host(uuid, uuid) FROM PUBLIC, anon'));
  });

  it('requires fully approved, consented, and complete staff profiles for admin RLS', () => {
    const start = migrationSql.indexOf('CREATE OR REPLACE FUNCTION public.is_platform_admin_for_user');
    const end = migrationSql.indexOf('REVOKE ALL ON FUNCTION public.is_platform_admin_for_user', start);
    assert.ok(start >= 0 && end > start);
    const helper = migrationSql.slice(start, end);
    for (const required of [
      'sp.founder_approved = true',
      'sp.founder_approved_at IS NOT NULL',
      'sp.privacy_notice_accepted = true',
      'sp.agreements_completed',
      'sp.all_agreements_accepted',
      'sp.onboarding_completed',
    ]) {
      assert.ok(helper.includes(required), 'Missing gate: ' + required);
    }
    assert.ok(!helper.includes("sp.role_slug = 'founder' OR"));
    assert.ok(!helper.includes('FROM public.platform_admins'));
    assert.ok(migrationSql.includes('AND public.current_session_is_aal2()'));
  });

  it('uses an invoker Founder helper and narrows all existing private storage policies', () => {
    const start = migrationSql.indexOf('CREATE OR REPLACE FUNCTION public.is_active_founder()');
    const end = migrationSql.indexOf('REVOKE ALL ON FUNCTION public.is_active_founder()', start);
    assert.ok(start >= 0 && end > start);
    const helper = migrationSql.slice(start, end);
    assert.ok(helper.includes('SECURITY INVOKER'));
    assert.ok(helper.includes("sp.staff_id = 'UK-STAFF-2026-0001'"));
    assert.ok(helper.includes('sp.privacy_notice_accepted = true'));

    const allowed = 'public.is_active_founder() AND public.current_session_is_aal2()';
    assert.equal(migrationSql.split(allowed).length - 1, 3);
    assert.ok(!migrationSql.includes('public.is_platform_admin() AND public.current_session_is_aal2()'));
    assert.ok(migrationSql.includes('DROP POLICY IF EXISTS "Sellers can access own verification docs"'));
    assert.ok(migrationSql.includes('DROP POLICY IF EXISTS "Staff HR docs restricted to owner or Founder AAL2"'));
    assert.ok(migrationSql.includes('DROP POLICY IF EXISTS "Private pillar docs restricted to owner or Staff AAL2"'));
  });
});
