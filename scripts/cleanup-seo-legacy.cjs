/** Limpa somente arquivos substituídos ou descontinuados nesta atualização.
 * Garante atualização por sobreposição de arquivos sem conflito nas rotas SEO.
 * Não altera banco de dados, uploads de artes ou credenciais.
 */
const fs = require('node:fs')
const path = require('node:path')
const obsolete = [
  'public/robots.txt', 'public/llms.txt', 'public/llms-full.txt',
  'src/components/portal/DailyLimitDialog.tsx',
  'src/components/portal/ShareCatalogSection.tsx',
  'src/components/views/SharedCatalogView.tsx',
  'src/lib/download-quota.ts',
  'src/lib/portal-news.ts',
  'src/components/portal/NovidadesCard.tsx',
  'src/components/portal/CatalogoDigitalNews.tsx',
  'src/components/portal/WaitlistDialog.tsx',
]
for (const relative of obsolete) {
  const target = path.resolve(__dirname, '..', relative)
  if (fs.existsSync(target)) {
    fs.rmSync(target)
    console.log(`Arquivo substituído/descontinuado removido: ${relative}`)
  }
}
