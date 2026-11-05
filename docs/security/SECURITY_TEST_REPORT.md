# Uttarkunth 3.1 — Automated Security Test Report

**Test Runner**: Node.js built-in test runner via `npx --yes tsx --test tests/*.test.ts`  
**Total Executed Tests**: `164` tests across `12` test files  
**Result**: `164 PASSED`, `0 FAILED`  
**Date**: November 5, 2026  

---

## 1. Master Architecture & Security Audit Test Matrix (20 Scenarios)

All 20 mandatory security scenarios specified in Part 15 of the Uttarkunth 3.1 Master Architecture & Security Audit specification are implemented and verified in `tests/phase2-staff-seller-governance.test.ts`:

| # | Test Scenario | Expected Outcome | Actual Result |
|---|---|---|---|
| 1 | Anonymous user cannot access private tables or staff APIs | `401 UNAUTHENTICATED` | **PASS** |
| 2 | Ordinary public user cannot access Staff Portal (`team.uttarkunth.com`) or Founder Command Centre (`admin.uttarkunth.com`) | `403 ORDINARY_MEMBER_FORBIDDEN` | **PASS** |
| 3 | Host cannot access or modify another host's property data; magic bytes & staff AAL2 enforced on photo uploads | `403 Forbidden` + `validateFileMagicBytes` | **PASS** |
| 4 | Seller cannot access another seller's private verification documents | `allowed: false` | **PASS** |
| 5 | `UTTARKUNTH STAYS` staff cannot access Products, Productions, or Community data | `allowed: true` for `stays`, `false` for other 3 pillars | **PASS** |
| 6 | `UTTARKUNTH PRODUCTS` staff cannot access Stays, Productions, or Community data | `allowed: true` for `products`, `false` for other 3 pillars | **PASS** |
| 7 | `UTTARKUNTH PRODUCTIONS` staff cannot access Stays, Products, or Community data | `allowed: true` for `productions`, `false` for other 3 pillars | **PASS** |
| 8 | `UTTARKUNTH COMMUNITY` staff cannot access Stays, Products, or Productions data | `allowed: true` for `community`, `false` for other 3 pillars | **PASS** |
| 9 | Staff cannot modify their own role or assign permissions | `403 PERMISSION_DENIED` on `governance.*` | **PASS** |
| 10 | Non-Founder staff (all 7 non-Founder roles) cannot access Founder Command Centre (`admin.uttarkunth.com`) | `403 FOUNDER_ONLY_PORTAL` | **PASS** |
| 11 | Suspended staff loses access immediately across all portals | `403 STAFF_NOT_ACTIVE` | **PASS** |
| 12 | Terminated staff loses access immediately across all portals | `403 STAFF_NOT_ACTIVE` | **PASS** |
| 13 | Staff without TOTP MFA (`aal1`) cannot access Staff Portal or privileged actions | `403 MFA_AAL2_REQUIRED` | **PASS** |
| 14 | Founder with TOTP MFA (`aal2`) can access Founder Command Centre (`admin.uttarkunth.com`) and all 4 departments | `200 AUTHORIZED` (`portal: 'founder'`) | **PASS** |
| 15 | Private HR documents reject public buckets and spoofed file magic bytes (`<script>` disguised as `.pdf`) | `valid: false` on spoofed bytes; `true` on `%PDF-1.7` | **PASS** |
| 16 | Seller verification documents reject `aal1` staff and unrelated users | `allowed: false` | **PASS** |
| 17 | Dual approval rejects self-approval (`requested_by === approved_by`) even for Founder | `403 DUAL_AUTHORIZATION_REQUIRED` | **PASS** |
| 18 | Explicit permission revocation (`revoked_permissions` / `grant_type: 'revoke'`) overrides default role grants | `403 PERMISSION_REVOKED` | **PASS** |
| 19 | Open redirect sanitization (`sanitizeInternalRedirectPath`) blocks `https://`, `//`, `/\`, and `javascript:` URIs | Returns safe fallback `/` | **PASS** |
| 20 | Booking cancellation route enforces `crypto.timingSafeEqual` on `guest_access_token_hash`, guest email, host ownership, or AAL2 Stays staff | Verified in `/app/api/bookings/cancel/route.ts` | **PASS** |

---

## 2. Full Regression Suite Summary

- `tests/phase2-staff-seller-governance.test.ts`: 58 scenarios passed (26 Phase 2 + 12 Task 9 + 20 Master Architecture & Security Audit).
- `tests/security-audit.test.ts`: 104 security invariants passed (booking concurrency, RPC isolation, commercial agreement SHA-256 digests, audit log immutability, RLS visibility).
- `tests/account.test.ts`, `tests/admin.test.ts`, `tests/authenticity.test.ts`, `tests/booking-pricing.test.ts`, `tests/commission.test.ts`, `tests/date-validation.test.ts`, `tests/host-workspace.test.ts`, `tests/phase2g-2h-ecosystem.test.ts`, `tests/products-marketplace.test.ts`, `tests/zod-schemas.test.ts`: All passed.
