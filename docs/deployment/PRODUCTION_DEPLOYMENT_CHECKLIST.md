# Uttarkunth 3.1 — Master Production Deployment & GitHub Sync Checklist

**Repository**: `https://github.com/uttarkunth/uttarkunth3.1`  
**Target Branch**: `uttarkunthmain2`  

---

## 1. Pre-Deployment Verification Summary (Completed)

- [x] **TypeScript & Next.js Production Build (`compile_applet` / `npm run build`)**: Passed with 0 errors.
- [x] **ESLint Verification (`lint_applet`)**: Passed with 0 errors.
- [x] **Automated Unit & Security Suite (`npx --yes tsx --test tests/*.test.ts`)**: `164` passed, `0` failed.
- [x] **Hydration Warning Remediation**: Added `suppressHydrationWarning` to form controls across `components/search-bar.tsx`, `components/site-wide-search.tsx`, `components/booking-widget.tsx`, `app/login/page.tsx`, and `app/staff/login/page.tsx`.
- [x] **Secret Hygiene**: Confirmed `.env.local` and service-role keys are excluded via `.gitignore`; only `.env.example` is tracked.

---

## 2. GitHub Synchronization Instructions (`uttarkunthmain2`)

Because the AI Studio preview container runs without an authenticated Git remote credential for `github.com/uttarkunth/uttarkunth3.1`, run the following commands in your local/deployment checkout to commit and push these verified changes to `uttarkunthmain2`:

```bash
git checkout uttarkunthmain2
git status
git add \
  middleware.ts \
  lib/staff-rbac-shared.ts \
  lib/staff-rbac.ts \
  app/admin/layout.tsx \
  app/admin/dashboard/page.tsx \
  app/staff/page.tsx \
  app/staff/login/page.tsx \
  app/login/page.tsx \
  components/admin-nav.tsx \
  components/search-bar.tsx \
  components/site-wide-search.tsx \
  components/booking-widget.tsx \
  app/api/admin/agreements/route.ts \
  app/api/admin/community/route.ts \
  app/api/admin/hosts/route.ts \
  app/api/admin/moderation/route.ts \
  app/api/admin/productions/route.ts \
  app/api/admin/products/route.ts \
  app/api/admin/staff/route.ts \
  app/api/auth/callback/route.ts \
  app/api/auth/role/route.ts \
  app/api/bookings/cancel/route.ts \
  app/api/host/properties/[id]/photos/route.ts \
  app/api/staff/mfa-recovery/route.ts \
  supabase/migrations/20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql \
  tests/phase2-staff-seller-governance.test.ts \
  docs/
git commit -m "feat(security): complete Uttarkunth 3.1 security audit, 3-portal isolation, 4-department RBAC, AAL2 MFA, and additive RLS migration"
git push origin uttarkunthmain2
```

---

## 3. Post-Deploy Live Verification Steps

1. Run the two pending SQL migrations in **Supabase SQL Editor** (`20261104120000_...` and `20261105120000_...`).
2. Verify `https://uttarkunth.com/stays` loads `Yash Home Stay` and `Wonderway Retreat`.
3. Verify `https://admin.uttarkunth.com` routes to Founder Executive Sign In (`/staff/login?portal=founder`) and enforces `role_slug === 'founder'` + `aal2` MFA.
4. Verify `https://team.uttarkunth.com` routes to Staff Portal Sign In (`/staff/login?portal=staff`) and renders the department-scoped `/staff` workspace.
