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
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
    window.gtag?.('event', event, params)
  } catch {
    /* analytics nunca deve quebrar a UX */
  }
}
