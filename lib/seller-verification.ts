// ============================================================================
// UTTARKUNTH PHASE 2 — SELLER BRAND REGISTRATION, GSTIN & LICENCE VERIFICATION
// ============================================================================

import type { StaffPermission, StaffRoleSlug } from './staff-rbac-shared';

export type BusinessConstitution =
  | 'sole_proprietorship'
  | 'partnership'
  | 'llp'
  | 'private_limited'
  | 'public_limited'
  | 'cooperative_society'
  | 'self_help_group'
  | 'individual_artisan'
  | 'trust_or_ngo';

export type TaxRegistrationStatus =
  | 'gst_registered'
  | 'composition_scheme'
  | 'gst_exempt_artisan'
  | 'unregistered_small_producer'
  | 'unregistered_artisan'
  | 'exempt_handicraft';

export type ProductCategoryCode =
  | 'food'
  | 'organic'
  | 'textiles'
  | 'crafts'
  | 'himalayan'
  | 'lifestyle'
  | 'art'
  | 'sustainable'
  | 'mandatory_standards';

export type SellerVerificationDocType =
  | 'fssai_licence'
  | 'food_product_declaration'
  | 'ayush_herbal_licence'
  | 'organic_npop_pgs_certificate'
  | 'legal_metrology_declaration'
  | 'bis_certificate'
  | 'maker_identity'
  | 'workshop_cooperative_evidence'
  | 'provenance_evidence'
  | 'gst_registration_certificate'
  | 'business_registration_proof'
  | 'trademark_certificate_optional';

export type SellerDocumentType = SellerVerificationDocType;

export interface CategoryLicenceRequirement {
  categorySlug: string;
  category: ProductCategoryCode;
  categoryLabel: string;
  title: string;
  regulatoryBasis: string;
  regulatoryNotes: string;
  mandatoryDocuments: SellerVerificationDocType[];
  requiredDocuments: SellerVerificationDocType[];
  conditionalDocuments: SellerVerificationDocType[];
  optionalDocuments: SellerVerificationDocType[];
  notes: string;
}

export const OFFICIAL_GST_PORTAL_SEARCH_URL = 'https://services.gst.gov.in/services/searchtp';

export const SELLER_DOCUMENT_META: Record<
  SellerVerificationDocType,
  {
    title: string;
    purpose: string;
    retentionYears: number;
    requiresExpiryDate: boolean;
  }
> = {
  fssai_licence: {
    title: 'FSSAI Registration / Food Safety Licence',
    purpose:
      'Statutory compliance under Food Safety and Standards Act, 2006 for edible mountain harvests and food products.',
    retentionYears: 7,
    requiresExpiryDate: true,
  },
  food_product_declaration: {
    title: 'Food Product Ingredients, Batch & Shelf-Life Declaration',
    purpose: 'Consumer food safety and allergen transparency for packaged or raw edible goods.',
    retentionYears: 5,
    requiresExpiryDate: false,
  },
  ayush_herbal_licence: {
    title: 'AYUSH / State Herbal & Botanical Regulatory Permission',
    purpose: 'Regulatory compliance for medicinal, wellness, or regulated botanical preparations.',
    retentionYears: 7,
    requiresExpiryDate: true,
  },
  organic_npop_pgs_certificate: {
    title: 'Organic Certification (NPOP / PGS-India) or Lab Purity Report',
    purpose: 'Substantiates certified organic claims where marketed as certified organic.',
    retentionYears: 5,
    requiresExpiryDate: true,
  },
  legal_metrology_declaration: {
    title: 'Legal Metrology (Packaged Commodities) Declaration',
    purpose:
      'Verifies net quantity, MRP, month/year of packing, and consumer care details under Legal Metrology Rules.',
    retentionYears: 5,
    requiresExpiryDate: false,
  },
  bis_certificate: {
    title: 'Bureau of Indian Standards (BIS) Certification',
    purpose:
      'Mandatory Indian standard mark verification strictly for product categories notified under BIS Quality Control Orders.',
    retentionYears: 7,
    requiresExpiryDate: true,
  },
  maker_identity: {
    title: 'Maker / Authorised Representative Identity Proof',
    purpose:
      'Verifies the real human artisan, weaver, farmer, or authorised signatory behind the brand (Passport, Voter ID, Driving Licence, PAN, or Artisan Card).',
    retentionYears: 5,
    requiresExpiryDate: false,
  },
  workshop_cooperative_evidence: {
    title: 'Workshop, Loom, Apiary, or Cooperative Society Evidence',
    purpose: 'Confirms genuine production facility or cooperative registration in the Himalayan region.',
    retentionYears: 5,
    requiresExpiryDate: false,
  },
  provenance_evidence: {
    title: 'Regional Provenance & Authentic Sourcing Evidence',
    purpose:
      'Demonstrates authentic Himalayan origin (GI tag registration, Handloom Mark, Silk Mark, forest/panchayat sourcing record, or craft documentation).',
    retentionYears: 5,
    requiresExpiryDate: false,
  },
  gst_registration_certificate: {
    title: 'GST Registration Certificate (Form GST REG-06)',
    purpose:
      'Confirms active GSTIN registration and legal/trade name alignment for GST-registered sellers.',
    retentionYears: 8,
    requiresExpiryDate: false,
  },
  business_registration_proof: {
    title: 'Business Constitution / Cooperative / MSME Udyam Certificate',
    purpose:
      'Establishes legal entity constitution for partnerships, LLPs, companies, or registered cooperatives.',
    retentionYears: 8,
    requiresExpiryDate: false,
  },
  trademark_certificate_optional: {
    title: 'Brand Trademark Certificate (Optional — Never Mandatory)',
    purpose: 'Optional brand protection evidence if the seller holds a registered trademark.',
    retentionYears: 5,
    requiresExpiryDate: true,
  },
};

export const SELLER_DOCUMENT_LABELS: Record<SellerVerificationDocType, string> = {
  fssai_licence: SELLER_DOCUMENT_META.fssai_licence.title,
  food_product_declaration: SELLER_DOCUMENT_META.food_product_declaration.title,
  ayush_herbal_licence: SELLER_DOCUMENT_META.ayush_herbal_licence.title,
  organic_npop_pgs_certificate: SELLER_DOCUMENT_META.organic_npop_pgs_certificate.title,
  legal_metrology_declaration: SELLER_DOCUMENT_META.legal_metrology_declaration.title,
  bis_certificate: SELLER_DOCUMENT_META.bis_certificate.title,
  maker_identity: SELLER_DOCUMENT_META.maker_identity.title,
  workshop_cooperative_evidence: SELLER_DOCUMENT_META.workshop_cooperative_evidence.title,
  provenance_evidence: SELLER_DOCUMENT_META.provenance_evidence.title,
  gst_registration_certificate: SELLER_DOCUMENT_META.gst_registration_certificate.title,
  business_registration_proof: SELLER_DOCUMENT_META.business_registration_proof.title,
  trademark_certificate_optional: SELLER_DOCUMENT_META.trademark_certificate_optional.title,
};

export const CATEGORY_LICENCE_REQUIREMENTS: Record<string, CategoryLicenceRequirement> = {
  food: {
    categorySlug: 'food',
    category: 'food',
    categoryLabel: 'Mountain Foods, Honey, Preserves & Culinary',
    title: 'Mountain Foods, Honey, Preserves & Culinary',
    regulatoryBasis:
      'Food Safety and Standards Act, 2006 (FSSAI) & Legal Metrology (Packaged Commodities) Rules',
    regulatoryNotes:
      'FSSAI registration/licence is mandatory for all food and edible items. Never required for non-food textiles or crafts.',
    mandatoryDocuments: ['fssai_licence', 'food_product_declaration', 'maker_identity'],
    requiredDocuments: ['fssai_licence', 'food_product_declaration', 'maker_identity'],
    conditionalDocuments: ['legal_metrology_declaration', 'organic_npop_pgs_certificate'],
    optionalDocuments: ['provenance_evidence', 'trademark_certificate_optional'],
    notes:
      'FSSAI registration/licence is mandatory for all food and edible items. Never required for non-food textiles or crafts.',
  },
  organic: {
    categorySlug: 'organic',
    category: 'organic',
    categoryLabel: 'Herbal, Botanical & Certified Organic Harvests',
    title: 'Herbal, Botanical & Certified Organic Harvests',
    regulatoryBasis: 'AYUSH / State Botanical Rules, NPOP / PGS-India Organic Standards',
    regulatoryNotes:
      'Requires applicable regulatory licence if marketed as herbal/medicinal or certified organic.',
    mandatoryDocuments: ['maker_identity', 'provenance_evidence', 'organic_npop_pgs_certificate'],
    requiredDocuments: ['maker_identity', 'provenance_evidence', 'organic_npop_pgs_certificate'],
    conditionalDocuments: ['ayush_herbal_licence', 'fssai_licence'],
    optionalDocuments: ['workshop_cooperative_evidence', 'trademark_certificate_optional'],
    notes: 'Requires applicable regulatory licence if marketed as herbal/medicinal or certified organic.',
  },
  textiles: {
    categorySlug: 'textiles',
    category: 'textiles',
    categoryLabel: 'Handloom Shawls, Yak/Sheep Wool & Himalayan Weaves',
    title: 'Handloom Shawls, Yak/Sheep Wool & Himalayan Weaves',
    regulatoryBasis: 'Handloom Reservation & Artisan Provenance Verification',
    regulatoryNotes:
      'Focuses on loom/cooperative authenticity and regional provenance. Never demands food or BIS licences.',
    mandatoryDocuments: ['maker_identity', 'workshop_cooperative_evidence', 'provenance_evidence'],
    requiredDocuments: ['maker_identity', 'workshop_cooperative_evidence', 'provenance_evidence'],
    conditionalDocuments: [],
    optionalDocuments: ['business_registration_proof', 'trademark_certificate_optional'],
    notes:
      'Focuses on loom/cooperative authenticity and regional provenance. Never demands food or BIS licences.',
  },
  crafts: {
    categorySlug: 'crafts',
    category: 'crafts',
    categoryLabel: 'Woodcarving, Metalwork, Basketry & Traditional Handicrafts',
    title: 'Woodcarving, Metalwork, Basketry & Traditional Handicrafts',
    regulatoryBasis: 'Artisan Identity & Regional Craft Provenance Standard',
    regulatoryNotes:
      'Requires maker identity, workshop/cooperative details, and regional provenance evidence.',
    mandatoryDocuments: ['maker_identity', 'workshop_cooperative_evidence', 'provenance_evidence'],
    requiredDocuments: ['maker_identity', 'workshop_cooperative_evidence', 'provenance_evidence'],
    conditionalDocuments: [],
    optionalDocuments: ['business_registration_proof', 'trademark_certificate_optional'],
    notes: 'Requires maker identity, workshop/cooperative details, and regional provenance evidence.',
  },
  himalayan: {
    categorySlug: 'himalayan',
    category: 'himalayan',
    categoryLabel: 'Indigenous Himalayan Heritage Goods',
    title: 'Indigenous Himalayan Heritage Goods',
    regulatoryBasis: 'Artisan Identity & Regional Provenance Standard',
    regulatoryNotes: 'Requires authentic village/valley provenance and maker verification.',
    mandatoryDocuments: ['maker_identity', 'workshop_cooperative_evidence', 'provenance_evidence'],
    requiredDocuments: ['maker_identity', 'workshop_cooperative_evidence', 'provenance_evidence'],
    conditionalDocuments: ['legal_metrology_declaration'],
    optionalDocuments: ['trademark_certificate_optional'],
    notes: 'Requires authentic village/valley provenance and maker verification.',
  },
  lifestyle: {
    categorySlug: 'lifestyle',
    category: 'lifestyle',
    categoryLabel: 'Packaged Consumer & Mountain Lifestyle Goods',
    title: 'Packaged Consumer & Mountain Lifestyle Goods',
    regulatoryBasis: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    regulatoryNotes:
      'Packaged retail commodities require Legal Metrology declarations; BIS certification applies only if the item falls under a mandatory BIS QCO.',
    mandatoryDocuments: ['maker_identity', 'legal_metrology_declaration'],
    requiredDocuments: ['maker_identity', 'legal_metrology_declaration'],
    conditionalDocuments: ['bis_certificate'],
    optionalDocuments: ['provenance_evidence', 'trademark_certificate_optional'],
    notes:
      'Packaged retail commodities require Legal Metrology declarations; BIS certification applies only if the item falls under a mandatory BIS QCO.',
  },
  art: {
    categorySlug: 'art',
    category: 'art',
    categoryLabel: 'Thangka, Pahari Miniature & Fine Mountain Art',
    title: 'Thangka, Pahari Miniature & Fine Mountain Art',
    regulatoryBasis: 'Artist Identity & Provenance Attribution',
    regulatoryNotes: 'Verifies original artist attribution and cultural provenance.',
    mandatoryDocuments: ['maker_identity', 'provenance_evidence'],
    requiredDocuments: ['maker_identity', 'provenance_evidence'],
    conditionalDocuments: [],
    optionalDocuments: ['workshop_cooperative_evidence', 'trademark_certificate_optional'],
    notes: 'Verifies original artist attribution and cultural provenance.',
  },
  sustainable: {
    categorySlug: 'sustainable',
    category: 'sustainable',
    categoryLabel: 'Upcycled, Natural Fibre & Eco-Stewardship Goods',
    title: 'Upcycled, Natural Fibre & Eco-Stewardship Goods',
    regulatoryBasis: 'Maker Identity & Material Provenance Verification',
    regulatoryNotes: 'Verifies natural material sourcing and maker identity.',
    mandatoryDocuments: ['maker_identity', 'provenance_evidence'],
    requiredDocuments: ['maker_identity', 'provenance_evidence'],
    conditionalDocuments: ['legal_metrology_declaration'],
    optionalDocuments: ['workshop_cooperative_evidence', 'trademark_certificate_optional'],
    notes: 'Verifies natural material sourcing and maker identity.',
  },
  mandatory_standards: {
    categorySlug: 'mandatory_standards',
    category: 'mandatory_standards',
    categoryLabel: 'Goods Subject to Mandatory BIS Standards',
    title: 'Goods Subject to Mandatory BIS Standards',
    regulatoryBasis: 'Bureau of Indian Standards Act, 2016 & Applicable Quality Control Orders',
    regulatoryNotes:
      'Mandatory BIS certification is required strictly when the product category falls under a statutory Quality Control Order.',
    mandatoryDocuments: ['maker_identity', 'bis_certificate', 'legal_metrology_declaration'],
    requiredDocuments: ['maker_identity', 'bis_certificate', 'legal_metrology_declaration'],
    conditionalDocuments: [],
    optionalDocuments: ['business_registration_proof', 'trademark_certificate_optional'],
    notes:
      'Mandatory BIS certification is required strictly when the product category falls under a statutory Quality Control Order.',
  },
};

export function getRequiredDocumentsForCategories(
  primaryOrArray: string | string[],
  secondaryCategories: string[] = [],
  taxStatus: TaxRegistrationStatus = 'gst_exempt_artisan'
): {
  mandatory: SellerVerificationDocType[];
  required: SellerVerificationDocType[];
  conditional: SellerVerificationDocType[];
  optional: SellerVerificationDocType[];
} {
  const baseCats = Array.isArray(primaryOrArray) ? primaryOrArray : [primaryOrArray];
  const allCats = Array.from(new Set([...baseCats, ...(secondaryCategories || [])])).filter(
    Boolean
  );
  const mandatorySet = new Set<SellerVerificationDocType>(['maker_identity']);
  const conditionalSet = new Set<SellerVerificationDocType>();
  const optionalSet = new Set<SellerVerificationDocType>(['trademark_certificate_optional']);

  for (const cat of allCats) {
    const req = CATEGORY_LICENCE_REQUIREMENTS[cat] || CATEGORY_LICENCE_REQUIREMENTS.crafts;
    req.mandatoryDocuments.forEach((d) => mandatorySet.add(d));
    req.conditionalDocuments.forEach((d) => {
      if (!mandatorySet.has(d)) conditionalSet.add(d);
    });
    req.optionalDocuments.forEach((d) => {
      if (!mandatorySet.has(d) && !conditionalSet.has(d)) optionalSet.add(d);
    });
  }

  if (taxStatus === 'gst_registered' || taxStatus === 'composition_scheme') {
    mandatorySet.add('gst_registration_certificate');
  }

  mandatorySet.delete('trademark_certificate_optional');

  const mandatoryList = Array.from(mandatorySet);
  return {
    mandatory: mandatoryList,
    required: mandatoryList,
    conditional: Array.from(conditionalSet).filter((d) => !mandatorySet.has(d)),
    optional: Array.from(optionalSet).filter(
      (d) => !mandatorySet.has(d) && !conditionalSet.has(d)
    ),
  };
}

const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

export function computeGstinCheckDigit(first14: string): string {
  let factor = 2;
  let sum = 0;
  const mod = GSTIN_CHARS.length; // 36

  for (let i = first14.length - 1; i >= 0; i--) {
    const codePoint = GSTIN_CHARS.indexOf(first14[i]);
    if (codePoint === -1) return '';
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / mod) + (addend % mod);
    sum += addend;
  }

  const remainder = sum % mod;
  const checkCodePoint = (mod - remainder) % mod;
  return GSTIN_CHARS[checkCodePoint];
}

export function validateIndianGSTIN(gstinRaw: string | null | undefined): {
  valid: boolean;
  normalized: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  error?: string;
} {
  if (!gstinRaw || typeof gstinRaw !== 'string') {
    return { valid: false, normalized: '', error: 'GSTIN is empty.' };
  }

  const normalized = gstinRaw.trim().toUpperCase();
  if (normalized.length !== 15) {
    return { valid: false, normalized, error: 'GSTIN must be exactly 15 characters long.' };
  }

  const gstinRegex =
    /^(0[1-9]|[12][0-9]|3[0-8]|97|99)[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        'GSTIN does not match the statutory 15-character Indian GST format (State Code + PAN + Entity + Z + Checksum).',
    };
  }

  const stateCode = normalized.slice(0, 2);
  if (!INDIAN_STATE_CODES[stateCode]) {
    return {
      valid: false,
      normalized,
      error: `Invalid GST state code '${stateCode}'.`,
    };
  }

  const expectedCheck = computeGstinCheckDigit(normalized.slice(0, 14));
  if (expectedCheck !== normalized[14]) {
    return {
      valid: false,
      normalized,
      error: 'GSTIN Modulo-36 checksum validation failed (invalid 15th check character).',
    };
  }

  return {
    valid: true,
    normalized,
    stateCode,
    stateName: INDIAN_STATE_CODES[stateCode],
    pan: normalized.slice(2, 12),
  };
}

export interface GstinVerificationCheckInput {
  gstin: string;
  applicantLegalBusinessName: string;
  applicantTradeName?: string | null;
  legalNameReturned: string;
  tradeNameReturned?: string | null;
  registrationStatus: 'Active' | 'Suspended' | 'Cancelled' | 'Inactive';
  verificationResult: 'verified' | 'mismatched' | 'rejected';
  reviewerUserId: string;
  supportingEvidenceRef: string;
  verificationDate?: string;
}

export function validateGstinVerificationCheck(input: GstinVerificationCheckInput): {
  allowed: boolean;
  canMarkVerified: boolean;
  error?: string;
  reason: string;
  record?: GstinVerificationCheckInput & { verificationDate: string; portalUrl: string };
} {
  const gstinValidation = validateIndianGSTIN(input.gstin);

  if (input.verificationResult === 'verified') {
    if (!gstinValidation.valid) {
      const msg = `Cannot mark GSTIN as verified: ${gstinValidation.error}`;
      return { allowed: false, canMarkVerified: false, error: msg, reason: msg };
    }

    if (input.registrationStatus !== 'Active') {
      const msg = `Cannot mark GSTIN as verified when GST Portal registration status is '${input.registrationStatus}'.`;
      return { allowed: false, canMarkVerified: false, error: msg, reason: msg };
    }

    if (!input.legalNameReturned || input.legalNameReturned.trim().length < 2) {
      const msg = 'Legal business name returned from the official GST Portal must be recorded.';
      return { allowed: false, canMarkVerified: false, error: msg, reason: msg };
    }

    const normalizeName = (s?: string | null) =>
      (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    const applicantLegalNorm = normalizeName(input.applicantLegalBusinessName);
    const applicantTradeNorm = normalizeName(input.applicantTradeName);
    const returnedLegalNorm = normalizeName(input.legalNameReturned);
    const returnedTradeNorm = normalizeName(input.tradeNameReturned);

    const legalMatches =
      applicantLegalNorm.length > 0 &&
      (applicantLegalNorm === returnedLegalNorm ||
        applicantLegalNorm.includes(returnedLegalNorm) ||
        returnedLegalNorm.includes(applicantLegalNorm));

    const tradeMatches =
      applicantTradeNorm.length > 0 &&
      returnedTradeNorm.length > 0 &&
      (applicantTradeNorm === returnedTradeNorm ||
        applicantTradeNorm.includes(returnedTradeNorm) ||
        returnedTradeNorm.includes(applicantTradeNorm));

    if (!legalMatches && !tradeMatches) {
      const msg =
        'GSTIN legal/trade name mismatch: Name returned by the GST Portal does not match the applicant legal or trade name. Cannot mark as verified.';
      return { allowed: false, canMarkVerified: false, error: msg, reason: msg };
    }

    if (!input.supportingEvidenceRef || input.supportingEvidenceRef.trim().length < 3) {
      const msg =
        'Supporting evidence reference (GST Portal search reference or certificate hash) is required.';
      return { allowed: false, canMarkVerified: false, error: msg, reason: msg };
    }
  }

  if (!input.reviewerUserId) {
    const msg = 'Reviewer staff identity is required to record GSTIN verification.';
    return { allowed: false, canMarkVerified: false, error: msg, reason: msg };
  }

  return {
    allowed: true,
    canMarkVerified: input.verificationResult === 'verified',
    reason: 'Verified',
    record: {
      ...input,
      gstin: gstinValidation.normalized || input.gstin.trim().toUpperCase(),
      verificationDate: input.verificationDate || new Date().toISOString(),
      portalUrl: OFFICIAL_GST_PORTAL_SEARCH_URL,
    },
  };
}

export const ALLOWED_PRIVATE_DOCUMENT_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_PRIVATE_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export function validatePrivateDocumentUpload(fileMeta: {
  fileName?: string;
  mimeType: string;
  sizeBytes?: number;
  fileSizeBytes?: number;
  storageBucket?: string;
  bucket?: string;
  storagePath?: string;
  isPublicUrl?: boolean;
}): { valid: boolean; error?: string; reason?: string } {
  const bytes = fileMeta.sizeBytes ?? fileMeta.fileSizeBytes ?? 0;
  const resolvedBucket = fileMeta.storageBucket || fileMeta.bucket || '';

  if (
    fileMeta.isPublicUrl ||
    (fileMeta.storagePath && /^https?:\/\//i.test(fileMeta.storagePath)) ||
    (resolvedBucket !== 'seller-verification-docs' &&
      resolvedBucket !== 'staff-hr-docs')
  ) {
    const msg =
      'Private verification documents must be stored in private buckets (seller-verification-docs or staff-hr-docs) and never with public URLs.';
    return {
      valid: false,
      error: msg,
      reason: msg,
    };
  }

  if (!ALLOWED_PRIVATE_DOCUMENT_MIMES.includes(fileMeta.mimeType as any)) {
    const msg = `Unsupported file MIME type '${fileMeta.mimeType}'. Allowed types: PDF, JPEG, PNG, WEBP.`;
    return {
      valid: false,
      error: msg,
      reason: msg,
    };
  }

  if (!Number.isFinite(bytes) || bytes <= 0) {
    const msg = 'Document file size must be greater than 0 bytes.';
    return {
      valid: false,
      error: msg,
      reason: msg,
    };
  }

  if (bytes > MAX_PRIVATE_DOCUMENT_BYTES) {
    const msg = 'Document exceeds maximum permitted size of 10 MB.';
    return {
      valid: false,
      error: msg,
      reason: msg,
    };
  }

  return { valid: true };
}

export const validateUploadedDocumentMeta = validatePrivateDocumentUpload;

/**
 * Detects authoritative MIME type from binary magic bytes.
 * Validates genuine binary format signatures for PDF, JPEG, PNG, and WEBP.
 */
export function detectMimeFromMagicBytes(buffer: Uint8Array | Buffer | ArrayBuffer): string | null {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  if (!bytes || bytes.length < 4) return null;

  // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }

  // JPEG: \xFF\xD8\xFF (0xFF, 0xD8, 0xFF)
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WEBP: RIFF....WEBP (0x52, 0x49, 0x46, 0x46 at 0..3 and 0x57, 0x45, 0x42, 0x50 at 8..11)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

/**
 * Validates that binary file payload matches genuine magic bytes and matches declared MIME type.
 */
export function validateFileMagicBytes(
  buffer: Uint8Array | Buffer | ArrayBuffer,
  declaredMime?: string
): { valid: boolean; detectedMime: string | null; error?: string } {
  const detected = detectMimeFromMagicBytes(buffer);
  if (!detected) {
    return {
      valid: false,
      detectedMime: null,
      error:
        'Invalid file format. Uploaded file fails binary magic-byte inspection (supported: genuine PDF, JPEG, PNG, WEBP).',
    };
  }

  if (declaredMime) {
    const normDeclared = declaredMime.toLowerCase().trim();
    const isJpegMatch =
      detected === 'image/jpeg' &&
      (normDeclared === 'image/jpeg' || normDeclared === 'image/jpg');
    if (detected !== normDeclared && !isJpegMatch) {
      return {
        valid: false,
        detectedMime: detected,
        error: `MIME type mismatch: declared '${declaredMime}' but binary content indicates '${detected}'.`,
      };
    }
  }

  return { valid: true, detectedMime: detected };
}

export function canAccessSellerVerificationDocument(params: {
  actorUserId: string | null;
  documentSellerUserId: string;
  accessType: 'view_status' | 'download_signed_url' | 'verify_document';
  staffContext?: {
    isActiveStaff: boolean;
    roleSlug: StaffRoleSlug;
    permissions: StaffPermission[];
    mfaAssuranceLevel?: 'aal1' | 'aal2';
  } | null;
}): { allowed: boolean; reason: string } {
  if (!params.actorUserId) {
    return {
      allowed: false,
      reason: 'Unauthenticated access to private business documents is prohibited.',
    };
  }

  if (params.staffContext && params.staffContext.isActiveStaff) {
    if (params.staffContext.roleSlug === 'support_executive') {
      return {
        allowed: false,
        reason:
          'Forbidden: Support Executives are strictly prohibited from accessing private seller verification documents.',
      };
    }

    const hasDocPermission =
      params.staffContext.permissions.includes('seller.verify_documents') ||
      params.staffContext.permissions.includes('finance.review_agreements');

    if (!hasDocPermission) {
      return {
        allowed: false,
        reason: `Forbidden: Staff role '${params.staffContext.roleSlug}' is not authorised to access private seller verification documents.`,
      };
    }

    if (
      (params.accessType === 'download_signed_url' || params.accessType === 'verify_document') &&
      params.staffContext.mfaAssuranceLevel &&
      params.staffContext.mfaAssuranceLevel !== 'aal2'
    ) {
      return {
        allowed: false,
        reason: 'Forbidden: TOTP MFA (AAL2) is required to view or verify private business documents.',
      };
    }

    return { allowed: true, reason: 'Authorized staff reviewer' };
  }

  if (params.actorUserId === params.documentSellerUserId) {
    if (params.accessType === 'verify_document') {
      return {
        allowed: false,
        reason: 'Forbidden: Sellers cannot verify or approve their own business documents.',
      };
    }
    return { allowed: true, reason: 'Document owner' };
  }

  return {
    allowed: false,
    reason:
      'Forbidden: Sellers cannot view verification documents belonging to another seller.',
  };
}

export const PROTECTED_SELLER_LEGAL_FIELDS = [
  'legal_business_name',
  'business_constitution',
  'tax_registration_status',
  'gstin',
  'registration_number',
  'registered_address',
  'status',
  'verification_status',
] as const;

export function evaluateSellerDeskUpdate(
  existingSeller: Record<string, any>,
  proposedUpdate: Record<string, any>,
  isStaffReviewer: boolean = false
): {
  allowed: boolean;
  triggersReverification: boolean;
  nextStatus: string;
  sanitizedUpdate: Record<string, any>;
  error?: string;
} {
  const forbiddenBankFields = [
    'bank_account_number',
    'ifsc_code',
    'upi_id',
    'payout_account',
    'iban',
  ];
  for (const field of forbiddenBankFields) {
    if (proposedUpdate[field] !== undefined) {
      return {
        allowed: false,
        triggersReverification: false,
        nextStatus: existingSeller.status || 'pending',
        sanitizedUpdate: {},
        error:
          'Uttarkunth does not collect bank account or payout details until a formal settlement system is introduced.',
      };
    }
  }

  if (!isStaffReviewer) {
    const changedProtectedFields = PROTECTED_SELLER_LEGAL_FIELDS.filter(
      (f) =>
        f !== 'status' &&
        f !== 'verification_status' &&
        proposedUpdate[f] !== undefined &&
        proposedUpdate[f] !== existingSeller[f]
    );

    if (changedProtectedFields.length > 0) {
      const sanitized = { ...proposedUpdate };
      delete sanitized.status;
      delete sanitized.verification_status;

      return {
        allowed: true,
        triggersReverification: true,
        nextStatus: 'pending',
        sanitizedUpdate: {
          ...sanitized,
          verification_status: 'reverification_pending',
          status: 'pending',
        },
      };
    }

    if (
      (proposedUpdate.status && proposedUpdate.status !== existingSeller.status) ||
      (proposedUpdate.verification_status &&
        proposedUpdate.verification_status !== existingSeller.verification_status)
    ) {
      return {
        allowed: false,
        triggersReverification: false,
        nextStatus: existingSeller.status || 'pending',
        sanitizedUpdate: {},
        error: 'Forbidden: Sellers cannot modify their own approval or verification status.',
      };
    }
  }

  const sanitized = { ...proposedUpdate };
  if (!isStaffReviewer) {
    delete sanitized.status;
    delete sanitized.verification_status;
  }

  return {
    allowed: true,
    triggersReverification: false,
    nextStatus: existingSeller.status || 'approved',
    sanitizedUpdate: sanitized,
  };
}
