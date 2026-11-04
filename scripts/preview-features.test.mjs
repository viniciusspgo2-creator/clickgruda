import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
const f = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')

test('schema: conta universal, artes reprovadas, métricas', () => {
  const s = f('prisma/schema.prisma')
  for (const field of ['isPreview', 'previewMaxSessions', 'isRejected', 'model SiteEvent']) assert.ok(s.includes(field), `${field} ausente`)
})
test('segurança: download original não permitido na demo', () => {
  assert.match(f('src/app/api/arts/[id]/download/route.ts'), /isDemo/)
  assert.match(f('src/app/api/arts/route.ts'), /session\.isDemo/)
  assert.match(f('src/app/api/arts/[id]/preview/route.ts'), /sharp\(buffer/)
  assert.match(f('src/app/api/arts/[id]/preview/route.ts'), /\.blur\(1\.8\)/)
  assert.match(f('src/app/api/arts/[id]/preview/route.ts'), /width: 900, height: 420/)
  assert.match(f('src/components/portal/ArtPreviewDialog.tsx'), /blur-\[1px\] brightness-\[0\.98\]/)
  assert.match(f('src/components/shared/ArtCard.tsx'), /demo && 'blur-\[0\.5px\] brightness-\[0\.99\]'/)
  assert.match(f('src/app/api/arts/[id]/preview/route.ts'), /SEM DOWNLOAD/)
})
test('gestão: exclusão em lote, filtro e edição reprovadas', () => {
  assert.match(f('src/app/api/admin/arts/bulk/route.ts'), /export async function DELETE/)
  assert.match(f('src/app/api/admin/arts/bulk/route.ts'), /z\.literal\('EXCLUIR'\)/)
  assert.match(f('src/app/api/admin/arts/bulk/route.ts'), /TransactionIsolationLevel\.Serializable/)
  assert.match(f('src/lib/arts.ts'), /tab === 'reprovadas'/)
  assert.match(f('src/app/api/catalog/route.ts'), /'__none__'/)
})
test('preview: múltiplas sessões, popup e criação no admin', () => {
  assert.match(f('src/lib/sessions.ts'), /user\.isPreview/)
  assert.match(f('src/app/api/admin/preview/route.ts'), /previewMaxSessions/)
  assert.match(f('src/components/shared/DemoAccessButton.tsx'), /Conhecer por dentro/)
  assert.match(f('src/app/api/auth/demo/route.ts'), /createPublicDemoSession/)
  assert.match(f('src/components/admin/PreviewAccountDialog.tsx'), /Criar usuário Preview/)
})
test('landing: contagem interna de interações', () => {
  assert.match(f('src/app/api/admin/analytics/route.ts'), /uniqueVisitors/)
  assert.match(f('src/app/api/analytics/track/route.ts'), /siteEvent\.create/)
  assert.match(f('src/lib/analytics.ts'), /navigator\.sendBeacon/)
  assert.match(f('src/components/views/LandingView.tsx'), /landing_view/)
})
