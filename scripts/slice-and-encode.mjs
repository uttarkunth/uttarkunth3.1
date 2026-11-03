import fs from 'node:fs';
import path from 'node:path';

function getSections(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match section headers like "-- 1.", "-- 2.", "-- 3.", etc.
  const regex = /^-- ([0-9]+[A-Z]?\..*)$/gm;
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push({ title: m[1], index: m.index });
  }

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = (i + 1 < matches.length) ? matches[i + 1].index : content.length;
    const sql = content.slice(start, end).trim();
    // remove any outer BEGIN; or COMMIT; if present
    const cleanSql = sql.replace(/^\s*BEGIN;\s*/i, '').replace(/\s*COMMIT;\s*$/i, '').trim();
    const b64 = Buffer.from(cleanSql, 'utf8').toString('base64');
    sections.push({
      title: matches[i].title,
      sqlLength: cleanSql.length,
      b64Length: b64.length,
      b64,
    });
  }
  return sections;
}

const file2d = 'supabase/migrations/20261103114500_phase2d_security_remediation.sql';
const s2d = getSections(file2d);
fs.writeFileSync('supabase/migrations/20261103114500_sections.json', JSON.stringify(s2d, null, 2));

const file2e = 'supabase/migrations/20261103114530_phase2e_security_remediation.sql';
const s2e = getSections(file2e);
fs.writeFileSync('supabase/migrations/20261103114530_sections.json', JSON.stringify(s2e, null, 2));

const file2f = 'supabase/migrations/20261103114600_phase2f_products_marketplace.sql';
const s2f = getSections(file2f);
fs.writeFileSync('supabase/migrations/20261103114600_sections.json', JSON.stringify(s2f, null, 2));

console.log('Sections processed:');
console.log('Phase 2D sections:', s2d.map(s => `${s.title} (${s.sqlLength} chars)`));
console.log('Phase 2E sections:', s2e.map(s => `${s.title} (${s.sqlLength} chars)`));
console.log('Phase 2F sections:', s2f.map(s => `${s.title} (${s.sqlLength} chars)`));
