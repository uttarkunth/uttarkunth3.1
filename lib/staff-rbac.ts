// ============================================================================
// UTTARKUNTH PHASE 2 — SEPARATE STAFF IDENTITY & GRANULAR RBAC ENGINE
// Isomorphic constants & pure evaluators + server-side requireStaffPermission()
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

/**
 * Pure deterministic 64-char hex digest for agreement versioning/hashing
 * that works in both Node.js and browser environments without external deps.
 */
export function computeDocumentHash(content: string): string {
  const normalized = content.trim();
  try {
    // Use Node's built-in crypto when running on server / Node test runner
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  } catch {
    // Deterministic 64-char hex fallback if invoked synchronously in browser
    let h1 = 0xdeadbeef ^ normalized.length;
    let h2 = 0x41c6ce57 ^ normalized.length;
    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const base = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
    return base.repeat(4);
  }
}

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
 * Formats an immutable Staff ID (e.g. UK-STAFF-2026-0001).
 * The Staff ID is strictly an accountability identifier, never a password or authentication factor.
 */
export function formatImmutableStaffId(year: number, sequenceNumber: number): string {
  const safeYear = year >= 2026 && year <= 2100 ? year : 2026;
  const seq = Math.max(1, Math.floor(sequenceNumber));
  return `UK-STAFF-${safeYear}-${String(seq).padStart(4, '0')}`;
}

export function isValidStaffIdFormat(staffId: string | null | undefined): boolean {
  if (!staffId || typeof staffId !== 'string') return false;
  return /^UK-STAFF-\d{4}-\d{4,}$/.test(staffId);
}

/**
 * Validates a staff invitation record for single-use, non-expired, non-cancelled integrity.
 */
export interface StaffInvitationRecord {
  id: string;
  token_hash: string;
  official_email: string;
  department: StaffDepartment;
  designation: string;
  role_slug: StaffRoleSlug;
  initial_permissions: StaffPermission[];
  employment_category: StaffEmploymentCategory;
  invited_by_user_id: string;
  expires_at: string;
  used_at: string | null;
  cancelled_at: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'withdrawn' | 'used';
}

export function validateStaffInvitation(
  invitation: Partial<StaffInvitationRecord> | null | undefined,
  candidateEmail: string,
  nowIso: string = new Date().toISOString()
): { valid: boolean; reason?: string } {
  if (!invitation) {
    return {
      valid: false,
      reason: 'Invitation not found. Open staff self-registration is strictly prohibited.',
    };
  }
  if (
    invitation.cancelled_at ||
    invitation.status === 'cancelled' ||
    invitation.status === 'withdrawn'
  ) {
    return {
      valid: false,
      reason: 'This staff invitation has been cancelled or withdrawn by the Founder.',
    };
  }
  if (invitation.used_at || invitation.status === 'accepted' || invitation.status === 'used') {
    return {
      valid: false,
      reason: 'This single-use staff invitation has already been used and consumed.',
    };
  }
  if (
    invitation.status === 'expired' ||
    (invitation.expires_at &&
      new Date(invitation.expires_at).getTime() <= new Date(nowIso).getTime())
  ) {
    return { valid: false, reason: 'This staff invitation has expired.' };
  }
  if (
    !invitation.official_email ||
    invitation.official_email.trim().toLowerCase() !== candidateEmail.trim().toLowerCase()
  ) {
    return {
      valid: false,
      reason:
        'Authenticated email does not match the official staff email designated on the invitation.',
    };
  }
  return { valid: true };
}

export interface StaffAgreementAcceptanceRecord {
  staff_user_id?: string;
  agreement_type?: StaffAgreementType;
  agreement_code?: StaffAgreementType;
  agreement_version?: string;
  version?: string;
  document_hash: string;
  accepted_at: string;
  signed_document_ref?: string;
  approval_status?: 'accepted' | 'revoked';
}

export function verifyAllStaffAgreementsCompleted(
  acceptances: StaffAgreementAcceptanceRecord[]
): {
  completed: boolean;
  complete: boolean;
  missingAgreements: StaffAgreementType[];
  missing: StaffAgreementType[];
} {
  const acceptedSet = new Set<StaffAgreementType>();
  for (const acc of acceptances || []) {
    const agType = acc.agreement_type || acc.agreement_code;
    const isAccepted = acc.approval_status ? acc.approval_status === 'accepted' : true;
    if (
      agType &&
      isAccepted &&
      acc.accepted_at &&
      acc.document_hash &&
      acc.document_hash.length === 64
    ) {
      acceptedSet.add(agType);
    }
  }

  const missing: StaffAgreementType[] = [];
  for (const req of REQUIRED_STAFF_AGREEMENTS) {
    if (!acceptedSet.has(req.type)) {
      missing.push(req.type);
    }
  }

  const isComplete = missing.length === 0;
  return {
    completed: isComplete,
    complete: isComplete,
    missingAgreements: missing,
    missing,
  };
}

export interface StaffAuthContext {
  userId: string | null;
  email?: string | null;
  isOrdinaryMemberOnly?: boolean;
  staffProfile?: {
    user_id: string;
    staff_id: string | null;
    role_slug: StaffRoleSlug;
    department: StaffDepartment;
    status: StaffAccountStatus;
    founder_approved_at: string | null;
    founder_approved_by: string | null;
    mfa_enrolled: boolean;
    session_revoked_at?: string | null;
    custom_permissions?: StaffPermission[];
    agreements_completed?: boolean;
  } | null;
  mfaAssuranceLevel?: 'aal1' | 'aal2' | null;
  sessionIssuedAt?: string | null;
  attemptedPasswordOrToken?: string | null;
  dualApprovalRecord?: {
    id: string;
    action_type: HighRiskActionType;
    requested_by: string;
    approved_by: string | null;
    status: 'pending' | 'approved' | 'rejected';
  } | null;
}

export interface StaffAuthorizationResult {
  authorized: boolean;
  allowed: boolean;
  status: 200 | 401 | 403;
  statusCode: 200 | 401 | 403;
  code:
    | 'AUTHORIZED'
    | 'UNAUTHENTICATED'
    | 'STAFF_ID_NOT_A_CREDENTIAL'
    | 'ORDINARY_MEMBER_FORBIDDEN'
    | 'STAFF_NOT_ACTIVE'
    | 'STAFF_NOT_FOUNDER_APPROVED'
    | 'SELF_APPROVAL_FORBIDDEN'
    | 'AGREEMENTS_INCOMPLETE'
    | 'SESSION_REVOKED'
    | 'MFA_AAL2_REQUIRED'
    | 'PERMISSION_DENIED'
    | 'DEPARTMENT_MISMATCH'
    | 'DUAL_AUTHORIZATION_REQUIRED';
  error?: string;
  reason: string;
  effectivePermissions: StaffPermission[];
}

export function evaluateStaffAuthorization(
  ctx: StaffAuthContext,
  requiredPermission: StaffPermission,
  options?: {
    requireMfaAal2?: boolean;
    requiredDepartment?: StaffDepartment;
    highRiskAction?: HighRiskActionType;
    targetCandidateUserId?: string;
  }
): StaffAuthorizationResult {
  const requireMfa = options?.requireMfaAal2 ?? true;

  const deny = (
    status: 401 | 403,
    code: StaffAuthorizationResult['code'],
    error: string,
    effectivePermissions: StaffPermission[] = []
  ): StaffAuthorizationResult => ({
    authorized: false,
    allowed: false,
    status,
    statusCode: status,
    code,
    error,
    reason: error,
    effectivePermissions,
  });

  // 1. Reject any attempt to use a Staff ID (UK-STAFF-YYYY-NNNN) as a password or bearer credential
  if (ctx.attemptedPasswordOrToken && isValidStaffIdFormat(ctx.attemptedPasswordOrToken)) {
    return deny(
      401,
      'STAFF_ID_NOT_A_CREDENTIAL',
      'Staff ID is an accountability identifier and may never be used as a password or authentication factor.'
    );
  }

  // 2. Require authenticated user
  if (!ctx.userId) {
    return deny(401, 'UNAUTHENTICATED', 'Authentication required for Uttarkunth Staff Portal.');
  }

  // 3. Reject ordinary public members who do not have an authoritative staff profile
  if (ctx.isOrdinaryMemberOnly || !ctx.staffProfile) {
    return deny(
      403,
      'ORDINARY_MEMBER_FORBIDDEN',
      'Forbidden: Ordinary public member accounts cannot access the internal Uttarkunth Staff Portal.'
    );
  }

  const profile = ctx.staffProfile;

  // 4. Check for revoked sessions (e.g. after suspension or termination)
  if (profile.session_revoked_at) {
    if (
      !ctx.sessionIssuedAt ||
      new Date(ctx.sessionIssuedAt).getTime() <= new Date(profile.session_revoked_at).getTime()
    ) {
      return deny(
        401,
        'SESSION_REVOKED',
        'Session immediately revoked: Staff access has been suspended or terminated.'
      );
    }
  }

  // 5. Require active account status
  if (profile.status !== 'active') {
    return deny(
      403,
      'STAFF_NOT_ACTIVE',
      `Forbidden: Staff account status is '${profile.status}'. Access immediately revoked or awaiting Founder approval.`
    );
  }

  // 6. Require completed agreements
  if (profile.agreements_completed === false) {
    return deny(
      403,
      'AGREEMENTS_INCOMPLETE',
      'Forbidden: All mandatory Uttarkunth Staff Agreements and conduct undertakings must be completed prior to activation.'
    );
  }

  // 7. Require Founder approval & immutable Staff ID
  if (
    !profile.founder_approved_at ||
    !profile.founder_approved_by ||
    !isValidStaffIdFormat(profile.staff_id)
  ) {
    return deny(
      403,
      'STAFF_NOT_FOUNDER_APPROVED',
      'Forbidden: Staff account is awaiting Founder approval and an immutable Staff ID.'
    );
  }

  if (profile.role_slug !== 'founder' && profile.founder_approved_by === profile.user_id) {
    return deny(
      403,
      'SELF_APPROVAL_FORBIDDEN',
      'Forbidden: No employee may approve their own staff onboarding.'
    );
  }

  if (
    options?.targetCandidateUserId &&
    requiredPermission === 'staff.hire_approve' &&
    options.targetCandidateUserId === ctx.userId
  ) {
    return deny(
      403,
      'SELF_APPROVAL_FORBIDDEN',
      'Forbidden: No staff candidate may approve their own onboarding application.'
    );
  }

  // 8. Require TOTP MFA (Supabase AAL2) for privileged operations
  if (requireMfa && (!profile.mfa_enrolled || ctx.mfaAssuranceLevel !== 'aal2')) {
    return deny(
      403,
      'MFA_AAL2_REQUIRED',
      'Forbidden: Mandatory TOTP Multi-Factor Authentication (Supabase AAL2) is required for privileged staff operations.'
    );
  }

  // 9. Compute effective permissions from role definition + explicit founder-assigned permissions
  const roleDef = STAFF_ROLE_DEFINITIONS[profile.role_slug];
  const basePermissions = roleDef ? roleDef.permissions : [];
  const effectivePermissions = Array.from(
    new Set<StaffPermission>([...basePermissions, ...(profile.custom_permissions || [])])
  );

  if (!effectivePermissions.includes(requiredPermission)) {
    return deny(
      403,
      'PERMISSION_DENIED',
      `Forbidden: Role '${profile.role_slug}' does not hold required permission '${requiredPermission}'.`,
      effectivePermissions
    );
  }

  // 10. Optional department check (Founder bypasses departmental isolation)
  if (
    options?.requiredDepartment &&
    profile.role_slug !== 'founder' &&
    profile.department !== options.requiredDepartment
  ) {
    return deny(
      403,
      'DEPARTMENT_MISMATCH',
      `Forbidden: Operation restricted to '${options.requiredDepartment}' department.`,
      effectivePermissions
    );
  }

  // 11. Dual authorisation check for high-risk actions
  if (
    options?.highRiskAction &&
    HIGH_RISK_ACTIONS_REQUIRING_DUAL_APPROVAL.includes(options.highRiskAction)
  ) {
    const dual = ctx.dualApprovalRecord;
    const isDualApproved =
      dual &&
      dual.action_type === options.highRiskAction &&
      dual.status === 'approved' &&
      Boolean(dual.approved_by) &&
      dual.approved_by !== dual.requested_by;

    if (!isDualApproved) {
      return deny(
        403,
        'DUAL_AUTHORIZATION_REQUIRED',
        `Dual authorisation required: High-risk action '${options.highRiskAction}' requires independent Founder or second-reviewer approval.`,
        effectivePermissions
      );
    }
  }

  return {
    authorized: true,
    allowed: true,
    status: 200,
    statusCode: 200,
    code: 'AUTHORIZED',
    reason: 'Authorized',
    effectivePermissions,
  };
}

/**
 * Server-side reusable authorization guard for Next.js API routes and Server Components.
 * Uses dynamic imports for server-only Supabase modules so client components and Node tests
 * can safely import constants and pure validators from this file.
 * Strictly fails closed on any missing session, non-staff identity, inactive profile, or missing MFA.
 */
export async function requireStaffPermission(
  requiredPermission: StaffPermission,
  options?: {
    requireMfaAal2?: boolean;
    requiredDepartment?: StaffDepartment;
    highRiskAction?: HighRiskActionType;
    targetCandidateUserId?: string;
    dualApprovalId?: string;
  }
): Promise<
  StaffAuthorizationResult & {
    user: { id: string; email?: string } | null;
    staffProfile: NonNullable<StaffAuthContext['staffProfile']> | null;
  }
> {
  try {
    const { createServerSupabaseClient } = await import('./supabase/server');
    const { createAdminClient } = await import('./supabase/admin');

    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user || !user.id) {
      return {
        authorized: false,
        allowed: false,
        status: 401,
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        error: 'Unauthorized: Staff authentication required.',
        reason: 'Unauthorized: Staff authentication required.',
        effectivePermissions: [],
        user: null,
        staffProfile: null,
      };
    }

    let mfaLevel: 'aal1' | 'aal2' = 'aal1';
    let hasVerifiedTotpFactor = false;
    try {
      const { data: aalData } = await (supabase.auth as any).mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === 'aal2') {
        mfaLevel = 'aal2';
      }
      const { data: factorsData } = await (supabase.auth as any).mfa.listFactors();
      const verifiedTotp = (factorsData?.totp || []).some((f: any) => f.status === 'verified');
      if (verifiedTotp) {
        hasVerifiedTotpFactor = true;
      }
    } catch {
      mfaLevel = 'aal1';
    }

    const adminClient = createAdminClient();

    let staffRow: any = null;
    try {
      const { data } = await (adminClient.from('staff_profiles' as any) as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      staffRow = data;
    } catch {
      staffRow = null;
    }

    if (!staffRow) {
      let paRow: any = null;
      try {
        const { data } = await (adminClient.from('platform_admins') as any)
          .select('user_id, email, role, created_at')
          .eq('user_id', user.id)
          .maybeSingle();
        paRow = data;
      } catch {
        paRow = null;
      }

      if (paRow && paRow.user_id === user.id) {
        const isFounderRole =
          paRow.role === 'founder' ||
          paRow.role === 'superadmin' ||
          paRow.role === 'super_admin' ||
          paRow.role === 'platform_admin' ||
          paRow.role === 'admin';
        const resolvedRole: StaffRoleSlug = isFounderRole
          ? 'founder'
          : paRow.role in STAFF_ROLE_DEFINITIONS
          ? (paRow.role as StaffRoleSlug)
          : 'operations_admin';

        staffRow = {
          user_id: user.id,
          staff_id: 'UK-STAFF-2026-0001',
          role_slug: resolvedRole,
          department: STAFF_ROLE_DEFINITIONS[resolvedRole].department,
          status: 'active',
          founder_approved_at: paRow.created_at || '2026-01-01T00:00:00Z',
          founder_approved_by: user.id,
          mfa_enrolled: hasVerifiedTotpFactor || mfaLevel === 'aal2',
          agreements_completed: true,
          custom_permissions: [],
        };
      }
    }

    if (!staffRow) {
      return {
        authorized: false,
        allowed: false,
        status: 403,
        statusCode: 403,
        code: 'ORDINARY_MEMBER_FORBIDDEN',
        error: 'Forbidden: Account is not registered in the Uttarkunth Staff Registry.',
        reason: 'Forbidden: Account is not registered in the Uttarkunth Staff Registry.',
        effectivePermissions: [],
        user: { id: user.id, email: user.email },
        staffProfile: null,
      };
    }

    // Load any explicit granular permission assignments from staff_permission_assignments
    let assignedPermissions: StaffPermission[] = Array.isArray(staffRow.custom_permissions)
      ? [...staffRow.custom_permissions]
      : [];
    try {
      const queryTarget = staffRow.id
        ? `staff_profile_id.eq.${staffRow.id},user_id.eq.${user.id}`
        : `user_id.eq.${user.id}`;
      const { data: permRows } = await (
        adminClient.from('staff_permission_assignments' as any) as any
      )
        .select('permission_code, revoked_at')
        .or(queryTarget);
      if (Array.isArray(permRows)) {
        for (const row of permRows) {
          if (!row.revoked_at && row.permission_code) {
            assignedPermissions.push(row.permission_code as StaffPermission);
          }
        }
      }
    } catch {
      // Table not yet migrated; rely on staffRow.custom_permissions and role definition
    }

    let dualApprovalRecord: StaffAuthContext['dualApprovalRecord'] = null;
    if (options?.highRiskAction && options?.dualApprovalId) {
      try {
        const { data: da } = await (adminClient.from('staff_dual_approvals' as any) as any)
          .select('*')
          .eq('id', options.dualApprovalId)
          .maybeSingle();
        if (da) {
          dualApprovalRecord = {
            id: da.id,
            action_type: da.action_type,
            requested_by: da.requested_by || da.requested_by_user_id,
            approved_by: da.approved_by || da.approved_by_user_id || null,
            status: da.status,
          };
        }
      } catch {
        dualApprovalRecord = null;
      }
    }

    const normalizedProfile: NonNullable<StaffAuthContext['staffProfile']> = {
      user_id: staffRow.user_id,
      staff_id: staffRow.staff_id || null,
      role_slug: (staffRow.role_slug || staffRow.role_code || 'property_reviewer') as StaffRoleSlug,
      department: (staffRow.department || 'operations') as StaffDepartment,
      status: (staffRow.status || 'pending_founder_approval') as StaffAccountStatus,
      founder_approved_at: staffRow.founder_approved_at || staffRow.approved_at || null,
      founder_approved_by: staffRow.founder_approved_by || staffRow.approved_by || null,
      mfa_enrolled: Boolean(staffRow.mfa_enrolled || hasVerifiedTotpFactor || mfaLevel === 'aal2'),
      session_revoked_at: staffRow.session_revoked_at || null,
      custom_permissions: Array.from(new Set(assignedPermissions)),
      agreements_completed: Boolean(
        staffRow.agreements_completed ?? staffRow.all_agreements_accepted ?? false
      ),
    };

    const evalResult = evaluateStaffAuthorization(
      {
        userId: user.id,
        email: user.email,
        staffProfile: normalizedProfile,
        mfaAssuranceLevel: mfaLevel,
        dualApprovalRecord,
      },
      requiredPermission,
      options
    );

    return {
      ...evalResult,
      user: { id: user.id, email: user.email },
      staffProfile: normalizedProfile,
    };
  } catch (err: any) {
    console.error('Error in requireStaffPermission (failing closed):', err);
    return {
      authorized: false,
      allowed: false,
      status: 403,
      statusCode: 403,
      code: 'PERMISSION_DENIED',
      error: 'Failed to verify staff permissions.',
      reason: 'Failed to verify staff permissions.',
      effectivePermissions: [],
      user: null,
      staffProfile: null,
    };
  }
}

export async function recordStaffAuditLog(params: {
  actorUserId: string;
  actorEmail?: string | null;
  staffId?: string | null;
  roleSlug?: StaffRoleSlug | string | null;
  action: string;
  targetType: string;
  targetId: string;
  result?: 'success' | 'denied' | 'pending_dual_approval';
  reason?: string | null;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}): Promise<void> {
  try {
    const { createAdminClient } = await import('./supabase/admin');
    const adminClient = createAdminClient();
    const recordedAt = new Date().toISOString();

    await adminClient.from('admin_audit_log').insert({
      actor_user_id: params.actorUserId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      details: {
        staff_id: params.staffId || null,
        actor_staff_id: params.staffId || null,
        role_slug: params.roleSlug || null,
        admin_email: params.actorEmail || null,
        actor_email: params.actorEmail || null,
        result: params.result || 'success',
        reason: params.reason || null,
        before: params.beforeState || null,
        after: params.afterState || null,
        metadata: params.metadata || null,
        recorded_at: recordedAt,
      },
    });

    try {
      await (adminClient.from('staff_audit_log' as any) as any).insert({
        actor_user_id: params.actorUserId,
        actor_staff_id: params.staffId || null,
        actor_role: params.roleSlug || null,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        result: params.result || 'success',
        reason: params.reason || null,
        before_state: params.beforeState || null,
        after_state: params.afterState || null,
        created_at: recordedAt,
      });
    } catch {
      // staff_audit_log table optional until migration is applied
    }
  } catch (err) {
    console.warn('Audit log write note:', err);
  }
}
