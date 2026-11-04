import { getSessionUser, jsonError } from '@/lib/auth'
import { getR2Config, presignPut } from '@/lib/storage'
import { randomUUID } from 'crypto'
import { MAX_ART_SIZE, MAX_ART_SIZE_LABEL } from '@/lib/upload-limits'

/**
 * POST /api/admin/upload/sign  { originalExt: 'png' | 'jpg' | 'jpeg' | 'webp', fileSize: number }
 *
 * Devolve URLs assinadas para o navegador enviar DIRETO ao Cloudflare R2:
 *  - ORIGINAL (PNG em alta) -> bucket de originais (privado). A chave NUNCA vai para o público.
 *  - PRÉVIA (WebP leve)     -> bucket público. É a única imagem que aparece no site.
 * Se o R2 não estiver configurado, responde { r2: false } e o painel usa o upload local (dev).
 */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Acesso restrito ao Admin Master', 401)

  const body = await req.json().catch(() => ({}))
  const ext = String(body.originalExt || 'png').toLowerCase()
  if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return jsonError('Formato não suportado. Use PNG, JPG ou WEBP.', 400)
  const fileSize = Number(body.fileSize)
  if (!Number.isSafeInteger(fileSize) || fileSize <= 0) return jsonError('Tamanho de arquivo inválido.', 400)
  if (fileSize > MAX_ART_SIZE) return jsonError(`Arquivo muito grande. Máximo: ${MAX_ART_SIZE_LABEL}.`, 400)

  const cfg = await getR2Config()
  if (!cfg) return Response.json({ r2: false, requiresR2ForLargeFiles: Boolean(process.env.VERCEL) })

  const id = randomUUID()
  const originalKey = `originals/${id}.${ext}`
  const previewKey = `previews/${id}.webp`
  const originalType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  try {
    const [originalPutUrl, previewPutUrl] = await Promise.all([
      presignPut(cfg, cfg.originalsBucket, originalKey, originalType),
      presignPut(cfg, cfg.previewsBucket, previewKey, 'image/webp'),
    ])
    return Response.json({
      r2: true,
      originalKey,
      originalPutUrl,
      originalType,
      previewPutUrl,
      previewUrl: `${cfg.publicUrl}/${previewKey}`,
    })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Falha ao preparar upload no R2', 500)
  }
}
