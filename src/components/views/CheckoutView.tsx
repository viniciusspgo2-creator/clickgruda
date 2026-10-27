'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, CheckCircle2, Copy, Loader2, MessageCircle, QrCode, ShieldCheck, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/shared/Logo'
import { CouponEntry } from '@/components/checkout/CouponEntry'
import { AssistedActivationView } from '@/components/checkout/AssistedActivationView'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'
import { track } from '@/lib/analytics'
import { WHATSAPP } from '@/lib/site'
import { formatBRL, type CatalogData, type PaymentData } from '@/lib/types'
import type { CheckoutQuote } from '@/lib/coupons'

type Provider = 'MERCADOPAGO' | 'ASAAS' | 'MANUAL_PIX'
type Pix = PaymentData & CheckoutQuote & { qrCodeImage?: string; qrCodePayload?: string }
export function CheckoutView() {
  const user = useStore(s => s.user)
  const setView = useStore(s => s.setView)
  const qc = useQueryClient()
  const catalog = useQuery<CatalogData>({ queryKey: ['catalog'], queryFn: async () => { const r = await fetch('/api/catalog'); if (!r.ok) throw new Error('Não foi possível consultar as condições.'); return r.json() } })
  const [provider, setProvider] = useState<Provider | null>(null)
  const [step, setStep] = useState<'form' | 'pix' | 'success'>('form')
  const [coupon, setCoupon] = useState<CheckoutQuote | null>(null)
  const [payment, setPayment] = useState<Pix | null>(null)
  const [cpf, setCpf] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(1800)
  const tracked = useRef(false)
  const providers = catalog.data?.providers
  const hasAutomatic = Boolean(providers?.mercadopago || providers?.asaas)
  const subtotal = catalog.data?.priceCents ?? 4790
  const quote = coupon?.subtotalCents === subtotal ? coupon : null
  const total = payment?.amountCents ?? quote?.amountCents ?? subtotal
  useEffect(() => {
    if (provider || !catalog.data) return
    setProvider(catalog.data.provider || (providers?.mercadopago ? 'MERCADOPAGO' : providers?.asaas ? 'ASAAS' : 'MANUAL_PIX'))
  }, [provider, catalog.data, providers?.mercadopago, providers?.asaas])
  useEffect(() => {
    if (!user) { setView('auth'); return }
    if ((user.hasAccess || user.isDemo) && step !== 'success') setView('portal')
  }, [user, step, setView])
  useEffect(() => {
    if (!catalog.data || !user || user.hasAccess || tracked.current) return
    tracked.current = true
    track('begin_checkout', { currency: 'BRL', value: subtotal / 100 })
  }, [catalog.data, user, subtotal])
  useEffect(() => {
    if (step !== 'pix' || !payment?.id || ['FAILED', 'EXPIRED'].includes(payment.status)) return
    let cancelled = false, running = false
    const check = async () => {
      if (running) return
      running = true
      try {
        const response = await fetch(`/api/payments/${payment.id}`, { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (cancelled) return
        if (data.status === 'APPROVED' || data.hasAccess) {
          if (data.status === 'APPROVED') {
            const key = `cg-purchase-${payment.id}`
            let done = false
            try { done = sessionStorage.getItem(key) === '1' } catch { /* sem armazenamento */ }
            if (!done) { track('purchase', { transaction_id: payment.id, currency: 'BRL', value: payment.amountCents / 100 }); try { sessionStorage.setItem(key, '1') } catch { /* sem armazenamento */ } }
          }
          const me = await fetch('/api/auth/me', { cache: 'no-store' })
          if (!me.ok || cancelled) return
          const account = await me.json()
          if (!account.user?.hasAccess) return
          useStore.getState().setUser(account.user)
          qc.invalidateQueries({ queryKey: ['catalog'] })
          setStep('success')
        } else if (['FAILED', 'EXPIRED'].includes(data.status)) {
          setPayment(current => current ? { ...current, status: data.status } : current)
          setError('Este PIX não está mais disponível. Gere uma nova cobrança ou fale com o suporte.')
        }
      } catch { /* Consulta temporariamente indisponível: mantém a cobrança atual. */ }
      finally { running = false }
    }
    const interval = window.setInterval(check, 3000)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [step, payment?.id, payment?.status, payment?.amountCents, qc])
  useEffect(() => {
    if (step !== 'pix') return
    const interval = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [step])
  const generate = async () => {
    if (busy || !provider || provider === 'MANUAL_PIX') return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/payments/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, cpf: cpf.replace(/\D/g, ''), couponCode: quote?.coupon?.code || '' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar o PIX.')
      setPayment(data); setCoupon(data); setSeconds(1800); setStep('pix')
      track('pix_generated', { provider })
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(payment?.qrCodePayload || ''); setCopied(true); toast.success('Código PIX copiado.') }
    catch { toast.error('Não foi possível copiar o código.') }
  }
  if (!user) return null
  if (catalog.isLoading) return <div role="status" className="flex min-h-screen items-center justify-center gap-3 bg-zinc-50 text-zinc-600"><Loader2 className="h-5 w-5 animate-spin" /> Consultando as condições do seu acesso…</div>
  if ((!hasAutomatic || provider === 'MANUAL_PIX') && step !== 'success') return <AssistedActivationView subtotalCents={subtotal} onAutomatic={hasAutomatic ? () => { setProvider(providers?.mercadopago ? 'MERCADOPAGO' : 'ASAAS'); setStep('form') } : undefined} />
  return <div className="min-h-screen bg-zinc-50 text-zinc-900">
    <header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6"><button type="button" onClick={() => setView('landing')} aria-label="Voltar ao site"><Logo /></button><span className="flex items-center gap-2 text-xs font-bold text-zinc-500"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Seu acesso, com confirmação</span></div></header>
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {step === 'success' ? <section className="mx-auto max-w-md rounded-3xl border border-emerald-200 bg-white p-8 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" /><h1 className="mt-5 text-3xl font-extrabold">Acesso liberado!</h1><p className="mt-3 leading-7 text-zinc-600">Sua conta está ativa. Explore a biblioteca e baixe suas artes.</p><button type="button" onClick={() => { qc.clear(); setView('portal') }} className="mt-6 min-h-12 rounded-xl bg-zinc-950 px-6 py-3 font-bold text-white">Entrar na minha biblioteca</button></section> : step === 'pix' && payment ? <section className="mx-auto max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 text-center sm:p-8"><span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-2 text-xs font-bold text-orange-800"><Timer className="h-4 w-4" /> {seconds > 0 ? `Confira o PIX em até ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : 'O prazo de visualização terminou; confira o status antes de pagar.'}</span><h1 className="mt-5 text-2xl font-extrabold">PIX de {formatBRL(payment.amountCents)}</h1><p className="mt-2 text-sm text-zinc-500">{payment.provider === 'MERCADOPAGO' ? 'Mercado Pago' : 'Asaas'} · acesso após confirmação</p>{payment.qrCodeImage && <img src={payment.qrCodeImage} alt="QR Code do pagamento PIX" className="mx-auto mt-6 h-56 w-56" />}{payment.qrCodePayload && <><Label htmlFor="pix-payload" className="mt-5 block text-left">PIX copia e cola</Label><textarea id="pix-payload" value={payment.qrCodePayload} readOnly rows={3} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-600" /><button type="button" onClick={copy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copiado' : 'Copiar código PIX'}</button></>}<p className="mt-5 text-sm leading-7 text-zinc-500">Confira o valor e o recebedor no aplicativo do seu banco antes de confirmar. A liberação depende da confirmação do gateway.</p>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" onClick={() => { setPayment(null); setError(''); setStep('form'); setCopied(false) }} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-600"><ArrowLeft className="h-4 w-4" /> Voltar às opções</button></section> : <section className="grid gap-6 md:grid-cols-2"><div className="rounded-3xl bg-zinc-950 p-7 text-white"><p className="text-sm font-bold text-orange-300">Seu acesso à Click & Gruda</p><h1 className="mt-4 text-3xl font-extrabold">Tudo pronto para o próximo passo.</h1><p className="mt-6 text-4xl font-extrabold">{formatBRL(total)}</p><p className="mt-4 text-sm leading-7 text-zinc-300">Biblioteca com curadoria, lançamentos e downloads ilimitados após a ativação. O cadastro não libera acesso sem confirmação do pagamento.</p><a href={WHATSAPP.link(`Olá! Sou ${user.name} (${user.email}) e quero tirar dúvidas antes de contratar a Click & Gruda.`)} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-orange-200 underline underline-offset-4"><MessageCircle className="h-4 w-4" /> Conversar antes de pagar</a></div><div className="rounded-3xl border border-zinc-200 bg-white p-6"><h2 className="text-xl font-extrabold">Escolha como continuar</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Pagamento automático, quando disponível, ou atendimento com a equipe pelo WhatsApp.</p><div className="mt-5 space-y-3">{([...(providers?.mercadopago ? [{ id: 'MERCADOPAGO' as const, label: 'PIX pelo Mercado Pago' }] : []), ...(providers?.asaas ? [{ id: 'ASAAS' as const, label: 'PIX pelo Asaas' }] : []), { id: 'MANUAL_PIX' as const, label: 'Quero atendimento pelo WhatsApp' }]).map(option => <button type="button" key={option.id} onClick={() => setProvider(option.id)} aria-pressed={provider === option.id} className={`flex min-h-13 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-bold ${provider === option.id ? 'border-orange-500 bg-orange-50' : 'border-zinc-200 bg-white hover:border-orange-300'}`}><QrCode className="h-5 w-5 text-orange-600" />{option.label}</button>)}</div><CouponEntry subtotalCents={subtotal} value={quote} onChange={setCoupon} disabled={busy} />{provider === 'ASAAS' && <div className="mt-4"><Label htmlFor="cpf">CPF exigido pelo Asaas</Label><Input id="cpf" value={cpf} onChange={e => setCpf(e.target.value.replace(/[^\d.\-]/g, '').slice(0, 14))} inputMode="numeric" placeholder="000.000.000-00" className="mt-2" /></div>}{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<button type="button" onClick={generate} disabled={busy || !provider} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Gerar PIX de {formatBRL(total)}</button></div></section>}
    </main>
  </div>
}
