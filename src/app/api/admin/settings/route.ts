import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings, setSettings, SETTING_KEYS, resolveProvider } from '@/lib/settings'
import { MARKETING_KEYS, normalizeMarketingValue, resolveMarketingConfig, type MarketingKey } from '@/lib/marketing-config'
import { revalidatePath, revalidateTag } from 'next/cache'
import { SITE_URL } from '@/lib/site'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const settings = await getSettings()
  return Response.json({ settings, effectiveProvider: resolveProvider(settings), marketing: resolveMarketingConfig(settings, process.env), siteUrl: SITE_URL })
}

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const incoming: Record<string, string> = {}

  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Configurações inválidas', 400)

  for (const key of SETTING_KEYS) {
    if (key in body) incoming[key] = String(body[key] ?? '')
  }

  try {
    for (const key of MARKETING_KEYS) {
      if (key in incoming) incoming[key] = normalizeMarketingValue(key as MarketingKey, incoming[key])
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Configuração de marketing inválida', 400)
  }

  if ('price_cents' in incoming) {
    const n = parseInt(incoming.price_cents, 10)
    if (isNaN(n) || n < 100) return jsonError('Preço inválido (mínimo R$ 1,00)', 400)
    incoming.price_cents = String(n)
  }

  await setSettings(incoming)
  if (MARKETING_KEYS.some(key => key in incoming) || 'price_cents' in incoming) {
    revalidateTag('public-marketing', { expire: 0 })
    revalidatePath('/', 'layout')
  }
  const settings = await getSettings()
  return Response.json({ settings, effectiveProvider: resolveProvider(settings), marketing: resolveMarketingConfig(settings, process.env), siteUrl: SITE_URL })
}
