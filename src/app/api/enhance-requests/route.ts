import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { putImage, isAllowedImageExt } from '@/lib/storage'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_NOTE = 400

/**
 * POST /api/enhance-requests — envio de arte própria para melhoria de qualidade.
 * O assinante manda a arte pixelizada / em baixa qualidade e o pedido cai
 * direto no Painel Admin Master (ArtEnhanceRequest, status NEW).
 * multipart/form-data: file (PNG/JPG/WEBP até 10MB) + note (opcional).
 */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Entre na sua conta para enviar a arte.', 401)
  if (!session.hasAccess) return jsonError('O envio de artes está disponível para assinantes com acesso ativo.', 403)
  if (session.isDemo) return jsonError('O envio de artes é liberado após a ativação do seu acesso.', 403)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return jsonError('Envio inválido (esperado multipart/form-data).', 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) return jsonError('Nenhuma imagem enviada.', 400)

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!isAllowedImageExt(ext)) return jsonError('Formato não suportado. Use PNG, JPG ou WEBP.', 400)
  if (file.size === 0) return jsonError('Arquivo vazio.', 400)
  if (file.size > MAX_SIZE) return jsonError('Arquivo muito grande. Máximo: 10MB.', 400)

  const rawNote = form.get('note')
  const note = typeof rawNote === 'string' ? rawNote.trim().slice(0, MAX_NOTE) : ''

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const imageUrl = await putImage(buffer, ext, 'enhance')

    const created = await db.artEnhanceRequest.create({
      data: {
        userId: session.id,
        imageUrl,
        fileName: file.name.slice(0, 160),
        note,
      },
    })

    return Response.json({ ok: true, id: created.id }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha ao enviar a arte. Tente novamente.'
    return jsonError(message, 500)
  }
}
