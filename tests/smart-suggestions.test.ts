import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  segmentHighlightedText,
  scoreSearchMatch,
  unifiedClientSearchHandler,
} from '../lib/smart-suggestions.ts';
import { CURATED_DESTINATIONS } from '../lib/destinations.ts';
import {
  AUTHENTIC_PRODUCTIONS,
  EXISTING_PROPERTIES,
  PRODUCT_CATEGORIES,
} from '../lib/constants.ts';

describe('Smart Suggestions Engine & Text Highlighting', () => {
  const cleanCategories = PRODUCT_CATEGORIES.filter((c) => c.id !== 'other').map((c) => ({
    ...c,
  }));

  it('segments text with case-insensitive multi-token highlighting', () => {
    const segments = segmentHighlightedText('Kasol and Parvati Valley', 'kasol valley');
    const highlightedWords = segments.filter((s) => s.highlighted).map((s) => s.text);
    assert.deepEqual(highlightedWords, ['Kasol', 'Valley']);
    assert.equal(segments.map((s) => s.text).join(''), 'Kasol and Parvati Valley');
  });

  it('escapes special regex characters safely during text highlighting', () => {
    const segments = segmentHighlightedText('Kullu & Jari (Parvati)', '(Parvati)');
    const highlighted = segments.filter((s) => s.highlighted).map((s) => s.text);
    assert.deepEqual(highlighted, ['(Parvati)']);
  });

  it('fetches and ranks Stays destination results in real time when typing', () => {
    const res = unifiedClientSearchHandler({
      activeCategory: 'stays',
      query: 'Parvati',
      filters: { propertyTypes: [], categories: [], genres: [] },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories: cleanCategories,
      productions: AUTHENTIC_PRODUCTIONS,
    });

    const destSuggestions = res.liveSuggestions.filter((s) => s.kind === 'destination');
    assert.ok(destSuggestions.length >= 2, 'Expected Kasol and Kullu & Jari for Parvati query');
    const slugs = destSuggestions.map((d) => d.destinationSlug);
    assert.ok(slugs.includes('kasol'));
    assert.ok(slugs.includes('kullu-jari'));
  });

  it('surfaces sub-village match terms (e.g., Tosh) inside Stays destination smart suggestions', () => {
    const res = unifiedClientSearchHandler({
      activeCategory: 'stays',
      query: 'tosh',
      filters: { propertyTypes: [], categories: [], genres: [] },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories: cleanCategories,
      productions: AUTHENTIC_PRODUCTIONS,
    });

    const kasolDest = res.liveSuggestions.find((s) => s.destinationSlug === 'kasol');
    assert.ok(kasolDest, 'Expected Kasol destination to match sub-village "tosh"');
    assert.ok(
      kasolDest.subtitle.toLowerCase().includes('tosh'),
      `Expected subtitle "${kasolDest.subtitle}" to include matched sub-village "Tosh"`
    );
  });

  it('fetches and ranks Products category results when typing category names or keywords', () => {
    const res = unifiedClientSearchHandler({
      activeCategory: 'products',
      query: 'craft',
      filters: { propertyTypes: [], categories: [], genres: [] },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories: cleanCategories,
      productions: AUTHENTIC_PRODUCTIONS,
    });

    const catSuggestions = res.liveSuggestions.filter((s) => s.kind === 'product-category');
    assert.ok(catSuggestions.length >= 1, 'Expected product category suggestions for "craft"');
    assert.equal(catSuggestions[0].categoryId, 'crafts');

    // Keyword match e.g. "honey" -> Food category with "Honey" surfaced in subtitle
    const honeyRes = unifiedClientSearchHandler({
      activeCategory: 'products',
      query: 'honey',
      filters: { propertyTypes: [], categories: [], genres: [] },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories: cleanCategories,
      productions: AUTHENTIC_PRODUCTIONS,
    });
    const foodCat = honeyRes.liveSuggestions.find((s) => s.categoryId === 'food');
    assert.ok(foodCat, 'Expected Food category to match "honey"');
    assert.ok(foodCat.subtitle.toLowerCase().includes('honey'));
  });

  it('fetches Production genres and original films when typing in Productions search', () => {
    const docRes = unifiedClientSearchHandler({
      activeCategory: 'productions',
      query: 'doc',
      filters: { propertyTypes: [], categories: [], genres: [] },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories: cleanCategories,
      productions: AUTHENTIC_PRODUCTIONS,
    });

    const genreSuggestions = docRes.liveSuggestions.filter((s) => s.kind === 'genre');
    const filmSuggestions = docRes.liveSuggestions.filter((s) => s.kind === 'film');

    assert.ok(genreSuggestions.length >= 1, 'Expected Documentary genre suggestion when typing "doc"');
    assert.equal(genreSuggestions[0].title, 'Documentary');
    assert.ok(filmSuggestions.some((f) => f.title === 'Aaj Ka Devta'));

    // Also test Cultural Monologue genre match
    const monoRes = unifiedClientSearchHandler({
      activeCategory: 'productions',
      query: 'monologue',
      filters: { propertyTypes: [], categories: [], genres: [] },
      recentSearches: [],
      destinations: CURATED_DESTINATIONS,
      properties: EXISTING_PROPERTIES,
      products: [],
      productCategories: cleanCategories,
      productions: AUTHENTIC_PRODUCTIONS,
    });
    assert.ok(
      monoRes.liveSuggestions.some(
        (s) => s.kind === 'genre' && s.title === 'Cultural Monologue'
      )
    );
  });

  it('scores prefix matches higher than secondary substring matches', () => {
    const prefixScore = scoreSearchMatch('man', ['Manali'], ['Himachal Pradesh']);
    const secondaryScore = scoreSearchMatch('man', ['Kasol'], ['Mountain hamlets and trails']);
    assert.ok(prefixScore.score > secondaryScore.score);
  });
});
