'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BookMarked,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Crown,
  Flame,
  Image as ImageIcon,
  Landmark,
  ListOrdered,
  Lock,
  Megaphone,
  Menu,
  MessageCircle,
  Package,
  QrCode,
  Quote,
  Rocket,
  Ruler,
  Scale,
  Sparkles,
  Store,
  TicketPercent,
  Truck,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Logo } from '@/components/shared/Logo'
import { Marquee } from '@/components/shared/Marquee'
import { HeroCollage } from '@/components/landing/HeroCollage'
import { ShowcaseCarousel } from '@/components/landing/ShowcaseCarousel'
import { MiniPlayer } from '@/components/landing/MiniPlayer'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { useStore } from '@/lib/store'
import { formatBRL, type CatalogData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ENTITY_PRACTICAL,
  FAQ_ITEMS,
  GLOSSARY_TERMS,
  COMPARISON,
  FOR_WHO,
  NOT_FOR_WHO,
  HOWTO_STEPS,
  HOWTO_TOOLING,
  KEY_FACTS,
} from '@/lib/knowledge'
import { BLOG_ARTICLES } from '@/content/blog'
import { todayISO, todayBR, CONTENT_PUBLISHED_ISO } from '@/lib/site'
import { track } from '@/lib/analytics'

const FACT_LABELS: Record<string, string> = {
  businessModel: 'Modelo de negócio',
  price: 'Preço',
  artFormatCm: 'Formato das artes',
  mugStandard: 'Caneca de referência',
  downloads: 'Downloads',
  commercialUse: 'Uso comercial',
  newArtsFrequency: 'Novas artes',
  payment: 'Pagamento',
  portalFeatures: 'Organização do portal',
}

const FALLBACK_CATEGORIES = ['FLORK', 'PROFISSÕES', 'RELIGIÃO', 'FRASES', 'ANIMAIS', 'COMEMORATIVAS']
const FALLBACK_EVENTS = ['NATAL', 'DIA DAS MÃES', 'DIA DOS NAMORADOS', 'PÁSCOA', 'ANO NOVO', 'BLACK FRIDAY']

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const dur = 1500
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])

  return (
    <span ref={ref}>
      {val.toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: 'easeOut' as const },
}

export function LandingView() {
  const setView = useStore((s) => s.setView)
  const user = useStore((s) => s.user)
  const setAuthMode = useStore((s) => s.setAuthMode)
  const setPendingIntent = useStore((s) => s.setPendingIntent)
  const [scrolled, setScrolled] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => (await fetch('/api/catalog')).json(),
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const categories = catalog?.categories?.length
    ? catalog.categories.map((c) => `${c.emoji} ${c.name}`)
    : FALLBACK_CATEGORIES
  const events = catalog?.events?.length
    ? catalog.events.map((e) => `${e.emoji} ${e.name.toUpperCase()}`)
    : FALLBACK_EVENTS

  const price = formatBRL(catalog?.priceCents ?? 4790)
  /* Ancoragem honesta: preço real do catálogo ÷ nº real de artes (atualiza sozinho). */
  const perArt = formatBRL(Math.round((catalog?.priceCents ?? 4790) / Math.max(1, catalog?.counts.arts ?? 14)))

  const goSignup = () => {
    track('cta_click', { location: 'landing', intent: 'signup' })
    if (user) {
      setView(user.hasAccess ? 'portal' : 'checkout')
      return
    }
    setAuthMode('register')
    setPendingIntent('checkout')
    setView('auth')
  }

  const goArts = () => {
    track('cta_click', { location: 'landing', intent: 'ver-artes' })
    document.getElementById('artes')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollTo = (id: string) => {
    setMobileNav(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ================= AVISO FIXO (dispensável) ================= */}
      {showBanner && (
        <div className="fixed inset-x-0 top-0 z-[60] h-10 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white shadow-lg">
          <div className="relative mx-auto flex h-full max-w-7xl items-center justify-center px-10 text-center">
            <Megaphone className="mr-2 hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
            <p className="text-[11px] font-bold leading-tight sm:text-xs">
              <span className="hidden sm:inline">Em desenvolvimento: o </span>
              <button
                onClick={() => scrollTo('catalogo')}
                className="underline decoration-white/60 underline-offset-2 transition-colors hover:decoration-white"
              >
                Catálogo Digital
              </button>
              <span className="hidden sm:inline">
                {' '}— a sua mini loja de personalizados. Assinantes terão{' '}
                <strong>condição especial</strong> no lançamento.
              </span>
              <span className="sm:hidden"> — a sua mini loja. Assinantes: condição especial no lançamento.</span>
            </p>
            <button
              onClick={() => setShowBanner(false)}
              aria-label="Fechar aviso"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= HEADER ================= */}
      <header
        className={cn(
          'fixed inset-x-0 z-50 transition-all duration-300',
          showBanner ? 'top-10' : 'top-0',
          scrolled ? 'glass-header border-b border-zinc-200/80 shadow-sm' : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Ir para o topo">
            <Logo dark={!scrolled} />
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
            {[
              ['Artes', 'artes'],
              ['Como funciona', 'como-funciona'],
              ['Preço', 'preco'],
              ['FAQ', 'faq'],
              ['Blog', '/blog'],
            ].map(([label, id]) =>
              id.startsWith('/') ? (
                <Link
                  key={id}
                  href={id}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                    scrolled ? 'text-zinc-600 hover:bg-orange-50 hover:text-orange-600' : 'text-white/85 hover:text-white'
                  )}
                >
                  {label}
                </Link>
              ) : (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                    scrolled ? 'text-zinc-600 hover:bg-orange-50 hover:text-orange-600' : 'text-white/85 hover:text-white'
                  )}
                >
                  {label}
                </button>
              )
            )}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Button
                onClick={() => setView(user.hasAccess ? 'portal' : 'checkout')}
                className="h-10 rounded-xl bg-zinc-950 font-bold text-white hover:bg-zinc-800"
              >
                <Crown className="mr-1 h-4 w-4 text-orange-400" />
                {user.hasAccess ? 'Meu Portal' : 'Assinar agora'}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAuthMode('login')
                    setView('auth')
                  }}
                  className={cn(
                    'h-10 rounded-xl font-bold',
                    scrolled ? 'text-zinc-700 hover:text-orange-600' : 'text-white/90 hover:text-white'
                  )}
                >
                  Entrar
                </Button>
                <Button
                  onClick={goSignup}
                  className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 font-extrabold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:brightness-105"
                >
                  Assinar {price} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-900 md:hidden"
            onClick={() => setMobileNav((v) => !v)}
            aria-label="Abrir menu"
          >
            {mobileNav ? <XCircle className={scrolled ? '' : 'text-white'} /> : <Menu className={scrolled ? '' : 'text-white'} />}
          </button>
        </div>

        {mobileNav && (
          <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-2 shadow-2xl md:hidden">
            {[
              ['Artes', 'artes'],
              ['Como funciona', 'como-funciona'],
              ['Preço', 'preco'],
              ['FAQ', 'faq'],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 hover:bg-orange-50"
              >
                {label}
              </button>
            ))}
            <Button
              onClick={goSignup}
              className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-extrabold"
            >
              Assinar por {price}
            </Button>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-zinc-950 pb-16 pt-28 text-white sm:pb-20 sm:pt-32">
        <div className="bg-grid-dark absolute inset-0" aria-hidden />
        <div
          className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-orange-600/25 blur-[130px]"
          aria-hidden
        />
        <div
          className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-500/15 blur-[120px]"
          aria-hidden
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold text-orange-300"
            >
              <Flame className="h-3.5 w-3.5" />
              Lançamentos frequentes · inclusos no acesso
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-5 text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl xl:text-6xl"
            >
              Caneca sem arte boa <span className="text-zinc-500 line-through decoration-orange-500/70 decoration-4">não vende.</span>
              <br />
              Arte pronta, na medida certa, por <span className="text-gradient-orange">um pagamento só.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg"
            >
              Você perde horas caçando arte, paga <strong className="text-zinc-200">R$ 10 a R$ 30 por imagem</strong> e
              ainda recebe arquivo borrado que estraga a sublimação. Aqui é diferente:{' '}
              <strong className="text-orange-400">pagamento único de {price}</strong> e{' '}
              <strong className="text-white">TODAS as artes liberadas pra sempre</strong> — inclusive os lançamentos.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                onClick={goSignup}
                className="group min-h-13 whitespace-normal rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-center text-sm font-black uppercase leading-tight tracking-wide text-white shadow-xl shadow-orange-600/40 transition-all hover:scale-[1.02] hover:shadow-orange-500/60 sm:px-7 sm:py-3.5 sm:text-base"
              >
                Quero acesso total — {price}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                onClick={goArts}
                variant="outline"
                className="min-h-13 whitespace-normal rounded-2xl border-zinc-700 bg-zinc-900/60 px-5 py-3 text-center text-sm font-bold text-zinc-100 backdrop-blur hover:bg-zinc-800 hover:text-white sm:px-7 sm:py-3.5 sm:text-base"
              >
                <Sparkles className="mr-2 h-5 w-5 text-orange-400" />
                Ver as artes
              </Button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.36 }}
              className="mt-7 grid max-w-xl grid-cols-2 gap-x-4 gap-y-2 text-[13px] font-medium text-zinc-300"
            >
              {[
                'Download ilimitado',
                'Lançamentos inclusos',
                'Medida exata 21×9,5 cm',
                'Use nas canecas que você vende',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500/20">
                    <Check className="h-3 w-3 text-orange-400" />
                  </span>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Colagem de artes reais do acervo (substitui a foto estática das canecas) */}
          <HeroCollage />
        </div>

        {/* Stats */}
        <div className="relative mx-auto mt-16 grid w-full max-w-4xl grid-cols-3 gap-4 px-4 sm:px-6">
          {[
            { value: catalog?.counts.arts ?? 14, suffix: '', label: 'artes no acervo agora' },
            { value: catalog?.categories?.length ?? 6, suffix: '', label: 'categorias organizadas' },
            { value: catalog?.events?.length ?? 9, suffix: '', label: 'datas sazonais cobertas' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-5 text-center backdrop-blur"
            >
              <div className="text-2xl font-black text-orange-400 sm:text-3xl">
                <CountUp to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MARQUEES ================= */}
      <div className="relative z-10" aria-hidden>
        <Marquee
          items={categories}
          duration={36}
          className="border-y border-zinc-800 bg-zinc-950 py-3.5"
          itemClassName="text-sm font-black uppercase tracking-[0.18em] text-zinc-100"
        />
        <Marquee
          items={events}
          reverse
          duration={30}
          className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-3.5"
          itemClassName="text-sm font-black uppercase tracking-[0.18em] text-white"
        />
      </div>

      {/* ================= DOR / SOLUÇÃO ================= */}
      <section className="bg-grid-light bg-white py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500">
              <XCircle className="h-3.5 w-3.5" /> Pare de perder dinheiro
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Você conhece essa <span className="text-gradient-orange">dor, sublimador?</span>
            </h2>
            <p className="mt-3 text-zinc-500">
              Se você vive de canecas, com certeza já passou por pelo menos uma delas...
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                pain: 'Pagar R$ 10 a R$ 30 em CADA arte que você compra',
                solution: 'Pagamento único e TUDO liberado pra sempre. Na 2ª ou 3ª arte que você baixar, o acesso já se pagou.',
                icon: Wallet,
              },
              {
                pain: 'Arte borrada ou com medida errada que estraga a sublimação',
                solution: 'Alta resolução, no formato exato 21×9,5 cm. Abriu, imprimiu, gruda — sem retrabalho.',
                icon: Ruler,
              },
              {
                pain: 'Ver o concorrente vender na data comemorativa antes de você',
                solution: 'A aba SAZONAL mostra a próxima data e separa as artes. Você prepara a produção antes da data chegar.',
                icon: Clock3,
              },
            ].map((c, i) => (
              <motion.div
                key={i}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                    <c.icon className="h-5.5 w-5.5 text-red-400" />
                  </div>
                  <p className="text-[15px] font-bold leading-snug text-zinc-800">{c.pain}</p>
                </div>
                <div className="my-4 flex items-center gap-2" aria-hidden>
                  <div className="h-px flex-1 bg-zinc-200" />
                  <ChevronDown className="h-4 w-4 text-orange-500" />
                  <div className="h-px flex-1 bg-orange-200" />
                </div>
                <div className="mt-auto flex items-start gap-3 rounded-2xl bg-orange-50/70 p-3.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-zinc-700">{c.solution}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= VITRINE ================= */}
      <section id="artes" className="scroll-mt-20 bg-zinc-950 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
                <Sparkles className="h-3.5 w-3.5" /> Vitrine do acervo
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Veja o que te espera <span className="text-gradient-orange">lá dentro</span>
              </h2>
              <p className="mt-2 max-w-lg text-zinc-400">
                Prévia de cada arte, já na medida da caneca. Liberou o acesso, baixou o PNG original em alta —
                21×9,5 cm, pronto pra prensa.
              </p>
            </div>
            <Button
              onClick={goSignup}
              className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 font-extrabold shadow-lg shadow-orange-600/30"
            >
              Desbloquear todas <Lock className="ml-1.5 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Carrossel infinito deslizando para a esquerda — 2 fileiras, pausa no hover */}
          <ShowcaseCarousel />

          <motion.p {...fadeUp} className="mt-8 text-center text-sm text-zinc-500">
            <strong className="text-orange-400">{catalog?.counts.arts ?? 20} artes</strong> no acervo agora — e os
            lançamentos frequentes já estão inclusos no seu acesso.
          </motion.p>
        </div>
      </section>

      {/* ================= COMO FUNCIONA ================= */}
      <section id="como-funciona" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Zap className="h-3.5 w-3.5" /> Simples assim
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Do PIX ao primeiro download em <span className="text-gradient-orange">poucos minutos</span>
            </h2>
            <div className="mt-8 space-y-6">
              {[
                {
                  n: '1',
                  title: 'Crie sua conta',
                  desc: 'Nome, e-mail e senha. 30 segundos e você já está dentro escolhendo seu pagamento.',
                },
                {
                  n: '2',
                  title: 'Pague uma vez no PIX',
                  desc: `Pague ${price} no PIX. No automático (Mercado Pago/Asaas), o acesso libera na hora; no PIX direto (chave), liberamos após conferir o seu comprovante no WhatsApp. Sem mensalidade.`,
                },
                {
                  n: '3',
                  title: 'Baixe tudo, hoje e sempre',
                  desc: 'Filtre por categoria, favorite, acompanhe lançamentos e baixe quantas artes quiser. Pra sempre.',
                },
              ].map((s, i) => (
                <motion.div key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.12 }} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-lg font-black text-white shadow-lg shadow-orange-500/30">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-zinc-900">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="relative">
            <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-2xl shadow-orange-900/10">
              <Image
                src="/uploads/hero-press.png"
                alt="Prensa térmica sublimando caneca com arte digital"
                width={1344}
                height={768}
                sizes="(max-width: 1024px) 100vw, 576px"
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl sm:right-6">
              <div className="flex items-center gap-2 text-sm font-black text-zinc-900">
                <Ruler className="h-4.5 w-4.5 text-orange-500" />
                21×9,5 cm — medida exata da caneca de 325 ml
              </div>
              <div className="text-[11px] font-medium text-zinc-400">PNG em alta: é imprimir e prensar, sem ajuste no editor</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= PREÇO ================= */}
      <section id="preco" className="relative scroll-mt-20 overflow-hidden bg-zinc-950 py-20 sm:py-24">
        <div className="bg-grid-dark absolute inset-0" aria-hidden />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[120px]" aria-hidden />

        <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Crown className="h-3.5 w-3.5" /> Investimento único
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              O acesso inteiro sai pelo preço de <span className="text-gradient-orange">2 artes avulsas</span>
            </h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            className="relative mt-10 overflow-hidden rounded-[2rem] border-2 border-orange-500/60 bg-white p-8 shadow-2xl shadow-orange-600/20 sm:p-10"
          >
            <div className="absolute right-0 top-0 rounded-bl-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white">
              Acesso vitalício
            </div>

            <div className="text-center">
              <div className="flex items-end justify-center gap-2">
                <span className="text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl">{price}</span>
                <span className="pb-2 text-sm font-bold text-zinc-400">à vista</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-zinc-400">
                Pagamento único. <span className="text-red-500 line-through">Sem mensalidade.</span>{' '}
                <span className="text-orange-600">Pra sempre.</span>
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
                Arte avulsa custa R$ 10 a R$ 30. Aqui, o acesso se paga na 2ª ou 3ª arte que você baixar — hoje, dá
                cerca de <strong className="text-zinc-700">{perArt}</strong> por arte, e cada lançamento novo reduz
                esse número.
              </p>
            </div>

            <ul className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              {[
                'Todas as artes liberadas hoje',
                'Lançamentos futuros inclusos',
                'Baixe quantas vezes quiser, pra sempre',
                'Na medida exata da caneca (sem ajuste no editor)',
                'Alta resolução pra sublimar',
                'Use nas canecas que você vende',
                'Aba sazonal de datas especiais',
                'Link de catálogo pra seu cliente escolher a arte',
                'Favoritos e busca avançada',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-zinc-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Check className="h-3 w-3 text-orange-600" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-9 text-center">
              <Button
                onClick={goSignup}
                className="group min-h-14 w-full max-w-md whitespace-normal rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 text-center text-base font-black uppercase leading-tight tracking-wide text-white shadow-xl shadow-orange-600/40 transition-all hover:scale-[1.015] hover:shadow-orange-500/60 sm:text-lg"
              >
                Liberar meu acesso por {price}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Métodos de pagamento aceitos — refletem a configuração ativa do Admin Master */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {[
                  { icon: QrCode, label: 'PIX', show: true },
                  { icon: Wallet, label: 'Mercado Pago', show: Boolean(catalog?.providers?.mercadopago) },
                  { icon: Landmark, label: 'Asaas', show: Boolean(catalog?.providers?.asaas) },
                ]
                  .filter((m) => m.show)
                  .map((m) => (
                    <span
                      key={m.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-600 shadow-sm transition-colors hover:border-orange-300 hover:text-orange-600"
                    >
                      <m.icon className="h-3.5 w-3.5 text-orange-500" />
                      {m.label}
                    </span>
                  ))}
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-400">
                <BadgeCheck className="h-4 w-4 text-emerald-500" />
                Pagamento seguro · PIX automático libera na hora · PIX direto após conferência
              </p>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              Dúvidas frequentes
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Tudo que você precisa <span className="text-gradient-orange">saber</span>
            </h2>
          </motion.div>

          <motion.div {...fadeUp} className="mt-10">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-zinc-200">
                  <AccordionTrigger className="text-left text-[15px] font-bold text-zinc-800 hover:text-orange-600 hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-zinc-500">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ================= CENTRAL DE CONHECIMENTO (GEO / KNOWLEDGE HUB) ================= */}
      <section id="conhecimento" className="scroll-mt-20 bg-white py-20 sm:py-24" aria-labelledby="conhecimento-titulo">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-600">
              <BookOpen className="h-3.5 w-3.5" /> Central de Conhecimento
            </span>
            <h2
              id="conhecimento-titulo"
              className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl"
            >
              O que é a Click &amp; Gruda e <span className="text-gradient-orange">como ela funciona</span>
            </h2>
            <p className="mt-3 text-zinc-500">
              Guia completo e direto ao ponto: definição, para quem é, comparativo com as alternativas e o
              processo de sublimação passo a passo.
            </p>
          </motion.div>

          {/* ---- A plataforma na prática (complementa a resposta direta do topo) ---- */}
          <motion.article {...fadeUp} className="mt-14">
            <h3 className="flex items-center gap-2 text-xl font-black text-zinc-900">
              <Quote className="h-5 w-5 text-orange-500" />
              A Click &amp; Gruda na prática
            </h3>
            <blockquote className="mt-4 rounded-r-2xl border-l-4 border-orange-500 bg-orange-50/70 p-5 text-[15px] font-medium leading-relaxed text-zinc-800 sm:text-base">
              {ENTITY_PRACTICAL}
            </blockquote>
          </motion.article>

          {/* ---- Para quem é / não é ---- */}
          <motion.article {...fadeUp} id="para-quem" className="mt-14 scroll-mt-24">
            <h3 className="flex items-center gap-2 text-xl font-black text-zinc-900">
              <Users className="h-5 w-5 text-orange-500" />
              Para quem é a Click &amp; Gruda (e para quem não é)
            </h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-orange-200 bg-orange-50/50 p-6">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-orange-600">
                  <Check className="h-4 w-4" /> Para quem é
                </p>
                <ul className="mt-4 space-y-2.5">
                  {FOR_WHO.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-700">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-orange-500">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-zinc-500">
                  <XCircle className="h-4 w-4" /> Para quem NÃO é
                </p>
                <ul className="mt-4 space-y-2.5">
                  {NOT_FOR_WHO.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-600">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.article>

          {/* ---- Comparativo honesto ---- */}
          <motion.article {...fadeUp} id="comparativo" className="mt-14 scroll-mt-24">
            <h3 className="flex items-center gap-2 text-xl font-black text-zinc-900">
              <Scale className="h-5 w-5 text-orange-500" />
              Click &amp; Gruda vs. arte avulsa vs. freelancer
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Resposta direta: para quem produz canecas em volume, o acesso vitalício de {price} é mais barato
              que comprar artes avulsas a partir da segunda ou terceira arte. Já a exclusividade absoluta de
              design é o único critério em que um freelancer ainda faz sentido — o acervo aqui é compartilhado
              entre assinantes.
            </p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Comparativo entre o acesso vitalício da Click &amp; Gruda, a compra de artes avulsas e a
                  contratação de freelancer
                </caption>
                <thead>
                  <tr className="bg-zinc-950 text-white">
                    <th scope="col" className="px-4 py-3.5 font-black">
                      Critério
                    </th>
                    <th scope="col" className="bg-orange-600 px-4 py-3.5 font-black">
                      Click &amp; Gruda
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Arte avulsa
                    </th>
                    <th scope="col" className="px-4 py-3.5 font-bold">
                      Freelancer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={row.criterion}
                      className={cn(
                        'border-t border-zinc-200',
                        i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60'
                      )}
                    >
                      <th scope="row" className="px-4 py-3 font-bold text-zinc-800">
                        {row.criterion}
                      </th>
                      <td className="bg-orange-50/80 px-4 py-3 font-semibold text-zinc-900">{row.clickgruda}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.avulsa}</td>
                      <td className="px-4 py-3 text-zinc-600">{row.freelancer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.article>

          {/* ---- HowTo: como sublimar ---- */}
          <motion.article {...fadeUp} id="como-sublimar" className="mt-14 scroll-mt-24">
            <h3 className="flex items-center gap-2 text-xl font-black text-zinc-900">
              <ListOrdered className="h-5 w-5 text-orange-500" />
              Como sublimar uma caneca em 6 passos
            </h3>
            <ol className="mt-5 space-y-3">
              {HOWTO_STEPS.map((s, i) => (
                <li
                  key={s.name}
                  id={`passo-${i + 1}`}
                  className="flex gap-4 scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-base font-black text-white shadow-md shadow-orange-500/25">
                    {i + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-zinc-900">{s.name}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
              <BookMarked className="h-4 w-4 text-orange-500" />
              Você vai precisar de:
              {HOWTO_TOOLING.map((t) => (
                <span key={t} className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-zinc-600">
                  {t}
                </span>
              ))}
            </p>
          </motion.article>

          {/* ---- Ficha de fatos (fact density) ---- */}
          <motion.article {...fadeUp} className="mt-14">
            <h3 className="flex items-center gap-2 text-xl font-black text-zinc-900">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              A plataforma em fatos
            </h3>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(KEY_FACTS).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <dt className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                    {FACT_LABELS[key] ?? key}
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold leading-snug text-zinc-800">{value}</dd>
                </div>
              ))}
            </dl>
          </motion.article>

          {/* ---- Autoria, revisão técnica e datas (E-E-A-T) ---- */}
          <motion.div
            {...fadeUp}
            className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-xs leading-relaxed text-zinc-500"
          >
            <p className="font-bold text-zinc-700">Sobre esta página</p>
            <p className="mt-1">
              Publicado em <time dateTime={CONTENT_PUBLISHED_ISO}>{new Date(CONTENT_PUBLISHED_ISO).toLocaleDateString('pt-BR')}</time>{' '}
              · Última revisão técnica em <time dateTime={todayISO()}>{todayBR()}</time> · Autoria:{' '}
              Equipe Editorial Click &amp; Gruda · Revisão técnica: Equipe de Produção Click &amp; Gruda
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= GLOSSÁRIO TÉCNICO ================= */}
      <section id="glossario" className="bg-grid-light scroll-mt-20 bg-white py-20 sm:py-24" aria-labelledby="glossario-titulo">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <BookMarked className="h-3.5 w-3.5" /> Glossário de sublimação
            </span>
            <h2
              id="glossario-titulo"
              className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl"
            >
              Termos técnicos do setor, <span className="text-gradient-orange">explicados</span>
            </h2>
            <p className="mt-3 text-zinc-500">
              Definições curtas e objetivas dos termos que todo sublimador ouve todos os dias.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="mt-10 space-y-3">
            {GLOSSARY_TERMS.map((t) => (
              <details
                key={t.term}
                className="group rounded-2xl border border-zinc-200 bg-white transition-all open:border-orange-300 open:shadow-lg open:shadow-orange-500/10"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-bold text-zinc-800 transition-colors hover:text-orange-600 [&::-webkit-details-marker]:hidden">
                  {t.term}
                  <ChevronDown className="h-4 w-4 shrink-0 text-orange-500 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="border-t border-zinc-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-zinc-600">
                  {t.definition}
                </p>
              </details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================= BLOG TEASER (linkagem interna / content hub) ================= */}
      <section id="blog" className="scroll-mt-20 bg-white py-20 sm:py-24" aria-labelledby="blog-teaser-titulo">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <BookOpen className="h-3.5 w-3.5" /> Conteúdo de referência
              </span>
              <h2 id="blog-teaser-titulo" className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
                Aprenda de graça no <span className="text-gradient-orange">blog do sublimador</span>
              </h2>
              <p className="mt-2 max-w-lg text-zinc-500">
                Guias definitivos, custos reais, escolha de equipamentos e o calendário sazonal de vendas —
                revisados pela equipe de produção.
              </p>
            </div>
            <Link
              href="/blog"
              className="group inline-flex h-11 items-center rounded-xl border border-zinc-200 px-5 text-sm font-bold text-zinc-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
            >
              Ver todos os artigos
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {BLOG_ARTICLES.slice(0, 3).map((a, i) => (
              <motion.div
                key={a.slug}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              >
                <Link
                  href={`/blog/${a.slug}`}
                  className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10"
                >
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                    {a.emoji} {a.category === 'guias' ? 'Guia' : a.category === 'negocios' ? 'Negócios' : a.category === 'equipamentos' ? 'Equipamentos' : a.category === 'artes' ? 'Artes' : 'Sazonal'}
                  </span>
                  <h3 className="mt-2.5 text-lg font-black leading-snug text-zinc-900 transition-colors group-hover:text-orange-600">
                    {a.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{a.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-extrabold text-orange-600">
                    Ler artigo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CATÁLOGO DIGITAL (EM BREVE) ================= */}
      <section id="catalogo" className="scroll-mt-20 bg-zinc-50 py-20 sm:py-24" aria-labelledby="catalogo-titulo">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Rocket className="h-3.5 w-3.5" /> Em breve · novo sistema
            </span>
            <h2 id="catalogo-titulo" className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              O <span className="text-gradient-orange">Catálogo Digital</span> está chegando
            </h2>
            <p className="mt-3 text-zinc-500">
              A sua própria vitrine online com a sua marca, para receber pedidos de catálogo. Está em
              desenvolvimento — e quem é assinante entra na frente.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Store,
                title: 'Sua vitrine exclusiva',
                desc: 'Um endereço seu na internet para expor e vender com a sua marca.',
              },
              {
                icon: ImageIcon,
                title: 'Cadastro de produtos',
                desc: 'Produtos com fotos, descrição e preço, organizados em minutos.',
              },
              {
                icon: TicketPercent,
                title: 'Cupons de desconto',
                desc: 'Crie promoções e cupons para atrair e fidelizar clientes.',
              },
              {
                icon: Truck,
                title: 'Formas de entrega',
                desc: 'Defina retirada, entrega local ou envio — com as suas regras.',
              },
              {
                icon: CreditCard,
                title: 'Meios de pagamento',
                desc: 'Ofereça PIX, cartão ou o método que preferir para receber.',
              },
              {
                icon: Package,
                title: 'Pedidos organizados',
                desc: 'Acompanhe pedidos e clientes em um painel simples e direto.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100">
                  <f.icon className="h-5.5 w-5.5 text-orange-600" />
                </div>
                <h3 className="mt-4 font-black text-zinc-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Vantagem exclusiva do assinante */}
          <motion.div
            {...fadeUp}
            className="relative mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 p-8 text-white shadow-2xl shadow-orange-600/30 sm:p-10"
          >
            <div className="flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider">
                  <Crown className="h-3.5 w-3.5" /> Condição de fundador
                </p>
                <h3 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">
                  Quem já é assinante garante{' '}
                  <span className="underline decoration-white/50 decoration-4 underline-offset-4">50% de desconto</span>{' '}
                  no plano anual
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                  Quando o Catálogo Digital lançar, o plano anual sai por{' '}
                  <strong className="text-white">R$ 98,00/ano</strong> em vez de R$ 196,00 — condição reservada
                  para quem já tem acesso ativo por aqui.
                </p>
              </div>
              <Button
                onClick={goSignup}
                className="group min-h-13 w-full shrink-0 whitespace-normal rounded-2xl bg-zinc-950 px-5 py-3 text-center text-sm font-black uppercase leading-tight tracking-wide text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-zinc-900 sm:px-7 sm:py-3.5 sm:text-base lg:w-auto"
              >
                Assinar e garantir o benefício
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <p className="mt-6 border-t border-white/20 pt-4 text-xs font-medium leading-relaxed text-white/85">
              Nossa equipe de produto está em pleno desenvolvimento. Acompanhe as novidades por aqui e no nosso
              WhatsApp oficial {WHATSAPP.display}.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 py-16">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <motion.h2 {...fadeUp} className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Sua próxima caneca já pode sair com arte nova <span className="underline decoration-white/50 decoration-4 underline-offset-4">hoje</span>.
          </motion.h2>
          <motion.p {...fadeUp} className="max-w-xl font-medium text-white/90">
            {price} uma vez, acesso vitalício. Escolha a arte, baixe em alta resolução e mande pra prensa.
          </motion.p>
          <motion.div {...fadeUp}>
            <Button
              onClick={goSignup}
              className="min-h-14 whitespace-normal rounded-2xl bg-zinc-950 px-6 py-3 text-center text-sm font-black uppercase leading-tight tracking-wide text-white shadow-2xl transition-all hover:scale-[1.03] hover:bg-zinc-900 sm:px-9 sm:text-base"
            >
              Liberar meu acesso por {price} <ArrowRight className="ml-2 h-5 w-5 text-orange-400" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Botão flutuante de WhatsApp — contato oficial e suporte */}
      <a
        href={WHATSAPP.link(WHATSAPP_MESSAGES.support)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com o suporte no WhatsApp"
        className="group fixed bottom-5 right-5 z-40 flex h-13 items-center gap-2 rounded-full bg-emerald-500 py-3 pl-3.5 pr-3.5 text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 hover:bg-emerald-600 sm:pr-4"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30 opacity-60 group-hover:opacity-0" aria-hidden />
          <MessageCircle className="relative h-6 w-6" />
        </span>
        <span className="hidden text-sm font-black sm:inline">Suporte</span>
      </a>

      {/* Mini player de áudio (boas-vindas) — sem autoplay, canto inferior esquerdo */}
      <MiniPlayer />

      {/* ================= FOOTER (sticky via mt-auto) ================= */}
      <footer className="mt-auto bg-zinc-950 py-10 text-zinc-400">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
          <Logo dark />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium" aria-label="Rodapé">
            <button onClick={() => scrollTo('artes')} className="transition-colors hover:text-orange-400">
              Artes
            </button>
            <button onClick={() => scrollTo('preco')} className="transition-colors hover:text-orange-400">
              Preço
            </button>
            <button onClick={() => scrollTo('faq')} className="transition-colors hover:text-orange-400">
              FAQ
            </button>
            <Link href="/blog" className="transition-colors hover:text-orange-400">
              Blog
            </Link>
            <Link href="/sobre" className="transition-colors hover:text-orange-400">
              Sobre
            </Link>
            <button onClick={() => scrollTo('conhecimento')} className="transition-colors hover:text-orange-400">
              Conhecimento
            </button>
            <button onClick={() => scrollTo('glossario')} className="transition-colors hover:text-orange-400">
              Glossário
            </button>
            <a
              href={WHATSAPP.link()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-orange-400"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
            <button
              onClick={() => {
                setAuthMode('login')
                setView('auth')
              }}
              className="transition-colors hover:text-orange-400"
            >
              Entrar
            </button>
          </nav>
          <div className="text-xs text-zinc-600 md:text-right">
            <p>© {new Date().getFullYear()} Click &amp; Gruda · Feito para sublimadores</p>
            <p className="mt-1">
              Suporte e comprovante de PIX:{' '}
              <a
                href={WHATSAPP.link()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-orange-400 transition-colors hover:text-orange-300"
              >
                {WHATSAPP.display}
              </a>
            </p>
            <p className="mt-1">
              Conteúdo revisado em <time dateTime={todayISO()}>{todayBR()}</time> · Equipe Editorial Click &amp;
              Gruda
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
