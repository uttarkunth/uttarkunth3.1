# Uttarkunth 3.1 — Staff Portal Architecture

**Domain**: `team.uttarkunth.com`  
**Route**: `/staff` (`/app/staff/page.tsx`)  
**Access Policy**: Restricted to active, Founder-approved staff (`public.staff_profiles.status === 'active'`) with completed agreements, immutable `UK-STAFF-YYYY-XXXX` ID, and verified TOTP MFA (`aal2`).

---

## 1. Staff Identity & Session Verification

Every request to `/staff` verifies:
1. Authenticated Supabase session (`supabase.auth.getUser()`).
2. Verified TOTP Multi-Factor Authentication (`aal2` via `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`).
3. Active `public.staff_profiles` row with:
   - `status === 'active'`
   - `session_revoked_at === null`
   - `agreements_completed === true` (all 8 mandatory agreements accepted)
   - `founder_approved_at !== null` and `founder_approved_by !== null`
   - Valid `UK-STAFF-YYYY-XXXX` identifier

---

## 2. Staff Identity Header & Dynamic Navigation

The Staff Portal displays:
- **Staff Identity Card**: Full name, immutable Staff ID (`UK-STAFF-YYYY-XXXX`), designation, assigned operational department (`UTTARKUNTH STAYS`, `UTTARKUNTH PRODUCTS`, `UTTARKUNTH PRODUCTIONS`, or `UTTARKUNTH COMMUNITY`), assigned role, and effective permissions list.
- **Dynamic Permission-Scoped Navigation**:
  - `Dashboard` (`/staff`)
  - `My Department` (routes directly to the staff member's assigned department desk)
  - `My Tasks` (`#tasks`)
  - `Applications` (pending submissions in the assigned department)
  - `Work Management`
  - `Reports` (`/admin/audit`, shown only if granted `audit.view_full` or `finance.view_reports`)
  - `My Profile` (`#profile`)
  - `Notifications` (`#notifications`)
  - `Help & Support` (`#support`)

---

## 3. Strict Departmental Data Isolation

`/app/staff/page.tsx` queries **only** the Supabase tables belonging to the staff member's authorized department:
- **Stays Staff**: Queries `properties` and `stay_bookings` only.
- **Products Staff**: Queries `sellers` and `products` only.
- **Productions Staff**: Queries `filmmaker_profiles` and `production_proposals` only.
- **Community Staff**: Queries `community_stories` and `community_participations` only.
- **Founder**: Views all 4 department queues plus a direct link to the **Founder Command Centre (`/admin/dashboard`)**.
