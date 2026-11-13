import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVoiceSearchCommand } from '../lib/voice-search';

test('parses direct destination voice transcript and strips trailing punctuation', () => {
  const res = parseVoiceSearchCommand('Manali.');
  assert.equal(res.cleanedQuery, 'Manali');
  assert.equal(res.matchedDestinationSlug, 'manali');
  assert.equal(res.matchedDestinationName, 'Manali');
});

test('strips conversational voice command prefixes and extracts guest counts', () => {
  const res = parseVoiceSearchCommand('Find stays in Kasol for 4 guests!');
  assert.equal(res.cleanedQuery, 'Kasol');
  assert.equal(res.matchedDestinationSlug, 'kasol');
  assert.equal(res.extractedGuests, 4);
});

test('matches sub-village voice queries like Jari or Tosh to their curated corridor', () => {
  const jariRes = parseVoiceSearchCommand('Search for homestays in Jari');
  assert.equal(jariRes.cleanedQuery, 'Jari');
  assert.equal(jariRes.matchedDestinationSlug, 'kullu-jari');

  const toshRes = parseVoiceSearchCommand('Tosh');
  assert.equal(toshRes.cleanedQuery, 'Tosh');
  assert.equal(toshRes.matchedDestinationSlug, 'kasol');
});

test('preserves property name voice queries when not a specific destination corridor', () => {
  const stayRes = parseVoiceSearchCommand('Search for Yash Home Stay');
  assert.equal(stayRes.cleanedQuery, 'Yash Home Stay');
});
