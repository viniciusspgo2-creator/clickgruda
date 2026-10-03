'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock3,
  Copy,
  Crown,
  Info,
  Landmark,
  Loader2,
  MessageCircle,
  PartyPopper,
  QrCode,
  ShieldCheck,
  Timer,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/shared/Logo'
import { useStore } from '@/lib/store'
import { track } from '@/lib/analytics'
import { WHATSAPP } from '@/lib/site'
import { formatBRL, type CatalogData, type PaymentData } from '@/lib/types'
import { cn } from '@/lib/utils'

type Step = 'form' | 'pix' | 'pending' | 'success'
type ProviderChoice = 'MERCADOPAGO' | 'ASAAS' | 'MANUAL_PIX'

function maskCPF(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function CheckoutView() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const setView = useStore((s) => s.setView)
  const catalogQ = useQuery<CatalogData>({ queryKey: ['catalog'], queryFn: async () => (await fetch('/api/catalog')).json() })
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('form')
  const [provider, setProvider] = useState<ProviderChoice | null>(null)
  const [cpf, setCpf] = useState('')
  const [generating, setGenerating] = useState(false)
  const [confirmingManual, setConfirmingManual] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<(PaymentData & { qrCodeImage?: string; qrCodePayload?: string }) | null>(null)
  const [copied, setCopied] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(30 * 60)

  const priceCents = catalogQ.data?.priceCents ?? 4790
  const providers = catalogQ.data?.providers ?? { mercadopago: false, asaas: false }
  const effectiveProvider = catalogQ.data?.provider ?? null
  const manualPix = catalogQ.data?.manualPix
  const manualEnabled = Boolean(manualPix?.enabled && manualPix.key)

  /* Opções reais do checkout — aparecem automaticamente conforme as
     credenciais salvas no Admin Master (Mercado Pago/Asaas) + PIX manual. */
  const availableOptions = useMemo(() => {
    const opts: { id: ProviderChoice; label: string; desc: string; available: boolean; icon: typeof QrCode }[] = [
      {
        id: 'MERCADOPAGO',
        label: 'Mercado Pago',
        desc: 'PIX aprovado na hora · QR Code automático',
        available: providers.mercadopago,
        icon: Wallet,
      },
      {
        id: 'ASAAS',
        label: 'Asaas',
        desc: 'PIX aprovado na hora · QR Code automático',
        available: providers.asaas,
        icon: Landmark,
      },
      {
        id: 'MANUAL_PIX',
        label: 'PIX direto (chave)',
        desc: 'Pague a chave e envie o comprovante no WhatsApp',
        available: manualEnabled,
        icon: MessageCircle,
      },
    ]
    return opts.filter((o) => o.available)
  }, [providers, manualEnabled])

  useEffect(() => {
    if (!provider && availableOptions.length > 0) {
      // PIX manual ativo → é a opção preferencial (fluxo com comprovante no WhatsApp)
      const preferred = manualEnabled
        ? availableOptions.find((o) => o.id === 'MANUAL_PIX') || availableOptions[0]
        : availableOptions.find((o) => o.id === effectiveProvider) || availableOptions[0]
      setProvider(preferred.id)
    }
  }, [availableOptions, effectiveProvider, provider, manualEnabled])

  // Cadastro pré-aprovado (PIX manual em conferência) → mostra o cartão de status direto
  useEffect(() => {
    if (user && !user.hasAccess && user.status === 'PENDING_MANUAL' && step === 'form') {
      setStep('pending')
    }
  }, [user, step])

  // Redirects (skip if active view already changed — e.g. during exit animation)
  useEffect(() => {
    if (!user && useStore.getState().view === 'checkout') setView('auth')
  }, [user, setView])
  useEffect(() => {
    // Only bounce already-active users at the form step; after approval the
    // success card shows first and a timed redirect takes over. If the admin
    // releases the account while the user watches the pending card, go to portal.
    if (!user?.hasAccess) return
    if ((step === 'form' || step === 'pending') && useStore.getState().view === 'checkout') setView('portal')
  }, [user, step, setView])

  // Poll payment status
  useQuery<{ status: PaymentData['status']; hasAccess?: boolean }>({
    queryKey: ['payment', payment?.id],
    queryFn: async () => (await fetch(`/api/payments/${payment!.id}`)).json(),
    enabled: step === 'pix' && !!payment?.id,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  })

  // Watch for approval via a lightweight interval (reads same endpoint)
  useEffect(() => {
    if (step !== 'pix' || !payment?.id) return
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${payment.id}`)
        const data = await res.json()
        if (data.status === 'APPROVED' || data.hasAccess) {
          setStep('success')
          toast.success('Pagamento aprovado! Acesso liberado 🎉')
          queryClient.invalidateQueries({ queryKey: ['catalog'] })
          const me = await (await fetch('/api/auth/me')).json()
          setUser(me.user)
          setTimeout(() => setView('portal'), 2200)
        }
      } catch {
        /* ignore */
      }
    }, 3000)
    return () => clearInterval(t)
  }, [step, payment?.id, queryClient, setUser, setView])

  // PIX countdown
  useEffect(() => {
    if (step !== 'pix') return
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [step])

  const generatePix = async () => {
    setError(null)
    setGenerating(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, cpf: cpf.replace(/\D/g, '') }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar o PIX.')
        return
      }
      setPayment(data)
      setSecondsLeft(30 * 60)
      setStep('pix')
      track('pix_generated', { provider: provider || 'manual' })
      toast.success('PIX gerado! Escaneie para pagar.')
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  const copyPayload = async () => {
    if (!payment?.qrCodePayload) return
    try {
      await navigator.clipboard.writeText(payment.qrCodePayload)
      setCopied(true)
      toast.success('Código PIX copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  // ---- PIX manual (chave + comprovante no WhatsApp) ----
  const copyPixKey = async () => {
    const key = manualPix?.key
    if (!key) return
    try {
      await navigator.clipboard.writeText(key)
      setPixCopied(true)
      toast.success('Chave PIX copiada! Cole no seu app do banco.')
      track('pix_key_copy', { location: 'checkout' })
      setTimeout(() => setPixCopied(false), 2500)
    } catch {
      toast.error('Não foi possível copiar. Selecione e copie manualmente.')
    }
  }

  const manualWhatsappUrl = () => {
    const name = user?.name?.split(' ')[0] || ''
    const text = `Olá! Sou ${name} (${user?.email}) — cadastro feito no site da Click & Gruda. Vou pagar o PIX de ${formatBRL(priceCents)} na chave ${manualPix?.key || ''} e já envio o comprovante em anexo.`
    return WHATSAPP.link(text)
  }

  const confirmManualPix = async () => {
    setError(null)
    setConfirmingManual(true)
    try {
      const res = await fetch('/api/payments/manual-pix', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Não foi possível registrar agora. Tente novamente.')
        return
      }
      track('pix_generated', { provider: 'MANUAL_PIX' })
      setStep('pending')
    } catch {
      setError('Falha de conexão. Tente novamente.')
    } finally {
      setConfirmingManual(false)
    }
  }

  const checkRelease = async () => {
    try {
      const me = await (await fetch('/api/auth/me')).json()
      if (me.user?.hasAccess) {
        setUser(me.user)
        setStep('success')
        toast.success('Acesso liberado! Boas criações 🎉')
        setTimeout(() => setView('portal'), 1800)
      } else {
        setUser(me.user)
        toast.info('Ainda em conferência — a equipe confirma e avisa no WhatsApp.')
      }
    } catch {
      toast.error('Falha de conexão.')
    }
  }

  if (!user) return null

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="glass-header sticky top-0 z-40 border-b border-zinc-200">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => setView('landing')} aria-label="Voltar">
            <Logo />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Ambiente seguro
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <AnimatePresence mode="wait">
          {/* ============ FORM STEP ============ */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]"
            >
              {/* Summary */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-7 text-white shadow-2xl">
                <div className="bg-grid-dark absolute inset-0" aria-hidden />
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-600/30 blur-[80px]" aria-hidden />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-400">
                    <Crown className="h-3.5 w-3.5" /> Acesso vitalício
                  </span>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tight">{formatBRL(priceCents)}</span>
                    <span className="pb-1.5 text-sm font-bold text-zinc-400">único</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-400">Arte avulsa: R$ 10 a R$ 30 cada. Aqui, o acervo inteiro é uma compra só.</p>

                  <ul className="mt-6 space-y-3 text-sm font-medium text-zinc-300">
                    {[
                      'Todas as artes liberadas agora',
                      'Lançamentos futuros inclusos',
                      'Download ilimitado',
                      'Formato 21×9,5 cm — use nas canecas que você vende',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/25">
                          <Check className="h-3 w-3 text-orange-400" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Payment options */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl shadow-zinc-200/40">
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Como você quer pagar?</h2>
                <p className="mt-1 text-sm text-zinc-500">No PIX automático, o acesso libera na hora. No PIX direto (chave), após conferirmos o seu comprovante no WhatsApp.</p>

                <div className="mt-6 space-y-3">
                  {availableOptions.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/60 p-5 text-center">
                      <p className="text-sm font-black text-zinc-800">Pagamentos em configuração</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        Nenhum método ativo agora. Fale com a gente no WhatsApp {WHATSAPP.display} e liberamos o seu acesso
                        por lá mesmo.
                      </p>
                      <a
                        href={WHATSAPP.link('Olá! Quero assinar a Click & Gruda, mas o checkout está sem método de pagamento ativo.')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-600"
                      >
                        <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                      </a>
                    </div>
                  )}
                  {availableOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setProvider(opt.id)}
                      className={cn(
                        'flex w-full items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-all',
                        provider === opt.id
                          ? 'border-orange-500 bg-orange-50/60 shadow-md shadow-orange-500/10'
                          : 'border-zinc-200 hover:border-orange-200'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                          provider === opt.id ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-500'
                        )}
                      >
                        <opt.icon className="h-5.5 w-5.5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-extrabold text-zinc-900">{opt.label}</span>
                        <span className="block text-xs text-zinc-500">{opt.desc}</span>
                      </span>
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full border-2',
                          provider === opt.id ? 'border-orange-500 bg-orange-500' : 'border-zinc-300'
                        )}
                      >
                        {provider === opt.id && <Check className="h-3 w-3 text-white" />}
                      </span>
                    </button>
                  ))}
                </div>

                {provider === 'ASAAS' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                    <Label htmlFor="cpf" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                      Seu CPF (exigido pelo Asaas)
                    </Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      className="mt-1.5 h-11 rounded-xl text-[15px] focus-visible:ring-orange-500"
                    />
                  </motion.div>
                )}

                {error && (
                  <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600" role="alert">
                    {error}
                  </p>
                )}

                {provider === 'MANUAL_PIX' && manualPix ? (
                  /* ---------- PIX manual: chave + comprovante no WhatsApp ---------- */
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-5 overflow-hidden rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/70 p-5 text-left"
                  >
                    <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-orange-600">
                      <QrCode className="h-4.5 w-4.5" /> Pague {formatBRL(priceCents)} na chave abaixo
                    </p>
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-xl border border-orange-200 bg-white px-4 py-2.5 font-mono text-sm font-bold text-zinc-800">
                        {manualPix.key}
                      </code>
                      <Button
                        type="button"
                        onClick={copyPixKey}
                        variant="outline"
                        className={cn(
                          'h-11 shrink-0 rounded-xl border-orange-300 font-bold transition-all',
                          pixCopied ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'bg-white text-orange-600 hover:bg-orange-500 hover:text-white'
                        )}
                        aria-live="polite"
                      >
                        {pixCopied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
                        {pixCopied ? 'Copiado!' : 'Copiar chave'}
                      </Button>
                    </div>
                    {manualPix.holder && (
                      <p className="mt-2 text-[11px] text-zinc-500">
                        Titular: <strong className="text-zinc-700">{manualPix.holder}</strong>
                      </p>
                    )}

                    <div className="mt-4 space-y-2 rounded-xl bg-white/80 p-3.5 text-[13px] font-medium text-zinc-600">
                      {[
                        'Copie a chave PIX e pague o valor no seu app do banco',
                        `Envie o comprovante para o nosso WhatsApp oficial ${WHATSAPP.display}`,
                        'A equipe confere e libera o seu acesso no portal',
                      ].map((s, i) => (
                        <p key={i} className="flex items-start gap-2.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                            {i + 1}
                          </span>
                          {s}
                        </p>
                      ))}
                    </div>

                    <a
                      href={manualWhatsappUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-600"
                    >
                      <MessageCircle className="h-4.5 w-4.5" />
                      Enviar comprovante no WhatsApp
                    </a>

                    <Button
                      onClick={confirmManualPix}
                      disabled={confirmingManual}
                      variant="outline"
                      className="mt-2.5 h-11 w-full rounded-xl border-zinc-300 bg-white font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      {confirmingManual ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
                        </>
                      ) : (
                        'Já paguei — reservar meu cadastro'
                      )}
                    </Button>
                    <p className="mt-2 text-center text-[11px] leading-relaxed text-zinc-400">
                      Seu cadastro fica pré-aprovado e o acesso é liberado após a conferência do comprovante.
                    </p>
                  </motion.div>
                ) : (
                  <Button
                    onClick={generatePix}
                    disabled={generating || !provider}
                    className="mt-6 min-h-13 w-full whitespace-normal rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-center text-sm font-black uppercase leading-tight tracking-wide text-white shadow-lg shadow-orange-500/30 hover:brightness-105 sm:text-base"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando PIX...
                      </>
                    ) : (
                      <>Gerar PIX de {formatBRL(priceCents)}</>
                    )}
                  </Button>
                )}

                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                  <Info className="h-3.5 w-3.5" /> Compra única, sem assinatura recorrente.
                </p>
              </div>
            </motion.div>
          )}

          {/* ============ PIX STEP ============ */}
          {step === 'pix' && payment && (
            <motion.div
              key="pix"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-lg"
            >
              <button
                onClick={() => setStep('form')}
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-orange-600"
              >
                <ArrowLeft className="h-4 w-4" /> Escolher outro método
              </button>

              <div className="rounded-3xl border border-zinc-200 bg-white p-7 text-center shadow-xl shadow-zinc-200/40">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-orange-600">
                  <Timer className="h-3.5 w-3.5" /> Expira em {mm}:{ss}
                </div>

                <h2 className="mt-4 text-xl font-black tracking-tight text-zinc-950">Escaneie e pague {formatBRL(priceCents)}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {`PIX via ${payment.provider === 'MERCADOPAGO' ? 'Mercado Pago' : 'Asaas'} — aprovação automática`}
                </p>

                {payment.qrCodeImage && (
                  <div className="mx-auto mt-5 w-fit rounded-2xl border-2 border-zinc-100 bg-white p-3 shadow-inner">
                    { }
                    <img src={payment.qrCodeImage} alt="QR Code PIX" className="h-56 w-56 object-contain" />
                  </div>
                )}

                {payment.qrCodePayload && (
                  <div className="mt-5 text-left">
                    <Label className="text-xs font-bold uppercase tracking-wide text-zinc-500">PIX copia e cola</Label>
                    <div className="mt-1.5 flex gap-2">
                      <textarea
                        readOnly
                        value={payment.qrCodePayload}
                        rows={3}
                        className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] leading-relaxed text-zinc-600"
                      />
                      <Button
                        onClick={copyPayload}
                        className="h-fit shrink-0 rounded-xl bg-zinc-950 px-4 py-3 font-bold text-white hover:bg-zinc-800"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-2.5 rounded-2xl bg-zinc-50 p-4 text-left text-[13px] font-medium text-zinc-600">
                  {[
                    'Abra o app do seu banco e escolha pagar com PIX',
                    'Escaneie o QR Code ou cole o código copiado',
                    'Confirme — o acesso libera automaticamente aqui',
                  ].map((s, i) => (
                    <p key={i} className="flex items-start gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                        {i + 1}
                      </span>
                      {s}
                    </p>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-orange-600">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
                  </span>
                  Aguardando confirmação do pagamento...
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ PENDING STEP (PIX manual pré-aprovado) ============ */}
          {step === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-lg"
            >
              <div className="rounded-3xl border-2 border-orange-200 bg-white p-8 text-center shadow-xl shadow-orange-200/40 sm:p-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.45, ease: 'easeOut' }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 shadow-inner"
                >
                  <Clock3 className="h-9 w-9 text-orange-500" />
                </motion.div>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-600">
                  <Check className="h-3 w-3" /> Cadastro pré-aprovado
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">
                  Quase lá, {user.name.split(' ')[0]}!
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Sua conta está reservada. Agora é só enviar o comprovante do PIX de{' '}
                  <strong className="text-zinc-800">{formatBRL(priceCents)}</strong> para o nosso WhatsApp oficial — a
                  equipe confere e libera o seu acesso no portal.
                </p>

                <a
                  href={manualWhatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-600"
                >
                  <MessageCircle className="h-5 w-5" />
                  {WHATSAPP.display} — Enviar comprovante
                </a>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Button
                    onClick={checkRelease}
                    variant="outline"
                    className="h-11 rounded-xl border-orange-300 bg-orange-50 font-bold text-orange-600 hover:bg-orange-100"
                  >
                    Verificar liberação
                  </Button>
                  <Button
                    onClick={() => setView('landing')}
                    variant="ghost"
                    className="h-11 rounded-xl font-bold text-zinc-500"
                  >
                    Fechar e voltar depois
                  </Button>
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-zinc-400">
                  Pode fechar esta página e voltar depois — o acesso é liberado assim que o pagamento for conferido.
                </p>
              </div>
            </motion.div>
          )}

          {/* ============ SUCCESS STEP ============ */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -8, 8, 0] }}
                transition={{ delay: 0.1, duration: 0.55, ease: 'easeOut' }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/40"
              >
                <Check className="h-10 w-10 text-white" strokeWidth={3} />
              </motion.div>
              <h2 className="mt-6 text-2xl font-black tracking-tight text-zinc-950">Acesso liberado! 🎉</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Bem-vindo(a) ao time, {user.name.split(' ')[0]}! Você já pode baixar <strong className="text-zinc-800">todas as artes</strong> — pra sempre.
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> Abrindo seu portal...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-6 text-center text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Click &amp; Gruda · Pagamento único · Acesso vitalício
        </span>
      </footer>
    </div>
  )
}
