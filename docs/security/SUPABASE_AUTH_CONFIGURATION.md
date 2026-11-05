# Supabase Authentication & MFA Security Configuration (`docs/security/SUPABASE_AUTH_CONFIGURATION.md`)

- **Supabase Project URL**: `https://xyplgugxpmlnjsvlosdg.supabase.co`
- **Project Reference ID**: `xyplgugxpmlnjsvlosdg`
- **Audit Method**: Live non-destructive inspection of `/auth/v1/settings` + codebase inspection of `@/lib/supabase/*`, `@/lib/auth.ts`, `@/lib/staff-rbac.ts`, `middleware.ts`, `app/login/page.tsx`, `app/signup/page.tsx`, and `app/staff/login/page.tsx`.

---

## 1. Live Supabase Auth Settings Inspection (`/auth/v1/settings`)

A live query to `https://xyplgugxpmlnjsvlosdg.supabase.co/auth/v1/settings` returned the following verified configuration:

```json
{
  "external": {
    "anonymous_users": false,
    "email": true,
    "phone": false,
    "google": false,
    "github": false,
    "apple": false,
    "azure": false,
    "sso": false
  },
  "disable_signup": false,
  "mailer_autoconfirm": false,
  "phone_autoconfirm": false,
  "sms_provider": "",
  "saml_enabled": false,
  "web3_solana_enabled": false,
  "passkeys_enabled": false
}
```

### Live Configuration Assessment

| Setting | Current Live State | Security Assessment | Action Required |
| :--- | :--- | :--- | :--- |
| **Email Provider (`external.email`)** | `true` (Enabled) | Compliant | Keep enabled. |
| **Email Confirmation (`mailer_autoconfirm`)** | `false` (Confirmation Required) | **Compliant** — Users must verify their email before `signInWithPassword` succeeds. | Keep `Confirm email` enabled in Dashboard. |
| **Anonymous Sign-Ins (`anonymous_users`)** | `false` (Disabled) | **Compliant** — Prevents anonymous JWT creation. | Keep disabled. |
| **Third-Party OAuth Providers** | All `false` (Disabled) | **Compliant** — Reduces attack surface from unconfigured OAuth callbacks. | Keep disabled unless explicitly needed. |
| **Open Public Signup (`disable_signup`)** | `false` (Enabled for Public Members) | **Compliant for Public Portal (`uttarkunth.com`)**; Staff Portal self-signup is blocked at application/DB layer via single-use `staff_invitations`. | Keep enabled for public guests/members; never allow staff self-signup without Founder invitation token. |
| **TOTP Multi-Factor Authentication (MFA)** | Supported by Supabase Auth v2 (`supabase.auth.mfa.*`) | **Enforced in Codebase (`aal2`)** — Must also ensure TOTP is set to `Enabled (Enroll & Verify)` in Supabase Dashboard. | Verify in Dashboard -> Authentication -> Multi-Factor. |
| **Password Minimum Length & Complexity** | Enforced in Staff Onboarding (`>= 12 chars`); Dashboard default is `6` | **Needs Dashboard Hardening** — Public `/signup` currently relies on Supabase Auth's server-side minimum length. | Set minimum password length to **10+ chars** (12+ for staff) and require letters + digits in Dashboard + client/server validation. |
| **Leaked Password Protection (HIBP)** | Dashboard-only setting (not exposed in `/auth/v1/settings`) | **Requires Manual Enablement in Supabase Dashboard** | Enable HaveIBeenPwned check in Dashboard -> Authentication -> Providers -> Email / Security. |
| **CAPTCHA Protection** | Not active | **Requires Manual Enablement in Supabase Dashboard** | Configure Cloudflare Turnstile in Dashboard -> Authentication -> Attack Protection. |

---

## 2. Application Authentication & Session Flow Audit

### A. Server-Side Session Verification
- **Implementation**: All server components and API routes use `supabase.auth.getUser()` via `@/lib/supabase/server` (`createServerSupabaseClient()`), which contacts the Supabase Auth server to validate the JWT signature and check that the user has not been banned or deleted.
- **Cookie Security**: `@supabase/ssr` manages chunked auth cookies through `middleware.ts` (`get` / `set` / `remove`).
- **Key Compatibility**: Both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) are supported across `lib/supabase/client.ts`, `lib/supabase/server.ts`, `utils/supabase/*`, and `middleware.ts`.

### B. Multi-Factor Authentication (TOTP `aal2`) Architecture
- **Enrollment Flow**:
  - Located in `app/staff/login/page.tsx` (`supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Uttarkunth Staff Authenticator' })`).
  - Generates a QR code and manual TOTP secret key, then challenges and verifies a 6-digit code via `supabase.auth.mfa.challenge()` and `supabase.auth.mfa.verify()`.
- **Assurance Level Verification (`aal1` vs `aal2`)**:
  - When a user signs in with email + password only, Supabase issues a JWT with `aal = "aal1"`.
  - Only after `supabase.auth.mfa.verify()` succeeds with a verified TOTP factor does Supabase upgrade the session JWT to `aal = "aal2"`.
  - Server-side `requireStaffPermission()` in `lib/staff-rbac.ts` calls `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` and checks `aalData.currentLevel === 'aal2'`.
- **Audit Finding & Fix Required**:
  1. In `app/staff/login/page.tsx`, if a staff member has no verified TOTP factor yet (`!verifiedTotpFactor`), the login flow previously redirected them to `/admin/dashboard` at `aal1`. **Fix**: Automatically trigger TOTP enrollment (`mfaStep = 'enroll'`) during login whenever `!verifiedTotpFactor`.
  2. In `app/admin/layout.tsx` and all `/admin/*` pages and `/api/admin/*` routes, enforce `requireMfaAal2: true` so no `aal1` session can view or mutate internal administrative data.
  3. In PostgreSQL RLS, add helper `public.current_session_is_aal2()` (`coalesce(auth.jwt()->>'aal', '') = 'aal2'`) so direct database queries by staff also require `aal2`.

### C. Staff ID Separation from Authentication Credentials
- **Rule**: Immutable Staff IDs (`UK-STAFF-YYYY-XXXX`) and Founder IDs (`UK-FOUNDER-YYYY-0001`) are governance/audit identifiers, **never** authentication passwords or login tokens.
- **Verification**:
  - `app/staff/login/page.tsx` (line 43) and `lib/staff-rbac.ts` (`evaluateStaffAuthorization` line 662) explicitly call `isValidStaffIdFormat(password)` and reject any attempt to use a Staff ID as a password.

### D. Lost Authenticator Recovery Flow
- **Implementation**:
  - Staff members who lose their authenticator device cannot self-reset MFA via email.
  - Instead, they submit an out-of-band recovery request via `POST /api/staff/mfa-recovery`, which records a `staff_mfa_recovery_requested` alert in `public.staff_audit_log`.
  - Only the Founder (`role_slug = 'founder'` with `aal2`) can verify the staff member's identity out-of-band and reset their TOTP factor.

---

## 3. Required Manual Configuration in Supabase Dashboard

Because Supabase does not allow client/SQL modification of project-level GoTrue/Auth configuration, the Founder must verify and apply the following settings in the **Supabase Dashboard** (`https://supabase.com/dashboard/project/xyplgugxpmlnjsvlosdg`):

### Step 1: Email & Password Hardening (`Authentication -> Providers -> Email`)
1. **Enable Email Provider**: `ON`
2. **Confirm Email**: `ON` (Already active: `mailer_autoconfirm: false`)
3. **Secure Email Change**: `ON` (Requires confirmation on both old and new email addresses before changing an account email)
4. **Secure Password Change**: `ON` (Requires recent login / re-authentication to change password)
5. **Minimum Password Length**: Set to **`12`** characters (or `10` minimum if public guests require 10+, while application code enforces `12` for staff).
6. **Password Requirements**: Select **Letters, digits, and symbols** (or Lowercase, uppercase, digits, and symbols).

### Step 2: Attack Protection & Leaked Passwords (`Authentication -> Attack Protection`)
1. **Prevent use of leaked passwords (HaveIBeenPwned.org)**: Turn **`ON`** (Blocks any password that appears in known data breaches).
2. **Enable Captcha Protection**: Turn **`ON`** using **Cloudflare Turnstile** once your Turnstile site key and secret key are created in Cloudflare Dashboard.

### Step 3: Multi-Factor Authentication (`Authentication -> Multi-Factor`)
1. **TOTP (App Authenticator)**: Set to **`Enabled (Enroll and Verify)`**.
2. **Maximum Enrolled Factors per User**: Set to **`2`** (allows 1 primary authenticator + 1 backup hardware/authenticator device for the Founder).

### Step 4: Sessions (`Authentication -> Sessions`)
1. **Time-box user sessions**: Set to **`24 hours`** (`86400` seconds) or **`7 days`** for public users; internal staff sessions are additionally re-verified on every request.
2. **Inactivity timeout**: Set to **`8 hours`** (`28800` seconds).
3. **Single session per user**: Optional (`ON` recommended if strict single-device staff sessions are desired).

### Step 5: Rate Limits (`Authentication -> Rate Limits`)
1. **Rate limit for sending emails**: Configure custom SMTP (e.g., Resend / AWS SES / Cloudflare Email Routing SMTP) and set to `30/hour`.
2. **Sign-in / Token refresh limit**: `30 requests per 5 minutes per IP`.
3. **Sign-up & Password reset limit**: `10 requests per hour per IP`.
4. **MFA verification attempts**: `10 attempts per 5 minutes per IP`.
