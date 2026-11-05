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
  | 'operations'
  | 'stays_curation'
  | 'marketplace_compliance'
  | 'productions'
  | 'community'
  | 'customer_support'
  | 'finance_legal';

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
    department: 'operations',
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
    department: 'stays_curation',
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
    department: 'marketplace_compliance',
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
    department: 'customer_support',
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
    department: 'finance_legal',
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
 * Canonical 4 Operational Departments of Uttarkunth + Centralized Founder Office Shared Functions.
 * HR, Finance, Technology, Customer Support, Administration, and Compliance remain centralized
 * shared functions under the Founder rather than independent operational departments.
 */
export type OperationalDepartmentSlug =
  | 'stays'
  | 'products'
  | 'productions'
  | 'community'
  | 'founder_office';

export const FOUR_OPERATIONAL_DEPARTMENTS: ReadonlyArray<{
  slug: 'stays' | 'products' | 'productions' | 'community';
  name: string;
  title: string;
  description: string;
  legacyDepartmentCodes: StaffDepartment[];
  deskRoute: string;
}> = [
  {
    slug: 'stays',
    name: 'UTTARKUNTH STAYS',
    title: 'Stays Department',
    description:
      'Property onboarding, host applications, property & room verification, availability, booking supervision, reviews, and host agreements.',
    legacyDepartmentCodes: ['stays_curation', 'operations'],
    deskRoute: '/admin/properties',
  },
  {
    slug: 'products',
    name: 'UTTARKUNTH PRODUCTS',
    title: 'Products Department',
    description:
      'Seller applications, GSTIN & licence verification, artisan product curation, inventory governance, and buyer inquiries.',
    legacyDepartmentCodes: ['marketplace_compliance'],
    deskRoute: '/admin/products',
  },
  {
    slug: 'productions',
    name: 'UTTARKUNTH PRODUCTIONS',
    title: 'Productions Department',
    description:
      'Filmmaker & creator profiles, documentary/media proposals, scripts, collaboration requests, and copyright/takedown workflows.',
    legacyDepartmentCodes: ['productions'],
    deskRoute: '/admin/productions',
  },
  {
    slug: 'community',
    name: 'UTTARKUNTH COMMUNITY',
    title: 'Community Department',
    description:
      'Village development initiatives, volunteer/fellowship applications, participation records, and oral history moderation.',
    legacyDepartmentCodes: ['community'],
    deskRoute: '/admin/community',
  },
] as const;

export function resolveOperationalDepartment(
  dept: StaffDepartment | OperationalDepartmentSlug | string | null | undefined,
  roleSlug?: StaffRoleSlug | string | null
): OperationalDepartmentSlug {
  const normalized = String(dept || '').trim().toLowerCase();
  if (normalized === 'stays' || normalized === 'stays_curation') return 'stays';
  if (normalized === 'products' || normalized === 'marketplace_compliance') return 'products';
  if (normalized === 'productions') return 'productions';
  if (normalized === 'community') return 'community';

  const normRole = String(roleSlug || '').trim().toLowerCase();
  if (normRole === 'property_reviewer') return 'stays';
  if (normRole === 'marketplace_reviewer') return 'products';
  if (normRole === 'productions_editor') return 'productions';
  if (normRole === 'community_manager') return 'community';

  return 'founder_office';
}

/**
 * Maps action-based permission aliases (e.g. 'stays.properties.approve', 'products.sellers.verify')
 * to the canonical StaffPermission keys while preserving all existing permission strings.
 */
export const ACTION_PERMISSION_ALIAS_MAP: Record<string, StaffPermission> = {
  // Stays
  'property.approve': 'property.review',
  'stays.properties.view': 'property.review',
  'stays.properties.create': 'property.review',
  'stays.properties.update': 'property.review',
  'stays.properties.edit': 'property.review',
  'stays.properties.approve': 'property.review',
  'stays.properties.publish': 'property.review',
  'stays.hosts.verify': 'property.assign_host',
  'stays.agreements.manage': 'finance.review_agreements',
  'stays.bookings.view': 'support.manage_tickets',
  'stays.bookings.manage': 'support.manage_tickets',
  // Products
  'products.sellers.view': 'seller.verify_documents',
  'products.sellers.verify': 'seller.verify_documents',
  'products.sellers.approve': 'seller.approve',
  'products.products.create': 'product.approve',
  'products.products.approve': 'product.approve',
  'products.items.approve': 'product.approve',
  'products.items.publish': 'product.approve',
  'products.orders.manage': 'product.approve',
  // Productions
  'productions.proposals.view': 'productions.review_proposal',
  'productions.proposals.review': 'productions.review_proposal',
  'productions.proposals.approve': 'productions.review_proposal',
  'productions.projects.manage': 'productions.review_proposal',
  'productions.content.approve': 'productions.approve_profile',
  // Community
  'community.members.view': 'community.moderate',
  'community.applications.review': 'community.moderate',
  'community.projects.manage': 'community.moderate',
  'community.initiatives.manage': 'community.moderate',
  'community.stories.moderate': 'community.moderate',
  // Governance & Shared Functions
  'governance.staff.invite': 'staff.invite',
  'governance.staff.approve': 'staff.hire_approve',
  'governance.staff.suspend': 'staff.terminate',
  'governance.staff.terminate': 'staff.terminate',
  'governance.permissions.assign': 'staff.permissions.manage',
  'governance.dual_approve': 'governance.dual_approve',
  'staff.System.view': 'staff.permissions.manage',
  'staff.invitations.create': 'staff.invite',
  'staff.onboarding.approve': 'staff.hire_approve',
  'staff.status.manage': 'staff.terminate',
  'staff.permissions.grant': 'staff.permissions.manage',
  'staff.documents.view': 'staff.hr_docs.view',
};

export function normalizeStaffPermission(
  permission: StaffPermission | string
): StaffPermission {
  if ((ALL_STAFF_PERMISSIONS as ReadonlyArray<string>).includes(permission)) {
    return permission as StaffPermission;
  }
  return ACTION_PERMISSION_ALIAS_MAP[permission] || (permission as StaffPermission);
}

export function formatImmutableStaffId(year: number, sequenceNumber: number): string {
  const safeYear = year >= 2026 && year <= 2100 ? year : 2026;
  const seq = Math.max(1, Math.floor(sequenceNumber));
  return `UK-STAFF-${safeYear}-${String(seq).padStart(4, '0')}`;
}

export function isValidStaffIdFormat(staffId: string | null | undefined): boolean {
  if (!staffId || typeof staffId !== 'string') return false;
  return /^UK-(?:STAFF|FOUNDER)-\d{4}-\d{4,}$/.test(staffId);
}

/**
 * Sanitizes a post-login or callback redirect path to prevent Open Redirect vulnerabilities.
 * Only permits internal relative paths starting with a single '/' and never '//' or '/\'.
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

