import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings, setSettings, SETTING_KEYS, resolveProvider } from '@/lib/settings'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const settings = await getSettings()
  return Response.json({ settings, effectiveProvider: resolveProvider(settings) })
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const incoming: Record<string, string> = {}

  for (const key of SETTING_KEYS) {
    if (key in body) incoming[key] = String(body[key] ?? '')
  }

  if ('price_cents' in incoming) {
    const n = parseInt(incoming.price_cents, 10)
    if (isNaN(n) || n < 100) return jsonError('Preço inválido (mínimo R$ 1,00)', 400)
    incoming.price_cents = String(n)
  }

  await setSettings(incoming)
  const settings = await getSettings()
  return Response.json({ settings, effectiveProvider: resolveProvider(settings) })
}
