import { z } from 'zod';

export const BookingRequestSchema = z.object({
  property_id: z.string().uuid("Invalid property identifier"),
  room_unit_id: z.string().uuid("Invalid room identifier"),
  guest_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  guest_email: z.string().trim().email("Please provide a valid email address"),
  guest_phone: z.string().trim().min(7, "Phone number is too short").max(20, "Phone number is too long"),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in must be YYYY-MM-DD"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out must be YYYY-MM-DD"),
  adults: z.coerce.number().int().min(1, "At least 1 adult is required").max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  special_requests: z.string().trim().max(500).optional().default(""),
}).refine(data => data.check_out > data.check_in, {
  message: "Check-out date must be after check-in date",
  path: ["check_out"]
});

export type BookingRequestInput = z.infer<typeof BookingRequestSchema>;

export const HostDecisionSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  action: z.enum(["confirm", "decline", "cancel"]),
  host_notes: z.string().trim().max(500).optional(),
});

export type HostDecisionInput = z.infer<typeof HostDecisionSchema>;

export const PropertyFormSchema = z.object({
  name: z.string().trim().min(3, "Property name must be at least 3 characters").max(120),
  description: z.string().trim().min(20, "Please provide a descriptive overview (at least 20 chars)").max(2000),
  address: z.string().trim().min(5, "Address is required"),
  village: z.string().trim().min(2, "Village is required"),
  district: z.string().trim().min(2, "District is required").default("Kullu"),
  state: z.string().trim().min(2).default("Himachal Pradesh"),
  property_type: z.enum(["homestay", "hotel", "resort", "villa", "guesthouse", "cottage", "other"]),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  rooms: z.array(z.object({
    room_name: z.string().trim().min(2, "Room name is required"),
    description: z.string().trim().optional(),
    max_guests: z.coerce.number().int().min(1).max(10).default(2),
    base_price: z.coerce.number().min(100, "Price must be at least ₹100"),
    active: z.boolean().default(true),
  })).min(1, "At least one room type must be added"),
});

export type PropertyFormInput = z.infer<typeof PropertyFormSchema>;

export const HostApplySchema = z.object({
  name: z.string().trim().min(3, 'Property name must be at least 3 characters').max(120),
  property_type: z.string().trim().min(2).default('homestay'),
  village: z.string().trim().min(2, 'Village is required'),
  district: z.string().trim().min(2, 'District is required'),
  state: z.string().trim().min(2).default('Himachal Pradesh'),
  address: z.string().trim().optional(),
  description: z
    .string()
    .trim()
    .min(20, 'Authentic property description (at least 20 chars) is required')
    .max(2000),
  host_phone: z.string().trim().optional(),
  amenities: z.array(z.string()).optional().default([]),
  initial_room_name: z.string().trim().min(2).default('Mountain View Room'),
  initial_room_guests: z.coerce.number().int().min(1).max(16).default(2),
  initial_room_price: z.coerce.number().min(100).default(2000),
  initial_room_description: z.string().trim().optional(),
});

export type HostApplyInput = z.infer<typeof HostApplySchema>;

export const SearchFilterSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().min(1).max(20).optional().default(1),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export type SearchFilterInput = z.infer<typeof SearchFilterSchema>;

// ============================================================================
// PHASE 2F: PRODUCTS MARKETPLACE & SELLER VALIDATIONS
// ============================================================================

export const SellerApplicationSchema = z.object({
  // Public Brand Profile (backward-compatible with existing Phase 2F fields)
  business_name: z.string().trim().min(2, "Business or brand name is required").max(120),
  brand_name: z.string().trim().min(2).max(120).optional(),
  brand_logo_url: z.string().trim().url("Brand logo must be a valid URL").optional().or(z.literal('')),
  primary_category: z.enum([
    'himalayan',
    'crafts',
    'textiles',
    'food',
    'foods',
    'wearables',
    'homeware',
    'books',
    'cosmetics',
    'lifestyle',
    'organic',
    'art',
    'sustainable',
    'mandatory_standards',
    'other',
  ]).optional().default('crafts'),
  secondary_categories: z.array(z.string()).optional().default([]),
  brand_story: z.string().trim().max(3000).optional().or(z.literal('')),
  maker_name: z.string().trim().min(2, "Artisan or lead contact name is required").max(100),
  craft_type: z.string().trim().min(2, "Craft or product specialisation is required").max(100),
  origin_village: z.string().trim().max(100).optional().or(z.literal('')),
  valley: z.string().trim().min(2, "Valley or region is required").max(100),
  state: z.string().trim().min(2, "State is required").max(100).default("Himachal Pradesh"),
  contact_email: z.string().trim().email("Valid contact email is required"),
  contact_phone: z.string().trim().min(7, "Phone number is too short").max(20).optional().or(z.literal('')),
  bio: z.string().trim().min(20, "Please describe your workshop, craft history, or farm (at least 20 chars)").max(2000),
  materials: z.string().trim().max(500).optional().or(z.literal('')),
  website_url: z.string().trim().url("Must be a valid URL").optional().or(z.literal('')),
  social_links: z.array(z.string().url()).optional().default([]),

  // Private Business Verification Information (never exposed on public storefront)
  legal_business_name: z.string().trim().min(2).max(160).optional(),
  trade_name: z.string().trim().max(160).optional().or(z.literal('')),
  business_constitution: z.enum([
    'sole_proprietorship',
    'sole_proprietor',
    'partnership',
    'partnership_firm',
    'llp',
    'private_limited',
    'public_limited',
    'cooperative_society',
    'cooperative_shg_fpo',
    'self_help_group',
    'individual_artisan',
    'trust_or_ngo',
  ]).optional().default('individual_artisan'),
  registered_address: z.string().trim().max(500).optional().or(z.literal('')),
  dispatch_address: z.string().trim().max(500).optional().or(z.literal('')),
  business_contact_name: z.string().trim().max(120).optional().or(z.literal('')),
  business_contact_phone: z.string().trim().max(20).optional().or(z.literal('')),
  tax_registration_status: z.enum([
    'gst_registered',
    'composition_scheme',
    'gst_exempt_artisan',
    'unregistered_small_producer',
    'unregistered_artisan',
    'exempt_handicraft',
  ]).optional().default('gst_exempt_artisan'),
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  registration_number: z.string().trim().max(100).optional().or(z.literal('')),
  authorized_representative_name: z.string().trim().max(120).optional().or(z.literal('')),
  authorized_representative_role: z.string().trim().max(100).optional().or(z.literal('')),
  submitted_documents: z.array(
    z.object({
      doc_type: z.string().optional(),
      document_type: z.string().optional(),
      document_title: z.string().min(1).optional(),
      storage_bucket: z.string().optional(),
      storage_path: z.string().min(3),
      mime_type: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']).default('application/pdf'),
      size_bytes: z.number().int().positive().max(10 * 1024 * 1024).default(102400),
      file_size_bytes: z.number().int().positive().max(10 * 1024 * 1024).optional(),
      reference_number: z.string().optional().or(z.literal('')),
      document_reference_number: z.string().optional().or(z.literal('')),
      expires_at: z.string().optional().or(z.literal('')),
      expiry_date: z.string().optional().or(z.literal('')),
    })
  ).optional().default([]),
  verification_documents: z.array(
    z.object({
      document_type: z.string().optional(),
      doc_type: z.string().optional(),
      document_title: z.string().min(1).optional(),
      document_reference_number: z.string().optional().or(z.literal('')),
      reference_number: z.string().optional().or(z.literal('')),
      storage_bucket: z.string().optional(),
      storage_path: z.string().min(3),
      mime_type: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']).default('application/pdf'),
      file_size_bytes: z.number().int().positive().max(10 * 1024 * 1024).default(102400),
      size_bytes: z.number().int().positive().max(10 * 1024 * 1024).optional(),
      expiry_date: z.string().optional().or(z.literal('')),
      expires_at: z.string().optional().or(z.literal('')),
    })
  ).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.tax_registration_status === 'gst_registered' || data.tax_registration_status === 'composition_scheme') {
    const gst = (data.gstin || '').trim().toUpperCase();
    const gstRegex = /^(0[1-9]|[12][0-9]|3[0-8]|97|99)[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gst || !gstRegex.test(gst)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['gstin'],
        message: 'A valid 15-character Indian GSTIN is required when GST registered is selected.',
      });
    }
  }
});

export type SellerApplicationInput = z.infer<typeof SellerApplicationSchema>;

export const ProductSubmissionSchema = z.object({
  title: z.string().trim().min(3, "Product title must be at least 3 characters").max(150),
  category: z.enum([
    'himalayan',
    'crafts',
    'textiles',
    'food',
    'lifestyle',
    'organic',
    'art',
    'sustainable',
    'other',
  ]),
  maker_name: z.string().trim().min(2, "Maker or cooperative name is required").max(100),
  origin_valley: z.string().trim().min(2, "Origin valley is required").max(100),
  origin_state: z.string().trim().min(2, "State is required").max(100).default("Himachal Pradesh"),
  craft_type: z.string().trim().min(2, "Craft technique or harvest method is required").max(100),
  materials: z.string().trim().min(2, "Natural materials list is required").max(500),
  description: z.string().trim().min(20, "Product description must be at least 20 characters").max(3000),
  photos: z.array(z.string().url("Must be valid URL")).min(1, "At least one product photograph is required"),
  price_estimate: z.coerce.number().min(0, "Price estimate cannot be negative").optional().nullable(),
  inventory_status: z.enum(['coming_soon', 'in_stock', 'made_to_order', 'sold_out']).default('coming_soon'),
});

export type ProductSubmissionInput = z.infer<typeof ProductSubmissionSchema>;

export const ProductInterestSchema = z.object({
  product_id: z.string().uuid("Invalid product ID").optional().nullable(),
  category: z.string().trim().optional().nullable(),
  guest_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  guest_email: z.string().trim().email("Valid email address is required"),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type ProductInterestInput = z.infer<typeof ProductInterestSchema>;

// ============================================================================
// PHASE 2G: PRODUCTIONS & FILMMAKER VALIDATIONS
// ============================================================================

export const FilmmakerApplicationSchema = z.object({
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(7, "Phone number is too short").max(20).optional().or(z.literal('')),
  location: z.string().trim().min(2, "Location is required").max(100),
  creative_role: z.enum([
    'director',
    'cinematographer',
    'sound_recordist',
    'editor',
    'writer',
    'researcher',
    'other',
  ]),
  skills: z.array(z.string()).min(1, "Please select at least one skill"),
  portfolio_url: z.string().trim().url("Please provide a valid portfolio or reel URL").optional().or(z.literal('')),
  bio: z.string().trim().min(20, "Please share a brief creative background (min 20 characters)").max(2000),
  collaboration_interests: z.array(z.string()).default([]),
});

export type FilmmakerApplicationInput = z.infer<typeof FilmmakerApplicationSchema>;

export const ProductionProposalSchema = z.object({
  title: z.string().trim().min(3, "Project title must be at least 3 characters").max(150),
  category: z.enum([
    'documentary',
    'cultural_monologue',
    'visual_essay',
    'oral_history',
    'environmental',
    'other',
  ]),
  synopsis: z.string().trim().min(20, "Please provide a concise synopsis (min 20 characters)").max(1000),
  concept: z.string().trim().min(30, "Please outline the documentary or creative treatment (min 30 characters)").max(3000),
  proposed_location: z.string().trim().min(2, "Proposed filming location or valley is required").max(150),
  cultural_relevance: z.string().trim().min(20, "Explain the cultural, ecological, or community significance (min 20 characters)").max(2000),
  support_needed: z.array(z.string()).min(1, "Please select at least one support requirement"),
  estimated_budget: z.coerce.number().min(0, "Estimated budget cannot be negative").optional().nullable(),
  portfolio_links: z.array(z.string().url("Must be valid URL")).default([]),
});

export type ProductionProposalInput = z.infer<typeof ProductionProposalSchema>;

// ============================================================================
// PHASE 2H: COMMUNITY & PARTICIPATION VALIDATIONS
// ============================================================================

export const CommunityParticipationSchema = z.object({
  initiative_slug: z.string().trim().min(2, "Initiative selection is required").max(100),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(7, "Phone number is too short").max(20).optional().or(z.literal('')),
  skills: z.string().trim().min(5, "Please list your relevant skills, craft, or profession").max(1000),
  duration: z.string().trim().min(2, "Duration of availability is required (e.g., 2 weeks, 1 month)").max(100),
  motivation: z.string().trim().min(20, "Please explain why you wish to participate (min 20 characters)").max(2000),
});

export type CommunityParticipationInput = z.infer<typeof CommunityParticipationSchema>;

export const CommunityStorySubmissionSchema = z.object({
  author_name: z.string().trim().min(2, "Author name must be at least 2 characters").max(100),
  author_role: z.string().trim().min(2, "Your role or relationship to the community is required").max(100),
  village: z.string().trim().min(2, "Village name is required").max(100),
  valley: z.string().trim().min(2, "Valley or region is required").max(100),
  title: z.string().trim().min(5, "Story title must be at least 5 characters").max(150),
  excerpt: z.string().trim().min(20, "Please provide a brief excerpt or summary (min 20 characters)").max(500),
  content: z.string().trim().min(50, "Full story content must be at least 50 characters").max(5000),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: "You must confirm participant and village consent before submitting" }),
  }),
});

export type CommunityStorySubmissionInput = z.infer<typeof CommunityStorySubmissionSchema>;

// ============================================================================
// PHASE 2: PRIVATE STAFF PORTAL, INVITATION & ONBOARDING VALIDATIONS
// ============================================================================

export const StaffInvitationCreateSchema = z.object({
  official_email: z.string().trim().email("Valid official staff email is required"),
  department: z.enum([
    'founder_office',
    'stays',
    'products',
    'productions',
    'community',
    'operations',
    'stays_curation',
    'marketplace_compliance',
    'customer_support',
    'finance_legal',
  ]),
  designation: z.string().trim().min(2, "Designation is required").max(100),
  role_slug: z.enum([
    'founder',
    'operations_admin',
    'property_reviewer',
    'marketplace_reviewer',
    'productions_editor',
    'community_manager',
    'support_executive',
    'finance_compliance_reviewer',
  ]),
  employment_category: z.enum([
    'full_time_employee',
    'part_time_employee',
    'fixed_term_contractor',
    'independent_consultant',
    'fellow',
  ]),
  initial_permissions: z.array(z.string()).default([]),
  expiry_hours: z.coerce.number().int().min(1).max(720).default(72),
});

export type StaffInvitationCreateInput = z.infer<typeof StaffInvitationCreateSchema>;

export const StaffOnboardingSubmitSchema = z.object({
  invitation_token: z.string().trim().min(16, "Valid single-use invitation token is required"),
  full_legal_name: z.string().trim().min(2, "Full legal name is required").max(120),
  preferred_name: z.string().trim().min(2, "Preferred name is required").max(80),
  personal_email: z.string().trim().email("Valid personal email is required"),
  official_email: z.string().trim().email("Valid official email is required"),
  verified_mobile: z.string().trim().min(8, "Verified mobile number is required").max(20),
  current_address: z.string().trim().max(400).optional().or(z.literal('')),
  emergency_contact_name: z.string().trim().max(100).optional().or(z.literal('')),
  emergency_contact_phone: z.string().trim().max(20).optional().or(z.literal('')),
  designation: z.string().trim().min(2).max(100),
  department: z.enum([
    'founder_office',
    'stays',
    'products',
    'productions',
    'community',
    'operations',
    'stays_curation',
    'marketplace_compliance',
    'customer_support',
    'finance_legal',
  ]),
  employment_category: z.enum([
    'full_time_employee',
    'part_time_employee',
    'fixed_term_contractor',
    'independent_consultant',
    'fellow',
  ]),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be YYYY-MM-DD"),
  previous_experience: z.string().trim().min(10, "Brief relevant experience summary is required").max(2000),
  professional_qualifications: z.string().trim().max(1000).optional().or(z.literal('')),
  reporting_manager: z.string().trim().min(2).max(100).default("Gaurav Negi (Founder)"),
  assigned_responsibilities: z.string().trim().min(10).max(2000),
  // Aadhaar is strictly optional and NEVER the mandatory default identity document
  identity_document_type: z.enum([
    'indian_passport',
    'voter_id_epic',
    'driving_licence',
    'pan_card',
    'voluntary_masked_aadhaar',
  ]).default('indian_passport'),
  identity_document_ref: z.string().trim().min(4, "Document verification reference is required").max(80),
  identity_document_storage_path: z.string().trim().min(5, "Private HR storage path is required"),
  privacy_notice_acknowledged: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the Uttarkunth Staff HR Privacy Notice" }),
  }),
  accepted_agreements: z.array(
    z.object({
      agreement_type: z.enum([
        'appointment_agreement',
        'confidentiality_nda',
        'data_protection_undertaking',
        'acceptable_use_policy',
        'internal_moderation_policy',
        'conflict_of_interest',
        'intellectual_property',
        'termination_return_of_info',
      ]),
      agreement_version: z.string().min(1),
      document_hash: z.string().length(64),
      signed_document_ref: z.string().min(3),
    })
  ).length(8, "All 8 mandatory Uttarkunth staff agreements and conduct policies must be accepted"),
});

export type StaffOnboardingSubmitInput = z.infer<typeof StaffOnboardingSubmitSchema>;

export function validatePayload<T>(
  schema: z.ZodType<T, any, any>,
  payload: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; details: z.ZodIssue[] } {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Validation failed.',
      details: parsed.error.issues,
    };
  }
  return { success: true, data: parsed.data };
}