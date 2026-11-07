'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleHelp, CreditCard, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { WHATSAPP } from '@/lib/site'
import { Logo } from '@/components/shared/Logo'
import { LIFETIME_PRICE_CENTS } from '@/lib/payments/config'
import { formatBRL } from '@/lib/types'

type Me = { user?: { name: string; email: string; hasAccess: boolean; isTrial?:boolean } | null }
export function CaktoPurchase() {
  const [me, setMe] = useState<Me | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(setMe).catch(() => setMe({})) }, [])
  const start = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/payments/cakto-checkout', { cache: 'no-store' })
      const data = await r.json()
      if (!r.ok || !data.url) throw new Error(data.error || 'Checkout indisponível.')
      window.location.assign(data.url)
    } catch (e) { setError((e as Error).message); setBusy(false) }
  }
  return <main className="min-h-screen bg-[#0b0b0f] px-4 pb-16 text-[#f5f5f7] sm:px-6">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-5 border-b border-white/10 py-6"><a href="/" aria-label="Voltar ao início"><Logo dark /></a><span className="flex items-center gap-2 text-xs font-bold text-[#a7a7b3]"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Ambiente de compra protegido</span></header>
    <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-[1fr_.95fr] lg:items-center">
      <section><p className="text-xs font-bold uppercase tracking-[.19em] text-[#ff9e5d]">Seu próximo passo</p><h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-[-.045em] sm:text-5xl">Seu acesso vitalício começa <span className="text-[#ff8a2a]">aqui.</span></h1><p className="mt-6 max-w-lg text-base leading-8 text-[#a7a7b3]">Um pagamento, sua biblioteca de artes e as ferramentas para preparar o próximo pedido do seu cliente.</p><div className="mt-9 grid gap-3">{['Biblioteca de artes com curadoria e novidades semanais','Editor de Arte Online','Studio Mockup 3D para apresentar canecas antes de produzir'].map(item => <p key={item} className="flex items-center gap-3 text-sm text-white/85"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#ff8a2a]" /> {item}</p>)}</div><p className="mt-10 flex items-center gap-2 text-xs text-white/55"><Sparkles className="h-4 w-4 text-orange-400" /> Sem mensalidade e sem necessidade de falar com suporte para liberar o acesso.</p></section>
      <section className="rounded-[24px] border border-[#ff6a00]/35 bg-[#17171e] p-6 shadow-[0_24px_90px_rgba(0,0,0,.35)] sm:p-8"><div className="flex items-center justify-between"><strong className="text-lg">Click & Gruda</strong><span className="rounded-full bg-[#ff6a00]/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#ffb17c]">Acesso vitalício</span></div><p className="mt-7 text-xs font-semibold uppercase tracking-widest text-[#a7a7b3]">Pagamento único</p><p className="mt-2 text-5xl font-black tracking-tight">{formatBRL(LIFETIME_PRICE_CENTS)}</p><p className="mt-3 text-xs leading-6 text-white/55">Condição da campanha vigente até 31/12/2026.</p><div className="my-7 h-px bg-white/10"/><p className="text-[11px] font-bold uppercase tracking-widest text-[#a7a7b3]">E-mail vinculado ao seu acesso</p><p className="mt-2 break-words rounded-xl border border-[#ff6a00]/20 bg-[#ff6a00]/[.06] p-4 text-sm font-bold text-[#ffb17c]">{me?.user?.email || 'Verificando sua sessão…'}</p><p className="mt-2 text-xs leading-6 text-[#a7a7b3]">Use <strong className="text-white">este mesmo e-mail</strong> na hora de pagar no checkout da Cakto.</p><button type="button" onClick={start} disabled={busy || !me?.user || (me.user.hasAccess && !me.user.isTrial)} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#ff6a00] to-[#ff8a2a] px-4 py-3 text-sm font-black text-white shadow-[0_6px_20px_rgba(255,106,0,.35)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Abrindo checkout seguro…' : me?.user?.hasAccess && !me.user.isTrial ? 'Seu acesso já está ativo' : 'COMPRAR ACESSO VITALÍCIO'} <ArrowRight className="h-5 w-5" /></button>{!me?.user && me !== null && <a href="/" className="mt-3 block text-center text-xs text-orange-300 underline">Faça login ou crie sua conta para continuar.</a>}{error && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-white/80"><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-emerald-400"/> Pagamento seguro</span><span className="inline-flex items-center rounded-lg bg-white px-3 py-1.5"><img src="/cakto-logo.svg" width="78" height="27" alt="Cakto — plataforma de pagamentos" className="h-5 w-auto" /></span></div><div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#a7a7b3]"><span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> Checkout protegido</span><span className="flex items-center gap-1"><CreditCard className="h-3 w-3"/> Liberação após confirmação</span></div></section>
    </div><p className="mx-auto mt-12 flex max-w-5xl items-center justify-center gap-2 text-center text-xs text-[#a7a7b3]"><CircleHelp className="h-4 w-4" /> Precisa de ajuda? <a className="font-bold text-orange-300 underline underline-offset-4" href={WHATSAPP.link('Olá! Preciso de ajuda para finalizar minha compra da Click & Gruda.')} target="_blank" rel="noopener noreferrer">Falar com suporte</a></p>
  </main>
}
