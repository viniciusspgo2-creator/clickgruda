import { getSessionUser, jsonError } from '@/lib/auth'
import { putImage, isAllowedImageExt } from '@/lib/storage'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * POST /api/admin/upload — upload de imagem de arte (multipart/form-data, campo "file").
 * Armazenamento: Cloudflare R2 quando configurado no Admin Master (CDN);
 * em produção (Vercel) sem R2 retorna erro orientando R2 ou URL externa;
 * em desenvolvimento cai para o /public/uploads local.
 */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Acesso restrito ao Admin Master', 401)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return jsonError('Envio inválido (esperado multipart/form-data)', 400)
  }

  const file = form.get('file')
  if (!(file instanceof File)) return jsonError('Nenhum arquivo enviado (campo "file")', 400)

  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!isAllowedImageExt(ext)) return jsonError('Formato não suportado. Use PNG, JPG ou WEBP.', 400)
  if (file.size > MAX_SIZE) return jsonError('Arquivo muito grande. Máximo: 10MB.', 400)
  if (file.size === 0) return jsonError('Arquivo vazio.', 400)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await putImage(buffer, ext)
    return Response.json({ url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha no upload.'
    return jsonError(message, 500)
  }
}
