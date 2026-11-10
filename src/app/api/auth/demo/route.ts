import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createPublicDemoSession, getSessionUser, jsonError } from '@/lib/auth'
import { isSafeOrigin } from '@/lib/security-guards'
import {
  ANALYTICS_IGNORE_COOKIE, ANALYTICS_IGNORE_IPS_KEY, ANALYTICS_IGNORE_VISITORS_KEY,
  getClientIp, isInternalCookie, readStringList, validVisitorId, visitorHash,
} from '@/lib/analytics-privacy'

/** Conta acessos bem-sucedidos à demonstração pública no SiteEvent existente.
 * Sem alterar schema, sem guardar IP, nome ou dados pessoais dos visitantes.
 * Um navegador pode entrar várias vezes; visitantes únicos são deduplicados pelo hash do ID local.
 */
async function recordDemoEntry(req: Request, body: unknown) {
  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  if (!validVisitorId(payload.visitorId)) return
  const cookieStore = await cookies()
  if (isInternalCookie(cookieStore.get(ANALYTICS_IGNORE_COOKIE)?.value)) return

  const visitorId = visitorHash(payload.visitorId)
  const [excludedBrowsers, excludedIps] = await Promise.all([
    db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY } }),
    db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_IPS_KEY } }),
  ])
  if (readStringList(excludedBrowsers?.value).includes(visitorId)) return
  const ip = getClientIp(req.headers)
  if (ip && readStringList(excludedIps?.value).includes(ip)) return

  // Evita duplicações por duplo clique/reenvio imediato, mas mantém visitas posteriores.
  const since = new Date(Date.now() - 2_000)
  if (await db.siteEvent.count({ where: { visitorId, name: 'demo_entry', createdAt: { gte: since } } })) return
  const location = typeof payload.location === 'string'
    ? payload.location.slice(0, 70).replace(/[^a-zA-Z0-9_-]/g, '') : ''
  await db.siteEvent.create({ data: { visitorId, name: 'demo_entry', location } })
}

export async function POST(req: Request) {
  // Na VPS o Next.js standalone monta req.url com o endereço interno do
  // servidor (localhost:3000), não com o domínio público — a comparação
  // direta com req.url rejeitava até a origem correta. Usa o mesmo
  // isSafeOrigin do login (host ou NEXT_PUBLIC_SITE_URL).
  const origin = req.headers.get('origin')
  if (origin && !isSafeOrigin(req)) return jsonError('Origem não permitida.', 403)
  try {
    const body: unknown = await req.json().catch(() => null)
    const existing = await getSessionUser()
    // Uma conta ativa ou de administrador mantém sua própria sessão.
    const user = existing && (existing.hasAccess || existing.role === 'ADMIN') ? existing : await createPublicDemoSession()
    // Registra apenas DEMO pública realmente liberada; nunca contabiliza administradores.
    // Eventuais falhas do contador não impedem o visitante de explorar a plataforma.
    if (user.isPublicDemo && existing?.role !== 'ADMIN') {
      try { await recordDemoEntry(req, body) }
      catch (error) { console.warn('Contador de DEMO indisponível:', error instanceof Error ? error.message : 'erro') }
    }
    return Response.json({ user }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return jsonError('Não foi possível abrir a demonstração. Tente novamente.', 503)
  }
}
