'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Gift,
  Heart,
  ImagePlus,
  Layers3,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SALES } from '@/components/landing/sales-content'
import { Logo } from '@/components/shared/Logo'
import { FAQ_ITEMS } from '@/lib/knowledge'
import { track } from '@/lib/analytics'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { useStore } from '@/lib/store'
import { formatBRL, type CatalogData } from '@/lib/types'

const highlights = [
  'Biblioteca organizada por categorias',
  'Mockups 3D para apresentar melhor',
  'Loja online com apoio para vender no WhatsApp',
  'Coleções sazonais para aproveitar o calendário',
]

const showcaseSections = [
  {
    id: 'biblioteca',
    kicker: 'Biblioteca organizada',
    title: 'Encontre a arte certa sem se perder em pastas.',
    description:
      'A landing agora parte da ideia principal da Click&Gruda: não é sobre acumular arquivos, é sobre encontrar o que realmente vende. Busca, organização visual e navegação fazem a plataforma parecer premium e fácil de usar.',
    image: '/uploads/rebrand/busca-acervo.png',
    bullets: ['Busca visual mais intuitiva', 'Percepção de acervo premium', 'Clareza de uso logo no primeiro contato'],
  },
  {
    id: 'mockups',
    kicker: 'Mockups 3D',
    title: 'Mostre antes de produzir e valorize cada arte.',
    description:
      'Ao invés de parecer só um acervo, a nova landing comunica que a plataforma também ajuda a vender. O gerador de mockups entra como recurso de apresentação e diferenciação.',
    image: '/uploads/rebrand/mockup-studio.png',
    bullets: ['Visual de produto mais profissional', 'Ajuda na decisão do cliente', 'Reforça valor percebido'],
  },
  {
    id: 'loja',
    kicker: 'Loja online + WhatsApp',
    title: 'Transforme arte em vitrine, vitrine em conversa e conversa em venda.',
    description:
      'A seção de vendas deixa claro que a Click&Gruda não entrega só arquivos: entrega um ecossistema para divulgar, receber pedidos e acelerar o fechamento pelo WhatsApp.',
    image: '/uploads/rebrand/loja-whatsapp.png',
    bullets: ['Comunicação mais comercial', 'Jornada visual de venda', 'Mais clareza sobre os bônus inclusos'],
  },
  {
    id: 'sazonais',
    kicker: 'Datas que vendem',
    title: 'Antecipe campanhas sazonais e tenha tema para o ano inteiro.',
    description:
      'Natal, Halloween, Dia das Mães, Namorados e muito mais. A repaginação posiciona os sazonais como combustível de faturamento recorrente para quem trabalha com personalizados.',
    image: '/uploads/rebrand/sazonais-calendario.png',
    bullets: ['Calendário criativo o ano todo', 'Mais oportunidades de campanha', 'Gatilho de recorrência e urgência'],
  },
] as const

const valueCards = [
  {
    title: 'Acervo curado',
    text: 'Nada de pack genérico que só faz volume. A proposta da nova landing é vender curadoria, organização e utilidade real.',
    icon: Layers3,
  },
  {
    title: 'Visual premium',
    text: 'As ilustrações da caneca entram como identidade central para deixar a página marcante, temática e memorável.',
    icon: Sparkles,
  },
  {
    title: 'Ferramentas que ajudam a vender',
    text: 'Mockups 3D, loja online e recursos extras reforçam que o assinante entra em uma plataforma, não compra um arquivo solto.',
    icon: WandSparkles,
  },
  {
    title: 'Fluxo mais prático',
    text: 'Menos tempo procurando arte e mais tempo criando, divulgando e vendendo. Essa é a promessa que a landing precisa passar.',
    icon: Zap,
  },
] as const

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function SectionImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,143,32,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,143,32,0.14),transparent_28%)]" />
      <Image src={src} alt={alt} width={1672} height={941} priority={priority} className="relative z-10 h-auto w-full object-cover" />
    </div>
  )
}

export function LandingView() {
  const user = useStore((s) => s.user)
  const setView = useStore((s) => s.setView)
  const setAuthMode = useStore((s) => s.setAuthMode)
  const setPendingIntent = useStore((s) => s.setPendingIntent)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showMobileCta, setShowMobileCta] = useState(false)
  const reduced = useReducedMotion()

  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => {
      const r = await fetch('/api/catalog')
      if (!r.ok) throw Error('Catálogo indisponível')
      return r.json()
    },
    staleTime: 60_000,
  })

  const isEstimated = !catalog || catalog.counts.arts <= 0
  const count = isEstimated ? SALES.estimatedArtCount : catalog.counts.arts
  const priceCents = catalog?.priceCents ?? SALES.defaultPriceCents
  const price = formatBRL(priceCents)
  const campaignActive = priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()

  const heroStats = useMemo(
    () => [
      { label: 'artes no acervo', value: isEstimated ? `+${count.toLocaleString('pt-BR')}` : count.toLocaleString('pt-BR') },
      { label: 'bônus inclusos', value: '2' },
      { label: 'pagamento', value: 'único' },
    ],
    [count, isEstimated]
  )

  const navigateSignup = (source: string) => {
    track('cta_click', { location: source, intent: 'signup', price_cents: priceCents })
    if (user?.hasAccess) {
      setView('portal')
      return
    }
    if (SALES.CHECKOUT_URL) {
      window.location.assign(SALES.CHECKOUT_URL)
      return
    }
    if (user) {
      setView('checkout')
      return
    }
    setAuthMode('register')
    setPendingIntent('checkout')
    setView('auth')
  }

  const goLogin = () => {
    setAuthMode('login')
    setView('auth')
  }

  const goSection = (id: string) => {
    setMenuOpen(false)
    track('cta_click', { location: 'navigation', intent: id })
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      setScrolled(y > 12)
      setShowMobileCta(y > 680)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="min-h-screen overflow-x-clip bg-[#09090c] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,130,24,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,130,24,0.12),transparent_22%),linear-gradient(180deg,#09090c_0%,#111114_45%,#0a0a0d_100%)]" />

      <header className={`sticky top-0 z-50 border-b transition-all ${scrolled ? 'border-white/10 bg-[#09090c]/84 backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            className="flex items-center"
            aria-label="Click&Gruda, voltar ao início"
            onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
          >
            <Logo dark />
          </button>

          <nav className="hidden items-center gap-8 text-sm text-white/78 lg:flex">
            <button onClick={() => goSection('experiencia')} className="transition hover:text-white">Experiência</button>
            <button onClick={() => goSection('recursos')} className="transition hover:text-white">Recursos</button>
            <button onClick={() => goSection('preco')} className="transition hover:text-white">Investimento</button>
            <button onClick={() => goSection('faq')} className="transition hover:text-white">FAQ</button>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button onClick={goLogin} className="rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/84 transition hover:border-white/25 hover:text-white">
              Entrar
            </button>
            <button
              onClick={() => navigateSignup('header')}
              className="inline-flex items-center gap-2 rounded-full bg-[#ff7b22] px-5 py-2.5 text-sm font-black text-white shadow-[0_16px_40px_rgba(255,123,34,0.32)] transition hover:translate-y-[-1px]"
            >
              {user?.hasAccess ? 'Abrir portal' : 'Quero meu acesso'} <ArrowUpRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0d0d11] px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              <button onClick={() => goSection('experiencia')} className="rounded-2xl border border-white/10 px-4 py-3 text-left">Experiência</button>
              <button onClick={() => goSection('recursos')} className="rounded-2xl border border-white/10 px-4 py-3 text-left">Recursos</button>
              <button onClick={() => goSection('preco')} className="rounded-2xl border border-white/10 px-4 py-3 text-left">Investimento</button>
              <button onClick={() => goSection('faq')} className="rounded-2xl border border-white/10 px-4 py-3 text-left">FAQ</button>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={goLogin} className="rounded-2xl border border-white/10 px-4 py-3 font-semibold text-white/85">Entrar</button>
                <button onClick={() => navigateSignup('mobile_menu')} className="rounded-2xl bg-[#ff7b22] px-4 py-3 font-black text-white">Acessar</button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-16">
            <FadeIn>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7b22]/30 bg-[#ff7b22]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#ffb171]">
                <Sparkles size={14} /> repaginação total da experiência click&gruda
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] text-white sm:text-5xl lg:text-[4.35rem]">
                Sua landing precisa vender a <span className="text-[#ff8f3c]">plataforma inteira</span>, não só mostrar um catálogo.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                Biblioteca organizada, mockups 3D, loja online, WhatsApp, sazonais e um universo visual que faz a Click&Gruda parecer muito mais premium. É isso que essa nova home comunica.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/80">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigateSignup('hero_primary')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7b22] px-7 py-4 text-base font-black text-white shadow-[0_20px_55px_rgba(255,123,34,0.34)] transition hover:translate-y-[-2px]"
                >
                  {user?.hasAccess ? 'Abrir minha biblioteca' : 'Quero garantir meu acesso'} <ArrowUpRight size={19} />
                </button>
                <button
                  onClick={() => goSection('video')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/6 px-7 py-4 text-base font-semibold text-white/88 transition hover:border-white/24 hover:bg-white/8"
                >
                  Ver apresentação <ArrowDownRight size={18} />
                </button>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                    <div className="text-2xl font-black text-white sm:text-3xl">{stat.value}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/48">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.08} className="relative">
              <div className="relative mx-auto max-w-[640px]">
                <div className="absolute inset-x-[10%] top-[7%] h-[72%] rounded-full bg-[#ff7b22]/25 blur-3xl" aria-hidden />
                <div className="absolute inset-0 rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] shadow-[0_30px_100px_rgba(0,0,0,0.55)]" aria-hidden />
                <div className="relative rounded-[38px] p-5 sm:p-8">
                  <div className="absolute left-4 top-4 rounded-full border border-[#ff7b22]/30 bg-[#ff7b22]/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb171]">
                    identidade visual principal
                  </div>
                  <Image
                    src="/uploads/rebrand/mascote-principal.png"
                    alt="Mascote caneca da Click&Gruda em versão 3D premium"
                    width={1122}
                    height={1402}
                    priority
                    className="relative z-10 mx-auto h-auto max-h-[760px] w-full object-contain"
                  />
                </div>
                <div className="absolute -left-3 bottom-10 rounded-[24px] border border-white/10 bg-[#131318]/90 p-4 shadow-2xl backdrop-blur sm:-left-8">
                  <div className="flex items-center gap-2 text-sm font-black text-white"><BadgeCheck size={16} className="text-[#ff8f3c]" /> Visual memorável</div>
                  <p className="mt-1 max-w-[180px] text-xs leading-5 text-white/58">A caneca vira o símbolo da plataforma e costura toda a narrativa da página.</p>
                </div>
                <div className="absolute -right-2 top-24 rounded-[24px] border border-white/10 bg-[#131318]/90 p-4 shadow-2xl backdrop-blur sm:-right-8">
                  <div className="flex items-center gap-2 text-sm font-black text-white"><Sparkles size={16} className="text-[#ff8f3c]" /> Cara de produto premium</div>
                  <p className="mt-1 max-w-[180px] text-xs leading-5 text-white/58">Nada de landing genérica. A identidade agora conversa direto com o universo criativo da marca.</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="video" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] sm:p-7 lg:p-9">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/65">
                    <BadgeCheck size={14} className="text-[#ff8f3c]" /> apresentação da plataforma
                  </span>
                  <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">O vídeo continua como prova visual da proposta.</h2>
                </div>
                <div className="max-w-md text-sm leading-7 text-white/62">
                  A nova landing não joga fora o vídeo. Ela usa o vídeo como reforço de autoridade, mas agora dentro de uma experiência visual muito mais impactante.
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/50 pt-[56.25%]">
                <iframe
                  src="https://player.vimeo.com/video/1238613293?title=0&byline=0&portrait=0&dnt=1"
                  title="Apresentação da plataforma Click&Gruda"
                  loading="eager"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>

              <div className="mt-5 grid gap-3 text-sm text-white/74 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Check size={16} className="mb-2 text-[#ff8f3c]" /> Produto explicado com clareza</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Check size={16} className="mb-2 text-[#ff8f3c]" /> Apoio para conversão do tráfego frio</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Check size={16} className="mb-2 text-[#ff8f3c]" /> Reforço de confiança e percepção</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Check size={16} className="mb-2 text-[#ff8f3c]" /> Complementa as ilustrações premium</div>
              </div>
            </div>
          </FadeIn>
        </section>

        <section id="experiencia" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ff7b22]/25 bg-[#ff7b22]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb171]">
                  <Sparkles size={13} /> outra percepção de valor
                </span>
                <h2 className="mt-4 max-w-3xl text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                  Agora a landing vende um <span className="text-[#ff8f3c]">ecossistema criativo</span>.
                </h2>
              </div>
            </FadeIn>
            <FadeIn delay={0.08}>
              <p className="max-w-2xl text-base leading-8 text-white/64 sm:text-lg">
                Em vez de parecer uma página comum de assinatura, a nova estrutura posiciona a Click&Gruda como plataforma completa para quem trabalha com personalizados e precisa criar, apresentar e vender melhor.
              </p>
            </FadeIn>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {valueCards.map((card, index) => {
              const Icon = card.icon
              return (
                <FadeIn key={card.title} delay={index * 0.05}>
                  <div className="h-full rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff7b22]/14 text-[#ff8f3c]">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-5 text-xl font-black text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/62">{card.text}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid gap-8 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/62">
                  <Store size={13} className="text-[#ff8f3c]" /> vitrine principal da plataforma
                </span>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Biblioteca, produtos e branding aparecem juntos na primeira impressão certa.</h2>
                <p className="mt-4 text-base leading-8 text-white/62 sm:text-lg">
                  Essa imagem funciona como vitrine visual do universo Click&Gruda. Ela ajuda a mostrar que a plataforma serve para canecas, camisetas, capinhas, moletons e outros personalizados — reforçando amplitude sem perder a identidade.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><ShoppingBag size={16} className="mb-2 text-[#ff8f3c]" /> Mais percepção de versatilidade</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><ImagePlus size={16} className="mb-2 text-[#ff8f3c]" /> Melhor aproveitamento das ilustrações geradas</div>
                </div>
              </div>
              <SectionImage src="/uploads/rebrand/biblioteca-vitrine.png" alt="Mascote da Click&Gruda apresentando vitrine da biblioteca" priority />
            </div>
          </FadeIn>
        </section>

        <section id="recursos" className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8 lg:space-y-10 lg:py-20">
          {showcaseSections.map((item, index) => (
            <FadeIn key={item.id} delay={index * 0.04}>
              <div className={`grid gap-8 rounded-[34px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] lg:grid-cols-2 lg:items-center lg:p-8 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''}`}>
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#ff7b22]/25 bg-[#ff7b22]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb171]">
                    {item.kicker}
                  </span>
                  <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">{item.title}</h3>
                  <p className="mt-4 text-base leading-8 text-white/62 sm:text-lg">{item.description}</p>
                  <div className="mt-6 space-y-3">
                    {item.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/18 px-4 py-3 text-sm text-white/74">
                        <Check size={16} className="mt-0.5 shrink-0 text-[#ff8f3c]" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <SectionImage src={item.image} alt={item.title} />
              </div>
            </FadeIn>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="grid gap-8 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[0.84fr_1.16fr] lg:items-center lg:p-8">
              <SectionImage src="/uploads/rebrand/studio-escritorio.png" alt="Mascote Click&Gruda em ambiente de trabalho criativo" />
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/62">
                  <Heart size={13} className="text-[#ff8f3c]" /> rotina mais prática para quem vive de personalizados
                </span>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">A marca parece mais viva, mais amigável e muito mais lembrável.</h2>
                <p className="mt-4 text-base leading-8 text-white/62 sm:text-lg">
                  Essa cena do estúdio reforça proximidade e mostra a Click&Gruda como companheira do dia a dia de produção. É o tipo de detalhe que humaniza a experiência e ajuda a fixar a marca na cabeça do visitante.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><BadgeCheck size={16} className="mb-2 text-[#ff8f3c]" /> Marca mais carismática</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><MessageCircle size={16} className="mb-2 text-[#ff8f3c]" /> Comunicação mais próxima</div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <FadeIn>
            <div className="overflow-hidden rounded-[38px] border border-white/10 bg-[#0f0f13] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-7 lg:p-9">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#ff7b22]/25 bg-[#ff7b22]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb171]">
                    <Layers3 size={13} /> ecossistema completo
                  </span>
                  <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">A página passa a sensação de plataforma robusta do começo ao fim.</h2>
                </div>
                <p className="max-w-2xl text-base leading-8 text-white/62">
                  Busca, categorias, mockups, loja, WhatsApp, calendário, automação visual e bônus. Essa composição ajuda a amarrar tudo em uma única percepção: valor muito acima do preço de entrada.
                </p>
              </div>
              <SectionImage src="/uploads/rebrand/ecossistema-completo.png" alt="Ecossistema completo da Click&Gruda com vários painéis e recursos" />
            </div>
          </FadeIn>
        </section>

        <section id="preco" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/62">
                  <CreditCard size={13} className="text-[#ff8f3c]" /> oferta e percepção de valor
                </span>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                  Um produto com cara de premium, por um valor que parece <span className="text-[#ff8f3c]">irrecusável</span>.
                </h2>
                <p className="mt-5 text-base leading-8 text-white/62 sm:text-lg">
                  A repaginação deixa muito mais fácil justificar o investimento: biblioteca organizada, novas artes toda semana e dois bônus práticos que ajudam na apresentação e nas vendas.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><Gift size={16} className="mb-2 text-[#ff8f3c]" /> Gerador de mockups 3D incluso</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><Store size={16} className="mb-2 text-[#ff8f3c]" /> Loja online inclusa</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><CalendarDays size={16} className="mb-2 text-[#ff8f3c]" /> Novas artes semanalmente</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72"><Search size={16} className="mb-2 text-[#ff8f3c]" /> Busca e organização visual</div>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <div className="relative overflow-hidden rounded-[36px] border border-[#ff7b22]/20 bg-[linear-gradient(180deg,rgba(255,123,34,0.18),rgba(255,123,34,0.05)),linear-gradient(180deg,#121217_0%,#0e0e12_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8">
                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#ff7b22]/18 blur-3xl" aria-hidden />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/72">
                      <Sparkles size={13} className="text-[#ff8f3c]" /> acesso click&gruda
                    </span>
                    {campaignActive && <span className="rounded-full bg-[#ff7b22] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">condição promocional</span>}
                  </div>
                  <h3 className="mt-5 text-3xl font-black text-white sm:text-4xl">{price}</h3>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/48">
                    {campaignActive ? 'pagamento único · acesso vitalício promocional' : 'consulte as condições no checkout'}
                  </p>
                  <p className="mt-5 text-base leading-8 text-white/72">
                    Tudo isso com uma apresentação muito mais forte, coerente e persuasiva — exatamente o tipo de repaginação que faz o visitante sentir que está entrando em algo grande.
                  </p>

                  <div className="mt-6 space-y-3">
                    {[
                      'Biblioteca organizada para facilitar seu fluxo',
                      'Mockups 3D para mostrar melhor seus personalizados',
                      'Loja online para divulgar produtos e receber pedidos',
                      'Coleções sazonais para vender o ano inteiro',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/16 px-4 py-3 text-sm text-white/80">
                        <Check size={16} className="mt-0.5 shrink-0 text-[#ff8f3c]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigateSignup('pricing')}
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7b22] px-6 py-4 text-base font-black text-white shadow-[0_18px_50px_rgba(255,123,34,0.33)] transition hover:translate-y-[-2px]"
                  >
                    {user?.hasAccess ? 'Acessar meu portal' : 'Quero liberar meu acesso'} <ArrowUpRight size={19} />
                  </button>

                  <div className="mt-5 space-y-3 text-sm text-white/64">
                    <div className="flex items-start gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#ff8f3c]" /><span>{campaignActive ? `Oferta promocional com pagamento único até ${SALES.promoEndsLabel}.` : 'As condições finais aparecem no checkout.'}</span></div>
                    <div className="flex items-start gap-3"><Clock3 size={17} className="mt-0.5 shrink-0 text-[#ff8f3c]" /><span>Menos tempo procurando arte. Mais tempo criando, divulgando e vendendo.</span></div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <FadeIn>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/62">
                  <MessageCircle size={13} className="text-[#ff8f3c]" /> direto ao ponto
                </span>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Perguntas que ajudam a converter com menos atrito.</h2>
                <p className="mt-4 text-base leading-8 text-white/62 sm:text-lg">
                  O FAQ permanece importante para quebrar objeções, reforçar confiança e complementar a copy de vendas sem pesar a página.
                </p>
                <a
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-bold text-white/84 transition hover:border-white/24 hover:text-white"
                  href={WHATSAPP.link(WHATSAPP_MESSAGES.support)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track('cta_click', { location: 'faq_support' })}
                >
                  Falar pelo WhatsApp <ArrowUpRight size={16} />
                </a>
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 sm:p-6">
                <Accordion type="single" collapsible>
                  {SALES.faqIndices.map((idx) => {
                    const f = FAQ_ITEMS[idx]
                    return (
                      <AccordionItem value={`faq-${idx}`} key={f.q}>
                        <AccordionTrigger onClick={() => track('faq_open', { question: f.q })}>{f.q}</AccordionTrigger>
                        <AccordionContent>{f.a}</AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
                <p className="mt-6 text-sm text-white/56">
                  Quer mais detalhes? <Link href="/guia" className="font-bold text-[#ffb171] hover:text-white">Veja o guia completo da plataforma.</Link>
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-[40px] border border-[#ff7b22]/22 bg-[linear-gradient(180deg,rgba(255,123,34,0.18),rgba(255,123,34,0.05)),linear-gradient(180deg,#111116_0%,#0d0d10_100%)] px-6 py-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.48)] sm:px-8 sm:py-12 lg:px-16 lg:py-16">
              <div className="absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-[#ff7b22]/20 blur-3xl" aria-hidden />
              <div className="relative z-10 mx-auto max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/72">
                  <BadgeCheck size={13} className="text-[#ff8f3c]" /> conclusão da nova direção visual
                </span>
                <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl lg:text-5xl">A Click&Gruda merece uma landing que pareça tão forte quanto a proposta dela.</h2>
                <p className="mt-5 text-base leading-8 text-white/70 sm:text-lg">
                  Agora a marca comunica valor, organização, criatividade e venda de um jeito muito mais premium. É essa a base da nova experiência: uma página feita para impressionar, explicar e converter.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    onClick={() => navigateSignup('final_cta')}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7b22] px-7 py-4 text-base font-black text-white shadow-[0_18px_50px_rgba(255,123,34,0.33)] transition hover:translate-y-[-2px]"
                  >
                    {user?.hasAccess ? 'Abrir meu portal' : 'Quero entrar para a Click&Gruda'} <ArrowUpRight size={19} />
                  </button>
                  <a
                    href={WHATSAPP.link(WHATSAPP_MESSAGES.support)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/6 px-7 py-4 text-base font-semibold text-white/86 transition hover:border-white/24"
                  >
                    Tirar dúvida no WhatsApp <MessageCircle size={18} />
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/18">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-md text-sm leading-7 text-white/56">
              Artes digitais para sublimação, mockups 3D, loja online e uma biblioteca pensada para quem quer trabalhar com mais organização e mais impacto visual.
            </p>
            <small className="mt-4 block text-xs uppercase tracking-[0.18em] text-white/32">© {new Date().getFullYear()} Click&Gruda. Todos os direitos reservados.</small>
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-[0.22em] text-white/36">Explore</span>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
              <button className="text-left transition hover:text-white" onClick={() => goSection('experiencia')}>Experiência</button>
              <button className="text-left transition hover:text-white" onClick={() => goSection('recursos')}>Recursos</button>
              <button className="text-left transition hover:text-white" onClick={() => goSection('preco')}>Investimento</button>
              <button className="text-left transition hover:text-white" onClick={goLogin}>Entrar</button>
            </div>
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-[0.22em] text-white/36">Saiba mais</span>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
              <Link href="/sobre" className="transition hover:text-white">Sobre nós</Link>
              <Link href="/blog" className="transition hover:text-white">Blog</Link>
              <Link href="/guia" className="transition hover:text-white">Guia técnico</Link>
              <a href={WHATSAPP.link()} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>

      <a
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_18px_40px_rgba(37,211,102,0.35)] transition hover:scale-105"
        href={WHATSAPP.link(WHATSAPP_MESSAGES.support)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar com suporte pelo WhatsApp"
      >
        <MessageCircle size={24} />
      </a>

      <div className={`fixed inset-x-4 bottom-4 z-40 transition ${showMobileCta ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-10 opacity-0'} lg:hidden`}>
        <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/12 bg-[#0f0f13]/92 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div>
            <b className="block text-sm text-white">{campaignActive ? `${price} · pagamento único` : `Acesso por ${price}`}</b>
            <span className="text-xs text-white/54">{campaignActive ? 'Oferta vitalícia promocional' : 'Consulte as condições'}</span>
          </div>
          <button onClick={() => navigateSignup('mobile_sticky')} className="shrink-0 rounded-full bg-[#ff7b22] px-4 py-3 text-sm font-black text-white">
            {user?.hasAccess ? 'Portal' : 'Acessar'}
          </button>
        </div>
      </div>
    </div>
  )
}
