# Database & Row-Level Security (RLS) Policy Audit (`docs/security/RLS_POLICY_AUDIT.md`)

- **Supabase Project**: `https://xyplgugxpmlnjsvlosdg.supabase.co`
- **Audit Scope**: Complete inspection of all live tables/views in `public` schema + all migration files in `supabase/migrations/`.

---

## 1. Live Database vs. Repository Migration Status Matrix

Every table and view required by Uttarkunth 3.1 was probed non-destructively against the live Supabase project (`xyplgugxpmlnjsvlosdg`) using the publishable key (`anon` role) and cross-referenced against the repository's SQL migrations:

| # | Table / View Name | Domain | Exists in Live DB? | Live `anon` Probe Result | RLS Enabled? | RLS Forced? | Migration Source |
| :-: | :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| 1 | `destinations` | Stays | **YES** (22 rows) | `200 OK` (Public read of active destinations) | YES | NO | Base schema + `20261103114500` |
| 2 | `properties` | Stays | **YES** | **`401 (42501)`** `permission denied for table property_hosts` | YES | NO | Base schema + `20261103114500` |
| 3 | `room_units` | Stays | **YES** | **`401 (42501)`** `permission denied for table property_hosts` | YES | NO | Base schema + `20261103114500` |
| 4 | `stay_bookings` | Stays | **YES** (0 visible to `anon`) | `200 OK` (`[]` — blocked for `anon`) | YES | NO | Base schema + `20261103114500` |
| 5 | `booking_requests` | Stays | **YES** (0 visible to `anon`) | `200 OK` (`[]` — blocked for `anon`) | YES | NO | Base schema + `20261103114500` |
| 6 | `booking_rate_limits` | Stays / Security | **YES** | `401 (42501)` (`REVOKE ALL FROM anon, authenticated`) | YES | NO | Base schema + `20261103114500` |
| 7 | `property_hosts` | Stays | **YES** | `401 (42501)` (`REVOKE ALL FROM anon`) | YES | NO | Base schema + `20261103114500` |
| 8 | `host_agreements` | Stays | **YES** | `401 (42501)` (`REVOKE ALL FROM anon`) | YES | NO | Base schema + `20261103114500` |
| 9 | `room_availability_blocks` | Stays | **YES** | `200 OK` (`[]` — scoped to published rooms) | YES | NO | Base schema + `20261103114500` |
| 10 | `admin_audit_log` | Governance | **YES** | `401 (42501)` (`REVOKE ALL FROM anon, authenticated`) | YES | NO | Base schema + `20261103114500` |
| 11 | `platform_admins` | Legacy Admin | **YES** | `401 (42501)` (`REVOKE ALL FROM anon, authenticated`) | YES | NO | Base schema + `20261103114500` |
| 12 | `sellers` | Products | **YES** | `200 OK` (`[]` — only `status = 'approved'` visible) | YES | NO | `20261103114600_phase2f` |
| 13 | `products` | Products | **YES** | `200 OK` (`[]` — only `published = true AND moderation_status = 'approved'`) | YES | NO | `20261103114600_phase2f` |
| 14 | `product_interests` | Products | **YES** | `200 OK` (`[]` — blocked for `anon`) | YES | NO | `20261103114600_phase2f` |
| 15 | `rate_limits` | Security | **YES** | `200 OK` (`[]` — no policies, service_role only) | YES | NO | `20261103114600_phase2f` |
| 16 | `filmmaker_profiles` | Productions | **YES** | `200 OK` (`[]` — only `status = 'approved'`) | YES | NO | `20261103140000_phase2g_2h` |
| 17 | `production_proposals` | Productions | **YES** | `200 OK` (`[]` — private to filmmaker & staff) | YES | NO | `20261103140000_phase2g_2h` |
| 18 | `community_initiatives` | Community | **YES** | `200 OK` (`[]` — only `published = true`) | YES | NO | `20261103140000_phase2g_2h` |
| 19 | `community_participations` | Community | **YES** | `200 OK` (`[]` — private to applicant & staff) | YES | NO | `20261103140000_phase2g_2h` |
| 20 | `community_stories` | Community | **YES** | `200 OK` (`[]` — only `published = true AND moderation_status = 'approved'`) | YES | NO | `20261103140000_phase2g_2h` |
| 21 | `user_notifications` | Account | **YES** | `200 OK` (`[]` — private to `auth.uid() = user_id`) | YES | NO | `20261103140000_phase2g_2h` |
| 22 | `profiles` | Identity | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 23 | `public_member_profiles` (View) | Identity | **NO (`PGRST205`)** | Pending Phase 2 migration application | View (`security_invoker`) | N/A | `20261104120000_phase2` |
| 24 | `staff_roles` | Staff RBAC | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 25 | `staff_permissions` | Staff RBAC | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 26 | `staff_role_permissions` | Staff RBAC | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 27 | `staff_invitations` | Staff RBAC | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 28 | `staff_profiles` | Staff RBAC | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 29 | `staff_permission_assignments` | Staff RBAC | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 30 | `staff_documents` | Staff HR | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 31 | `staff_agreements` | Staff HR | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 32 | `staff_agreement_acceptances` | Staff HR | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 33 | `staff_employment_history` | Staff HR | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 34 | `staff_dual_approvals` | Governance | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 35 | `staff_audit_log` | Governance | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 36 | `seller_verification_documents` | Products | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 37 | `seller_verification_checks` | Products | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |
| 38 | `marketplace_category_requirements` | Products | **NO (`PGRST205`)** | Pending Phase 2 migration application | YES (in SQL) | NO | `20261104120000_phase2` |

> **Note on Naming Conventions**:
> - In the Uttarkunth schema, rooms are stored in `public.room_units` (not `rooms`), stay reservations are stored in `public.stay_bookings` and `public.booking_requests` (not `bookings`), property host assignments are stored in `public.property_hosts` (not `hosts`), product buyer inquiries are stored in `public.product_interests` (not `orders`), and community participation records are stored in `public.community_participations` (not `community_members`). Reviews do not yet have a dedicated `public.reviews` table in live DB; Phase 4 migration will add `public.reviews` with strict verified-stay/moderation RLS.

---

## 2. Detailed 10-Point Audit Per Table

Below is the 10-point evaluation for each table group across the Uttarkunth 3.1 database:

### Group 1: Identity & Member Profiles (`profiles`, `public_member_profiles`)
1. **Is RLS enabled?** Yes (`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`).
2. **Is RLS forced?** Currently **No** in `20261104120000_phase2` — **Recommendation**: Add `ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;`.
3. **Which database roles have access?** `authenticated` has `SELECT, INSERT, UPDATE` on `profiles`; `anon` and `authenticated` have `SELECT` on `public_member_profiles` view (`security_invoker = true`).
4. **SELECT policies**: `profiles_select_own_or_staff`: `auth.uid() = id OR public.is_active_staff_for_user(auth.uid())`.
   - **Audit Finding**: `public_member_profiles` is defined with `WITH (security_invoker = true)` over `public.profiles`. Because `anon` has no `SELECT` policy on `public.profiles` (and shouldn't be able to read `email`, `phone`, or `address` from `profiles`), querying `public_member_profiles` as `anon` or as another member returns 0 rows unless a safe `SECURITY DEFINER` function or column-restricted grant is used.
5. **INSERT policies**: `profiles_insert_own`: `WITH CHECK (auth.uid() = id)`.
6. **UPDATE policies**: `profiles_update_own`: `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`.
7. **DELETE policies**: None (deletion restricted to `service_role`).
8. **Can an unauthorized user access another user's data?** No — `profiles` is strictly locked to `auth.uid() = id`.
9. **Can a user modify their own authorization or role?** No — `profiles` contains no role/privilege columns; staff authorization lives exclusively in `public.staff_profiles`.
10. **Can an ordinary user access administrative data?** No.

---

### Group 2: Stays Pillar (`properties`, `room_units`, `stay_bookings`, `booking_requests`, `property_hosts`, `host_agreements`, `room_availability_blocks`, `destinations`)
1. **Is RLS enabled?** Yes on all 8 tables in live DB.
2. **Is RLS forced?** Currently **No** — **Recommendation**: Enable `FORCE ROW LEVEL SECURITY` on `property_hosts`, `host_agreements`, `stay_bookings`, and `booking_requests`.
3. **Which database roles have access?**
   - `destinations`: `anon, authenticated` (`SELECT`).
   - `properties`, `room_units`, `room_availability_blocks`: `anon, authenticated` (`SELECT`), `authenticated` (`INSERT, UPDATE` for hosts).
   - `property_hosts`, `host_agreements`: `REVOKE ALL FROM anon, public`; `authenticated` has `SELECT` (and `UPDATE` on `host_agreements` for accepting pending agreements).
   - `stay_bookings`, `booking_requests`: `REVOKE ALL FROM anon, public`; `authenticated` has `SELECT` (for assigned hosts).
4. **SELECT policies**:
   - **Defect Found on Live DB (`[HIGH-01]`)**: On `public.properties` and `public.room_units`, a live RLS policy references `public.property_hosts` without restricting the policy `TO authenticated` or using a `SECURITY DEFINER` function. Because `anon` has no `SELECT` privilege on `property_hosts`, **every `anon` query to `properties` or `room_units` fails with `42501: permission denied for table property_hosts`**.
   - `property_hosts`: `user_id = auth.uid() OR public.is_platform_admin()`.
   - `host_agreements`: `host_user_id = auth.uid() OR public.is_platform_admin()`.
   - `stay_bookings` & `booking_requests`: Assigned property hosts (`property_hosts.user_id = auth.uid()`) or platform admins.
5. **INSERT policies**:
   - `properties`: Authenticated hosts can submit draft properties (`moderation_status = 'pending_review' AND published = false`).
   - `stay_bookings` & `booking_requests`: Direct client `INSERT` is blocked (`REVOKE INSERT FROM anon, authenticated`); all bookings must pass through `/api/bookings/request` server-side validation.
6. **UPDATE policies**:
   - `properties`: Hosts can update their own property details, **Wait — Audit Check**: Can a host set `published = true` or `moderation_status = 'approved'` via direct client `UPDATE` on `public.properties`?
   - **Vulnerability Checked**: If a host updates `public.properties` directly via Supabase client, a `BEFORE UPDATE` trigger or strict `WITH CHECK` must prevent non-staff users from changing `moderation_status` to `'approved'` or `published` to `true` without an approved `host_agreements` row and staff moderation approval! We will add a database trigger `enforce_property_moderation_guard()` in Phase 4 to guarantee hosts cannot self-approve or self-publish properties via direct PostgREST calls.
   - `host_agreements`: Locked by `host_agreements_accept_own_pending` (`status = 'accepted'`) + `enforce_host_agreement_acceptance_only` trigger (prevents modifying `commission_rate` or `property_id`).
7. **DELETE policies**: Restricted to `service_role` / platform admins (except hosts managing their own `room_availability_blocks`).
8. **Can an unauthorized user access another user's data?** No — Guest PII in `stay_bookings` and `booking_requests` is hidden from `anon` and from other guests, and visible only to the verified host of that specific property and authorized `stays` staff.
9. **Can a user modify their own authorization or role?** No — `property_hosts` has no `INSERT`/`UPDATE` policy for ordinary users.
10. **Can an ordinary user access administrative data?** No — `host_agreements` is visible only to the specific `host_user_id`.

---

### Group 3: Products Marketplace Pillar (`sellers`, `products`, `product_interests`, `seller_verification_documents`, `seller_verification_checks`, `marketplace_category_requirements`)
1. **Is RLS enabled?** Yes on all tables.
2. **Is RLS forced?** Currently **No** — **Recommendation**: Force RLS on `sellers`, `products`, `product_interests`, `seller_verification_documents`, and `seller_verification_checks`.
3. **Which database roles have access?**
   - `sellers`, `products`: `anon, authenticated` (`SELECT` approved/published rows); `authenticated` (`INSERT, UPDATE` own rows).
   - `product_interests`: `authenticated` (`SELECT` for owning seller); `INSERT` via server API.
   - `seller_verification_documents`: `authenticated` (`SELECT, INSERT` own rows + `products` staff).
   - `seller_verification_checks`: `service_role` and `products` staff only.
4. **SELECT policies**:
   - `sellers`: `status = 'approved'` (public) OR `auth.uid() = user_id` (own) OR `is_platform_admin()` / `has_staff_permission_for_user(auth.uid(), 'products.sellers.view')`.
   - **Audit Check on `sellers` PII**: When `status = 'approved'`, the public `SELECT` policy on `public.sellers` allows reading the row. While `sellers` only holds business profile fields (and private verification documents live in `seller_verification_documents`), `email` and `phone` on `sellers` are business contact fields; sensitive tax/identity numbers (`gst_number`, `pan_number`, `fssai_license_number`) added in Phase 2 should be protected from public scraping via a public directory view or column restriction.
   - `products`: `(published = true AND moderation_status = 'approved')` OR owning seller OR `products` staff.
   - `seller_verification_documents`: `auth.uid() = user_id` OR `has_staff_permission_for_user(auth.uid(), 'products.sellers.view')`.
5. **INSERT policies**:
   - `sellers`: `auth.uid() = user_id AND status = 'pending'`.
   - `products`: Owning approved seller with `published = false AND moderation_status = 'pending_review'`.
   - `seller_verification_documents`: `auth.uid() = user_id`.
6. **UPDATE policies**:
   - `sellers`: `sellers_update_own` (`auth.uid() = user_id`).
   - **Audit Finding**: In `20261103114600_phase2f_products_marketplace.sql` (lines 118–121), `sellers_update_own` has `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` **without a trigger blocking a seller from updating their own `status = 'approved'` or `verification_stage = 'approved'`** via direct PostgREST `PATCH /rest/v1/sellers`!
   - Similarly, `products_update_own_seller` (lines 154–166) has `WITH CHECK` that checks `sellers.user_id = auth.uid()` **without blocking the seller from setting `published = true` or `moderation_status = 'approved'` on UPDATE**!
   - **Recommended Fix**: Add database `BEFORE UPDATE` triggers `enforce_seller_status_immutability()` and `enforce_product_moderation_immutability()` in Phase 4 so non-staff users can never self-approve their seller account or self-publish a product via direct Supabase client calls.
7. **DELETE policies**: Admin/staff only.
8. **Can an unauthorized user access another user's data?** No — `product_interests` and `seller_verification_documents` are isolated to the owner.
9. **Can a user modify their own authorization or role?** Without the `BEFORE UPDATE` trigger noted in #6, an authenticated seller could attempt a direct PostgREST `PATCH` to change `sellers.status` to `'approved'`. Adding the trigger closes this vector completely.
10. **Can an ordinary user access administrative data?** No.

---

### Group 4: Productions & Community Pillars (`filmmaker_profiles`, `production_proposals`, `community_initiatives`, `community_participations`, `community_stories`, `user_notifications`)
1. **Is RLS enabled?** Yes on all 6 tables in live DB.
2. **Is RLS forced?** Currently **No** — **Recommendation**: Force RLS on all 6 tables.
3. **SELECT policies**:
   - `filmmaker_profiles`: `status = 'approved'` OR `auth.uid() = user_id` OR staff.
   - `production_proposals`: Strictly private (`auth.uid() = user_id` OR `productions` staff). Public visitors cannot read film proposals or budgets.
   - `community_initiatives`: `published = true` OR `community` staff.
   - `community_participations`: Strictly private (`auth.uid() = user_id` OR `community` staff).
   - `community_stories`: `(published = true AND moderation_status = 'approved')` OR `auth.uid() = user_id` OR `community` staff.
   - `user_notifications`: Strictly private (`auth.uid() = user_id`).
4. **INSERT / UPDATE / DELETE policies**:
   - Direct client mutations are restricted; `filmmaker_profiles_update_own` allows updating own profile — we will also add a `BEFORE UPDATE` trigger preventing self-approval of `filmmaker_profiles.status`.

---

### Group 5: Staff Governance, RBAC & Immutable Audit Tables (`staff_roles`, `staff_permissions`, `staff_role_permissions`, `staff_invitations`, `staff_profiles`, `staff_permission_assignments`, `staff_documents`, `staff_agreements`, `staff_agreement_acceptances`, `staff_employment_history`, `staff_dual_approvals`, `staff_audit_log`, `admin_audit_log`)
1. **Is RLS enabled?** Yes on all 13 tables in `20261104120000_phase2`.
2. **Is RLS forced?** Currently **No** — **Recommendation**: Enable `FORCE ROW LEVEL SECURITY` on all 13 tables.
3. **Which database roles have access?**
   - `REVOKE ALL FROM anon, public` on all sensitive staff tables (`staff_invitations`, `staff_profiles`, `staff_permission_assignments`, `staff_documents`, `staff_agreement_acceptances`, `staff_employment_history`, `staff_dual_approvals`, `staff_audit_log`, `admin_audit_log`).
   - Only `authenticated` has `SELECT` on `staff_roles`, `staff_permissions`, `staff_role_permissions`, `staff_agreements`, `staff_profiles` (own row or `staff.System.view`), and `staff_agreement_acceptances` (own row or `staff.System.view`).
4. **SELECT / INSERT / UPDATE / DELETE policies**:
   - **Zero client-side INSERT/UPDATE/DELETE policies exist on `staff_profiles`, `staff_invitations`, `staff_permission_assignments`, `staff_employment_history`, `staff_dual_approvals`, `staff_audit_log`, or `admin_audit_log`**.
   - Even an authenticated staff member or Founder cannot mutate `staff_profiles` or `staff_permission_assignments` directly from the browser using the publishable key — all governance mutations must pass through server-side API routes (`POST /api/admin/staff`, `POST /api/staff/onboard`) or `SECURITY DEFINER` RPC functions (`provision_founder_account`).
   - **Immutability Triggers**: `trg_admin_audit_log_immutable` and `trg_staff_audit_log_immutable` execute `public.prevent_audit_log_mutation()`, raising an exception on any `UPDATE` or `DELETE` even if executed by `service_role`!
5. **Can a user modify their own authorization or role?** **No** — `staff_profiles` and `staff_permission_assignments` have `REVOKE INSERT, UPDATE, DELETE FROM anon, authenticated`.
6. **Can an ordinary user access administrative data?** **No** — Ordinary public members have no row in `staff_profiles`, so `public.is_active_staff_for_user(auth.uid())` and `public.has_staff_permission_for_user(auth.uid(), ...)` return `false`.

---

## 3. Summary of Database Security Remediations for Phase 4 Migration

1. **Apply Phase 2 Staff Governance & Seller Verification Schema** (`20261104120000`) to `xyplgugxpmlnjsvlosdg`.
2. **Fix `public.properties` and `public.room_units` Live RLS (`42501` error for `anon`)** by introducing `public.is_property_host(p_property_id uuid, p_user_id uuid)` (`SECURITY DEFINER`, `SET search_path = public`) and scoping host policies strictly `TO authenticated`.
3. **Add `FORCE ROW LEVEL SECURITY`** on all sensitive identity, financial, verification, and governance tables.
4. **Add Anti-Self-Approval Triggers (`BEFORE UPDATE`)** on `public.properties`, `public.sellers`, `public.products`, and `public.filmmaker_profiles` so an authenticated host/seller/filmmaker can never elevate `status = 'approved'`, `moderation_status = 'approved'`, or `published = true` via direct PostgREST calls.
5. **Add `public.current_session_is_aal2()` Helper Function** checking `coalesce(auth.jwt()->>'aal', '') = 'aal2'` and enforce it in staff RLS policies.
6. **Unify `public.is_platform_admin()` with `public.is_active_staff_for_user(auth.uid())`** so Phase 2F/2G/2H RLS policies honor the `staff_profiles` governance table.
7. **Create `public.reviews` Table** with strict RLS (public read of `moderation_status = 'approved'`, authenticated insert only for guests with a completed/confirmed stay, host/staff moderation).
