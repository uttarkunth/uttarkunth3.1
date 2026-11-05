# Uttarkunth 3.1 — Staff Security & Operational Guide

**Portal**: Uttarkunth Staff Portal (`team.uttarkunth.com` / `/staff`)  
**Four Operational Departments**:
1. `UTTARKUNTH STAYS` (`stays`)
2. `UTTARKUNTH PRODUCTS` (`products`)
3. `UTTARKUNTH PRODUCTIONS` (`productions`)
4. `UTTARKUNTH COMMUNITY` (`community`)

---

## 1. Staff Onboarding & Mandatory Legal Undertakings

1. **Invitation-Only Provisioning**:
   - Public staff registration is disabled (`/staff/register` and `/admin/register` are blocked).
   - You must receive a single-use, 72-hour expiring invitation link from the Founder matched to your official work email.
2. **Completing the 8 Mandatory Staff Agreements (`/staff/onboard`)**:
   - Before your account can be activated, you must read and accept all 8 binding undertakings:
     1. Staff Appointment & Role Scope Undertaking
     2. Confidentiality & Non-Disclosure Agreement (NDA)
     3. Data Protection & Privacy Handling Undertaking (DPDP Act, 2023)
     4. Acceptable Use & Credential Security Policy
     5. Internal Moderation & Anti-Corruption Policy
     6. Conflict of Interest Declaration
     7. Intellectual Property & Platform Assets Undertaking
     8. Termination & Return of Information Undertaking
   - Each acceptance is recorded with its canonical SHA-256 document hash, timestamp, IP address, and user agent.
3. **Founder Sign-Off & Immutable Staff ID**:
   - Your account remains blocked (`pending_founder_approval`) until the Founder approves your dossier and issues your immutable `UK-STAFF-YYYY-XXXX` identifier.

---

## 2. Signing In & Mandatory TOTP MFA (AAL2)

1. Sign in at `https://team.uttarkunth.com` (or `/staff/login?portal=staff&next=/staff`).
2. **Never use your `UK-STAFF-YYYY-XXXX` ID as your password**. Your Staff ID is an audit accountability tag, not a secret credential.
3. **Mandatory TOTP Authenticator (AAL2)**:
   - On your first sign-in, scan the TOTP QR code with Google Authenticator, 1Password, or Authy and enter the 6-digit code.
   - Every subsequent login requires your password + 6-digit TOTP code (`aal2`).
4. **Lost Authenticator Recovery**:
   - If you lose your authenticator device, click **Lost Authenticator Device? Request Founder MFA Recovery** on `/staff/login`. This logs a verified alert in `staff_audit_log` for out-of-band Founder verification.

---

## 3. Department Boundaries & Audit Accountability

- **Strict Departmental Isolation**:
  - `UTTARKUNTH STAYS` staff can only view and moderate Stays properties, staged host edits, host assignments, and stay bookings.
  - `UTTARKUNTH PRODUCTS` staff can only view and verify Seller applications, Modulo-36 GSTIN checks, private category licences (`seller-verification-docs`), and product listings.
  - `UTTARKUNTH PRODUCTIONS` staff can only review Filmmaker profiles, Production proposals, and takedown requests.
  - `UTTARKUNTH COMMUNITY` staff can only moderate Community stories and Fellowship/volunteer participations.
- **Prohibited Actions**:
  - Staff cannot access `admin.uttarkunth.com` (Founder Command Centre).
  - Staff cannot modify their own role, permissions, or department.
  - Staff cannot download private HR documents (`staff-hr-docs`) belonging to other personnel.
  - Every moderation decision and private document view is permanently logged with your `UK-STAFF-YYYY-XXXX` identifier in `staff_audit_log`.
