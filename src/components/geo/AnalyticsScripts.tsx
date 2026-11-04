'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import type { PublicMarketingConfig } from '@/lib/marketing-config'

const CONSENT_KEY = 'cg-marketing-consent'

export function AnalyticsScripts({ config }: { config: PublicMarketingConfig }) {
  const pathname = usePathname()
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)
  const lastPage = useRef('')
  const hasTags = Boolean(config.ga4Id || config.gtmId || config.metaPixelId)
  const allowed = loaded && (consent === 'accepted' || (!config.consentRequired && consent !== 'rejected'))
  // Com GTM, a configuração de GA4 pertence ao contêiner: evita eventos em dobro.
  const mode = config.gtmId ? 'gtm' : config.ga4Id ? 'ga4' : 'none'

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored === 'accepted' || stored === 'rejected') setConsent(stored)
      if (localStorage.getItem('cg-analytics-opt-out') === '1') setConsent('rejected')
    } catch { /* sem armazenamento, a escolha vale durante esta página */ }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!allowed || !ready || lastPage.current === pathname) return
    // Não incluir tokens de catálogo, e-mails ou parâmetros da URL nos eventos.
    const page = { page_location: location.origin + pathname, page_path: pathname, page_title: document.title }
    if (mode === 'gtm') window.dataLayer?.push({ event: 'cg_page_view', ...page })
    if (mode === 'ga4') window.gtag?.('event', 'page_view', page)
    if (config.metaPixelId) window.fbq?.('track', 'PageView')
    lastPage.current = pathname
  }, [allowed, ready, pathname, mode, config.metaPixelId])

  const choose = (value: 'accepted' | 'rejected') => {
    setConsent(value)
    try { localStorage.setItem(CONSENT_KEY, value) } catch { /* sessão atual */ }
    if (value === 'rejected' && window.cgTracking) {
      window.cgTracking.enabled = false
      window.fbq?.('consent', 'revoke')
      window.location.reload()
    }
  }

  const bootstrap = `window.cgTracking={enabled:true,mode:${JSON.stringify(mode)},pixelId:${JSON.stringify(config.metaPixelId)}};`
    + (mode === 'ga4'
      ? `window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',${JSON.stringify(config.ga4Id)},{send_page_view:false,page_location:location.origin+location.pathname,page_referrer:document.referrer?document.referrer.split('?')[0]:''});`
      : '')
    + (mode === 'gtm'
      ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer',${JSON.stringify(config.gtmId)});`
      : '')
    + (config.metaPixelId
      ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init',${JSON.stringify(config.metaPixelId)});`
      : '')

  if (!hasTags) return null
  return <>
    {allowed && <>
      <Script id="cg-marketing-init" strategy="afterInteractive" onReady={() => setReady(true)}>{bootstrap}</Script>
      {mode === 'ga4' && <Script id="cg-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${config.ga4Id}`} strategy="afterInteractive" />}
    </>}
    {loaded && config.consentRequired && consent === null && <aside aria-label="Preferências de cookies" className="fixed bottom-4 left-4 right-4 z-[100] max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl sm:right-auto">
      <p className="text-sm font-bold">Cookies de medição e publicidade</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">Com sua autorização, usamos Google e Meta para medir visitas e melhorar nossas campanhas. Você pode recusar e continuar usando a plataforma.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => choose('rejected')} className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold">Recusar opcionais</button>
        <button onClick={() => choose('accepted')} className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white">Aceitar opcionais</button>
      </div>
    </aside>}
    {loaded && consent !== null && <details className="fixed bottom-2 left-2 z-[99] max-w-xs rounded-xl border border-zinc-200 bg-white p-2 text-xs text-zinc-700 shadow-md">
      <summary className="cursor-pointer">Cookies</summary>
      <p className="mt-2">Cookies opcionais {consent === 'accepted' ? 'autorizados' : 'recusados'}.</p>
      <button className="mt-2 font-bold text-orange-700" onClick={() => choose(consent === 'accepted' ? 'rejected' : 'accepted')}>{consent === 'accepted' ? 'Revogar autorização' : 'Autorizar cookies opcionais'}</button>
    </details>}
  </>
}
