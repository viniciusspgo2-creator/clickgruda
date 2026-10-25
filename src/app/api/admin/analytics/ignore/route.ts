import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import {
  ANALYTICS_IGNORE_COOKIE, ANALYTICS_IGNORE_IPS_KEY, ANALYTICS_IGNORE_VISITORS_KEY,
  readStringList, signedInternalCookie, validIgnoredIps, validVisitorId, visitorHash,
} from '@/lib/analytics-privacy'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return jsonError('Origem não permitida', 403)

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return jsonError('Dados inválidos', 400)

  if (body.action === 'browser') {
    if (typeof body.enabled !== 'boolean') return jsonError('Valor inválido', 400)
    if (body.visitorId !== undefined && !validVisitorId(body.visitorId)) return jsonError('Identificador inválido', 400)
    const cookieStore = await cookies()
    if (body.enabled) {
      // Também permite desconsiderar visitas anteriores deste navegador nos relatórios.
      if (validVisitorId(body.visitorId)) {
        const saved = await db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY } })
        const hashes = readStringList(saved?.value).filter(v => /^[0-9a-f]{64}$/.test(v))
        const currentHash = visitorHash(body.visitorId)
        if (!hashes.includes(currentHash)) hashes.push(currentHash)
        await db.setting.upsert({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY }, create: { key: ANALYTICS_IGNORE_VISITORS_KEY, value: JSON.stringify(hashes.slice(-150)) }, update: { value: JSON.stringify(hashes.slice(-150)) } })
      }
      cookieStore.set(ANALYTICS_IGNORE_COOKIE, signedInternalCookie(), {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 365 * 24 * 60 * 60,
      })
    } else {
      // Ao reativar, o navegador volta a contar inclusive no histórico existente.
      if (validVisitorId(body.visitorId)) {
        const saved = await db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY } })
        const hashes = readStringList(saved?.value).filter(v => v !== visitorHash(body.visitorId))
        await db.setting.upsert({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY }, create: { key: ANALYTICS_IGNORE_VISITORS_KEY, value: JSON.stringify(hashes) }, update: { value: JSON.stringify(hashes) } })
      }
      cookieStore.delete(ANALYTICS_IGNORE_COOKIE)
    }
    return Response.json({ ok: true, browserExcluded: body.enabled })
  }

  if (body.action === 'ips') {
    const ips = validIgnoredIps(body.ips)
    if (!ips) return jsonError('Informe até 30 IPs válidos (IPv4 ou IPv6).', 400)
    await db.setting.upsert({ where: { key: ANALYTICS_IGNORE_IPS_KEY }, create: { key: ANALYTICS_IGNORE_IPS_KEY, value: JSON.stringify(ips) }, update: { value: JSON.stringify(ips) } })
    return Response.json({ ok: true, ignoredIps: ips })
  }

  return jsonError('Ação inválida', 400)
}
