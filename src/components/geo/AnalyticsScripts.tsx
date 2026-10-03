'use client'

/**
 * AnalyticsScripts — injeta GA4 e GTM somente quando configurados
 * via env (NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_GTM_ID).
 * Sem as variáveis, nada é carregado: zero scripts bloqueantes,
 * zero requisições a terceiros, zero impacto no Core Web Vitals.
 */
import Script from 'next/script'
import { GA4_ID, GTM_ID } from '@/lib/analytics'

export function AnalyticsScripts() {
  return (
    <>
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_ID}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
    </>
  )
}
