import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { getSettings } from '@/lib/settings'
import { MARKETING_KEYS, resolveMarketingConfig } from '@/lib/marketing-config'

const readPublicSettings = unstable_cache(
  () => getSettings([...MARKETING_KEYS, 'price_cents']),
  ['public-marketing-v1'],
  { revalidate: 60, tags: ['public-marketing'] },
)

export const getPublicMarketing = cache(async () => {
  let settings: Record<string, string> = {}
  // Um banco temporariamente indisponível não deve tirar as páginas públicas do ar.
  try { if (process.env.DATABASE_URL) settings = await readPublicSettings() } catch { /* fallback às variáveis públicas */ }
  const priceCents = Number(settings.price_cents || 4790)
  return {
    config: resolveMarketingConfig(settings, process.env),
    priceCents: Number.isSafeInteger(priceCents) && priceCents >= 100 ? priceCents : 4790,
  }
})
