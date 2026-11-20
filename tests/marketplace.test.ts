import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_TEAM_PERMISSION_KEYS,
  calculateProductDiscount,
  extractLiveSearchSuggestions,
  filterAndSortMarketplaceProducts,
  hasMarketplacePermission,
  mapCanonicalToDbCategory,
  resolveCanonicalCategory,
  resolveStockState,
  resolveUserWorkspaces,
  sanitizeSellerProductWritePayload,
  validateStockAdjustment,
} from '../lib/marketplace';
import { normalizeStaffPermission } from '../lib/staff-rbac-shared';

describe('Uttarkunth Products Marketplace & Seller Desk Domain Logic', () => {
  it('defines all 6 canonical categories and their subcategories', () => {
    assert.equal(MARKETPLACE_CATEGORIES.length, 6);
    const titles = MARKETPLACE_CATEGORIES.map((c) => c.title);
    assert.deepEqual(titles, [
      'Handcrafted & Artisan',
      'Food & Pantry',
      'Clothing & Textiles',
      'Home & Living',
      'Personal Care',
      'Sustainable Living',
    ]);

    const handcrafted = resolveCanonicalCategory('handcrafted-artisan');
    assert.ok(handcrafted);
    assert.equal(handcrafted.subcategories.length, 4);
    assert.equal(handcrafted.subcategories[0]?.label, 'Woodcraft');

    // Legacy category resolution
    assert.equal(resolveCanonicalCategory('crafts')?.slug, 'handcrafted-artisan');
    assert.equal(resolveCanonicalCategory('food')?.slug, 'food-pantry');
    assert.equal(resolveCanonicalCategory('textiles')?.slug, 'clothing-textiles');
    assert.equal(mapCanonicalToDbCategory('handcrafted-artisan'), 'crafts');
    assert.equal(mapCanonicalToDbCategory('food-pantry'), 'food');
  });

  it('automatically calculates discount amount and percentage from MRP and selling price', () => {
    // Example from spec: MRP ₹1,000, Selling Price ₹800 -> ₹200 discount, 20% OFF
    const res = calculateProductDiscount(1000, 800);
    assert.equal(res.valid, true);
    assert.equal(res.mrp, 1000);
    assert.equal(res.sellingPrice, 800);
    assert.equal(res.discountAmount, 200);
    assert.equal(res.discountPercentage, 20);
    assert.equal(res.hasDiscount, true);
    assert.equal(res.formattedSellingPrice, '₹800');
    assert.equal(res.formattedMrp, '₹1,000');
    assert.equal(res.formattedBadge, '20% OFF');

    // When Selling Price === MRP -> no discount badge
    const noDisc = calculateProductDiscount(800, 800);
    assert.equal(noDisc.valid, true);
    assert.equal(noDisc.hasDiscount, false);
    assert.equal(noDisc.discountPercentage, 0);
    assert.equal(noDisc.formattedBadge, null);

    // Rejects Selling Price > MRP
    const invalidHigh = calculateProductDiscount(1000, 1200);
    assert.equal(invalidHigh.valid, false);
    assert.match(invalidHigh.error || '', /cannot exceed/i);

    // Rejects zero or negative prices
    assert.equal(calculateProductDiscount(0, 500).valid, false);
    assert.equal(calculateProductDiscount(1000, -10).valid, false);
  });

  it('resolves stock status and prevents negative stock adjustments', () => {
    const inStock = resolveStockState(15, 5);
    assert.equal(inStock.status, 'in_stock');
    assert.equal(inStock.canPurchase, true);

    const lowStock = resolveStockState(4, 5);
    assert.equal(lowStock.status, 'low_stock');
    assert.equal(lowStock.canPurchase, true);
    assert.match(lowStock.label, /Low Stock/i);

    const outOfStock = resolveStockState(0, 5);
    assert.equal(outOfStock.status, 'out_of_stock');
    assert.equal(outOfStock.canPurchase, false);

    // Valid stock addition
    const addRes = validateStockAdjustment(10, 5, 'new_stock_added');
    assert.equal(addRes.valid, true);
    assert.equal(addRes.newStock, 15);

    // Reject adjustment resulting in negative stock
    const negRes = validateStockAdjustment(4, -7, 'damaged_or_unsellable');
    assert.equal(negRes.valid, false);
    assert.match(negRes.error || '', /cannot become negative/i);
  });

  it('resolves Host Dashboard and Seller Desk workspace visibility across Scenarios A, B, C, D, E', () => {
    // Scenario A: User is a Seller only
    const scenA = resolveUserWorkspaces({ isHost: false, sellerStatus: 'approved' });
    assert.equal(scenA.scenario, 'A_SELLER_ONLY');
    assert.equal(scenA.showHostDashboard, false);
    assert.equal(scenA.showSellerDesk, true);
    assert.deepEqual(
      scenA.workspaces.map((w) => w.id),
      ['seller_desk']
    );

    // Scenario B: User is a Host only
    const scenB = resolveUserWorkspaces({ isHost: true, sellerStatus: null });
    assert.equal(scenB.scenario, 'B_HOST_ONLY');
    assert.equal(scenB.showHostDashboard, true);
    assert.equal(scenB.showSellerDesk, false);
    assert.deepEqual(
      scenB.workspaces.map((w) => w.id),
      ['host_dashboard']
    );

    // Scenario C: User is both a Seller and a Host
    const scenC = resolveUserWorkspaces({ isHost: true, sellerStatus: 'approved' });
    assert.equal(scenC.scenario, 'C_BOTH_HOST_AND_SELLER');
    assert.equal(scenC.showHostDashboard, true);
    assert.equal(scenC.showSellerDesk, true);
    assert.deepEqual(
      scenC.workspaces.map((w) => w.id),
      ['host_dashboard', 'seller_desk']
    );

    // Scenario D: User is neither a Seller nor a Host
    const scenD = resolveUserWorkspaces({ isHost: false, sellerStatus: null });
    assert.equal(scenD.scenario, 'D_NEITHER');
    assert.equal(scenD.showHostDashboard, false);
    assert.equal(scenD.showSellerDesk, false);
    assert.equal(scenD.workspaces.length, 0);

    // Scenario E: User has a pending or draft seller application
    const scenE = resolveUserWorkspaces({ isHost: false, sellerStatus: 'pending' });
    assert.equal(scenE.scenario, 'E_PENDING_SELLER');
    assert.equal(scenE.showSellerDesk, false);
    assert.equal(scenE.showPendingSellerBanner, true);
  });

  it('prevents sellers from self-approving, self-publishing, or granting verification badges', () => {
    const maliciousPayload = {
      title: 'Test Shawl',
      moderation_status: 'approved',
      published: true,
      verification_badge_approved: true,
      reviewed_by: 'attacker-uuid',
    };

    const sanitizedReview = sanitizeSellerProductWritePayload(
      maliciousPayload,
      'submit_for_review'
    );
    assert.equal(sanitizedReview.moderation_status, 'pending');
    assert.equal(sanitizedReview.published, false);
    assert.equal(sanitizedReview.verification_badge_approved, false);
    assert.equal('reviewed_by' in sanitizedReview, false);

    const sanitizedDraft = sanitizeSellerProductWritePayload(
      maliciousPayload,
      'save_draft'
    );
    assert.equal(sanitizedDraft.moderation_status, 'draft');
    assert.equal(sanitizedDraft.published, false);
    assert.equal(sanitizedDraft.verification_badge_approved, false);
  });

  it('filters, sorts, and extracts live search suggestions strictly from real products', () => {
    const sampleApproved = [
      {
        id: '1',
        slug: 'kullu-shawl',
        title: 'Handwoven Kullu Shawl',
        brand_name: 'Parvati Weavers',
        maker_name: 'Tenzing',
        category: 'clothing-textiles',
        subcategory: 'Woollens',
        origin_valley: 'Parvati Valley',
        mrp: 2000,
        selling_price: 1600,
        available_stock: 8,
        created_at: '2026-11-18T10:00:00Z',
      },
      {
        id: '2',
        slug: 'forest-honey',
        title: 'Wild Multi-Floral Forest Honey',
        brand_name: 'Jari Apiary',
        maker_name: 'Ramesh',
        category: 'food-pantry',
        subcategory: 'Honey & Natural Produce',
        origin_valley: 'Jari',
        mrp: 900,
        selling_price: 900,
        available_stock: 0,
        created_at: '2026-11-19T10:00:00Z',
      },
    ];

    // Discount filter
    const discountedOnly = filterAndSortMarketplaceProducts(sampleApproved, {
      onlyDiscounted: true,
    });
    assert.equal(discountedOnly.length, 1);
    assert.equal(discountedOnly[0]?.slug, 'kullu-shawl');

    // In-stock filter
    const inStockOnly = filterAndSortMarketplaceProducts(sampleApproved, {
      onlyInStock: true,
    });
    assert.equal(inStockOnly.length, 1);
    assert.equal(inStockOnly[0]?.slug, 'kullu-shawl');

    // Price ascending sort
    const sortedAsc = filterAndSortMarketplaceProducts(sampleApproved, {
      sortBy: 'price_asc',
    });
    assert.equal(sortedAsc[0]?.slug, 'forest-honey');

    // Search suggestions
    const suggestions = extractLiveSearchSuggestions(sampleApproved, 'Parvati');
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0]?.type, 'brand');
    assert.equal(suggestions[0]?.label, 'Parvati Weavers');
  });

  it('maps all 26 granular marketplace RBAC permissions and enforces Founder and active staff checks', () => {
    assert.equal(MARKETPLACE_TEAM_PERMISSION_KEYS.length, 26);

    for (const key of MARKETPLACE_TEAM_PERMISSION_KEYS) {
      const canonical = normalizeStaffPermission(key);
      assert.ok(canonical);

      // Founder always has permission
      assert.equal(
        hasMarketplacePermission({ isFounder: true }, key),
        true
      );
    }

    // Active marketplace reviewer with product.approve & seller.approve
    const reviewer = {
      isFounder: false,
      roleSlug: 'marketplace_reviewer' as const,
      accountStatus: 'active',
      grantedPermissions: ['product.approve', 'seller.approve'],
    };
    assert.equal(hasMarketplacePermission(reviewer, 'products.approve'), true);
    assert.equal(hasMarketplacePermission(reviewer, 'products.publish'), true);
    assert.equal(hasMarketplacePermission(reviewer, 'seller.applications.review'), true);
    assert.equal(hasMarketplacePermission(reviewer, 'marketplace.reports.view'), false);

    // Suspended staff member is denied even if permission is listed
    const suspendedReviewer = {
      ...reviewer,
      accountStatus: 'suspended',
    };
    assert.equal(
      hasMarketplacePermission(suspendedReviewer, 'products.approve'),
      false
    );
  });
});
