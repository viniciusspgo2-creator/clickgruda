import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

// Download somente leitura; não inclui dados pessoais, originais privados ou chaves de armazenamento.
const csvCell = (value: unknown): string => {
  const text = String(value ?? '').replace(/\r\n?/g, '\n')
  // Excel/LibreOffice: impede interpretação de títulos e tags como fórmulas.
  const safe = /^[\s]*[=+@\-\t]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)

  const count = await db.art.count()
  if (count > 20000) return jsonError('Exportação acima de 20 mil artes: solicite uma exportação em lotes.', 413)

  const rows: string[] = [
    ['Código', 'Título', 'Categoria', 'Tags', 'Data sazonal', 'Selecionada', 'Lançamento', 'Downloads', 'Criada em'].map(csvCell).join(';'),
  ]
  let cursor: string | undefined
  while (true) {
    const batch = await db.art.findMany({
      take: 500,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'asc' },
      select: {
        id: true, code: true, title: true, isSelected: true, isLaunch: true, downloadsCount: true, createdAt: true,
        category: { select: { name: true } },
        seasonalEvent: { select: { name: true } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    })
    for (const art of batch) {
      rows.push([
        `CG-${String(art.code).padStart(4, '0')}`,
        art.title,
        art.category?.name ?? '',
        art.tags.map((t) => t.tag.name).join(', '),
        art.seasonalEvent?.name ?? '',
        art.isSelected ? 'Sim' : 'Não',
        art.isLaunch ? 'Sim' : 'Não',
        String(art.downloadsCount),
        art.createdAt.toISOString().slice(0, 10),
      ].map(csvCell).join(';'))
    }
    if (batch.length < 500) break
    cursor = batch[batch.length - 1].id
  }

  const date = new Date().toISOString().slice(0, 10)
  return new Response(`\ufeff${rows.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clickgruda-artes-${date}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
