/** Segurança: a consulta de artes NÃO depende de tabelas de funcionalidades desativadas. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
function walk(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(item => {
    const absolute = path.join(folder, item.name);
    return item.isDirectory() ? walk(absolute) : [absolute];
  });
}
test('nenhum código do servidor nem UI requer Bocao', () => {
  const sources = [...walk(path.join(root, 'src')), ...walk(path.join(root,'prisma'))]
    .filter(f => /\.(ts|tsx|prisma)$/.test(f));
  for (const file of sources) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /boc[aã]o|bocoes/i, file);
});
test('as três APIs afetadas consultam apenas tabelas remanescentes', () => {
  for (const name of ['src/lib/arts.ts', 'src/app/api/catalog/route.ts', 'src/app/api/admin/arts/route.ts']) {
    const src = read(name);
    assert.doesNotMatch(src, /\.bocao\b|\bbocao\s*:/i);
  }
  assert.match(read('src/app/api/admin/arts/route.ts'), /db\.art\.findMany/);
  assert.match(read('src/lib/arts.ts'), /db\.art\.findMany/);
});
test('modelo Art continua existente e a tela de artes continua no Admin e Portal', () => {
  assert.match(read('prisma/schema.prisma'), /model Art\s*\{/);
  assert.doesNotMatch(read('prisma/schema.prisma'), /model Bocao\s*\{/);
  assert.match(read('src/components/views/AdminView.tsx'), /<AdminArtsSection\s*\/>/);
  assert.match(read('src/components/views/PortalView.tsx'), /<ArtCard\b/);
});
test('rotas e componentes descontinuados não são publicados', () => {
  for (const name of ['src/app/api/bocoes', 'src/app/api/admin/bocoes', 'src/components/portal/BocoesSection.tsx', 'src/components/views/AdminBocoesSection.tsx']) {
    assert.equal(fs.existsSync(path.join(root, name)), false, name);
  }
});
