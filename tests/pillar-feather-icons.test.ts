import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PILLAR_FEATHER_COLLECTIONS,
  getFeatherIconsForPillar,
  type PillarFeatherCategory,
} from '../lib/pillar-feather-icons.ts';

test('every pillar has a unique 14-icon feather collection (7 left wing, 7 right wing)', () => {
  const pillars: PillarFeatherCategory[] = ['stays', 'products', 'productions', 'community'];
  const seenKeys = new Set<string>();

  for (const pillar of pillars) {
    const icons = getFeatherIconsForPillar(pillar);
    assert.equal(icons.length, 14, `${pillar} should have 14 feather icons`);

    const leftWing = icons.filter((i) => i.side === 'left');
    const rightWing = icons.filter((i) => i.side === 'right');
    assert.equal(leftWing.length, 7, `${pillar} should have 7 left-wing feather icons`);
    assert.equal(rightWing.length, 7, `${pillar} should have 7 right-wing feather icons`);

    for (const icon of icons) {
      assert.equal(icon.pillar, pillar);
      assert.ok(icon.iconKey.startsWith(`${pillar}-`), `iconKey ${icon.iconKey} should match pillar ${pillar}`);
      assert.equal(seenKeys.has(icon.iconKey), false, `iconKey ${icon.iconKey} must be unique across all pillars`);
      seenKeys.add(icon.iconKey);

      if (icon.side === 'left') {
        assert.ok(icon.dx <= -160, `left wing desktop dx (${icon.dx}) must emerge outside card left edge (-146px)`);
        assert.ok(icon.mobileDx <= -110, `left wing mobileDx (${icon.mobileDx}) must emerge outside mobile card left edge (-108px)`);
      } else {
        assert.ok(icon.dx >= 160, `right wing desktop dx (${icon.dx}) must emerge outside card right edge (+146px)`);
        assert.ok(icon.mobileDx >= 110, `right wing mobileDx (${icon.mobileDx}) must emerge outside mobile card right edge (+108px)`);
      }
    }
  }

  assert.equal(seenKeys.size, 56, 'Total distinct thematic feather icons across all 4 pillars must be 56');
  assert.equal(Object.keys(PILLAR_FEATHER_COLLECTIONS).length, 4);
});
