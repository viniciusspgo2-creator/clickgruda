const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.join(__dirname, '..')
const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8')
const landing = fs.readFileSync(path.join(root, 'src/components/views/LandingView.tsx'), 'utf8')
const mobileAsset = path.join(root, 'public/uploads/rebrand/hero-clickgruda-premium-mobile.webp')

test('a imagem mobile original está preservada e continua servida pelo <picture>', () => {
  assert.equal(fs.existsSync(mobileAsset), true)
  assert.match(landing, /<source media="\(max-width: 1023px\)" srcSet="\/uploads\/rebrand\/hero-clickgruda-premium-mobile.webp"/)
})

test('a correção de HERO vem após o CSS legado e usa layout em fluxo normal', () => {
  const marker = '/* 04/11/2026 · HERO responsivo:'
  const pos = css.lastIndexOf(marker)
  assert.ok(pos > css.indexOf('/* Click & Gruda · HERO 1920px'), 'O CSS corretivo deve prevalecer sobre regras anteriores')
  const fix = css.slice(pos)
  assert.match(fix, /@media \(max-width: 767px\)/)
  assert.match(fix, /\.cg-home-hero-art\s*\{[^}]*position: relative;/s)
  assert.match(fix, /\.cg-home-hero-art img\s*\{[^}]*aspect-ratio: 1 \/ 1;[^}]*object-fit: contain;/s)
  assert.match(fix, /\.cg-home-hero-actions\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\);/s)
  assert.match(fix, /\.cg-home-hero-actions > \*\s*\{[^}]*min-width: 0;/s)
  assert.match(fix, /\.cg-home-hero-actions \.cg-sales-button,[\s\S]*?white-space: normal;/s)
})
