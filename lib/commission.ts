import crypto from 'crypto';

/**
 * Uttarkunth Commission Calculation Architecture
 * 
 * Commercial Policy:
 * Formal host commission arrangements remain subject to separate bilateral approval.
 * Platform commercial rates are NOT promised or activated by default.
 * When a formally authorized and host-accepted agreement exists in the database
 * (with verified accepted_at timestamp and terms_version), snapshots are calculated
 * strictly according to that agreement's terms. Otherwise, commission remains deferred.
 */

export interface LegalTermsDocument {
  version: string;
  documentHash: string; // SHA-256 of the authoritative terms text
  title: string;
  effectiveDate: string;
}

export const OFFICIAL_LEGAL_TERMS_DOCUMENTS: Record<string, LegalTermsDocument> = {
  '2026.1': {
    version: '2026.1',
    documentHash: '54f1d67ee1294739557d9602d7b1ab0d819819de7b60d05a5a9f8a4676665af8',
    title: 'Uttarkunth Commercial Host Partnership Agreement v2026.1',
    effectiveDate: '2026-01-01'
  }
};

export interface CommissionSnapshot {
  percent: number;
  amount: number;
  hostPayout: number;
  isIntroductory: boolean;
  isActivated: boolean;
  status: 'active' | 'deferred';
}

export interface HostAgreementTerms {
  agreement_start?: string | null;
  agreement_end?: string | null;
  intro_period_months?: number | null;
  intro_commission_percent?: number | null;
  standard_commission_percent?: number | null;
  commission_percent?: number | null;
  agreement_status?: string | null;
  accepted_at?: string | null;
  terms_version?: string | null;
}

export function computeCommission(
  totalEstimate: number,
  agreement?: HostAgreementTerms | null,
  bookingDate?: string | Date | null
): CommissionSnapshot {
  const estimate = Math.max(0, Number(totalEstimate || 0));

  // Commission activates strictly and solely when:
  // 1. Agreement exists and is explicitly 'active'
  // 2. Agreement start date is specified
  // 3. Demonstrable host acceptance is recorded with a non-null accepted_at timestamp
  if (
    !agreement ||
    agreement.agreement_status !== 'active' ||
    !agreement.agreement_start ||
    !agreement.accepted_at
  ) {
    return {
      percent: 0,
      amount: 0,
      hostPayout: estimate,
      isIntroductory: false,
      isActivated: false,
      status: 'deferred'
    };
  }

  const refDate = bookingDate ? new Date(bookingDate) : new Date();
  const start = new Date(agreement.agreement_start);

  // If before agreement start or after agreement end, agreement is not in effect
  if (refDate < start) {
    return {
      percent: 0,
      amount: 0,
      hostPayout: estimate,
      isIntroductory: false,
      isActivated: false,
      status: 'deferred'
    };
  }

  if (agreement.agreement_end && refDate > new Date(agreement.agreement_end)) {
    return {
      percent: 0,
      amount: 0,
      hostPayout: estimate,
      isIntroductory: false,
      isActivated: false,
      status: 'deferred'
    };
  }

  const introMonths = Number(agreement.intro_period_months ?? 0);
  const introRate = agreement.intro_commission_percent != null ? Number(agreement.intro_commission_percent) : null;
  const standardRate = agreement.standard_commission_percent != null 
    ? Number(agreement.standard_commission_percent) 
    : (agreement.commission_percent != null ? Number(agreement.commission_percent) : 0);

  const introEndDate = new Date(start);
  introEndDate.setMonth(introEndDate.getMonth() + introMonths);

  const isIntroductory = introMonths > 0 && introRate !== null && refDate < introEndDate;
  const percent = isIntroductory ? (introRate ?? standardRate) : standardRate;
  const amount = Math.round((estimate * percent) / 100);
  const hostPayout = Math.max(0, estimate - amount);

  return {
    percent,
    amount,
    hostPayout,
    isIntroductory,
    isActivated: true,
    status: 'active'
  };
}

/**
 * Computes an unambiguous, deterministic SHA-256 digest of canonical host agreement terms.
 * Keys are strictly sorted, null values normalized, numbers converted to fixed 2-decimal representation.
 */
export function generateCanonicalAgreementDigest(agreement: {
  id: string;
  property_id: string;
  signatory_user_id: string;
  agreement_start: string;
  agreement_end?: string | null;
  commission_percent?: number | string | null;
  standard_commission_percent?: number | string | null;
  intro_commission_percent?: number | string | null;
  intro_period_months?: number | null;
  terms_version: string;
  document_hash?: string | null;
}): { digest: string; canonicalPayload: string } {
  const docHash = agreement.document_hash || OFFICIAL_LEGAL_TERMS_DOCUMENTS[agreement.terms_version]?.documentHash;
  if (!docHash) {
    throw new Error(`Unregistered legal terms version: ${agreement.terms_version}`);
  }

  // Unambiguous, stable parameter sequence (strictly sorted alphabetically by key)
  const canonicalEntries = [
    ['agreement_end', agreement.agreement_end ?? 'NONE'],
    ['agreement_id', agreement.id],
    ['agreement_start', agreement.agreement_start],
    ['commission_percent', agreement.commission_percent != null ? Number(agreement.commission_percent).toFixed(2) : 'NONE'],
    ['document_hash', docHash],
    ['intro_commission_percent', agreement.intro_commission_percent != null ? Number(agreement.intro_commission_percent).toFixed(2) : 'NONE'],
    ['intro_period_months', agreement.intro_period_months != null ? String(agreement.intro_period_months) : 'NONE'],
    ['property_id', agreement.property_id],
    ['signatory_user_id', agreement.signatory_user_id],
    ['standard_commission_percent', agreement.standard_commission_percent != null ? Number(agreement.standard_commission_percent).toFixed(2) : 'NONE'],
    ['terms_version', agreement.terms_version]
  ];

  const canonicalPayload = canonicalEntries.map(([k, v]) => `${k}=${v}`).join('&');
  const digest = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');

  return { digest, canonicalPayload };
}
