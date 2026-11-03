import fs from 'node:fs';
import path from 'node:path';

const migrations = [
  {
    version: '20261103114500',
    name: 'phase2d_security_remediation',
    file: 'supabase/migrations/20261103114500_phase2d_security_remediation.sql',
  },
  {
    version: '20261103114530',
    name: 'phase2e_security_remediation',
    file: 'supabase/migrations/20261103114530_phase2e_security_remediation.sql',
  },
  {
    version: '20261103114600',
    name: 'phase2f_products_marketplace',
    file: 'supabase/migrations/20261103114600_phase2f_products_marketplace.sql',
  },
];

for (const m of migrations) {
  const sql = fs.readFileSync(path.resolve(m.file), 'utf8');
  const b64 = Buffer.from(sql, 'utf8').toString('base64');
  const b64Path = path.resolve(`supabase/migrations/${m.version}_${m.name}.b64`);
  fs.writeFileSync(b64Path, b64, 'utf8');
  console.log(`Wrote ${b64Path} (${b64.length} chars)`);
}
