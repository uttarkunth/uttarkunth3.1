# Uttarkunth 3.1 — Cloudflare Workers, Staff Subdomain & Supabase Deployment Guide

**Platform:** Uttarkunth (`uttarkunth.com` & `team.uttarkunth.com`)  
**Supabase Project:** `xyplgugxpmlnjsvlosdg`  
**Deployment Target:** Cloudflare Workers via `@opennextjs/cloudflare`

> [!IMPORTANT]
> **Production Safety Rule:** Do not apply pending database migrations or deploy to Cloudflare until reviewed and approved by the Founder. Live properties (`Yash Home Stay` and `Wonderway Retreat`), existing bookings, and live Auth accounts must remain untouched.

---

## 1. Clean Build & Local Preview Commands

```bash
# Install dependencies
npm install

# Run full verification suite before building
npx tsc --noEmit
npm run lint
npm test

# Build Next.js production output
npm run build

# Build Cloudflare Worker bundle (.open-next/worker.js & .open-next/assets)
npm run build:worker

# Preview locally in Cloudflare Workers runtime (workerd)
npm run preview
```

---

## 2. Cloudflare Workers Builds Configuration

1. In the **Cloudflare Dashboard**, go to **Workers & Pages > Create Application > Workers > Connect to Git**.
2. Select repository `uttarkunth/uttarkunth3.1` and branch `main`.
3. Configure build settings:
   - **Root directory:** `/`
   - **Build command:** `npm run build:worker`
   - **Deploy command:** `npx wrangler deploy`
4. Verify `wrangler.jsonc` at the repository root:
   - `name`: `"uttarkunth3-1"`
   - `main`: `".open-next/worker.js"`
   - `assets.directory`: `".open-next/assets"` (`binding: "ASSETS"`)
   - `compatibility_date`: `"2024-12-30"`
   - `compatibility_flags`: `["nodejs_compat"]`

---

## 3. Environment Variables & Secrets in Cloudflare

### A. Build-Time Variables (Workers Builds > Settings > Builds > Build Variables)
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xyplgugxpmlnjsvlosdg.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`

### B. Runtime Variables & Encrypted Secrets (Workers & Pages > `uttarkunth3-1` > Settings > Variables and Secrets)
- `NEXT_PUBLIC_SUPABASE_URL` (Plain text)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Plain text)
- `SUPABASE_SERVICE_ROLE_KEY` (**Encrypted Secret** — strictly server-only; never prefix with `NEXT_PUBLIC_`)
- `ALLOWED_ORIGINS` = `https://uttarkunth.com,https://team.uttarkunth.com`

---

## 4. Dedicated Staff Portal Hostname (`team.uttarkunth.com`) & Cloudflare Access

### A. Custom Domain Routing
1. In **Workers & Pages > `uttarkunth3-1` > Settings > Domains & Routes**, add custom domains:
   - `uttarkunth.com`
   - `team.uttarkunth.com`
2. `middleware.ts` automatically enforces staff portal isolation:
   - Any unauthenticated request to `/admin/*` redirects to `/staff/login?next=...`.
   - Open staff registration paths (`/admin/register`, `/admin/signup`, `/staff/register`, `/staff/signup`) are permanently blocked and redirected to `/staff/login?error=open_registration_prohibited`.

### B. Cloudflare Access (Zero Trust External Perimeter Gate — Recommended)
1. In **Cloudflare Zero Trust > Access > Applications**, create a **Self-hosted Application** for:
   - `team.uttarkunth.com/*`
   - `uttarkunth.com/staff/*`
   - `uttarkunth.com/admin/*`
2. Create an **Allow** policy restricted to authorised Uttarkunth staff emails (`@uttarkunth.com` or Founder email list) requiring One-Time PIN or hardware MFA.
3. **Defense-in-Depth:** Cloudflare Access is an outer perimeter gate only; application-level authentication (`middleware.ts`, `lib/auth.ts`, `requireStaffPermission()` in `lib/staff-rbac.ts`) and Supabase Auth TOTP MFA (`aal2`) remain mandatory on every request.

---

## 5. Supabase Database Migrations & Founder Provisioning

### A. Ordered Pending Migrations (Review Before Applying)
Run in the Supabase SQL Editor only after Founder sign-off:
1. `supabase/migrations/20260418010000_phase2a_foundation_pending_approval.sql`
2. `supabase/migrations/20261101120000_products_marketplace_pending_approval.sql`
3. `supabase/migrations/20261102120000_phase2f_bilateral_agreements_pending_approval.sql`
4. `supabase/migrations/20261103120000_phase2g_2h_productions_community_pending_approval.sql`
5. `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`

### B. Provisioning the Founder Account in `public.staff_profiles`
After applying `20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql`, run the following SQL in the Supabase SQL Editor using the Founder's existing `auth.users.id`:

```sql
SELECT public.provision_founder_account(
  '<FOUNDER_AUTH_USER_UUID>'::uuid,
  'info@uttarkunth.com',
  'Gaurav Negi',
  '+91-0000000000'
);
```

This creates the immutable `UK-STAFF-2026-0001` Founder record in `public.staff_profiles` (`role_slug = 'founder'`, `status = 'active'`) and synchronizes `public.platform_admins`.
