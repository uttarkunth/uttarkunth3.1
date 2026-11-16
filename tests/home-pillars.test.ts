import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS_SECTION_ORDER,
  INITIAL_CURATED_PRODUCTS,
  formatProductForCard,
  buildFeaturedProductSubgroups,
  getProductsForSection,
  extractMakersFromProducts,
  COMMUNITY_DESCRIPTION_PARAGRAPHS,
  COMMUNITY_WELCOME_CATEGORIES,
} from '../lib/home-pillars';

test('PRODUCTS_SECTION_ORDER defines the 6 ordered sections with their exact headings and focus', () => {
  assert.equal(PRODUCTS_SECTION_ORDER.length, 6);
  assert.deepEqual(
    PRODUCTS_SECTION_ORDER.map((s) => ({
      order: s.order,
      heading: s.heading,
      focus: s.focus,
    })),
    [
      { order: 1, heading: 'Featured Products', focus: 'Curated products from different brands' },
      { order: 2, heading: 'Woven & Worn', focus: 'Clothing and textiles' },
      { order: 3, heading: 'Flavours of the Himalayas', focus: 'Food and regional specialties' },
      { order: 4, heading: 'Crafted by Hand', focus: 'Crafts and handmade products' },
      { order: 5, heading: 'Natural Living', focus: 'Natural and wellness products' },
      { order: 6, heading: 'Meet the Makers', focus: 'Local brands and artisans' },
    ]
  );
});

test('INITIAL_CURATED_PRODUCTS contains 1 product only and formats Brand and Region clearly', () => {
  assert.equal(INITIAL_CURATED_PRODUCTS.length, 1);
  const first = INITIAL_CURATED_PRODUCTS[0]!;
  assert.ok(!first.title.toLowerCase().includes('wool shawl'));
  assert.ok(!first.maker_name.toLowerCase().includes('local brand name'));

  const card = formatProductForCard(first);
  assert.equal(card.brandDisplayLabel, 'Brand: Uttarkunth Mountain Collective');
  assert.equal(card.regionSmallLabel, 'Kullu, Himachal Pradesh');
  assert.equal(card.priceFormatted, '₹680');
});

test('buildFeaturedProductSubgroups only adds regional rows when products exist from that valley', () => {
  const defaultGroups = buildFeaturedProductSubgroups(INITIAL_CURATED_PRODUCTS);
  const groupTitles = defaultGroups.map((g) => g.title);
  assert.ok(groupTitles.includes('Uttarkunth Products'));
  assert.ok(groupTitles.includes('Treasures from Kullu'));
  assert.ok(!groupTitles.includes('From the Valleys of Lahaul and Spiti'));

  // When a product from Spiti is added, "From the Valleys of Lahaul and Spiti" appears dynamically
  const withSpiti = [
    ...INITIAL_CURATED_PRODUCTS,
    {
      id: 'spiti-sea-buckthorn',
      slug: 'spiti-sea-buckthorn-concentrate',
      title: 'Spiti Wild Sea Buckthorn Concentrate',
      category: 'organic',
      maker_name: 'Kaza Valley Botanicals',
      origin_valley: 'Spiti Valley',
      origin_state: 'Himachal Pradesh',
      price_estimate: 540,
    },
  ];
  const updatedGroups = buildFeaturedProductSubgroups(withSpiti);
  assert.ok(
    updatedGroups.some((g) => g.title === 'From the Valleys of Lahaul and Spiti')
  );
});

test('getProductsForSection routes products only into the category sections where they fit', () => {
  const flavours = getProductsForSection(INITIAL_CURATED_PRODUCTS, 'flavours-of-the-himalayas');
  const woven = getProductsForSection(INITIAL_CURATED_PRODUCTS, 'woven-and-worn');
  const crafted = getProductsForSection(INITIAL_CURATED_PRODUCTS, 'crafted-by-hand');
  const natural = getProductsForSection(INITIAL_CURATED_PRODUCTS, 'natural-living');

  assert.equal(flavours.length, 1);
  assert.equal(woven.length, 0);
  assert.equal(crafted.length, 0);
  assert.equal(natural.length, 0);

  const makers = extractMakersFromProducts(INITIAL_CURATED_PRODUCTS);
  assert.equal(makers.length, 1);
  assert.equal(makers[0]?.brandName, 'Uttarkunth Mountain Collective');
});

test('COMMUNITY_WELCOME_CATEGORIES defines all 6 categories and highlights Uttarkunth in Village Initiatives', () => {
  assert.equal(COMMUNITY_DESCRIPTION_PARAGRAPHS.length, 4);
  assert.equal(COMMUNITY_WELCOME_CATEGORIES.length, 6);

  const villageInit = COMMUNITY_WELCOME_CATEGORIES.find(
    (c) => c.category === 'Village Initiatives'
  );
  assert.ok(villageInit);
  assert.equal(villageInit.welcomes, 'Community-led development projects');
  assert.ok(villageInit.highlightNote?.toLowerCase().includes('uttarkunth'));
});
