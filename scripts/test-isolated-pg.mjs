// ============================================================================
// UTTARKUNTH — ISOLATED POSTGRESQL MIGRATION TEST HARNESS
// Genuine isolated PostgreSQL execution using @electric-sql/pglite WASM engine
// Tests: Phase 2D/2E, Phase 2F, RLS/Roles, and Transaction Rollback
// ============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import assert from 'assert/strict';

// Import PGlite and extensions from isolated node_modules
import { PGlite } from '../../pg-isolated/node_modules/@electric-sql/pglite/dist/index.js';
import { pgcrypto } from '../../pg-isolated/node_modules/@electric-sql/pglite/dist/contrib/pgcrypto.cjs';
import { btree_gist } from '../../pg-isolated/node_modules/@electric-sql/pglite/dist/contrib/btree_gist.cjs';

console.log('------------------------------------------------------------');
console.log('UTTARKUNTH ISOLATED POSTGRESQL TEST SUITE');
console.log('Engine: PGlite (PostgreSQL 18.6 WASM)');
console.log('Database Mode: In-Memory Isolated Instance (ZERO remote network)');
console.log('------------------------------------------------------------');

async function runIsolatedTests() {
  const db = new PGlite({
    extensions: { pgcrypto, btree_gist }
  });

  // Verify PostgreSQL version
  const vRes = await db.query('SELECT version();');
  console.log('PostgreSQL Version:', vRes.rows[0].version);

  // --------------------------------------------------------------------------
  // STEP 1: BASELINE SUPABASE SCHEMA SETUP (Mirroring Remote Production)
  // --------------------------------------------------------------------------
  console.log('\n[1/6] Setting up baseline schema mirroring Supabase production...');

  await db.exec(`
    -- Enable extensions in extensions schema
    CREATE SCHEMA IF NOT EXISTS extensions;
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
    CREATE EXTENSION IF NOT EXISTS btree_gist;

    -- Standard Supabase Auth Mock
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now()
    );

    -- Mock auth.uid() function
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;

    -- Standard Supabase Roles
    DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
      END IF;
    END $$;

    -- Baseline Tables matching production Supabase catalog exactly
    CREATE TABLE IF NOT EXISTS public.platform_admins (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text UNIQUE NOT NULL,
      role text NOT NULL DEFAULT 'admin',
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.properties (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text UNIQUE NOT NULL,
      name text NOT NULL,
      moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'changes_requested', 'suspended')),
      published boolean NOT NULL DEFAULT false,
      host_id uuid REFERENCES auth.users(id),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.property_hosts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL CHECK (role IN ('co_host', 'manager')),
      created_at timestamptz DEFAULT now(),
      UNIQUE(property_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS public.room_units (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
      room_name text NOT NULL,
      max_guests integer NOT NULL DEFAULT 2 CHECK (max_guests > 0),
      base_price numeric NOT NULL DEFAULT 1000 CHECK (base_price >= 0),
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.room_availability_blocks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_unit_id uuid NOT NULL REFERENCES public.room_units(id) ON DELETE CASCADE,
      blocked_from date NOT NULL,
      blocked_until date NOT NULL,
      reason text,
      created_by uuid REFERENCES auth.users(id),
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.host_agreements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
      host_user_id uuid REFERENCES auth.users(id),
      host_name text DEFAULT 'Host Signatory',
      agreement_start date NOT NULL,
      agreement_end date,
      commission_percent numeric DEFAULT 0 CHECK (commission_percent >= 0 AND commission_percent <= 100),
      intro_commission_percent numeric DEFAULT 0,
      intro_period_months integer DEFAULT 12,
      standard_commission_percent numeric DEFAULT 10,
      agreement_status text NOT NULL DEFAULT 'draft' CHECK (agreement_status IN ('draft', 'active', 'ended')),
      accepted_at timestamptz,
      terms_version text DEFAULT '2026.1',
      notes text,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.stay_bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_reference text UNIQUE NOT NULL,
      property_id uuid NOT NULL REFERENCES public.properties(id),
      room_unit_id uuid NOT NULL REFERENCES public.room_units(id),
      guest_user_id uuid REFERENCES auth.users(id),
      guest_name text NOT NULL,
      guest_email text NOT NULL,
      guest_phone text NOT NULL,
      check_in date NOT NULL,
      check_out date NOT NULL,
      adults integer NOT NULL DEFAULT 1 CHECK (adults > 0),
      children integer NOT NULL DEFAULT 0 CHECK (children >= 0),
      rooms_count integer NOT NULL DEFAULT 1 CHECK (rooms_count > 0),
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
      total_estimate numeric,
      agreement_id uuid REFERENCES public.host_agreements(id),
      commission_percent_snapshot numeric,
      commission_amount_snapshot numeric,
      host_notes text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.admin_audit_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id uuid REFERENCES auth.users(id),
      action text NOT NULL CHECK (action IN ('property_moderated', 'host_assigned', 'booking_decided', 'agreement_saved')),
      target_type text NOT NULL CHECK (target_type IN ('property', 'booking', 'agreement')),
      target_id uuid NOT NULL,
      details jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  console.log('  -> Baseline tables created successfully.');

  // Seed test users
  const adminId = '11111111-1111-1111-1111-111111111111';
  const primaryHostId = '22222222-2222-2222-2222-222222222222';
  const designatedSignatoryId = '33333333-3333-3333-3333-333333333333';
  const unauthorizedUserId = '44444444-4444-4444-4444-444444444444';
  const guestUserId = '55555555-5555-5555-5555-555555555555';

  await db.query(`
    INSERT INTO auth.users (id, email) VALUES
      ($1, 'admin@uttarkunth.com'),
      ($2, 'host@uttarkunth.com'),
      ($3, 'signatory@uttarkunth.com'),
      ($4, 'intruder@unknown.com'),
      ($5, 'guest@traveller.com');
  `, [adminId, primaryHostId, designatedSignatoryId, unauthorizedUserId, guestUserId]);

  await db.query(`
    INSERT INTO public.platform_admins (user_id, email, role) VALUES ($1, 'admin@uttarkunth.com', 'admin');
  `, [adminId]);

  // Seed canonical properties (host_id = NULL) and standard hosted property
  const yashStayId = 'a0000000-0000-0000-0000-000000000001';
  const wonderwayId = 'a0000000-0000-0000-0000-000000000002';
  const pineRetreatId = 'a0000000-0000-0000-0000-000000000003';

  await db.query(`
    INSERT INTO public.properties (id, slug, name, moderation_status, published, host_id) VALUES
      ($1, 'yash-home-stay', 'Yash Home Stay', 'approved', true, NULL),
      ($2, 'wonderway-retreat', 'Wonderway Retreat', 'approved', true, NULL),
      ($3, 'pine-retreat', 'Pine Valley Retreat', 'approved', true, $4);
  `, [yashStayId, wonderwayId, pineRetreatId, primaryHostId]);

  // Seed rooms
  const yashRoomId = 'b0000000-0000-0000-0000-000000000001';
  const pineRoomId = 'b0000000-0000-0000-0000-000000000002';

  await db.query(`
    INSERT INTO public.room_units (id, property_id, room_name, max_guests, base_price, active) VALUES
      ($1, $2, 'Himalayan View Room', 3, 1200, true),
      ($3, $4, 'Pine Suite', 2, 2500, true);
  `, [yashRoomId, yashStayId, pineRoomId, pineRetreatId]);

  console.log('  -> Canonical properties seeded: Yash Home Stay (host_id=NULL), Wonderway Retreat (host_id=NULL).');

  // --------------------------------------------------------------------------
  // STEP 2: EXECUTE PHASE 2D & PHASE 2E MIGRATION SCRIPTS
  // --------------------------------------------------------------------------
  console.log('\n[2/6] Executing Phase 2D & Phase 2E Security Remediation Migrations...');
  const migration2DPath = path.resolve('supabase/migrations/20261103114500_phase2d_security_remediation.sql');
  const migration2EPath = path.resolve('supabase/migrations/20261103114530_phase2e_security_remediation.sql');
  const sql2D = fs.readFileSync(migration2DPath, 'utf8');
  const sql2E = fs.readFileSync(migration2EPath, 'utf8');

  const startTime2D = Date.now();
  await db.exec(sql2D);
  console.log(`  -> Phase 2D Migration executed successfully in ${Date.now() - startTime2D}ms.`);

  const startTime2E = Date.now();
  await db.exec(sql2E);
  console.log(`  -> Phase 2E Migration executed successfully in ${Date.now() - startTime2E}ms.`);

  // Verify Phase 2D/2E DDL & Objects
  const legalDocRes = await db.query('SELECT version, document_hash, title FROM public.legal_terms_documents;');
  assert.equal(legalDocRes.rows.length, 0, 'Initial release must have zero placeholder legal documents seeded');
  console.log('  -> Verified public.legal_terms_documents registry is unseeded (zero placeholder content).');

  // Insert test legal document in test environment to test agreement acceptance mechanics
  await db.query(`
    INSERT INTO public.legal_terms_documents (version, document_hash, title, effective_date, content)
    VALUES ('2026.1', '54f1d67ee1294739557d9602d7b1ab0d819819de7b60d05a5a9f8a4676665af8', 'Test Host Agreement', '2026-01-01', 'Test terms content');
  `);

  // Test SQL calculate_host_agreement_digest matching JS implementation
  const testAgrId = 'a1111111-1111-1111-1111-111111111111';
  const testPropId = 'b2222222-2222-2222-2222-222222222222';
  const testSignatoryId = 'c3333333-3333-3333-3333-333333333333';

  const digestQuery = await db.query(`
    SELECT public.calculate_host_agreement_digest(
      $1::uuid, $2::uuid, $3::uuid,
      '2026-11-01'::date, NULL::date,
      10.00::numeric, 0.00::numeric, 12::integer, 10.00::numeric, '2026.1'::text
    ) as digest;
  `, [testAgrId, testPropId, testSignatoryId]);

  const expectedHash = 'f7441eb2d955d8f8ed6d057d6dbac9e90dec344afad7973acd9f8a19b29552c1';
  assert.equal(digestQuery.rows[0].digest, expectedHash);
  console.log('  -> Verified calculate_host_agreement_digest matches exact SHA-256 byte digest:', expectedHash);

  // --------------------------------------------------------------------------
  // STEP 3: VERIFY AGREEMENT SECURITY & TERMINATION INVARIANTS
  // --------------------------------------------------------------------------
  console.log('\n[3/6] Testing Host Agreement Security, Signatory Authorization & Termination...');

  // 3A. Direct insert of active agreement must fail
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.host_agreements (property_id, host_user_id, agreement_start, agreement_status, terms_version)
        VALUES ($1, $2, '2026-11-01', 'active', '2026.1');
      `, [pineRetreatId, primaryHostId]);
    },
    /New commercial agreements must be created with draft status/
  );
  console.log('  -> [PASS] Direct insert of active agreement rejected.');

  // 3B. Direct insert of accepted agreement must fail
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.host_agreements (property_id, host_user_id, agreement_start, agreement_status, accepted_at, terms_version)
        VALUES ($1, $2, '2026-11-01', 'draft', now(), '2026.1');
      `, [pineRetreatId, primaryHostId]);
    },
    /New commercial agreements cannot be inserted in an already accepted state/
  );
  console.log('  -> [PASS] Direct insert with accepted_at populated rejected.');

  // 3C. Insert valid draft agreement for Pine Valley Retreat
  const draftAgrRes = await db.query(`
    INSERT INTO public.host_agreements (
      property_id, host_user_id, agreement_start, commission_percent,
      intro_commission_percent, intro_period_months, standard_commission_percent,
      agreement_status, terms_version
    ) VALUES (
      $1, $2, '2026-11-01', 10.00, 5.00, 6, 10.00, 'draft', '2026.1'
    ) RETURNING id;
  `, [pineRetreatId, primaryHostId]);
  const pineAgrId = draftAgrRes.rows[0].id;

  // Compute exact digest for pineAgrId
  const pineDigestRes = await db.query(`
    SELECT public.calculate_host_agreement_digest(
      $1::uuid, $2::uuid, $3::uuid,
      '2026-11-01'::date, NULL::date,
      10.00::numeric, 5.00::numeric, 6::integer, 10.00::numeric, '2026.1'::text
    ) as digest;
  `, [pineAgrId, pineRetreatId, primaryHostId]);
  const pineDigest = pineDigestRes.rows[0].digest;

  // 3D. Acceptance with wrong digest must fail
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.host_agreements
        SET agreement_status = 'active', accepted_at = now(), terms_digest = '0000000000000000000000000000000000000000000000000000000000000000'
        WHERE id = $1;
      `, [pineAgrId]);
    },
    /Terms digest mismatch/
  );
  console.log('  -> [PASS] Acceptance with tampered digest rejected.');

  // 3E. Acceptance with unauthorized signatory transfer must fail
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.host_agreements
        SET agreement_status = 'active', accepted_at = now(), host_user_id = $2, terms_digest = $3
        WHERE id = $1;
      `, [pineAgrId, unauthorizedUserId, pineDigest]);
    },
    /Agreement signatory cannot be transferred/
  );
  console.log('  -> [PASS] Signatory transfer attempt on draft rejected.');

  // 3E2. Acceptance of unassigned draft on host_id = NULL property by unauthorized user must fail
  const yashDraftRes = await db.query(`
    INSERT INTO public.host_agreements (
      property_id, host_user_id, agreement_start, commission_percent,
      agreement_status, terms_version
    ) VALUES (
      $1, NULL, '2026-11-01', 0.00, 'draft', '2026.1'
    ) RETURNING id;
  `, [yashStayId]);
  const yashAgrId = yashDraftRes.rows[0].id;

  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.host_agreements
        SET agreement_status = 'active', accepted_at = now(), host_user_id = $2, terms_digest = '54f1d67ee1294739557d9602d7b1ab0d819819de7b60d05a5a9f8a4676665af8'
        WHERE id = $1;
      `, [yashAgrId, unauthorizedUserId]);
    },
    /Unauthorized signatory/
  );
  console.log('  -> [PASS] Unauthorized signatory self-assignment on host_id=NULL property rejected.');

  // 3F. Valid acceptance by primary host succeeds
  await db.query(`
    UPDATE public.host_agreements
    SET agreement_status = 'active', accepted_at = now(), terms_digest = $2
    WHERE id = $1;
  `, [pineAgrId, pineDigest]);
  console.log('  -> [PASS] Valid acceptance by authorized host succeeded.');

  // 3G. Post-acceptance alteration of material terms must fail
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.host_agreements
        SET commission_percent = 2.00
        WHERE id = $1;
      `, [pineAgrId]);
    },
    /Material terms of an accepted commercial agreement cannot be altered/
  );
  console.log('  -> [PASS] Post-acceptance alteration of commission rate rejected.');

  // 3H. Deletion of accepted agreement must fail
  await assert.rejects(
    async () => {
      await db.query(`DELETE FROM public.host_agreements WHERE id = $1;`, [pineAgrId]);
    },
    /Accepted commercial agreements cannot be deleted/
  );
  console.log('  -> [PASS] Deletion of accepted agreement rejected.');

  // 3I. Truncate table must fail
  await assert.rejects(
    async () => {
      await db.query(`TRUNCATE TABLE public.host_agreements CASCADE;`);
    },
    /TRUNCATE is strictly prohibited on host_agreements/
  );
  console.log('  -> [PASS] TRUNCATE table host_agreements rejected.');

  // 3J. Test Agreement Termination via terminate_host_agreement RPC
  const termRes = await db.query(`
    SELECT public.terminate_host_agreement(
      $1::uuid, $2::uuid, 'Mutual bilateral termination executed upon written commercial notice.'::text
    ) as result;
  `, [pineAgrId, adminId]);
  assert.equal(termRes.rows[0].result.success, true);
  assert.equal(termRes.rows[0].result.agreement_status, 'terminated');
  assert.ok(termRes.rows[0].result.terminated_at);
  console.log('  -> [PASS] Agreement terminated via terminate_host_agreement RPC with immutable evidence.');

  // Verify audit log recorded the termination
  const auditRes = await db.query(`
    SELECT action, target_type, target_id, details
    FROM public.admin_audit_log
    WHERE target_id = $1;
  `, [pineAgrId]);
  assert.equal(auditRes.rows.length, 1);
  assert.equal(auditRes.rows[0].details.operation, 'host_agreement_terminated');
  console.log('  -> [PASS] Audit log verified with operation: host_agreement_terminated.');

  // 3K. Terminated agreement cannot be reactivated
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.host_agreements
        SET agreement_status = 'active'
        WHERE id = $1;
      `, [pineAgrId]);
    },
    /Terminated commercial agreements are in a.*terminal state/
  );
  console.log('  -> [PASS] Reactivation of terminated agreement rejected.');

  // --------------------------------------------------------------------------
  // STEP 4: VERIFY HISTORICAL BOOKING SNAPSHOT PROTECTION
  // --------------------------------------------------------------------------
  console.log('\n[4/6] Testing Confirmed Booking Snapshot Protection & Lifecycle Rules...');

  // Create a confirmed booking with snapshot
  const bookingId = 'c0000000-0000-0000-0000-000000000001';
  await db.query(`
    INSERT INTO public.stay_bookings (
      id, booking_reference, property_id, room_unit_id, guest_user_id,
      guest_name, guest_email, guest_phone, check_in, check_out,
      adults, children, total_estimate, status, agreement_id,
      commission_percent_snapshot, commission_amount_snapshot
    ) VALUES (
      $1, 'UTK-2026-9001', $2, $3, $4,
      'Vikram Seth', 'vikram@example.com', '+919876543210', '2026-11-10', '2026-11-15',
      2, 0, 10000.00, 'confirmed', $5,
      10.00, 1000.00
    );
  `, [bookingId, pineRetreatId, pineRoomId, guestUserId, pineAgrId]);

  // Derived host payout check: total_estimate (10000) - commission (1000) = 9000
  const bookingCheck = await db.query(`
    SELECT total_estimate, commission_amount_snapshot, (total_estimate - commission_amount_snapshot) as host_payout
    FROM public.stay_bookings WHERE id = $1;
  `, [bookingId]);
  assert.equal(Number(bookingCheck.rows[0].host_payout), 9000);
  console.log('  -> Derived host payout verified: 10,000 - 1,000 = 9,000 INR.');

  // 4A. Mutating snapshots on confirmed booking must fail
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.stay_bookings
        SET commission_percent_snapshot = 0.00
        WHERE id = $1;
      `, [bookingId]);
    },
    /Historical commercial snapshot of a confirmed booking is immutable/
  );
  console.log('  -> [PASS] Mutating commission snapshot rejected.');

  // 4B. Mutating dates on confirmed booking must fail
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.stay_bookings
        SET check_in = '2026-11-12'
        WHERE id = $1;
      `, [bookingId]);
    },
    /Historical commercial snapshot of a confirmed booking is immutable/
  );
  console.log('  -> [PASS] Mutating confirmed stay dates rejected.');

  // 4C. Cancelling confirmed booking succeeds while preserving snapshots
  await db.query(`
    UPDATE public.stay_bookings
    SET status = 'cancelled'
    WHERE id = $1;
  `, [bookingId]);
  console.log('  -> [PASS] Transition to cancelled succeeded.');

  // 4D. Snapshots on cancelled booking remain protected
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.stay_bookings
        SET total_estimate = 5000.00
        WHERE id = $1;
      `, [bookingId]);
    },
    /Historical commercial snapshot of a confirmed booking is immutable/
  );
  console.log('  -> [PASS] Mutating snapshot on cancelled booking rejected.');

  // 4E. Re-confirming a cancelled booking must fail
  await assert.rejects(
    async () => {
      await db.query(`
        UPDATE public.stay_bookings
        SET status = 'confirmed'
        WHERE id = $1;
      `, [bookingId]);
    },
    /Cancelled bookings are in a terminal state and cannot be reactivated/
  );
  console.log('  -> [PASS] Re-confirming a cancelled booking rejected.');

  // --------------------------------------------------------------------------
  // STEP 5: EXECUTE PHASE 2F PRODUCTS MARKETPLACE MIGRATION
  // --------------------------------------------------------------------------
  console.log('\n[5/6] Executing Phase 2F Products Marketplace Migration...');
  const migration2FPath = path.resolve('supabase/migrations/20261103114600_phase2f_products_marketplace.sql');
  const migration2FSQL = fs.readFileSync(migration2FPath, 'utf8');

  const startTime2F = Date.now();
  await db.exec(migration2FSQL);
  console.log(`  -> Phase 2F Migration executed successfully in ${Date.now() - startTime2F}ms.`);

  // Verify Phase 2F tables & RPCs
  const checkRateLimitRes = await db.query(`
    SELECT public.check_rate_limit('test:ip:127.0.0.1', 5, 60) as allowed;
  `);
  assert.equal(checkRateLimitRes.rows[0].allowed, true);
  console.log('  -> Verified public.check_rate_limit RPC execution: allowed = true.');

  // --------------------------------------------------------------------------
  // STEP 5B: ROLE-BASED PRIVILEGE & RLS TESTS (anon, authenticated, service_role)
  // --------------------------------------------------------------------------
  console.log('\n[5B/6] Testing Role-Based Privileges (anon, authenticated, service_role)...');

  // Test as anon
  await db.exec(`SET ROLE anon;`);
  
  // Anon can read legal_terms_documents
  const anonLegalRes = await db.query(`SELECT version, title FROM public.legal_terms_documents;`);
  assert.equal(anonLegalRes.rows.length, 1);
  console.log('  -> [PASS] anon can read legal_terms_documents.');

  // Anon can read public_room_availability view
  const anonAvailRes = await db.query(`SELECT * FROM public.public_room_availability;`);
  assert.ok(Array.isArray(anonAvailRes.rows));
  console.log('  -> [PASS] anon can read public_room_availability view.');

  // Anon cannot insert into host_agreements
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.host_agreements (property_id, agreement_start, agreement_status)
        VALUES ('${pineRetreatId}', '2026-11-01', 'draft');
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] anon direct write to host_agreements rejected with permission denied.');

  // Anon cannot insert into room_availability_blocks
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.room_availability_blocks (room_unit_id, blocked_from, blocked_until, reason)
        VALUES ('${pineRoomId}', '2026-12-01', '2026-12-05', 'Test Block');
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] anon direct write to room_availability_blocks rejected with permission denied.');

  // Anon cannot insert into admin_audit_log
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.admin_audit_log (action, target_type, target_id)
        VALUES ('property_moderated', 'property', '${pineRetreatId}');
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] anon direct write to admin_audit_log rejected with permission denied.');

  // Test as authenticated
  await db.exec(`RESET ROLE;`);
  await db.exec(`SET ROLE authenticated;`);

  // Authenticated cannot insert directly into room_availability_blocks (must use RPC)
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.room_availability_blocks (room_unit_id, blocked_from, blocked_until, reason)
        VALUES ('${pineRoomId}', '2026-12-01', '2026-12-05', 'Direct Block');
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] authenticated direct write to room_availability_blocks rejected.');

  // Authenticated cannot insert directly into admin_audit_log
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.admin_audit_log (action, target_type, target_id)
        VALUES ('property_moderated', 'property', '${pineRetreatId}');
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] authenticated direct write to admin_audit_log rejected.');

  // Test as service_role
  await db.exec(`RESET ROLE;`);
  await db.exec(`SET ROLE service_role;`);

  // Service role cannot mutate room_availability_blocks directly (must use RPC)
  await assert.rejects(
    async () => {
      await db.query(`
        DELETE FROM public.room_availability_blocks;
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] service_role direct DELETE on room_availability_blocks rejected.');

  // Service role cannot delete or truncate admin_audit_log
  await assert.rejects(
    async () => {
      await db.query(`
        DELETE FROM public.admin_audit_log;
      `);
    },
    /permission denied/
  );
  console.log('  -> [PASS] service_role direct DELETE on admin_audit_log rejected.');

  await db.exec(`RESET ROLE;`);

  // --------------------------------------------------------------------------
  // STEP 6: INTENTIONALLY FAILED MIGRATION TRANSACTION ROLLBACK TEST
  // --------------------------------------------------------------------------
  console.log('\n[6/6] Testing Transaction Rollback on Intentionally Failed Migration...');

  try {
    await db.exec(`
      BEGIN;
      CREATE TABLE public._canary_rollback_test (id int);
      INSERT INTO public._canary_rollback_test VALUES (1);
      -- Force deliberate constraint violation or syntax failure
      ALTER TABLE public._canary_rollback_test ADD CONSTRAINT bogus_check CHECK (id > 100);
      COMMIT;
    `);
    assert.fail('Expected transaction to fail and rollback.');
  } catch (err) {
    console.log('  -> Intentional error caught:', err.message);
    await db.exec('ROLLBACK;');
  }

  // Verify the canary table does NOT exist
  const canaryCheck = await db.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_canary_rollback_test'
    ) as exists;
  `);
  assert.equal(canaryCheck.rows[0].exists, false, 'Canary table must NOT exist after rollback');
  console.log('  -> [PASS] Complete atomic ROLLBACK verified. Zero partial tables persisted.');

  // --------------------------------------------------------------------------
  // STEP 7: PHASE 2G & 2H PENDING MIGRATION EXECUTION & RLS VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n[7/7] Testing Phase 2G/2H Pending Migration in Isolated PostgreSQL...');

  const phase2g2hSqlPath = path.resolve('supabase/migrations/20261103140000_phase2g_2h_productions_community_pending_approval.sql');
  const phase2g2hSql = fs.readFileSync(phase2g2hSqlPath, 'utf8');

  await db.exec(phase2g2hSql);
  console.log('  -> [PASS] Migration SQL executed with zero errors.');

  // Verify all 6 tables exist
  const tablesCheck = await db.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('filmmaker_profiles', 'production_proposals', 'community_initiatives', 'community_participations', 'community_stories', 'user_notifications')
    ORDER BY table_name;
  `);
  assert.equal(tablesCheck.rows.length, 6, 'All 6 Phase 2G/2H tables must exist');
  console.log('  -> [PASS] Verified all 6 tables created:', tablesCheck.rows.map(r => r.table_name).join(', '));

  // Test Community Story consent constraint
  await assert.rejects(
    async () => {
      await db.query(`
        INSERT INTO public.community_stories (
          author_name, author_role, village, valley, title, excerpt, content, consent_given
        ) VALUES (
          'Test Author', 'Tester', 'Jari', 'Parvati', 'Unconsented Story', 'Short excerpt', 'Content', false
        );
      `);
    },
    /check constraint/i
  );
  console.log('  -> [PASS] Mandatory participant consent constraint strictly enforced on community_stories.');

  // Test valid insert
  await db.query(`
    INSERT INTO public.community_stories (
      author_name, author_role, village, valley, title, excerpt, content, consent_given, status
    ) VALUES (
      'Test Author', 'Tester', 'Jari', 'Parvati', 'Consented Story', 'Valid excerpt', 'Content of consented story', true, 'published'
    );
  `);
  console.log('  -> [PASS] Valid community story with explicit consent accepted.');

  console.log('\n============================================================');
  console.log('ALL 7 ISOLATED DATABASE VERIFICATION STAGES PASSED CLEANLY!');
  console.log('============================================================');
}

runIsolatedTests().catch(err => {
  console.error('\n[FATAL ERROR in Isolated Test Runner]:', err);
  process.exit(1);
});
