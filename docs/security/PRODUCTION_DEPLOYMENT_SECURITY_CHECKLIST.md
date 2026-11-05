# Uttarkunth 3.1 — Production Deployment Security Checklist

**Target Architecture**:
- `uttarkunth.com` — Public Website
- `admin.uttarkunth.com` — Founder Command Centre (Founder Only)
- `team.uttarkunth.com` — Uttarkunth Staff Portal (Approved Staff & Founder)
- **Supabase Project**: `https://xyplgugxpmlnjsvlosdg.supabase.co`

---

## 1. Environment Variables & Secrets Checklist

- [x] `NEXT_PUBLIC_SUPABASE_URL` set to `https://xyplgugxpmlnjsvlosdg.supabase.co`.
- [x] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured for browser/SSR anon client.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set as an **encrypted server-only secret** in Cloudflare Pages / hosting runtime (never prefixed with `NEXT_PUBLIC_`, never committed to Git).
- [ ] `ENFORCE_CLOUDFLARE_ACCESS=true` enabled once Cloudflare Zero Trust Access policies are attached to `admin.uttarkunth.com` and `team.uttarkunth.com`.
- [x] Verified zero `SUPABASE_SERVICE_ROLE_KEY` references in client components (`'use client'`).

---

## 2. Supabase Database & Storage Checklist

- [ ] Execute `supabase/migrations/20261104120000_phase2_staff_governance_and_seller_verification_pending_approval.sql` in Supabase SQL Editor.
- [ ] Execute `supabase/migrations/20261105120000_phase3_master_security_rls_and_storage_hardening_pending_approval.sql` in Supabase SQL Editor.
- [ ] Verify `anon` query to `public.properties` returns the 2 published properties (`Yash Home Stay`, `Wonderway Retreat`) with HTTP 200 (confirming `42501` on `property_hosts` is resolved).
- [ ] Verify all 6 storage buckets exist in `storage.buckets`:
  - `property-photos` (`public: true`)
  - `staff-hr-docs` (`public: false`)
  - `seller-verification-docs` (`public: false`)
  - `host-verification-docs` (`public: false`)
  - `production-private-docs` (`public: false`)
  - `community-private-docs` (`public: false`)

---

## 3. Supabase Auth Dashboard Checklist

- [x] Email confirmation (`mailer_autoconfirm: false`) enabled.
- [x] TOTP MFA (`mfa.totp.enroll_enabled: true`, `verify_enabled: true`) enabled.
- [ ] Minimum password length increased from `6` to `12` characters with character complexity in **Supabase Dashboard -> Authentication -> Providers -> Email**.
- [ ] Leaked password protection (HaveIBeenPwned) enabled in **Authentication -> Security**.
- [ ] Cloudflare Turnstile CAPTCHA enabled in **Authentication -> Bot and Abuse Protection**.

---

## 4. Cloudflare DNS, SSL/TLS, WAF & Zero Trust Checklist

- [ ] Configure DNS records for `uttarkunth.com`, `www.uttarkunth.com`, `admin.uttarkunth.com`, and `team.uttarkunth.com` (Proxied / Orange Cloud).
- [ ] Set SSL/TLS encryption mode to **Full (Strict)** with **Always Use HTTPS** and **HSTS** enabled.
- [ ] Configure Cloudflare Zero Trust Access applications for:
  - `admin.uttarkunth.com` — Allow only Founder email (`founder@uttarkunth.com` / verified Founder identity).
  - `team.uttarkunth.com` — Allow only verified `@uttarkunth.com` staff emails.
- [ ] Configure Cloudflare WAF Rate Limiting rules on `/api/auth/*`, `/api/bookings/*`, `/api/staff/*`, and `/api/admin/*`.
