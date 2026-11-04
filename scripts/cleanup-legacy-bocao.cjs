/**
 * Remove leftovers of the discontinued Bocao feature before Vercel's TypeScript build.
 * Necessary when someone updates existing GitHub files without deleting obsolete paths.
 * Only the explicitly listed Bocao-specific files/directories are touched.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const obsolete = [
  'src/app/api/admin/bocoes',
  'src/app/api/bocoes',
  'src/components/portal/BocoesSection.tsx',
  'src/components/views/AdminBocoesSection.tsx',
  'src/lib/bocao-validation.ts',
  'scripts/bocao.test.cjs',
  'MIGRACAO-BOCAO-v2.3.sql',
  'LEIA-ANTES-DE-PUBLICAR-v2.3-BOCAO.md',
];
let removed = 0;
for (const relative of obsolete) {
  const absolute = path.join(root, relative);
  if (fs.existsSync(absolute)) {
    fs.rmSync(absolute, { recursive: true, force: true });
    console.log(`Removido legado Bocao: ${relative}`);
    removed++;
  }
}
console.log(`Limpeza Bocao concluida: ${removed} caminho(s) legados removidos. Banco de dados intacto.`);
