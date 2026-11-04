'use client'
import { useEffect, useRef } from 'react'
import Script from 'next/script'

declare global { interface Window { turnstile?: { render: (el: HTMLElement, options: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id: string) => void } } }

export function TurnstileChallenge({ onChange }: { onChange: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
  const render = () => {
    if (!key || !container.current || !window.turnstile || widget.current) return
    widget.current = window.turnstile.render(container.current, {
      sitekey: key, appearance: 'interaction-only', size: 'flexible',
      callback: (value: string) => onChange(value),
      'expired-callback': () => onChange(''), 'error-callback': () => onChange(''),
    })
  }
  useEffect(() => {
    render()
    return () => { if (widget.current && window.turnstile) { window.turnstile.remove(widget.current); widget.current = null } }
  // O callback é alterado a cada render da view; widget já montado não precisa reiniciar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  if (!key) return process.env.NODE_ENV !== 'production' ? null : <p className="text-xs text-red-500">Proteção anti-bot indisponível. Contate o suporte.</p>
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render} /><div ref={container} aria-label="Verificação de segurança" /></>
}
