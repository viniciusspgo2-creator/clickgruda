/** Smoke tests puros da busca e dos filtros. npm run test:discovery (após npm ci). */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const root = process.cwd()
const cache = new Map()
const nodeRequire = createRequire(import.meta.url)
function localModule(relative) {
  if (cache.has(relative)) return cache.get(relative)
  const file = path.join(root, relative)
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  cache.set(relative, exports)
  const resolve = (name) => {
    if (name === '@/lib/art-search') return localModule('src/lib/art-search.ts')
    if (name === '@/lib/art-code') return localModule('src/lib/art-code.ts')
    if (name === '@/lib/arts') return localModule('src/lib/arts.ts')
    if (name === '@/lib/db') return { db: {} }
    if (name === '@prisma/client') return { Prisma: {} }
    return nodeRequire(name)
  }
  vm.runInNewContext('(function(require, module, exports) {' + js + '\n})', {})(resolve, { exports }, exports)
  return exports
}

const search = localModule('src/lib/art-search.ts')
const arts = localModule('src/lib/arts.ts')
const admin = localModule('src/lib/admin-art-filters.ts')

const json = (x) => JSON.parse(JSON.stringify(x))

test('busca elimina palavras genéricas sem eliminar a intenção', () => {
  assert.deepEqual([...search.searchTokens('caneca do Goku')], ['Goku'])
  assert.deepEqual([...search.searchTokens('Dia dos Pais')], ['Dia', 'Pais'])
  assert.deepEqual([...search.searchTokens('caneca')], ['caneca'])
})

test('sinônimos incluem variantes conhecidas e não fazem reclassificação automática', () => {
  assert.ok(search.searchVariants('goku').includes('dragon ball'))
  assert.ok(search.searchVariants('mae').includes('mãe'))
  assert.ok(search.searchVariants('desconhecido').length === 1)
})

test('código individual é buscado por igualdade', () => {
  const where = json(arts.buildArtWhere({ q: 'CG-0042' }))
  assert.deepEqual(where, { AND: [{ code: 42 }] })
})

test('busca por palavras inclui termos relevantes e mantém a pesquisa no banco', () => {
  const where = JSON.stringify(arts.buildArtWhere({ q: 'caneca goku' }))
  assert.match(where, /dragon ball/)
  assert.match(where, /title/)
  assert.doesNotMatch(where, /"code":/)
})

test('filtro de artes sem tags não altera status de selecionada', () => {
  const filters = admin.normalizeAdminArtFilters({ quality: 'no-tags' })
  const where = json(admin.buildAdminArtWhere(filters))
  assert.equal(filters.quality, 'no-tags')
  assert.ok(where.AND.some((condition) => condition.tags?.none))
  assert.ok(!where.AND.some((condition) => condition.isSelected !== undefined))
})

test('filtros de revisão contam como filtros ativos para seleção em lote', () => {
  assert.equal(admin.hasActiveAdminArtFilters(admin.normalizeAdminArtFilters({ quality: 'no-tags' })), true)
  assert.equal(admin.hasActiveAdminArtFilters(admin.normalizeAdminArtFilters({})), false)
})
