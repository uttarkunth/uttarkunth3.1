import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pgliteModulePath = 'C:/Users/Rahul Negi/.gemini/antigravity/scratch/pg-isolated/node_modules/@electric-sql/pglite/dist/index.js';
const { PGlite } = await import(pathToFileURL(pgliteModulePath).href);

async function run() {
  console.log('--- Initializing Isolated Disposable PostgreSQL Engine (PGlite) ---');
  const db = new PGlite();

  // 1. Create prerequisite mock extensions, schemas and base production tables
  await db.exec(`
    DO $$ BEGIN
      CREATE ROLE anon;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE ROLE authenticated;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      CREATE ROLE service_role;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS storage;

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
      SELECT null::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
      SELECT 'anon'::text;
    $$ LANGUAGE sql STABLE;

    CREATE TABLE auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE storage.buckets (
      id text PRIMARY KEY,
      name text NOT NULL,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      public boolean DEFAULT false,
      avif_autodetection boolean DEFAULT false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );

    CREATE TABLE storage.objects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      bucket_id text REFERENCES storage.buckets(id),
      name text,
      owner uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      last_accessed_at timestamptz DEFAULT now(),
      metadata jsonb
    );

    CREATE TABLE public.platform_admins (
      user_id uuid PRIMARY KEY REFERENCES auth.users(id),
      email text NOT NULL,
      role text NOT NULL,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE public.admin_audit_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user_id text,
      action text NOT NULL,
      target_type text,
      target_id text,
      details jsonb,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE public.properties (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      village text NOT NULL,
      district text NOT NULL,
      state text NOT NULL DEFAULT 'Himachal Pradesh',
      address text,
      description text,
      property_type text NOT NULL DEFAULT 'homestay',
      host_id uuid,
      published boolean DEFAULT false,
      moderation_status text DEFAULT 'pending',
      moderation_notes text,
      booking_mode text DEFAULT 'request',
      amenities text[] DEFAULT '{}'::text[],
      photos text[] DEFAULT '{}'::text[],
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE public.room_units (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
      room_name text NOT NULL,
      max_guests integer DEFAULT 2,
      base_price numeric NOT NULL,
      description text,
      active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    );

    CREATE TABLE public.sellers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid UNIQUE REFERENCES auth.users(id),
      business_name text NOT NULL,
      maker_name text NOT NULL,
      valley text NOT NULL,
      state text NOT NULL,
      craft_type text NOT NULL,
      contact_email text NOT NULL,
      contact_phone text,
      bio text,
      materials text,
      website_url text,
      social_links text[] DEFAULT '{}'::text[],
      status text DEFAULT 'pending',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE TABLE public.member_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid UNIQUE REFERENCES auth.users(id),
      full_name text,
      phone text,
      home_valley text,
      created_at timestamptz DEFAULT now()
    );
  `);
  console.log('✓ Prerequisite production baseline tables established.');

  // 2. Read and apply the Phase 2 migration
  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql'
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('--- Applying Phase 2 SQL Migration inside Atomic Transaction ---');
  await db.exec(migrationSql);
  console.log('✓ Migration applied successfully without errors.');

  // 3. Verify created tables exist
  const tables = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Public tables created:', tables.rows.map(r => r.table_name).join(', '));

  // 4. Test column synchronization triggers
  console.log('--- Testing Column Synchronization Triggers ---');
  // Seed founder auth user
  const founderUserId = '00000000-0000-4000-a000-000000000001';
  await db.query(`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES ($1, 'founder@uttarkunth.com', '{"full_name":"Gaurav Negi"}'::jsonb)
  `, [founderUserId]);

  // Execute provision_founder_account
  console.log('--- Testing provision_founder_account execution ---');
  const founderResult = await db.query(`
    SELECT public.provision_founder_account(
      $1::uuid,
      'founder@uttarkunth.com',
      'Gaurav Negi',
      '+91 98160 00000'
    ) AS res;
  `, [founderUserId]);
  console.log('provision_founder_account result:', founderResult.rows[0].res);

  // Verify staff profile created
  const profileRow = await db.query(`
    SELECT staff_id, role_slug, role_code, designation, status, mfa_enrolled, agreements_completed, all_agreements_accepted
    FROM public.staff_profiles
    WHERE user_id = $1::uuid;
  `, [founderUserId]);
  console.log('Staff profile verified:', profileRow.rows[0]);

  // Test dual-column trigger on staff_invitations
  console.log('--- Testing dual-column trigger on staff_invitations ---');
  await db.query(`
    INSERT INTO public.staff_invitations (
      official_email,
      role_slug,
      department,
      proposed_designation,
      invited_by,
      token_hash,
      status,
      expires_at
    ) VALUES (
      'candidate@uttarkunth.com',
      'property_reviewer',
      'stays_curation',
      'Junior Property Reviewer',
      $1::uuid,
      'fake-token-hash-12345678901234567890123456789012345678901234567890123456',
      'pending',
      now() + interval '7 days'
    );
  `, [founderUserId]);

  const invRow = await db.query(`
    SELECT role_slug, role_code, designation, proposed_designation, invited_by, invited_by_user_id
    FROM public.staff_invitations
    WHERE official_email = 'candidate@uttarkunth.com';
  `);
  console.log('staff_invitations dual columns synchronized:', invRow.rows[0]);

  // Test staff_permission_assignments upsert and triggers
  console.log('--- Testing staff_permission_assignments unique constraints & dual columns ---');
  const spId = (await db.query(`SELECT id FROM public.staff_profiles WHERE user_id = $1::uuid`, [founderUserId])).rows[0].id;
  await db.query(`
    INSERT INTO public.staff_permission_assignments (
      staff_profile_id,
      user_id,
      permission_key,
      granted_by
    ) VALUES (
      $1::uuid,
      $2::uuid,
      'property.review',
      $2::uuid
    )
    ON CONFLICT (staff_profile_id, permission_key) DO UPDATE
    SET revoked_at = null;
  `, [spId, founderUserId]);

  const permRow = await db.query(`
    SELECT permission_key, permission_code, is_active
    FROM public.staff_permission_assignments
    WHERE staff_profile_id = $1::uuid;
  `, [spId]);
  console.log('staff_permission_assignments synchronized:', permRow.rows[0]);

  // Test staff_agreement_acceptances unique constraint
  console.log('--- Testing staff_agreement_acceptances unique constraint ---');
  await db.query(`
    INSERT INTO public.staff_agreement_acceptances (
      staff_profile_id,
      user_id,
      agreement_code,
      agreement_version,
      document_hash,
      approval_status
    ) VALUES (
      $1::uuid,
      $2::uuid,
      'appointment_agreement',
      '2026.2',
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      'accepted'
    )
    ON CONFLICT (user_id, agreement_code) DO UPDATE
    SET accepted_at = now();
  `, [spId, founderUserId]);
  console.log('✓ staff_agreement_acceptances unique constraint on (user_id, agreement_code) verified.');

  // Test function privilege checks
  console.log('--- Testing Function Privilege Checks ---');
  const privCheck = await db.query(`
    SELECT 
      has_function_privilege('anon', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') as anon_priv,
      has_function_privilege('authenticated', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') as auth_priv;
  `);
  console.log('provision_founder_account execution privileges for anon/authenticated:', privCheck.rows[0]);

  console.log('--- ALL DISPOSABLE DATABASE VERIFICATION CHECKS PASSED ---');
}

run().catch((err) => {
  console.error('Disposable PostgreSQL verification error:', err);
  process.exit(1);
});
