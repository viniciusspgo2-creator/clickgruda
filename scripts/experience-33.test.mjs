/** Regressões de interface da Experience 3.3 sem dados reais ou navegador. */
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const portal = readFileSync('src/components/views/PortalView.tsx', 'utf8')
const preview = readFileSync('src/components/portal/ArtPreviewDialog.tsx', 'utf8')
const css = readFileSync('src/app/globals.css', 'utf8')

test('atalho unifica Studio e Editor e oferece o caminho até o código automático', () => {
  assert.match(portal, /Studio · Mockup \+ Editor/)
  assert.match(portal, /Ver meu código do Studio/)
  assert.match(portal, /openExternal\(STUDIO_URL/)
  assert.doesNotMatch(portal, /clicktools\.vercel|Solicitar código grátis|setZipOpen/)
})

test('prévia explica a diferença entre imagem visualizada e arquivo para baixar', () => {
  assert.match(preview, /Prévia de visualização/)
  assert.match(preview, /Baixar arte/)
  assert.doesNotMatch(preview, /Abrir esta prévia em outra aba/)
  assert.match(preview, /onContextMenu=\{event => event\.preventDefault\(\)\}/)
  assert.doesNotMatch(preview, /Abrir imagem em tamanho original/)
})

test('ajustes de mobile e redução de movimento continuam presentes', () => {
  assert.match(css, /cg-mobile-quicklinks/)
  assert.match(css, /max-width:767px/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})
