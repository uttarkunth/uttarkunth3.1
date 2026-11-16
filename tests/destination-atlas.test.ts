import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CURATED_DESTINATIONS } from '../lib/destinations';
import {
  DESTINATION_VISUALS,
  getVisualMeta,
} from '../components/home/destination-atlas';

test('Every DESTINATION_VISUALS entry points to a unique, existing illustration file and has a subLabel', () => {
  const entries = Object.entries(DESTINATION_VISUALS);
  assert.equal(entries.length, 27);

  const seen = new Set<string>();
  for (const [slug, meta] of entries) {
    const diskPath = path.join(process.cwd(), 'public', meta.illustrationSrc);
    assert.equal(
      fs.existsSync(diskPath),
      true,
      `Missing illustration file on disk for ${slug}: ${meta.illustrationSrc}`
    );
    assert.equal(
      seen.has(meta.illustrationSrc),
      false,
      `Duplicate illustrationSrc for ${slug}: ${meta.illustrationSrc}`
    );
    seen.add(meta.illustrationSrc);
    assert.ok(meta.subLabel.trim().length > 0, `Missing subLabel for ${slug}`);
  }

  for (const dest of CURATED_DESTINATIONS) {
    const meta = getVisualMeta(dest);
    assert.ok(meta.illustrationSrc.startsWith('/assets/destinations/'));
  }
});

test('DestinationAtlas icon hover has zero scale-up or scale-down classes', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'components/home/destination-atlas.tsx'),
    'utf8'
  );
  assert.equal(source.includes('group-hover:scale-'), false);
  assert.equal(source.includes('hover:scale-'), false);
});
