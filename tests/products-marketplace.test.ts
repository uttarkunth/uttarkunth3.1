import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCT_CATEGORIES } from '../lib/constants.ts';
import {
  SellerApplicationSchema,
  ProductSubmissionSchema,
  ProductInterestSchema,
} from '../lib/validations.ts';

// 1. PRODUCT CATEGORIES TAXONOMY
test('Phase 2F: Product Categories Taxonomy Conformance', () => {
  assert.equal(PRODUCT_CATEGORIES.length, 9, 'Must define exactly 9 authentic categories');

  const categoryIds = PRODUCT_CATEGORIES.map((c) => c.id);
  const expectedIds = [
    'himalayan',
    'crafts',
    'textiles',
    'food',
    'lifestyle',
    'organic',
    'art',
    'sustainable',
    'other',
  ];

  assert.deepEqual(categoryIds.sort(), expectedIds.sort(), 'Category IDs match specification');

  for (const cat of PRODUCT_CATEGORIES) {
    assert.ok(cat.name.length > 2, `Category ${cat.id} has valid name`);
    assert.ok(cat.description.length > 10, `Category ${cat.id} has descriptive overview`);
  }
});

// 2. SELLER APPLICATION VALIDATION
test('Phase 2F: Seller Application Validation Rules', () => {
  const validApp = {
    business_name: 'Parvati Valley Handloom Guild',
    maker_name: 'Dorje Angchuk',
    craft_type: 'Pattu Blankets & Yak Shawls',
    valley: 'Parvati Valley',
    state: 'Himachal Pradesh',
    contact_email: 'dorje@parvatiweavers.org',
    contact_phone: '+91 98160 12345',
    bio: 'Traditional pit-loom weaving collective preserving centuries-old mountain patterns and natural walnut dye processes.',
    materials: '100% indigenous sheep wool and pure yak underfleece',
  };

  const parseResult = SellerApplicationSchema.safeParse(validApp);
  assert.equal(parseResult.success, true);

  // Short bio rejected (< 20 chars)
  const shortBioApp = { ...validApp, bio: 'Too short' };
  const shortBioResult = SellerApplicationSchema.safeParse(shortBioApp);
  assert.equal(shortBioResult.success, false);

  // Invalid email rejected
  const invalidEmailApp = { ...validApp, contact_email: 'not-an-email' };
  const invalidEmailResult = SellerApplicationSchema.safeParse(invalidEmailApp);
  assert.equal(invalidEmailResult.success, false);

  // Missing required business name rejected
  const missingNameApp = { ...validApp, business_name: '' };
  const missingNameResult = SellerApplicationSchema.safeParse(missingNameApp);
  assert.equal(missingNameResult.success, false);
});

// 3. PRODUCT SUBMISSION VALIDATION
test('Phase 2F: Product Submission Schema Validation', () => {
  const validProduct = {
    title: 'Hand-Spun Kullu Shawl with Geometric Kath-Kuni Border',
    category: 'textiles' as const,
    maker_name: 'Master Weaver Sunita Devi',
    origin_valley: 'Kullu Valley',
    origin_state: 'Himachal Pradesh',
    craft_type: 'Handloom shuttle weaving',
    materials: 'Pure Merino and local Gaddi sheep wool',
    description: 'An authentic mountain shawl handwoven on traditional wood looms using heritage geometric motifs inspired by Kullu temple carvings.',
    photos: ['https://images.unsplash.com/photo-1606787366850-de6330128bfc'],
    price_estimate: 3800,
    inventory_status: 'coming_soon' as const,
  };

  const result = ProductSubmissionSchema.safeParse(validProduct);
  assert.equal(result.success, true);

  // Null price estimate allowed (batch release pricing)
  const nullPriceResult = ProductSubmissionSchema.safeParse({
    ...validProduct,
    price_estimate: null,
  });
  assert.equal(nullPriceResult.success, true);

  // Negative price rejected
  const negPriceResult = ProductSubmissionSchema.safeParse({
    ...validProduct,
    price_estimate: -500,
  });
  assert.equal(negPriceResult.success, false);

  // Invalid category rejected
  const invalidCatResult = ProductSubmissionSchema.safeParse({
    ...validProduct,
    category: 'plastic-toys' as any,
  });
  assert.equal(invalidCatResult.success, false);

  // Empty photo list rejected (must have at least one photograph)
  const noPhotosResult = ProductSubmissionSchema.safeParse({
    ...validProduct,
    photos: [],
  });
  assert.equal(noPhotosResult.success, false);
});

// 4. PRODUCT INTEREST & WAITLIST VALIDATION
test('Phase 2F: Product Interest Schema Validation', () => {
  const validInterest = {
    product_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    category: 'textiles',
    guest_name: 'Meera Sharma',
    guest_email: 'meera.sharma@example.com',
    notes: 'Looking for a natural cream and walnut border shawl.',
  };

  const result = ProductInterestSchema.safeParse(validInterest);
  assert.equal(result.success, true);

  // General waitlist without product_id allowed
  const generalInterest = {
    product_id: null,
    category: 'food',
    guest_name: 'Rahul Varma',
    guest_email: 'rahul.v@example.com',
  };
  const genResult = ProductInterestSchema.safeParse(generalInterest);
  assert.equal(genResult.success, true);

  // Invalid email rejected
  const badEmail = { ...validInterest, guest_email: 'invalid-email' };
  assert.equal(ProductInterestSchema.safeParse(badEmail).success, false);
});

// 5. SELLER ONBOARDING & PRODUCT MODERATION LIFECYCLE
test('Phase 2F: Lifecycle State Transitions and Access Invariants', () => {
  // Model of seller state transition
  function transitionSellerStatus(current: string, action: string, isAdmin: boolean) {
    if (!isAdmin) throw new Error('Only administrators can moderate seller status');
    if (current === 'pending' && action === 'approve') return 'approved';
    if (current === 'pending' && action === 'reject') return 'rejected';
    if (current === 'approved' && action === 'suspend') return 'suspended';
    throw new Error('Invalid transition');
  }

  // Admin approves seller
  assert.equal(transitionSellerStatus('pending', 'approve', true), 'approved');
  assert.equal(transitionSellerStatus('pending', 'reject', true), 'rejected');

  // Non-admin cannot approve
  assert.throws(() => transitionSellerStatus('pending', 'approve', false), /Only administrators/);

  // Model of product public visibility
  function isProductPubliclyVisible(moderationStatus: string) {
    return moderationStatus === 'approved';
  }

  assert.equal(isProductPubliclyVisible('approved'), true);
  assert.equal(isProductPubliclyVisible('pending'), false);
  assert.equal(isProductPubliclyVisible('draft'), false);
  assert.equal(isProductPubliclyVisible('rejected'), false);
});
