# UTTARKUNTH 3.1 — CONTROLLED DATABASE MIGRATION PREFLIGHT, TESTING & PRODUCTION EXECUTION PLAN

## 1. Executive Summary & Live Remote State Verification

Before executing any DDL against the live Supabase project (`https://xyplgugxpmlnjsvlosdg.supabase.co`), a complete read-only preflight inspection was performed against the live PostgreSQL database (`supabase_migrations.schema_migrations`, `auth.users`, `pg_policies`, `information_schema.columns`, `storage.buckets`):

| Migration File | Status on Live Remote (`xyplgugxpmlnjsvlosdg`) | Verification Proof |
| :--- | :--- | :--- |
| `20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql` | **NOT APPLIED** (`0 / 16` tables present) | Live `supabase_migrations.schema_migrations` ends at `20261103114600` (`phase2f_products_marketplace`). None of the 16 Phase 2 tables exist yet. |
| `20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql` | **NOT APPLIED** (`0 / 1` new tables, `1 / 6` buckets) | Live `public.properties` currently has a `RESTRICTIVE` policy `"Restrict direct property table reads"` granted to `["anon","authenticated"]` that directly queries `public.property_hosts`, causing `42501: permission denied for table property_hosts` for anonymous visitors. `20261105120000` drops this policy and replaces it with `public.is_property_host()` (`SECURITY DEFINER`). |

---

## 2. Phase A — Line-by-Line Preflight Audit & Defects Remediated Before Production

Rather than assuming the generated SQL files were safe, we audited every `CREATE`, `ALTER`, `DROP`, `INSERT`, `REVOKE`, `GRANT`, `SECURITY DEFINER` function, trigger, and `FORCE ROW LEVEL SECURITY` statement against the live database and Next.js API routes. **12 critical preflight issues were caught and remediated in the migration files before production execution:**

1. **`property_hosts.status` Missing Column (`20261105120000` Section 1)**:
   - *Finding*: `public.is_property_host(p_property_id, p_user_id)` referenced `COALESCE(ph.status, 'active') = 'active'`, but `public.property_hosts` (created in `20261022_booking_foundation.sql`) only had `(id, property_id, user_id, created_at, role)`.
   - *Fix Applied*: Added `ALTER TABLE public.property_hosts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'inactive'));` immediately before `CREATE OR REPLACE FUNCTION public.is_property_host(...)`.
2. **Dynamic Cleanup of Legacy `property_hosts` RLS Policies (`20261105120000` Section 4)**:
   - *Finding*: Live `anon` queries to `public.properties` and `public.room_units` currently fail with `42501: permission denied for table property_hosts` because the live `RESTRICTIVE` policy `"Restrict direct property table reads"` on `public.properties` and `"Hosts manage their own properties"` directly query `public.property_hosts`.
   - *Fix Applied*: Added a `DO $$` block plus explicit `DROP POLICY IF EXISTS` statements that remove `"Restrict direct property table reads"`, `"Hosts manage their own properties"`, and `"Authorized hosts and admins can view availability blocks"` and replace them with clean policies backed by `public.is_property_host(id, auth.uid())` (`SECURITY DEFINER`).
3. **`FORCE ROW LEVEL SECURITY` Safety for `SECURITY DEFINER` Functions & Security Views (`20261105120000` Section 7)**:
   - *Finding*: In Supabase PostgreSQL, `postgres` is the owner of tables, views (`public_room_availability`, `public_member_profiles`), and `SECURITY DEFINER` functions (`is_platform_admin_for_user`, `is_property_host`, `has_staff_permission_for_user`, `respond_to_stay_booking`, `set_room_availability_block`). Enabling `FORCE ROW LEVEL SECURITY` forces the table owner (`postgres`) to pass RLS policies.
   - *Fix Applied*: Added an explicit `"service_and_definer_internal_access"` policy (`FOR ALL TO postgres, supabase_admin, service_role USING (true) WITH CHECK (true)`) across all 39 RLS-forced tables so `anon` and `authenticated` remain strictly constrained by RLS while `SECURITY DEFINER` RPCs, security views, and `service_role` server operations never break.
4. **Unifying `is_platform_admin_for_user(uuid)` Alongside `is_platform_admin()` (`20261105120000` Section 3)**:
   - *Finding*: All Stays concurrency RPCs (`respond_to_stay_booking`, `set_room_availability_block`, `delete_room_availability_block`, `terminate_host_agreement`) call the 1-argument helper `public.is_platform_admin_for_user(p_actor_user_id)`.
   - *Fix Applied*: Updated `public.is_platform_admin_for_user(uuid)` to evaluate active, Founder-approved `public.staff_profiles` as well as `public.platform_admins`, and delegated `public.is_platform_admin()` to `public.is_platform_admin_for_user(auth.uid())`.
5. **Reconciling `platform_admins` Service-Role Sync Grants (`20261105120000` Section 3)**:
   - *Finding*: When the Founder approves or terminates a staff member in `/api/admin/staff`, `adminClient` (`service_role`) syncs `public.platform_admins`.
   - *Fix Applied*: Granted `SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_admins TO service_role` while keeping `PUBLIC, anon, authenticated` completely revoked.
6. **Moderation Guard Trigger Compatibility with Next.js `createAdminClient()` (`20261105120000` Section 5)**:
   - *Finding*: `/api/admin/properties`, `/api/admin/products`, `/api/admin/productions`, and `/api/admin/community` verify staff RBAC + AAL2 MFA in Next.js and execute database writes using `createAdminClient()` (`service_role`).
   - *Fix Applied*: Updated all 4 moderation triggers (`enforce_property_moderation_guard`, `enforce_seller_status_immutability`, `enforce_product_moderation_lifecycle`, `enforce_filmmaker_status_immutability`) to recognize `service_role` across all PostgREST/Supabase GUC conventions as well as `public.is_platform_admin()`.
7. **`public.profiles` & `public.public_member_profiles` Reconciliation (`20261104120000` Section 0)**:
   - *Finding*: `/api/account/profile` upserts `email`, `address`, `location`, `mountain_interests`, and `contact_verified` into `public.profiles`.
   - *Fix Applied*: Added those columns to `public.profiles` and configured `public.public_member_profiles` with `WITH (security_invoker = false)` so public pages can read non-sensitive display names without granting `anon` access to `public.profiles`.
8. **`public.staff_profiles` & `public.staff_invitations` Columns & `CHECK` Constraints (`20261104120000` Section 1)**:
   - *Finding*: `/api/admin/staff` updates `approved_by`, `approved_at`, `moderation_notes`, and sets `status` to `'info_requested'` or `'under_review'`.
   - *Fix Applied*: Added `approved_by`, `approved_at`, `moderation_notes`, `resource_scope`, `region_scope`, and expanded the `status` and `employment_category` `CHECK` constraints to cover all application values.
9. **`public.staff_permission_assignments` & `public.staff_audit_log` Columns (`20261104120000` Section 1)**:
   - *Finding*: `lib/staff-rbac.ts` queries `expires_at` and `grant_type IN ('allow', 'grant', 'revoke')` on `staff_permission_assignments`, and inserts `result`, `before_state`, `after_state`, `target_user_id`, and `target_staff_id` into `staff_audit_log`.
   - *Fix Applied*: Added `expires_at`, `'grant'` to `grant_type`, and `result`, `before_state`, `after_state`, `target_user_id`, `target_staff_id` to `staff_audit_log`.
10. **Seller Verification Extended Columns (`20261104120000` Section 2)**:
    - *Finding*: `/api/products/apply` and `/api/admin/products` write extended seller fields (`business_constitution`, `primary_category`, `secondary_categories`, `tax_registration_status`, `document_reference_number`, `expiry_date`, `reviewer_user_id`).
    - *Fix Applied*: Added all extended columns to `public.sellers`, `public.seller_verification_documents`, and `public.seller_verification_checks`.
11. **Storage Bucket Folder-Depth Compatibility (`20261105120000` Section 8)**:
    - *Finding*: Upload paths may use either `<uid>/<file>` (`foldername[1]`) or `<prefix>/<uid>/<file>` (`foldername[2]`).
    - *Fix Applied*: Updated `storage.objects` policies on `seller-verification-docs`, `staff-hr-docs`, `host-verification-docs`, `production-private-docs`, and `community-private-docs` to accept `(storage.foldername(name))[1] = auth.uid()::text OR (storage.foldername(name))[2] = auth.uid()::text` or AAL2-verified staff (`public.is_platform_admin() AND public.current_session_is_aal2()`).
12. **Confirmed Founder Provisioning & UUID-Anchored Email Change Sync (`20261104120000` Section 3)**:
    - *Fix Applied*: Updated `public.provision_founder_account()` to verify `email_confirmed_at IS NOT NULL`, enforce single Founder uniqueness, set `designation = 'Founder & Chief Executive'`, and added `public.sync_auth_user_email_change()` (`AFTER UPDATE OF email ON auth.users`) so future Founder/Staff email changes synchronize `staff_profiles.official_email`, `platform_admins.email`, and `profiles.email` by `user_id` without resetting permissions.

---

## 3. Phase C — Production Migration Plan (Awaiting Explicit Founder Approval)

### A. Pre-Execution Backup Verification
1. Open **Supabase Dashboard → Project `xyplgugxpmlnjsvlosdg` → Database → Backups** and confirm the latest automated daily backup or trigger a manual snapshot before running any SQL.
2. Both migrations run inside atomic `BEGIN; ... COMMIT;` blocks: if any statement fails, PostgreSQL rolls back 100% of the transaction automatically.
3. Zero rows in `properties` (*Yash Home Stay*, *Wonderway Retreat*), `room_units` (2 room units), `stay_bookings`, `host_agreements`, `platform_admins`, `sellers`, `products`, or `auth.users` are deleted, truncated, or overwritten.

### B. Exact Execution Order
1. **Step 1**: Execute `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql` in the Supabase SQL Editor.
2. **Step 2**: Execute `supabase/migrations/20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql` in the Supabase SQL Editor.
3. **Step 3**: Bootstrap the confirmed Founder profile (`uttarkunth@gmail.com`, verified Supabase Auth UUID `28ba1250-9e0c-4daf-9348-0484175646ba`, `UK-STAFF-2026-0001`, `Founder & Chief Executive`) by running:
   ```sql
   SELECT public.provision_founder_account(
     '28ba1250-9e0c-4daf-9348-0484175646ba'::uuid,
     'uttarkunth@gmail.com',
     'Founder & Chief Executive',
     NULL
   );
   ```
   - **Strict Identity Guarantee**: Uses ONLY the exact confirmed Supabase Auth account `uttarkunth@gmail.com` (`id = '28ba1250-9e0c-4daf-9348-0484175646ba'`, `email_confirmed_at = '2026-11-04T13:21:46.755987+00:00'`). Never selects by `created_at`, never promotes `gauravnegi748@gmail.com` or `info@uttarkunth.com`, and prevents duplicate Founder records.
   - **UUID-Anchored Email Change Support**: Founder permissions are anchored strictly to `user_id` (`28ba1250-9e0c-4daf-9348-0484175646ba`). When the Founder changes their login email via `POST /api/account/security/email` (requiring active Founder session + `aal2` TOTP MFA + password re-authentication + Supabase email confirmation), `trg_sync_auth_user_email_change` on `auth.users` automatically updates `staff_profiles.official_email`, `platform_admins.email`, and `profiles.email` by `user_id` and writes an immutable entry to `staff_audit_log`.
4. **Step 4**: Sign in at `admin.uttarkunth.com/staff/login` as `uttarkunth@gmail.com` and complete TOTP Authenticator (`aal2`) enrollment.
