// Executar após npm run build. Confere o CSS entregue, incluindo a cascata
// entre utilities do Tailwind e as regras antigas fora de @layer.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const postcss = require('postcss')
const base = path.resolve(__dirname, '..')
const html = fs.readFileSync(path.join(base, '.next/server/app/index.html'), 'utf8')
const links = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
const sheets = links.map(m => postcss.parse(fs.readFileSync(path.join(base, '.next', m[1].replace('/_next/', '')), 'utf8')))
const rootMatch = html.match(/<div class="(cg-sales(?:-page)?\s[^"]*)"/)
assert.ok(rootMatch, 'Landing precisa existir no HTML de produção')
const rootClasses = rootMatch[1].split(/\s+/)
const unescape = value => value.replace(/\\([\da-f]{1,6})\s?|\\(.)/gi, (_, hex, char) => hex ? String.fromCodePoint(parseInt(hex, 16)) : char)
const layerOrder = { theme: 0, base: 1, components: 2, utilities: 3 }
function appliesMedia(params, width) {
  const lengths = value => Number.parseFloat(value) * (/rem/.test(value) ? 16 : 1)
  const min = params.match(/min-width:\s*([\d.]+(?:px|rem))/) || params.match(/width\s*>=\s*([\d.]+(?:px|rem))/)
  const max = params.match(/max-width:\s*([\d.]+(?:px|rem))/) || params.match(/width\s*<=\s*([\d.]+(?:px|rem))/)
  if (params.includes('prefers-reduced-motion')) return false
  return (!min || width >= lengths(min[1])) && (!max || width <= lengths(max[1]))
}
function styles(classes, tag, width, inherited = {}) {
  const winners = new Map()
  let order = 0
  for (const sheet of sheets) sheet.walkRules(rule => {
    let layer = 100, allowed = true
    for (let ancestor = rule.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.type !== 'atrule') continue
      if (ancestor.name === 'layer') layer = layerOrder[ancestor.params] ?? 2
      if (ancestor.name === 'media' && !appliesMedia(ancestor.params, width)) allowed = false
      if (ancestor.name.includes('keyframes')) allowed = false
    }
    if (!allowed) return
    for (const selector of postcss.list.comma(rule.selector)) {
      const classMatch = selector.match(/^\.((?:\\.|[\w-])+)$/)
      const matched = selector === '*' || selector === tag || (classMatch && classes.includes(unescape(classMatch[1])))
      if (!matched) continue
      const specificity = classMatch ? 10 : selector === '*' ? 0 : 1
      rule.walkDecls(decl => {
        const rank = [decl.important ? 1 : 0, decl.important ? -layer : layer, specificity, ++order]
        const prop = decl.prop === 'background' ? 'background-color' : decl.prop
        if (prop !== 'background-color' && prop !== 'color' && !prop.startsWith('--')) return
        const previous = winners.get(prop)
        if (!previous || rank.some((value, i) => value !== previous.rank[i] && rank.slice(0, i).every((x, j) => x === previous.rank[j]) && value > previous.rank[i])) winners.set(prop, { rank, value: decl.value })
      })
    }
  })
  const values = { ...inherited }
  for (const [prop, item] of winners) values[prop] = item.value
  const resolve = value => value?.replace(/var\((--[\w-]+)\)/g, (_, name) => values[name] || '')
  for (const key of ['color', 'background-color']) values[key] = resolve(values[key])
  return values
}
function rgb(value) {
  assert.match(value, /^#[\da-f]{3}(?:[\da-f]{3})?$/i)
  const hex = value.length === 4 ? value.slice(1).split('').map(c => c + c).join('') : value.slice(1)
  return [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
}
function contrast(foreground, background, opacity = 1) {
  const bg = rgb(background)
  const fg = rgb(foreground).map((v, i) => v * opacity + bg[i] * (1 - opacity))
  const luminance = color => color.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0)
  const a = luminance(fg), b = luminance(bg)
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
}
assert.ok(rootClasses.includes('cg-sales-page') && !rootClasses.includes('cg-sales'), 'Landing atual não pode herdar o tema antigo')
const headings = [...html.matchAll(/<(h[123])\b[^>]*class="([^"]*)"/g)]
for (const width of [360, 768, 1440]) {
  const root = styles(rootClasses, 'div', width)
  assert.equal(root['background-color'], '#0c0b0e')
  assert.equal(root.color, '#fff')
  for (const heading of headings) assert.equal(styles(heading[2].split(/\s+/), heading[1], width, root).color, '#fff', `Título precisa herdar a cor clara em ${width}px`)
  assert.ok(contrast(root.color, root['background-color']) > 18)
  assert.ok(contrast('#fff', root['background-color'], .55) > 5)
  console.log(`${width}px: fundo escuro, ${headings.length} títulos claros; contraste do texto secundário > 5:1`)
}
// A mesma folha ainda contém a regra histórica. Reproduzir seu resultado
// evita um teste que passaria mesmo com o conflito original intacto.
const legacy = styles(['cg-sales', 'bg-[#0c0b0e]', 'text-white'], 'div', 1440)
assert.equal(legacy['background-color'], '#f7f3ed')
assert.equal(legacy.color, '#111319')
assert.ok(contrast('#fff', legacy['background-color'], .75) < 1.2)
console.log('Regressão original reproduzida: o tema antigo ainda venceria as utilities; o novo escopo impede a colisão.')
