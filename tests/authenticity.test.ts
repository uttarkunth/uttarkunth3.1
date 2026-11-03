import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURATED_DESTINATIONS,
  getDestinationBySlug,
  filterPropertiesForDestination,
  getNearbyPropertiesForDestination,
  getCanonicalDestinationSlug,
} from '../lib/destinations.ts';
import { AUTHENTIC_PRODUCTIONS } from '../lib/constants.ts';

test('Authenticity: Exactly 22 curated destinations in directory', () => {
  assert.equal(CURATED_DESTINATIONS.length, 22);

  const himachal = CURATED_DESTINATIONS.filter((d) => d.region === 'Himachal Pradesh');
  const jk = CURATED_DESTINATIONS.filter((d) => d.region === 'Jammu & Kashmir');
  const uttarakhand = CURATED_DESTINATIONS.filter((d) => d.region === 'Uttarakhand');

  assert.equal(himachal.length, 10, 'Himachal Pradesh should have exactly 10 destinations');
  assert.equal(jk.length, 5, 'Jammu & Kashmir should have exactly 5 destinations');
  assert.equal(uttarakhand.length, 7, 'Uttarakhand should have exactly 7 destinations');
});

test('Authenticity: Canonical primary destination assigned with zero duplicated direct counts', async () => {
  const realProperties = [
    {
      id: 'd9bba1a1-23bc-4844-a70b-aebcc820cf37',
      name: 'Yash Home Stay',
      village: 'Jari',
      district: 'Kullu',
      state: 'Himachal Pradesh',
      published: true,
      moderation_status: 'approved',
    },
    {
      id: 'b1a8c6a7-e73c-431c-8727-c8e385dbd173',
      name: 'Wonderway Retreat',
      village: 'Jari',
      district: 'Kullu',
      state: 'Himachal Pradesh',
      published: true,
      moderation_status: 'approved',
    },
  ];

  // 1. Both properties have canonical destination 'kullu-jari'
  assert.equal(getCanonicalDestinationSlug(realProperties[0]), 'kullu-jari');
  assert.equal(getCanonicalDestinationSlug(realProperties[1]), 'kullu-jari');

  // 2. Kullu-Jari has exactly 2 direct stays
  const kulluJari = await getDestinationBySlug('kullu-jari');
  assert.ok(kulluJari);
  const kulluMatched = filterPropertiesForDestination(realProperties, kulluJari);
  assert.equal(kulluMatched.length, 2, 'Kullu and Jari directly contains both Jari properties');

  // 3. Kasol has 0 direct stays (no duplicate counting)
  const kasol = await getDestinationBySlug('kasol');
  assert.ok(kasol);
  const kasolDirect = filterPropertiesForDestination(realProperties, kasol);
  assert.equal(kasolDirect.length, 0, 'Kasol must have 0 direct stays because properties are physically in Jari');

  // 4. Kasol correctly resolves Jari stays under explicit nearby association
  const kasolNearby = getNearbyPropertiesForDestination(realProperties, kasol);
  assert.equal(kasolNearby.length, 2, 'Kasol correctly resolves Jari stays as nearby Parvati Valley stays');

  // 5. Total direct count across all 22 destinations sums to exactly 2 (zero duplication)
  let totalDirectCount = 0;
  for (const dest of CURATED_DESTINATIONS) {
    const direct = filterPropertiesForDestination(realProperties, dest);
    totalDirectCount += direct.length;
  }
  assert.equal(totalDirectCount, 2, 'Total direct property counts across all 22 destinations must equal 2 without duplication');
});

test('Authenticity: Only 2 authorized productions exist in catalog', () => {
  assert.equal(AUTHENTIC_PRODUCTIONS.length, 2, 'Must have exactly 2 authorized productions');

  const titles = AUTHENTIC_PRODUCTIONS.map((p) => p.title);
  assert.ok(titles.includes('Aaj Ka Devta'));
  assert.ok(titles.includes('Ruk Gayi Gupt Bali'));
});
