import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { readLocalFile, extToMime, slugify, getR2Config, presignOriginalGet } from '@/lib/storage'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSessionUser()

  if (!session) return jsonError('Faça login para baixar as artes', 401)
  if (!session.hasAccess) return jsonError('Você precisa de acesso para baixar. Faça o pagamento!', 403)
  if (session.isDemo)
    return jsonError('Conta de demonstração: downloads liberados apenas após a ativação do acesso.', 403)

  const art = await db.art.findUnique({ where: { id } })
  if (!art) return jsonError('Arte não encontrada', 404)

  await db.$transaction([
    db.download.create({ data: { userId: session.id, artId: id } }),
    db.art.update({ where: { id }, data: { downloadsCount: { increment: 1 } } }),
  ])

  const filename = `click-gruda-${slugify(art.title) || 'arte'}`

  /* Original em alta (PNG) guardado no R2 privado: devolve uma URL assinada de curta duração. */
  if (art.originalKey) {
    const cfg = await getR2Config()
    if (cfg) {
      const oext = art.originalKey.split('.').pop() || 'png'
      try {
        const url = await presignOriginalGet(cfg, art.originalKey, `${filename}.${oext}`)
        return Response.json({ url, filename: `${filename}.${oext}` }, { headers: { 'Cache-Control': 'no-store' } })
      } catch {
        return jsonError('Não foi possível gerar o link de download. Tente novamente.', 502)
      }
    }
  }

  let buffer: Buffer | null = null
  let ext = 'png'

  if (art.imageUrl.startsWith('/uploads/')) {
    ext = (art.imageUrl.split('.').pop() || 'png').toLowerCase()
    buffer = await readLocalFile(art.imageUrl)
    if (!buffer) {
      /* Serverless (Vercel): o arquivo estático vive na camada pública do deploy,
         não no filesystem da lambda — busca pela origem e transmite em anexo. */
      try {
        const origin = new URL(req.url).origin
        const res = await fetch(`${origin}${art.imageUrl}`)
        if (res.ok) buffer = Buffer.from(await res.arrayBuffer())
      } catch {
        buffer = null
      }
    }
  } else {
    try {
      const res = await fetch(art.imageUrl)
      if (!res.ok) throw new Error('fetch failed')
      buffer = Buffer.from(await res.arrayBuffer())
      const urlExt = art.imageUrl.split('.').pop()?.split('?')[0] || ''
      if (['png', 'jpg', 'jpeg', 'webp'].includes(urlExt.toLowerCase())) ext = urlExt.toLowerCase()
    } catch {
      buffer = null
    }
  }

  if (!buffer) return jsonError('Arquivo da arte não encontrado', 404)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': extToMime(ext),
      'Content-Disposition': `attachment; filename="${filename}.${ext}"; filename*=UTF-8''${encodeURIComponent(`${filename}.${ext}`)}`,
      'Cache-Control': 'no-store',
    },
  })
}
