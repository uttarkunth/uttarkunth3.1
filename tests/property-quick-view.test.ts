import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyAmenityIcon,
  normalizeAmenitiesList,
  normalizePropertyQuickView,
} from '../lib/property-quick-view';
import { EXISTING_PROPERTIES } from '../lib/constants';

test('classifyAmenityIcon maps Himalayan amenities to semantic icon categories', () => {
  assert.equal(classifyAmenityIcon('Free Wi-Fi'), 'wifi');
  assert.equal(classifyAmenityIcon('Mountain-view room'), 'mountain');
  assert.equal(classifyAmenityIcon('Breakfast and dinner meal plans'), 'meals');
  assert.equal(classifyAmenityIcon('Tea and coffee'), 'tea');
  assert.equal(classifyAmenityIcon('Laundry'), 'laundry');
  assert.equal(classifyAmenityIcon('Pet-friendly by prior agreement'), 'pet');
  assert.equal(classifyAmenityIcon('Free Parking'), 'parking');
  assert.equal(classifyAmenityIcon('Bonfire on Request'), 'bonfire');
});

test('normalizeAmenitiesList deduplicates and handles arrays, JSON strings, and CSV strings', () => {
  const fromArray = normalizeAmenitiesList(['Free Wi-Fi', 'free wi-fi', 'Hot Water']);
  assert.equal(fromArray.length, 2);
  assert.equal(fromArray[0]?.label, 'Free Wi-Fi');
  assert.equal(fromArray[0]?.icon, 'wifi');
  assert.equal(fromArray[1]?.label, 'Hot Water');
  assert.equal(fromArray[1]?.icon, 'water');

  const fromCsv = normalizeAmenitiesList('Balcony, Kitchenette');
  assert.equal(fromCsv.length, 2);
  assert.equal(fromCsv[0]?.icon, 'balcony');
  assert.equal(fromCsv[1]?.icon, 'kitchen');
});

test('normalizePropertyQuickView transforms EXISTING_PROPERTIES with accurate description, amenities, and pricing', () => {
  const sample = EXISTING_PROPERTIES[0]!;
  const details = normalizePropertyQuickView(sample);

  assert.equal(details.slug, 'yash-home-stay');
  assert.equal(details.name, 'Yash Home Stay');
  assert.equal(details.href, '/stays/yash-home-stay');
  assert.equal(details.locationLabel, 'Jari, Kullu');
  assert.equal(details.fullLocationLabel, 'Jari, Kullu, Himachal Pradesh');
  assert.ok(details.briefDescription.includes('peaceful homestay in Jari'));
  assert.equal(details.keyAmenities.length, 6);
  assert.equal(details.startingPrice, 900);
  assert.equal(details.twoNightPrice, 1800);
  assert.equal(details.maxGuestsCapacity, 2);
  assert.equal(details.roomCount, 1);
  assert.equal(details.rooms[0]?.roomName, 'Mountain View Room');
  assert.ok(details.photos.length >= 1);
});

test('normalizePropertyQuickView provides safe defaults when optional fields are missing', () => {
  const minimal = normalizePropertyQuickView({
    id: 'test-prop',
    slug: 'parvati-cottage',
    name: 'Parvati Timber Cottage',
    property_type: 'cottage',
  });

  assert.equal(minimal.propertyTypeLabel, 'Mountain Cottage');
  assert.equal(minimal.locationLabel, 'Jari, Kullu');
  assert.ok(minimal.briefDescription.length > 20);
  assert.equal(minimal.startingPrice, 900);
  assert.equal(minimal.keyAmenities.length, 0);
});
