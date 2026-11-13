import test from 'node:test';
import assert from 'node:assert/strict';
import { groupPropertiesByLocation, resolvePropertyLocationGroup } from './stays-grouping';

test('Yash Home Stay in Jari maps to Stays in Parvati Valley, Kullu', () => {
  const group = resolvePropertyLocationGroup({
    slug: 'yash-home-stay',
    name: 'Yash Home Stay',
    village: 'Jari',
    district: 'Kullu',
    state: 'Himachal Pradesh',
  });
  assert.equal(group.title, 'Stays in Parvati Valley, Kullu');
  assert.equal(group.href, '/stays/destinations/kullu-jari');
});

test('Property with Manali address or village maps to Stays in Manali', () => {
  const group = resolvePropertyLocationGroup({
    slug: 'pine-suite-manali',
    name: 'Pine Suite',
    village: 'Old Manali',
    address: 'Circuit House Road, Manali',
    district: 'Kullu',
  });
  assert.equal(group.title, 'Stays in Manali');
  assert.equal(group.href, '/stays/destinations/manali');
});

test('groupPropertiesByLocation excludes wonderway-retreat and groups by location', () => {
  const grouped = groupPropertiesByLocation([
    {
      id: '1',
      slug: 'yash-home-stay',
      name: 'Yash Home Stay',
      village: 'Jari',
      district: 'Kullu',
      photos: ['https://example.com/yash1.jpg', 'https://example.com/yash2.jpg'],
    },
    {
      id: '2',
      slug: 'wonderway-retreat',
      name: 'Wonderway Retreat',
      village: 'Jari',
      district: 'Kullu',
      photos: ['https://example.com/ww.jpg'],
    },
    {
      id: '3',
      slug: 'alpine-cabin-manali',
      name: 'Alpine Cabin',
      village: 'Manali',
      district: 'Kullu',
      photos: ['https://example.com/manali1.jpg'],
    },
  ]);

  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].title, 'Stays in Parvati Valley, Kullu');
  assert.equal(grouped[0].properties.length, 1);
  assert.equal(grouped[0].properties[0].slug, 'yash-home-stay');

  assert.equal(grouped[1].title, 'Stays in Manali');
  assert.equal(grouped[1].properties.length, 1);
  assert.equal(grouped[1].properties[0].slug, 'alpine-cabin-manali');
});
