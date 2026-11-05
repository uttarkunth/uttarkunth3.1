# UTTARKUNTH 3.1 — DATABASE MIGRATION REVIEW & RECONCILIATION

**Target Supabase Project:** `xyplgugxpmlnjsvlosdg`  
**Working Branch:** `uttarkunthmain2`  
**Status:** Staged Locally & Remote (`PENDING PRODUCTION APPROVAL` — Not Applied to Live Production)

---

## 1. Existing Live & Previously Staged Tables Reused

| Table Name | Migration File | Purpose & Compatibility |
|---|---|---|
| `public.properties` | `20260402060000_init_schema.sql`, `20260417000000_host_workspace.sql` | Reused for homestay listings (`Yash Home Stay`, `Wonderway Retreat` preserved untouched) and new host applications (`published: false`, `moderation_status: 'pending'`). |
| `public.room_units` | `20260402060000_init_schema.sql` | Reused for room categories, base pricing, and initial room units created during host property applications. |
| `public.bookings` | `20260402060000_init_schema.sql` | Reused for guest booking requests, check-in/out dates, and commission calculations. |
| `public.platform_admins` | `20260418000000_security_audit_fixes.sql` | Reused as backward-compatible administrator lookup alongside `public.staff_profiles`. |
| `public.sellers` | `20261101120000_products_marketplace_pending_approval.sql` | Extended additively with brand/legal identity, GSTIN, constitution, and category licence columns. |
| `public.products` & `public.product_interests` | `20261101120000_products_marketplace_pending_approval.sql` | Reused for marketplace product listings and early-patron waitlist entries. |
| `public.filmmaker_profiles` & `public.production_proposals` | `20261103120000_phase2g_2h_productions_community_pending_approval.sql` | Reused for filmmaker collaboration profiles, film pitches, and takedown/archival status (`takedown_requested`, `archived`, `removed`). |
| `public.community_stories` & `public.fellowship_applications` | `20261103120000_phase2g_2h_productions_community_pending_approval.sql` | Reused for community journal stories and Himalayan fellowship applications. |

---

## 2. New Tables & Views Proposed in `20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`

| Object Name | Type | Description |
|---|---|---|
| `public.profiles` | Table | Common public member profile (`id`, `full_name`, `preferred_name`, `phone`, `city`, `state`, `country`, `bio`, `avatar_url`, `interests`). |
| `public.public_member_profiles` | View | Safe public projection of `public.profiles` excluding private contact fields (`phone`). |
| `public.staff_roles` | Table | Catalog of 8 internal staff roles (`founder`, `operations_admin`, `property_reviewer`, `marketplace_reviewer`, `productions_editor`, `community_manager`, `support_executive`, `finance_compliance_reviewer`). |
| `public.staff_permissions` & `public.staff_role_permissions` | Tables | Granular staff permission catalog (18+ permissions) and role-to-permission mapping. |
| `public.staff_invitations` | Table | Single-use, expiring, Founder-controlled staff invitations storing SHA-256 `token_hash`. |
| `public.staff_profiles` | Table | Internal staff identity records (`user_id`, immutable `staff_id`, `role_slug`/`role_code`, `custom_permissions`, `revoked_permissions`, `status`, `session_revoked_at`). |
| `public.staff_permission_assignments` | Table | Granular `allow`/`revoke` permission overrides per staff member. |
| `public.staff_documents` | Table | Metadata for private HR & identity files stored in private bucket `staff-hr-docs`. |
| `public.staff_agreements` & `public.staff_agreement_acceptances` | Tables | Catalog and SHA-256 acceptance audit records for the 8 mandatory Uttarkunth staff agreements. |
| `public.staff_employment_history` | Table | Immutable lifecycle log (`invited`, `onboarded`, `approved`, `role_changed`, `suspended`, `reinstated`, `terminated`). |
| `public.staff_dual_approvals` | Table | Two-person approval queue for high-risk actions (`promote_superadmin`, `create_founder_or_superadmin`, `change_commercial_terms`, etc.). |
| `public.staff_audit_log` | Table | Append-only governance audit trail protected by `trg_prevent_staff_audit_log_mutation`. |
| `public.seller_verification_documents` | Table | Metadata for private seller business/licence documents stored in private bucket `seller-verification-docs`. |
| `public.seller_verification_checks` | Table | Reviewer verification log for Official GST Portal (`services.gst.gov.in`) and category licence checks. |
| `public.marketplace_category_requirements` | Table | Configurable category-to-licence requirements matrix (trademark always optional). |

---

## 3. Reconciled Columns & Non-Recursive `SECURITY DEFINER` Helpers

1. **Canonical Column Standardization & Compatibility Triggers (`trg_sync_staff_profile_role`, `trg_sync_staff_invitation_role`)**:
   - Reconciled on `role_slug`, `permission_key`, `founder_approved_at`, and `founder_approved_by`.
   - Automatic synchronization triggers keep `role_slug` and `role_code` aligned for zero-downtime backward compatibility.
2. **Immutable Staff ID Trigger (`trg_prevent_staff_id_mutation`)**:
   - Blocks any `UPDATE` attempting to change `staff_profiles.staff_id` once assigned (`UK-STAFF-YYYY-XXXX`).
3. **Append-Only Audit Trigger (`trg_prevent_staff_audit_log_mutation`)**:
   - Blocks any `UPDATE` or `DELETE` on `public.staff_audit_log`.
4. **Hardened Founder Provisioning Procedure (`public.provision_founder_account`)**:
   - Locked down to `service_role` and trusted database owner (`REVOKE ALL ON FUNCTION public.provision_founder_account FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION public.provision_founder_account TO service_role;`).
   - Checks that the provided Auth UUID exists in `auth.users` and that the submitted email matches `auth.users.email`.
   - Eliminates false MFA assertions, fabricated agreements, fake passport numbers, and dummy phone numbers.
   - Verification query:
     ```sql
     SELECT
       has_function_privilege('anon', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS anon_can_exec,
       has_function_privilege('authenticated', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS auth_can_exec,
       has_function_privilege('service_role', 'public.provision_founder_account(uuid, text, text, text)', 'EXECUTE') AS service_role_can_exec;
     ```
5. **Non-Recursive `SECURITY DEFINER` Functions**:
   - `public.is_active_staff_for_user(p_user_id uuid)`
   - `public.has_staff_permission_for_user(p_user_id uuid, p_perm text)`

---

## 4. Storage Buckets & RLS Policies

| Bucket ID | Public | Max Size | Allowed MIME Types | Access Control |
|---|---|---|---|---|
| `staff-hr-docs` | `false` | `10 MB` | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | Uploaded during validated staff onboarding (`/api/staff/documents`); viewed only via 60-second signed URLs by staff with `staff.hr_docs.view` + AAL2 MFA + audit log. |
| `seller-verification-docs` | `false` | `10 MB` | `application/pdf`, `image/jpeg`, `image/png`, `image/webp` | Uploaded by authenticated sellers (`/api/products/documents`); viewed only by the owning seller or active staff with `seller.verify_documents` / `finance.review_agreements` + AAL2 MFA + audit log. Support Executives and other sellers are strictly blocked (`403`). |

---

## 5. Ordered Migration Execution Plan (Pending Owner Approval)

Do not execute against production until explicitly approved by the Founder:

1. `supabase/migrations/20260402060000_init_schema.sql` *(Already applied in live production)*
2. `supabase/migrations/20260417000000_host_workspace.sql` *(Already applied in live production)*
3. `supabase/migrations/20260418000000_security_audit_fixes.sql` *(Already applied in live production)*
4. `supabase/migrations/20260418010000_phase2a_foundation_pending_approval.sql` *(Pending owner approval)*
5. `supabase/migrations/20261101120000_products_marketplace_pending_approval.sql` *(Pending owner approval)*
6. `supabase/migrations/20261102120000_phase2f_bilateral_agreements_pending_approval.sql` *(Pending owner approval)*
7. `supabase/migrations/20261103120000_phase2g_2h_productions_community_pending_approval.sql` *(Pending owner approval)*
8. `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql` *(Pending owner approval)*
