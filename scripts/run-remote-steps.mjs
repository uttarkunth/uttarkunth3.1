import fs from 'node:fs';

const [,, file, pattern, outFile] = process.argv;
const sections = JSON.parse(fs.readFileSync(file, 'utf8'));
const match = sections.find(s => s.title.includes(pattern));
if (!match) {
  console.error('Section not found for pattern:', pattern);
  process.exit(1);
}
const sql = `DO $$ BEGIN EXECUTE convert_from(decode('${match.b64}', 'base64'), 'UTF-8'); END $$;`;
if (outFile) {
  fs.writeFileSync(outFile, sql, 'utf8');
  console.log(`Wrote ${outFile} (${sql.length} chars)`);
} else {
  console.log(sql);
}
