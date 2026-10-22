/** Regressões de interface da Experience 3.3 sem dados reais ou navegador. */
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const portal = readFileSync('src/components/views/PortalView.tsx', 'utf8')
const preview = readFileSync('src/components/portal/ArtPreviewDialog.tsx', 'utf8')
const mockups = readFileSync('src/components/portal/MockupToolCard.tsx', 'utf8')
const shop = readFileSync('src/components/portal/NovidadesCard.tsx', 'utf8')
const css = readFileSync('src/app/globals.css', 'utf8')

test('atalhos do cabeçalho abrem os destinos existentes do gerador e da loja', () => {
  assert.match(portal, /Gerador de Mockup/)
  assert.match(portal, /Loja Online/)
  assert.match(portal, /href="https:\/\/clicktools\.vercel\.app\/"/)
  assert.match(portal, /href="https:\/\/www\.clickgruda\.com\.br"/)
  assert.match(mockups, /https:\/\/clicktools\.vercel\.app\//)
  assert.match(shop, /https:\/\/www\.clickgruda\.com\.br/)
})

test('ferramentas ficam antes da lista paginada e sem limpar filtros', () => {
  assert.ok(portal.indexOf('ref={toolsSectionRef} id="cg-portal-tools"') < portal.indexOf('className="cg-member-grid'))
  const openTools = portal.split('const openTools = () => {')[1].split('const toggleCategory')[0]
  assert.doesNotMatch(openTools, /setFilter|resetFilters/)
})

test('prévia explica a diferença entre imagem visualizada e arquivo para baixar', () => {
  assert.match(preview, /Esta imagem é apenas uma prévia/)
  assert.match(preview, /Baixar arte/)
  assert.match(preview, /Abrir esta prévia em outra aba/)
  assert.doesNotMatch(preview, /Abrir imagem em tamanho original/)
})

test('ajustes de mobile e redução de movimento continuam presentes', () => {
  assert.match(css, /cg-mobile-quicklinks/)
  assert.match(css, /max-width:767px/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})
