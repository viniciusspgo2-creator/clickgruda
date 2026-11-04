import { getSessionUser, jsonError } from '@/lib/auth'
import { getR2Config } from '@/lib/storage'
import { diagnoseR2Cors, uploadOrigins } from '@/lib/r2-cors'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return jsonError('Acesso restrito ao Admin Master', 401)
  const origin = req.headers.get('origin') || new URL(req.url).origin
  if (!uploadOrigins().includes(origin)) return jsonError('Origem não autorizada para configurar o upload.', 403)
  const body = await req.json().catch(() => ({}))
  if (!body || !['check', 'repair'].includes(body.mode)) return jsonError('Informe check ou repair.', 400)
  const cfg = await getR2Config()
  if (!cfg) return jsonError('Ative e salve a configuração completa do Cloudflare R2 antes de verificar o envio.', 400)
  const result = await diagnoseR2Cors(cfg, origin, body.mode === 'repair')
  return Response.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
}
