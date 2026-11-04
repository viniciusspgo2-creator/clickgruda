/** Apenas identificadores públicos. Nunca aceitar HTML ou scripts arbitrários. */
export const MARKETING_KEYS = [
  'gsc_verification', 'bing_verification', 'meta_domain_verification',
  'ga4_id', 'gtm_id', 'meta_pixel_id', 'marketing_consent_required',
  'official_social_urls',
] as const

export type MarketingKey = (typeof MARKETING_KEYS)[number]
export type PublicMarketingConfig = {
  gscVerification: string
  bingVerification: string
  metaDomainVerification: string
  ga4Id: string
  gtmId: string
  metaPixelId: string
  consentRequired: boolean
  socialUrls: string[]
}

export function normalizeMarketingValue(key: MarketingKey, input: string): string {
  let value = input.trim()
  if (['gsc_verification', 'bing_verification', 'meta_domain_verification'].includes(key)) {
    // Aceita o token ou a meta tag copiada da ferramenta oficial.
    if (value.startsWith('<meta')) {
      const names: Record<string, string> = {
        gsc_verification: 'google-site-verification',
        bing_verification: 'msvalidate.01',
        meta_domain_verification: 'facebook-domain-verification',
      }
      const name = value.match(/\bname\s*=\s*["']([^"']+)["']/i)?.[1]
      const content = value.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1]
      if (name !== names[key] || !content) throw new Error('Tag de verificação inválida para este campo.')
      value = content
    }
    if (value && !/^[a-zA-Z0-9_=-]{5,256}$/.test(value)) throw new Error('Código de verificação inválido. Cole apenas o token ou a meta tag oficial.')
  }
  if (key === 'ga4_id' || key === 'gtm_id') value = value.toUpperCase()
  if (key === 'ga4_id' && value && !/^G-[A-Z0-9]{4,20}$/.test(value)) throw new Error('ID do Google Analytics inválido. Use G-XXXXXXXXXX.')
  if (key === 'gtm_id' && value && !/^GTM-[A-Z0-9]{4,20}$/.test(value)) throw new Error('ID do Tag Manager inválido. Use GTM-XXXXXXX.')
  if (key === 'meta_pixel_id' && value && !/^\d{5,25}$/.test(value)) throw new Error('ID do Meta Pixel inválido. Informe somente números.')
  if (key === 'marketing_consent_required' && !['true', 'false'].includes(value)) throw new Error('Preferência de cookies inválida.')
  if (key === 'official_social_urls') {
    const urls = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    if (urls.length > 10) throw new Error('Informe no máximo 10 perfis oficiais.')
    value = [...new Set(urls.map(raw => {
      let url: URL
      try { url = new URL(raw) } catch { throw new Error('Informe URLs completas dos perfis oficiais, com https://.') }
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !url.hostname.includes('.')) throw new Error('Use URLs HTTPS públicas de perfis oficiais, sem parâmetros.')
      return url.href
    }))].join('\n')
  }
  return value
}

export function resolveMarketingConfig(values: Record<string, string>, env: Record<string, string | undefined> = {}): PublicMarketingConfig {
  const get = (key: MarketingKey, envKey?: string) => {
    try { return normalizeMarketingValue(key, values[key] ?? (envKey ? env[envKey] : undefined) ?? '') }
    catch { return '' }
  }
  return {
    gscVerification: get('gsc_verification', 'NEXT_PUBLIC_GSC_VERIFICATION'),
    bingVerification: get('bing_verification', 'NEXT_PUBLIC_BING_VERIFICATION'),
    metaDomainVerification: get('meta_domain_verification', 'NEXT_PUBLIC_META_DOMAIN_VERIFICATION'),
    ga4Id: get('ga4_id', 'NEXT_PUBLIC_GA4_ID'),
    gtmId: get('gtm_id', 'NEXT_PUBLIC_GTM_ID'),
    metaPixelId: get('meta_pixel_id', 'NEXT_PUBLIC_META_PIXEL_ID'),
    consentRequired: values.marketing_consent_required !== 'false',
    socialUrls: get('official_social_urls').split('\n').filter(Boolean),
  }
}
