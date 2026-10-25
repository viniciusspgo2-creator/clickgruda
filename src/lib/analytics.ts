/**
 * Analytics — camada de eventos (GA4 + GTM-ready).
 *
 * - Nenhum script é carregado sem as env vars NEXT_PUBLIC_GA4_ID /
 *   NEXT_PUBLIC_GTM_ID (zero overhead e zero requisições órfãs).
 * - track() empurra para o dataLayer (GTM) e para o gtag (GA4)
 *   quando disponíveis; caso contrário, no-op silencioso.
 *
 * Eventos instrumentados:
 *  cta_click (landing), auth_submit, pix_generated, art_download,
 *  favorite_toggle, faq_open, blog_view, article_view, scroll_depth,
 *  spa_view_change.
 */
export type EventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function track(event: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  try {
    if (window.localStorage.getItem('cg-analytics-opt-out') === '1') return
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
    window.gtag?.('event', event, params)
    // Métrica interna persistida no PostgreSQL (não depende de GA4 ou GTM).
    if (['landing_view', 'cta_click', 'faq_open', 'scroll_depth', 'feature_click'].includes(event)) {
      let visitorId = window.localStorage.getItem('cg-anon-visitor')
      if (!visitorId) {
        visitorId = crypto.randomUUID()
        window.localStorage.setItem('cg-anon-visitor', visitorId)
      }
      const payload = JSON.stringify({ event, visitorId, location: String(params.location || (event === 'scroll_depth' ? `depth_${params.percent}` : '')) })
      if (navigator.sendBeacon) {
        const accepted = navigator.sendBeacon('/api/analytics/track', new Blob([payload], { type: 'application/json' }))
        if (!accepted) fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
      } else {
        fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {})
      }
    }

  } catch {
    /* analytics nunca deve quebrar a UX */
  }
}
