// ============================================================================
// UTTARKUNTH PHASE 2 — ISOMORPHIC STAFF RBAC & AGREEMENTS DEFINITIONS
// Safe for both Client Components ('use client'), Server Routes, and Node Tests
// ============================================================================

export type StaffRoleSlug =
  | 'founder'
  | 'operations_admin'
  | 'property_reviewer'
  | 'marketplace_reviewer'
  | 'productions_editor'
  | 'community_manager'
  | 'support_executive'
  | 'finance_compliance_reviewer';

export type StaffRoleCode = StaffRoleSlug;

export type StaffDepartment =
  | 'founder_office'
  | 'stays'
  | 'products'
  | 'productions'
  | 'community';

export type StaffEmploymentCategory =
  | 'full_time_employee'
  | 'part_time_employee'
  | 'fixed_term_contractor'
  | 'independent_consultant'
  | 'fellow'
  | 'full_time'
  | 'part_time'
  | 'contractor'
  | 'advisor';

export type StaffAccountStatus =
  | 'invited'
  | 'onboarding_in_progress'
  | 'pending_founder_approval'
  | 'info_requested'
  | 'under_review'
  | 'active'
  | 'suspended'
  | 'terminated'
  | 'rejected';

export type StaffPermission =
  | 'staff.invite'
  | 'staff.hire_approve'
  | 'staff.terminate'
  | 'staff.permissions.manage'
  | 'staff.hr_docs.view'
  | 'property.review'
  | 'property.assign_host'
  | 'seller.approve'
  | 'product.approve'
  | 'seller.verify_documents'
  | 'productions.approve_profile'
  | 'productions.review_proposal'
  | 'community.moderate'
  | 'support.manage_tickets'
  | 'finance.review_agreements'
  | 'audit.view_full'
  | 'governance.dual_approve'
  | 'compliance.configure_licences';

export type StaffPermissionCode = StaffPermission;

export const ALL_STAFF_PERMISSIONS: ReadonlyArray<StaffPermission> = [
  'staff.invite',
  'staff.hire_approve',
  'staff.terminate',
  'staff.permissions.manage',
  'staff.hr_docs.view',
  'property.review',
  'property.assign_host',
  'seller.approve',
  'product.approve',
  'seller.verify_documents',
  'productions.approve_profile',
  'productions.review_proposal',
  'community.moderate',
  'support.manage_tickets',
  'finance.review_agreements',
  'audit.view_full',
  'governance.dual_approve',
  'compliance.configure_licences',
];

export type StaffAgreementType =
  | 'appointment_agreement'
  | 'confidentiality_nda'
  | 'data_protection_undertaking'
  | 'acceptable_use_policy'
  | 'internal_moderation_policy'
  | 'conflict_of_interest'
  | 'intellectual_property'
  | 'termination_return_of_info';

export type StaffAgreementCode = StaffAgreementType;

export type HighRiskActionType =
  | 'superadmin_creation'
  | 'admin_promotion'
  | 'commercial_terms_change'
  | 'bulk_sensitive_data_export'
  | 'exceptional_listing_approval'
  | 'destructive_published_record_action';

export const REQUIRED_STAFF_AGREEMENTS: ReadonlyArray<{
  type: StaffAgreementType;
  code: StaffAgreementType;
  title: string;
  version: string;
  summary: string;
  canonicalContent: string;
  content: string;
}> = [
  {
    type: 'appointment_agreement',
    code: 'appointment_agreement',
    title: 'Appointment & Engagement Agreement',
    version: '2026.2',
    summary:
      'Defines scope of duties, reporting hierarchy, fiduciary care, and terms of appointment with Uttarkunth.',
    canonicalContent:
      'UTTARKUNTH APPOINTMENT & ENGAGEMENT AGREEMENT v2026.2 — Staff member agrees to discharge assigned duties faithfully, adhere to departmental boundaries, and never represent unverified commercial commitments.',
    content:
      'UTTARKUNTH APPOINTMENT & ENGAGEMENT AGREEMENT v2026.2 — Staff member agrees to discharge assigned duties faithfully, adhere to departmental boundaries, and never represent unverified commercial commitments.',
  },
  {
    type: 'confidentiality_nda',
    code: 'confidentiality_nda',
    title: 'Confidentiality & Non-Disclosure Agreement (NDA)',
    version: '2026.2',
    summary:
      'Strictly protects host records, seller business verification documents, guest PII, and internal platform operations.',
    canonicalContent:
      'UTTARKUNTH CONFIDENTIALITY & NDA v2026.2 — Staff member shall hold all non-public host, seller, guest, filmmaker, and financial records in strict confidence during and after engagement.',
    content:
      'UTTARKUNTH CONFIDENTIALITY & NDA v2026.2 — Staff member shall hold all non-public host, seller, guest, filmmaker, and financial records in strict confidence during and after engagement.',
  },
  {
    type: 'data_protection_undertaking',
    code: 'data_protection_undertaking',
    title: 'Data Protection & Information Security Undertaking',
    version: '2026.2',
    summary:
      'Mandates individual credentials, hardware/TOTP MFA (AAL2), zero credential sharing, and purpose-limited access to PII.',
    canonicalContent:
      'UTTARKUNTH DATA PROTECTION UNDERTAKING v2026.2 — Staff member shall maintain mandatory TOTP MFA, never share credentials, never export private seller or HR documents outside authorized workflows, and comply with Indian data protection rules.',
    content:
      'UTTARKUNTH DATA PROTECTION UNDERTAKING v2026.2 — Staff member shall maintain mandatory TOTP MFA, never share credentials, never export private seller or HR documents outside authorized workflows, and comply with Indian data protection rules.',
  },
  {
    type: 'acceptable_use_policy',
    code: 'acceptable_use_policy',
    title: 'Internal Systems Acceptable-Use Policy',
    version: '2026.2',
    summary:
      'Governs use of team.uttarkunth.com, administrative APIs, audit logging, and device security.',
    canonicalContent:
      'UTTARKUNTH ACCEPTABLE USE POLICY v2026.2 — Access to team.uttarkunth.com is restricted to authorized official duties. All actions are immutably logged with Staff ID and actor identity.',
    content:
      'UTTARKUNTH ACCEPTABLE USE POLICY v2026.2 — Access to team.uttarkunth.com is restricted to authorized official duties. All actions are immutably logged with Staff ID and actor identity.',
  },
  {
    type: 'internal_moderation_policy',
    code: 'internal_moderation_policy',
    title: 'Internal Moderation & Authenticity Policy',
    version: '2026.2',
    summary:
      'Enforces zero fake listings, objective provenance verification, and prohibition of self-approval or preferential treatment.',
    canonicalContent:
      'UTTARKUNTH INTERNAL MODERATION POLICY v2026.2 — Reviewers must verify authentic Himalayan provenance, valid category licences, and accurate GSTIN records before approving any seller, product, or stay.',
    content:
      'UTTARKUNTH INTERNAL MODERATION POLICY v2026.2 — Reviewers must verify authentic Himalayan provenance, valid category licences, and accurate GSTIN records before approving any seller, product, or stay.',
  },
  {
    type: 'conflict_of_interest',
    code: 'conflict_of_interest',
    title: 'Conflict-of-Interest Declaration',
    version: '2026.2',
    summary:
      'Requires disclosure of any personal or familial interest in homestays, seller brands, or production proposals under review.',
    canonicalContent:
      'UTTARKUNTH CONFLICT OF INTEREST DECLARATION v2026.2 — Staff member must recuse themselves from moderating any homestay, seller brand, product, or film proposal in which they or close relatives hold a financial or personal interest.',
    content:
      'UTTARKUNTH CONFLICT OF INTEREST DECLARATION v2026.2 — Staff member must recuse themselves from moderating any homestay, seller brand, product, or film proposal in which they or close relatives hold a financial or personal interest.',
  },
  {
    type: 'intellectual_property',
    code: 'intellectual_property',
    title: 'Intellectual Property & Archive Stewardship Obligations',
    version: '2026.2',
    summary:
      'Assigns work product created in the course of official duties and protects community oral histories and filmmaker IP.',
    canonicalContent:
      'UTTARKUNTH INTELLECTUAL PROPERTY OBLIGATIONS v2026.2 — Operational tools, moderation records, and documentation created for Uttarkunth remain platform property; third-party artisan and filmmaker IP must be respected.',
    content:
      'UTTARKUNTH INTELLECTUAL PROPERTY OBLIGATIONS v2026.2 — Operational tools, moderation records, and documentation created for Uttarkunth remain platform property; third-party artisan and filmmaker IP must be respected.',
  },
  {
    type: 'termination_return_of_info',
    code: 'termination_return_of_info',
    title: 'Termination & Return-of-Information Obligations',
    version: '2026.2',
    summary:
      'Establishes immediate session revocation upon suspension/termination and mandatory return or deletion of offline working copies.',
    canonicalContent:
      'UTTARKUNTH TERMINATION & RETURN OF INFORMATION v2026.2 — Upon suspension or termination of engagement, all system access ceases immediately and any confidential materials must be surrendered.',
    content:
      'UTTARKUNTH TERMINATION & RETURN OF INFORMATION v2026.2 — Upon suspension or termination of engagement, all system access ceases immediately and any confidential materials must be surrendered.',
  },
] as const;

export interface StaffRoleDefinition {
  slug: StaffRoleSlug;
  code: StaffRoleSlug;
  title: string;
  department: StaffDepartment;
  description: string;
  permissions: StaffPermission[];
  defaultPermissions: StaffPermission[];
  allowedNavModules: string[];
  allowedModules: string[];
}

export const STAFF_ROLE_DEFINITIONS: Record<StaffRoleSlug, StaffRoleDefinition> = {
  founder: {
    slug: 'founder',
    code: 'founder',
    title: 'Founder / Superadmin',
    department: 'founder_office',
    description:
      'Ultimate platform governance, staff hiring & termination, permission assignment, dual approvals, and full ecosystem oversight.',
    permissions: [...ALL_STAFF_PERMISSIONS],
    defaultPermissions: [...ALL_STAFF_PERMISSIONS],
    allowedNavModules: [
      'dashboard',
      'staff',
      'properties',
      'products',
      'productions',
      'community',
      'users',
      'settings',
      'bookings',
      'audit',
    ],
    allowedModules: [
      '/admin/dashboard',
      '/admin/staff',
      '/admin/properties',
      '/admin/products',
      '/admin/productions',
      '/admin/community',
      '/admin/users',
      '/admin/settings',
      '/admin/bookings',
      '/admin/audit',
    ],
  },
  operations_admin: {
    slug: 'operations_admin',
    code: 'operations_admin',
    title: 'Operations Administrator',
    department: 'founder_office',
    description:
      'Coordinates cross-pillar operations, property host assignments, and booking supervision without unilateral staff hiring authority.',
    permissions: ['property.review', 'property.assign_host', 'support.manage_tickets'],
    defaultPermissions: ['property.review', 'property.assign_host', 'support.manage_tickets'],
    allowedNavModules: ['dashboard', 'properties', 'users', 'bookings'],
    allowedModules: ['/admin/dashboard', '/admin/properties', '/admin/users', '/admin/bookings'],
  },
  property_reviewer: {
    slug: 'property_reviewer',
    code: 'property_reviewer',
    title: 'Property Reviewer',
    department: 'stays',
    description:
      'Reviews homestay listings and staged property changes. Cannot assign primary hosts, approve sellers, or appoint administrators.',
    permissions: ['property.review'],
    defaultPermissions: ['property.review'],
    allowedNavModules: ['dashboard', 'properties'],
    allowedModules: ['/admin/dashboard', '/admin/properties'],
  },
  marketplace_reviewer: {
    slug: 'marketplace_reviewer',
    code: 'marketplace_reviewer',
    title: 'Marketplace & Seller Reviewer',
    department: 'products',
    description:
      'Reviews artisan/seller brand applications, verifies business documents, and moderates product submissions.',
    permissions: ['seller.approve', 'product.approve', 'seller.verify_documents'],
    defaultPermissions: ['seller.approve', 'product.approve', 'seller.verify_documents'],
    allowedNavModules: ['dashboard', 'products'],
    allowedModules: ['/admin/dashboard', '/admin/products'],
  },
  productions_editor: {
    slug: 'productions_editor',
    code: 'productions_editor',
    title: 'Productions Editor',
    department: 'productions',
    description: 'Reviews filmmaker & co-producer profiles and documentary/film proposals.',
    permissions: ['productions.approve_profile', 'productions.review_proposal'],
    defaultPermissions: ['productions.approve_profile', 'productions.review_proposal'],
    allowedNavModules: ['dashboard', 'productions'],
    allowedModules: ['/admin/dashboard', '/admin/productions'],
  },
  community_manager: {
    slug: 'community_manager',
    code: 'community_manager',
    title: 'Community Manager',
    department: 'community',
    description:
      'Moderates community residency participations, village initiatives, and oral history stories.',
    permissions: ['community.moderate'],
    defaultPermissions: ['community.moderate'],
    allowedNavModules: ['dashboard', 'community'],
    allowedModules: ['/admin/dashboard', '/admin/community'],
  },
  support_executive: {
    slug: 'support_executive',
    code: 'support_executive',
    title: 'Customer Support Executive',
    department: 'founder_office',
    description:
      'Assists guests and hosts with booking inquiries. Strictly prohibited from accessing private seller licences or HR documents.',
    permissions: ['support.manage_tickets'],
    defaultPermissions: ['support.manage_tickets'],
    allowedNavModules: ['dashboard', 'bookings'],
    allowedModules: ['/admin/dashboard', '/admin/bookings'],
  },
  finance_compliance_reviewer: {
    slug: 'finance_compliance_reviewer',
    code: 'finance_compliance_reviewer',
    title: 'Finance & Compliance Reviewer',
    department: 'founder_office',
    description:
      'Reviews bilateral commercial agreements, verifies GSTIN/tax compliance records, and audits regulatory licences.',
    permissions: [
      'seller.verify_documents',
      'finance.review_agreements',
      'audit.view_full',
      'compliance.configure_licences',
    ],
    defaultPermissions: [
      'seller.verify_documents',
      'finance.review_agreements',
      'audit.view_full',
      'compliance.configure_licences',
    ],
    allowedNavModules: ['dashboard', 'products', 'settings', 'audit'],
    allowedModules: ['/admin/dashboard', '/admin/products', '/admin/settings', '/admin/audit'],
  },
};

export const HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL: ReadonlyArray<HighRiskActionType> = [
  'superadmin_creation',
  'admin_promotion',
  'commercial_terms_change',
  'bulk_sensitive_data_export',
  'exceptional_listing_approval',
  'destructive_published_record_action',
];


/**
 * Accepts only same-origin absolute paths for post-authentication navigation.
 * External, protocol-relative, and scheme-like redirects are rejected.
 * Kept in this browser-safe module so client login and server auth callbacks share the rule.
 */
export function sanitizeInternalRedirectPath(
  rawNext: string | null | undefined,
  fallback: string = '/'
): string {
  if (!rawNext || typeof rawNext !== 'string') return fallback;
  const trimmed = rawNext.trim();
  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return fallback;
  if (/^\/[a-zA-Z0-9+.-]+:/.test(trimmed)) return fallback;
  return trimmed;
}

export function formatImmutableStaffId(year: number, sequenceNumber: number): string {
  const safeYear = year >= 2026 && year <= 2100 ? year : 2026;
  const seq = Math.max(1, Math.floor(sequenceNumber));
  return `UK-STAFF-${safeYear}-${String(seq).padStart(4, '0')}`;
}

export function isValidStaffIdFormat(staffId: string | null | undefined): boolean {
  if (!staffId || typeof staffId !== 'string') return false;
  return /^UK-STAFF-\d{4}-\d{4,}$/.test(staffId);
}
