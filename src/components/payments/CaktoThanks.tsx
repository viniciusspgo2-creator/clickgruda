'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, Loader2, MessageCircle } from 'lucide-react'
import { WHATSAPP } from '@/lib/site'
export function CaktoThanks() {
  const [state, setState] = useState<'checking'|'timeout'|'active'>('checking')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    let polling = false
    const started = Date.now()
    const check = async () => {
      if (cancelled || polling) return
      polling = true
      try {
        const r = await fetch('/api/access/status', { cache: 'no-store' })
        if (r.ok && (await r.json()).active) {
          if (cancelled) return
          setState('active')
          try { sessionStorage.setItem('cg_view', 'portal') } catch {}
          window.location.replace('/')
          return
        }
      } catch { /* falha temporária */ }
      finally { polling = false }
      if (!cancelled && Date.now() - started >= 120000) setState('timeout')
    }
    void check()
    const timer = window.setInterval(() => { if (Date.now() - started < 120000) void check(); else { setState('timeout'); window.clearInterval(timer) } }, 3000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [attempt])
  return <main className="flex min-h-screen items-center justify-center bg-[#0b0b0f] px-4 text-white"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#17171e] p-8 text-center shadow-2xl">{state === 'active' ? <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400"/> : state === 'checking' ? <Loader2 className="mx-auto h-14 w-14 animate-spin text-orange-400"/> : <Clock3 className="mx-auto h-14 w-14 text-orange-400"/>}<h1 className="mt-6 text-2xl font-bold">{state === 'active' ? 'Pagamento confirmado!' : state === 'checking' ? 'Confirmando seu pagamento…' : 'Pagamento em análise'}</h1><p className="mt-4 text-sm leading-7 text-[#a7a7b3]">{state === 'active' ? 'Seu acesso está ativo. Entrando na biblioteca…' : state === 'checking' ? 'A confirmação vem diretamente da Cakto. Você será direcionado quando o acesso estiver ativo.' : 'Pix pode levar alguns minutos. Você pode verificar novamente sem precisar refazer a compra.'}</p>{state === 'timeout' && <button onClick={() => { setState('checking'); setAttempt(n => n + 1) }} className="mt-6 w-full rounded-xl bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-500">Verificar novamente</button>}<a href={WHATSAPP.link('Olá! Fiz o pagamento na Cakto e preciso de ajuda para confirmar meu acesso.')} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-orange-300" target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4"/> Suporte por WhatsApp</a></div></main>
}
