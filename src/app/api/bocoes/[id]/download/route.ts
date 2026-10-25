import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { formatArtCode } from '@/lib/art-code'
import { downloadQuota, limitMessage, nextResetBR, recordLimitHit } from '@/lib/download-quota'
import { readLocalFile, extToMime, slugify, getR2Config, presignOriginalGet } from '@/lib/storage'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSessionUser()

  if (!session) return jsonError('Faça login para baixar as artes', 401)
  if (!session.hasAccess) return jsonError('Você precisa de acesso para baixar. Faça o pagamento!', 403)
  if (session.isDemo)
    return jsonError('Conta de demonstração: downloads liberados apenas após a ativação do acesso.', 403)

  const bocao = await db.bocao.findUnique({ where: { id }, include: { art: { select: { id: true, code: true, title: true } } } })
  if (!bocao) return jsonError('Bocão não encontrado', 404)
  const art = bocao.art

  // Limite diário de downloads (admin fica de fora). Baixar de novo uma arte já baixada HOJE não gasta cota.
  if (session.role !== 'ADMIN') {
    const quota = await downloadQuota(session.id)
    if (quota.limit > 0 && quota.used >= quota.limit && !quota.today.has(art.id)) {
      await recordLimitHit(session.id, quota.limit)
      return Response.json(
        { error: limitMessage(quota.limit), code: 'DAILY_LIMIT', limit: quota.limit, resetAt: nextResetBR().toISOString() },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      )
    }
  }

  // ?via=zip → a arte está sendo baixada dentro de um ZIP de backup
  const viaZip = new URL(req.url).searchParams.get('via') === 'zip'

  // Registra somente quando o arquivo/link existir e estiver pronto para entrega.
  // Assim uma falha no R2/storage não consome a cota de um assinante.
  const recordSuccess = async () => {
    await db.$transaction([
      db.download.create({ data: { userId: session.id, artId: art.id, viaZip } }),
      db.art.update({ where: { id: art.id }, data: { downloadsCount: { increment: 1 } } }),
    ])
  }

  const filename = `${formatArtCode(art.code)}-bocao-${slugify(art.title) || 'arte'}`

  /* Original em alta (PNG) guardado no R2 privado: devolve uma URL assinada de curta duração. */
  if (bocao.originalKey) {
    const cfg = await getR2Config()
    if (!cfg) return jsonError('Armazenamento do original indisponível. Tente novamente ou contate o suporte.', 503)
    if (cfg) {
      const oext = bocao.originalKey.split('.').pop() || 'png'
      try {
        const url = await presignOriginalGet(cfg, bocao.originalKey, `${filename}.${oext}`)
        await recordSuccess()
        return Response.json({ url, filename: `${filename}.${oext}` }, { headers: { 'Cache-Control': 'no-store' } })
      } catch {
        return jsonError('Não foi possível gerar o link de download. Tente novamente.', 502)
      }
    }
  }

  let buffer: Buffer | null = null
  let ext = 'png'

  if (bocao.imageUrl.startsWith('/uploads/')) {
    ext = (bocao.imageUrl.split('.').pop() || 'png').toLowerCase()
    buffer = await readLocalFile(bocao.imageUrl)
    if (!buffer) {
      /* Serverless (Vercel): o arquivo estático vive na camada pública do deploy,
         não no filesystem da lambda — busca pela origem e transmite em anexo. */
      try {
        const origin = new URL(req.url).origin
        const res = await fetch(`${origin}${bocao.imageUrl}`)
        if (res.ok) buffer = Buffer.from(await res.arrayBuffer())
      } catch {
        buffer = null
      }
    }
  } else {
    try {
      const res = await fetch(bocao.imageUrl)
      if (!res.ok) throw new Error('fetch failed')
      buffer = Buffer.from(await res.arrayBuffer())
      const urlExt = bocao.imageUrl.split('.').pop()?.split('?')[0] || ''
      if (['png', 'jpg', 'jpeg', 'webp'].includes(urlExt.toLowerCase())) ext = urlExt.toLowerCase()
    } catch {
      buffer = null
    }
  }

  if (!buffer) return jsonError('Arquivo da arte não encontrado', 404)

  await recordSuccess()
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': extToMime(ext),
      'Content-Disposition': `attachment; filename="${filename}.${ext}"; filename*=UTF-8''${encodeURIComponent(`${filename}.${ext}`)}`,
      'Cache-Control': 'no-store',
    },
  })
}
