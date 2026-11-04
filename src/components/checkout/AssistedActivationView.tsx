'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/shared/Logo'
import { CouponEntry } from '@/components/checkout/CouponEntry'
import { DemoAccessButton } from '@/components/shared/DemoAccessButton'
import { useStore } from '@/lib/store'
import { WHATSAPP } from '@/lib/site'
import { formatBRL } from '@/lib/types'
import type { CheckoutQuote } from '@/lib/coupons'

type Order = CheckoutQuote & { paymentId: string | null }
export function AssistedActivationView({ subtotalCents, onAutomatic }: { subtotalCents: number; onAutomatic?: () => void }) {
  const user = useStore(s => s.user)
  const qc = useQueryClient()
  const [localQuote, setLocalQuote] = useState<CheckoutQuote | null | undefined>()
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const order = useQuery<Order>({ queryKey: ['activation-order', user?.id], enabled: Boolean(user && !user.isDemo), queryFn: async () => { const response = await fetch('/api/payments/manual-pix'); if (!response.ok) throw new Error('Não foi possível consultar sua solicitação.'); return response.json() }, staleTime: 15000 })
  const quote = localQuote === undefined ? (order.data?.subtotalCents === subtotalCents ? order.data : null) : localQuote
  const activeQuote = quote?.subtotalCents === subtotalCents ? quote : null
  const total = activeQuote?.amountCents ?? subtotalCents
  const contact = async (receipt: boolean) => {
    if (busy || !user) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/payments/manual-pix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ couponCode: activeQuote?.coupon?.code || '' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível registrar a solicitação.')
      qc.setQueryData(['activation-order', user.id], data)
      const text = `Olá! Sou ${user.name}. Meu cadastro na Click & Gruda está no e-mail ${user.email}.\nSolicitação: ${data.paymentId}\nValor do acesso: ${formatBRL(data.amountCents)}${data.coupon?.code ? ` (cupom ${data.coupon.code})` : ''}.\n\n${receipt ? 'Já combinei o pagamento com a equipe e quero enviar o comprovante para conferência e ativação.' : 'Quero confirmar as condições de pagamento com a equipe e solicitar a ativação após a confirmação. Podem me atender?'}`
      // O usuário inicia a conversa; nenhuma mensagem ou aprovação é enviada automaticamente.
      window.location.assign(WHATSAPP.link(text))
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  const check = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!response.ok) throw new Error('Não foi possível consultar sua conta.')
      const data = await response.json()
      if (!data.user) { useStore.getState().setUser(null); useStore.getState().setAuthMode('login'); useStore.getState().setView('auth'); return }
      useStore.getState().setUser(data.user)
      if (data.user.hasAccess) { qc.clear(); useStore.getState().setView('portal'); toast.success('Seu acesso está liberado. Boas criações!') }
      else toast.info('O acesso ainda aguarda a ativação da equipe. Fale conosco pelo WhatsApp para acompanhar.')
    } catch (e) { toast.error((e as Error).message) }
    finally { setChecking(false) }
  }
  if (!user) return null
  return <div className="min-h-screen bg-zinc-50 text-zinc-900">
    <header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><Logo /><button type="button" onClick={() => useStore.getState().setView('landing')} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-600"><ArrowLeft className="h-4 w-4" /> Voltar ao site</button></div></header>
    <main className="mx-auto grid max-w-5xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
      <section><span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-2 text-xs font-extrabold text-orange-800"><CheckCircle2 className="h-4 w-4" /> Cadastro recebido · ativação pendente</span><h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{user.name.split(' ')[0]}, vamos concluir com atendimento de verdade.</h1><p className="mt-5 text-base leading-8 text-zinc-600">Sua conta está criada no e-mail <strong className="break-all text-zinc-900">{user.email}</strong>. O cadastro sozinho não libera as artes. Nossa equipe confirma o pagamento e ativa seu acesso.</p>
        <ol className="mt-7 space-y-4">{[['Converse antes de pagar', 'Tire suas dúvidas e confirme as condições no nosso WhatsApp oficial.'], ['Combine o pagamento com a equipe', 'O suporte informa os dados de pagamento e orienta o envio do comprovante.'], ['Receba a confirmação de ativação', 'Depois da conferência, entre com o e-mail e a senha que você cadastrou.']].map(([title, text], index) => <li key={title} className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-orange-300">{index + 1}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm leading-6 text-zinc-600">{text}</p></div></li>)}</ol>
        <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-zinc-500"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-700" /> Não envie sua senha nem códigos de verificação no atendimento. A equipe consegue localizar o cadastro pelo seu e-mail.</p>
      </section>
      <section className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-extrabold">Seu acesso à Click & Gruda</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Biblioteca com curadoria, novidades semanais e downloads ilimitados após a ativação.</p><p className="mt-5 text-4xl font-extrabold tracking-tight">{formatBRL(total)}</p><p className="mt-1 text-xs leading-5 text-zinc-500">Condições da oferta confirmadas com o suporte antes do pagamento.</p><CouponEntry subtotalCents={subtotalCents} value={activeQuote} onChange={setLocalQuote} disabled={busy} />
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button type="button" disabled={busy} onClick={() => contact(false)} className="mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-center text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-60">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />} Conversar e solicitar minha ativação</button>
        <p className="mt-3 text-center text-xs leading-5 text-zinc-500">WhatsApp oficial: {WHATSAPP.display}<br />Este botão solicita atendimento; não confirma um pagamento.</p>
        <button type="button" disabled={busy} onClick={() => contact(true)} className="mt-4 min-h-11 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">Já paguei à equipe: enviar comprovante</button>
        <button type="button" disabled={checking} onClick={check} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50">{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Conferir se meu acesso foi ativado</button>
        {onAutomatic && <button type="button" onClick={onAutomatic} className="mt-3 min-h-11 w-full text-sm font-semibold text-zinc-500 underline underline-offset-4">Ver pagamento automático disponível</button>}
        <div className="mt-5 border-t border-zinc-100 pt-5"><p className="mb-3 text-center text-sm text-zinc-500">Enquanto isso, conheça a demonstração.</p><DemoAccessButton location="activation_demo" className="border-zinc-300 text-zinc-800 hover:bg-zinc-50" /></div>
      </section>
    </main>
  </div>
}
