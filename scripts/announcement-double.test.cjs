const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const src = file => fs.readFileSync(path.join(root, file), 'utf8')

test('mesmo Setting do popup simples, sem migração de banco', () => {
  const model = src('src/lib/announcement.ts')
  assert.match(model, /portal_announcement_v1/)
  assert.match(model, /layout\?: 'single' \| 'double'/)
  assert.match(model, /secondary\?: AnnouncementContent/)
  assert.match(model, /data\.layout === 'double' \? 'double' : 'single'/)
  assert.match(model, /db\.setting\.upsert/)
})

test('publicação dupla exige dois avisos válidos, sem perder o controle de admin', () => {
  const api = src('src/app/api/admin/announcement/route.ts')
  assert.match(api, /isAdmin\(\)/)
  assert.match(api, /layout === 'double' && \(!secondary\.title \|\| !secondary\.message\)/)
  assert.match(api, /writeAnnouncement\(announcement\)/)
})

test('admin oferece seleção e prévia do formato duplo', () => {
  const admin = src('src/components/admin/AdminAnnouncementSection.tsx')
  assert.match(admin, /Pop-up simples/)
  assert.match(admin, /Pop-up duplo/)
  assert.match(admin, /Aviso 2 — Direita/)
  assert.match(admin, /AnnouncementPresentation/)
})

test('portal exibe dois avisos, rodapé social único e fecha os dois juntos', () => {
  const popup = src('src/components/portal/AnnouncementDialog.tsx')
  const css = src('src/components/portal/AnnouncementDialog.module.css')
  assert.match(popup, /const second = notice\.secondary/)
  assert.match(popup, /className=\{styles\.doubleGrid\}/)
  assert.match(popup, /className=\{styles\.doubleFooter\}/)
  assert.match(popup, /ContinueButton onClose=\{onClose\}/)
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(css, /max-width: 850px/)
  assert.match(popup, /cg-announcement-seen:/)
})
