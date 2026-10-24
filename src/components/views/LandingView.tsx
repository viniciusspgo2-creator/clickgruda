'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, Clock3,
  Download, Layers3, Menu, MessageCircle, MousePointerClick, Play, Search,
  ShieldCheck, ShoppingBag, Star, Store, WandSparkles, X, Zap,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ShowcaseCarousel } from '@/components/landing/ShowcaseCarousel'
import { SALES } from '@/components/landing/sales-content'
import { Logo } from '@/components/shared/Logo'
import { FAQ_ITEMS } from '@/lib/knowledge'
import { track } from '@/lib/analytics'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { useStore } from '@/lib/store'
import { formatBRL, type CatalogData } from '@/lib/types'

const ORANGE = 'text-[#ff913f]'
const features = [
  {
    id: 'biblioteca',
    category: '01 · Biblioteca de artes',
    title: <>A arte que seu cliente procura, <em className="not-italic text-[#ff913f]">sem caça ao tesouro.</em></>,
    text: 'Explore uma biblioteca de artes para canecas com temas organizados, busca, filtros e favoritos. Encontre o que combina com cada pedido sem perder tempo navegando por pastas intermináveis.',
    image: '/uploads/rebrand/busca-acervo.webp',
    alt: 'Caneca mascote apresentando busca, categorias e coleção de artes na plataforma',
    points: ['Mais de 8 mil artes selecionadas', 'Categorias, busca e favoritos', 'Arquivos preparados para sublimação'],
  },
  {
    id: 'mockups',
    category: '02 · Gerador de mockups 3D',
    title: <>Seu cliente precisa <em className="not-italic text-[#ff913f]">enxergar o resultado.</em></>,
    text: 'Apresente a estampa aplicada em uma caneca antes da produção. Com mockups 3D, você valoriza a apresentação do seu trabalho e facilita a escolha do cliente.',
    image: '/uploads/rebrand/mockup-studio.webp',
    alt: 'Mascote da Click&Gruda ao lado de uma prévia 3D de caneca personalizada',
    points: ['Apresentação visual mais profissional', 'Prévia para divulgar e enviar ao cliente', 'Recurso incluído no acesso'],
  },
  {
    id: 'loja',
    category: '03 · Loja online + WhatsApp',
    title: <>Sua vitrine aberta. <em className="not-italic text-[#ff913f]">Seus pedidos mais organizados.</em></>,
    text: 'Monte sua loja online, compartilhe seus produtos por link e receba o interesse dos clientes pelo WhatsApp. Uma forma mais prática de mostrar o que você produz sem depender apenas de fotos soltas.',
    image: '/uploads/rebrand/loja-whatsapp.webp',
    alt: 'Mascote ao lado de vitrine digital de produtos e atendimento por WhatsApp',
    points: ['Vitrine de produtos para compartilhar', 'Pedidos direcionados ao WhatsApp', 'Sua marca apresentada com mais profissionalismo'],
  },
  {
    id: 'sazonais',
    category: '04 · Artes para datas sazonais',
    title: <>A próxima data especial pode ser <em className="not-italic text-[#ff913f]">sua próxima oportunidade.</em></>,
    text: 'Natal, Halloween, Dia das Mães, Dia dos Namorados e outras ocasiões importantes. Encontre coleções temáticas e prepare suas campanhas com antecedência.',
    image: '/uploads/rebrand/sazonais-calendario.webp',
    alt: 'Mascote Click&Gruda com calendário e ilustrações de datas comemorativas',
    points: ['Coleções por data comemorativa', 'Novos temas adicionados regularmente', 'Mais agilidade no planejamento de encomendas'],
  },
] as const

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduce ? 0 : 0.65, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}

function Picture({ src, alt, priority = false, className = '' }: { src: string; alt: string; priority?: boolean; className?: string }) {
  return <div className={`relative isolate overflow-hidden rounded-[26px] border border-[#ff913f]/15 bg-[#140e0c] shadow-[0_28px_65px_rgba(0,0,0,.35)] ${className}`}>
    <Image src={src} alt={alt} width={1672} height={941} priority={priority} sizes="(max-width: 768px) 100vw, 50vw" className="block h-auto w-full object-cover" />
  </div>
}

export function LandingView() {
  const user = useStore(s => s.user)
  const setView = useStore(s => s.setView)
  const setAuthMode = useStore(s => s.setAuthMode)
  const setPendingIntent = useStore(s => s.setPendingIntent)
  useEffect(() => { track('landing_view', { location: 'home' }) }, [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const reduced = useReducedMotion()

  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => { const r = await fetch('/api/catalog'); if (!r.ok) throw Error('Catálogo indisponível'); return r.json() },
    staleTime: 60_000,
  })
  const priceCents = catalog?.priceCents ?? SALES.defaultPriceCents
  const price = formatBRL(priceCents)
  const campaignActive = priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const hasAccess = Boolean(user?.hasAccess)
  const buyLabel = hasAccess ? 'Acessar minha plataforma' : campaignActive ? 'Comprar acesso vitalício' : 'Ver condições de acesso'

  const goPurchase = (location: string) => {
    track('cta_click', { location, intent: 'checkout', price_cents: priceCents })
    if (hasAccess) { setView('portal'); return }
    if (SALES.CHECKOUT_URL) { window.location.assign(SALES.CHECKOUT_URL); return }
    if (user) { setView('checkout'); return }
    setAuthMode('register')
    setPendingIntent('checkout')
    setView('auth')
  }
  const goLogin = () => { track('cta_click', { location: 'login', intent: 'auth' }); setMenuOpen(false); setAuthMode('login'); setView('auth') }
  const scrollTo = (id: string) => {
    setMenuOpen(false)
    track('cta_click', { location: 'navigation', intent: id })
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return <div className="relative min-h-screen overflow-x-clip pb-20 bg-[#0b0a0d] text-white antialiased [font-family:var(--font-geist-sans),sans-serif]">
    <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled ? 'border-white/10 bg-[#0b0a0d]/95 shadow-xl backdrop-blur-xl' : 'border-white/5 bg-[#0b0a0d]/88 backdrop-blur-md'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button type="button" aria-label="Voltar ao começo" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}><Logo dark /></button>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/75 lg:flex" aria-label="Navegação principal">
          <button onClick={() => scrollTo('biblioteca')} className="hover:text-[#ff913f]">Biblioteca</button>
          <button onClick={() => scrollTo('recursos')} className="hover:text-[#ff913f]">Recursos</button>
          <button onClick={() => scrollTo('como-funciona')} className="hover:text-[#ff913f]">Como funciona</button>
          <button onClick={() => scrollTo('investimento')} className="hover:text-[#ff913f]">Investimento</button>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <button onClick={goLogin} className="rounded-full px-4 py-3 text-sm font-bold text-white/80 hover:text-white">Entrar</button>
          <button onClick={() => goPurchase('header')} className="inline-flex items-center gap-2 rounded-full bg-[#ff7b22] px-5 py-3 text-sm font-black text-white shadow-[0_12px_35px_rgba(255,123,34,.25)] transition hover:bg-[#ff9445]">{hasAccess ? 'Meu portal' : 'Adquirir acesso'} <ArrowUpRight size={17}/></button>
        </div>
        <button onClick={() => setMenuOpen(v => !v)} type="button" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 lg:hidden" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      </div>
      {menuOpen && <nav className="flex flex-col gap-2 border-t border-white/10 bg-[#100e12] px-4 py-4 lg:hidden" aria-label="Menu mobile">
        {[['biblioteca','Biblioteca de artes'],['recursos','Recursos inclusos'],['como-funciona','Como funciona'],['investimento','Investimento'],['faq','Dúvidas frequentes']].map(([id, label]) => <button key={id} onClick={() => scrollTo(id)} className="rounded-xl px-4 py-3 text-left font-semibold text-white/85 hover:bg-white/5">{label}</button>)}
        <div className="flex gap-2 pt-2"><button onClick={goLogin} className="flex-1 rounded-xl border border-white/15 px-3 py-3 text-sm font-bold">Entrar</button><button onClick={() => goPurchase('mobile_menu')} className="flex-1 rounded-xl bg-[#ff7b22] px-3 py-3 text-sm font-black">{hasAccess ? 'Meu portal' : 'Comprar agora'}</button></div>
      </nav>}
    </header>

    <main>
      <section className="relative isolate overflow-hidden border-b border-white/5 bg-[radial-gradient(ellipse_at_82%_35%,rgba(255,115,15,.19),transparent_49%),linear-gradient(180deg,#100d0d_0%,#0b0a0d_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-7 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.08fr_.92fr] lg:gap-10 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="relative z-10">
            <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-[#ff913f]/35 bg-[#ff913f]/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.17em] text-[#ffb170]"><Star size={14}/> Sua referência em artes para canecas</span></Reveal>
            <Reveal delay={.05}><h1 className="mt-6 max-w-[720px] text-[clamp(2.6rem,5vw,4.75rem)] font-black leading-[1.07] tracking-[-.045em]">Pare de procurar artes.<span className="block text-[#ff913f]">Comece a criar mais.</span></h1></Reveal>
            <Reveal delay={.08}><p className="mt-6 max-w-[610px] text-base leading-[1.8] text-white/76 sm:text-lg">Tenha acesso a <strong className="text-white">mais de 8.000 artes cuidadosamente selecionadas</strong> para sublimação, organizadas por temas e categorias. Encontre a estampa certa, agilize seus pedidos e conte com ferramentas para apresentar e vender seus personalizados.</p></Reveal>
            <Reveal delay={.12}><div className="mt-7 flex flex-wrap gap-2.5">
              {['Novas artes toda semana','Mockups 3D inclusos','Loja online inclusa'].map(item => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/83"><Check size={13} className="text-[#ff913f]"/>{item}</span>)}
            </div></Reveal>
            <Reveal delay={.15}><div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={() => goPurchase('hero')} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#ff7b22] px-7 py-4 text-base font-black shadow-[0_15px_45px_rgba(255,123,34,.27)] transition hover:-translate-y-1 hover:bg-[#ff9445]">{buyLabel} <ArrowUpRight size={19}/></button>
              <button onClick={() => scrollTo('video')} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-4 font-bold text-white/90 transition hover:bg-white/10"><Play size={17}/> Conhecer a plataforma</button>
            </div></Reveal>
            <Reveal delay={.2}><p className="mt-4 flex items-center gap-2 text-sm text-white/54"><ShieldCheck size={16} className="text-[#ff913f]"/> {campaignActive ? `Acesso vitalício por ${price}, pagamento único na promoção.` : 'Confira os planos e condições no checkout.'}</p></Reveal>
          </div>
          <Reveal delay={.1} className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="relative isolate overflow-hidden rounded-[34px] border border-[#ff9a45]/20 bg-[radial-gradient(circle_at_50%_40%,#43291d_0%,#181315_52%,#101014_85%)] px-6 pb-2 pt-10 shadow-[0_28px_80px_rgba(0,0,0,.42)] sm:px-10 sm:pt-11">
              <span className="absolute left-5 top-5 z-10 rounded-full border border-[#ff9a45]/25 bg-[#ff8a30]/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#ffc18a]">Seu parceiro criativo</span>
              <Image src="/uploads/rebrand/mascote-principal.webp" alt="Caneca mascote da Click&Gruda sorrindo e apresentando a plataforma" width={1122} height={1402} sizes="(max-width: 1024px) 90vw, 44vw" className="relative z-[1] mx-auto block h-auto max-h-[510px] w-full object-contain" priority />
            </div>
            {/* Os diferenciais ficam ABAIXO da imagem; não há balões sobre o mascote ou textos encobertos. */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4"><b className="block text-xl font-black text-[#ff913f]">8.000+</b><span className="text-xs text-white/68">artes com curadoria</span></div>
              <div className="rounded-2xl border border-white/10 bg-white/[.055] p-4"><b className="block text-xl font-black text-[#ff913f]">45+</b><span className="text-xs text-white/68">ferramentas no ecossistema</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#171217] py-5" aria-label="Diferenciais da plataforma"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {[{ icon: Layers3, big: '8 mil+', caption: 'artes selecionadas' },{ icon: CalendarDays, big: 'Toda semana', caption: 'novas artes no acervo' },{ icon: WandSparkles, big: 'Mockups 3D', caption: 'inclusos no plano' },{ icon: Store, big: 'Loja online', caption: 'para divulgar e vender' }].map(x => { const Icon = x.icon; return <div className="flex items-center gap-3 py-2" key={x.big}><Icon className="shrink-0 text-[#ff913f]" size={23}/><div><strong className="block text-sm font-black sm:text-base">{x.big}</strong><span className="text-xs text-white/52">{x.caption}</span></div></div> })}
      </div></section>

      <section id="video" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center"><p className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">VEJA POR DENTRO</p><h2 className="mx-auto mt-4 max-w-[780px] text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Tudo o que você precisa para trabalhar com artes, <span className="text-[#ff913f]">em um só lugar.</span></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/67">Conheça a Click&Gruda em poucos minutos e descubra como a biblioteca e os recursos podem simplificar sua rotina.</p></Reveal>
          <Reveal delay={.08}><div className="mt-9 overflow-hidden rounded-[30px] border border-[#ff913f]/25 bg-[#1c1413] p-2 shadow-[0_28px_90px_rgba(255,108,21,.12)] sm:p-3"><div className="relative aspect-video overflow-hidden rounded-[22px] bg-black"><iframe title="Conheça a Click&Gruda — apresentação em vídeo" src="https://player.vimeo.com/video/1238613293?title=0&byline=0&portrait=0&dnt=1&loop=1&autopause=0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" /></div><div className="flex items-center justify-between gap-3 px-3 py-3 text-xs font-semibold text-white/60 sm:text-sm"><span className="inline-flex items-center gap-2"><Play size={15} className="text-[#ff913f]"/> Assista à demonstração</span><span>Reprodução em loop após o término</span></div></div></Reveal>
          <Reveal><div className="mt-7 text-center"><button onClick={() => goPurchase('after_video')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff7b22] px-7 py-3.5 font-black transition hover:bg-[#ff9445]">{buyLabel} <ArrowRight size={18}/></button></div></Reveal>
        </div>
      </section>

      <section id="artes" className="scroll-mt-24 border-y border-white/10 bg-[#121014] py-20 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-4xl"><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Chega de pagar por volume que você não usa</span><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Packs prometem 200 mil artes. <span className="text-[#ff913f]">E quando nem 5% servem para vender?</span></h2><p className="mt-6 max-w-3xl text-base leading-8 text-white/72 sm:text-lg">Em muitos packs, a quantidade impressiona no anúncio, mas a utilidade decepciona no dia a dia. Arquivos repetidos, desorganização e horas procurando. O que importa é ter boas artes à mão quando seu cliente faz um pedido.</p></Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Reveal><div className="h-full rounded-[28px] border border-white/10 bg-white/[.035] p-7"><span className="inline-block rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white/65">Pacotes genéricos</span><h3 className="mt-5 text-2xl font-black">Quantidade no anúncio. Bagunça na prática.</h3><div className="mt-6 space-y-4 text-sm leading-7 text-white/64">{['Milhares de arquivos em pastas difíceis de navegar', 'Artes repetidas ou que não combinam com o pedido', 'Tempo perdido tentando localizar uma boa opção'].map(t => <div className="flex gap-3" key={t}><X size={18} className="mt-1 shrink-0 text-red-400"/>{t}</div>)}</div></div></Reveal>
          <Reveal delay={.07}><div className="relative h-full overflow-hidden rounded-[28px] border border-[#ff913f]/35 bg-[linear-gradient(145deg,rgba(255,125,33,.16),rgba(255,125,33,.025))] p-7"><span className="inline-block rounded-full bg-[#ff7b22] px-3 py-1.5 text-xs font-black uppercase tracking-widest">Com a Click&Gruda</span><h3 className="mt-5 text-2xl font-black">Curadoria de verdade. Arte certa para trabalhar.</h3><div className="mt-6 space-y-4 text-sm leading-7 text-white/83">{['Mais de 8 mil artes selecionadas com cuidado', 'Busca, categorias, tags e coleções temáticas', 'Novidades toda semana sem precisar comprar outro pack'].map(t => <div className="flex gap-3" key={t}><Check size={18} className="mt-1 shrink-0 text-[#ff913f]"/>{t}</div>)}</div></div></Reveal>
        </div>
      </div></section>

      <section id="biblioteca" className="scroll-mt-24 bg-[#0d0b0e] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 sm:px-6 lg:grid-cols-[.94fr_1.06fr] lg:px-8">
          <Reveal><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Biblioteca de artes</span><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Mais de 8 mil artes. <span className="text-[#ff913f]">Milhares de novas possibilidades.</span></h2><p className="mt-6 text-base leading-8 text-white/70">Flork, frases, amor, profissões, música, geek, futebol, datas comemorativas e muitos outros temas. Um acervo pensado para quem precisa produzir e vender, com artes organizadas para você chegar mais rápido à que procura.</p><div className="mt-7 space-y-3">{['Artes para canecas em alta resolução', 'Arquivos no formato 21 × 9,5 cm', 'Lançamentos e coleções sazonais incluídos'].map(t => <p className="flex items-center gap-3 text-sm text-white/78" key={t}><Check size={18} className="shrink-0 text-[#ff913f]"/>{t}</p>)}</div><button onClick={() => goPurchase('library')} className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#ff913f]/35 bg-[#ff913f]/10 px-6 py-3 font-bold text-[#ffb57b] hover:bg-[#ff913f]/20">Quero acessar o acervo <ArrowUpRight size={18}/></button></Reveal>
          <Reveal delay={.09}><Picture src="/uploads/rebrand/biblioteca-vitrine.webp" alt="Mascote Click&Gruda mostrando biblioteca e produtos personalizados" priority /></Reveal>
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8"><Reveal><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="text-xs font-black uppercase tracking-[.22em] text-[#ff913f]">Um gostinho do que te espera</span><h3 className="mt-2 text-2xl font-black sm:text-3xl">Artes que inspiram seus próximos pedidos.</h3></div><span className="text-sm text-white/50">Prévia ilustrativa com exemplos do acervo</span></div></Reveal></div>
        <ShowcaseCarousel />
      </section>

      <section id="recursos" className="scroll-mt-24 bg-[#121014] px-4 py-20 sm:px-6 lg:py-24"><div className="mx-auto max-w-7xl"><Reveal><div className="mx-auto mb-12 max-w-3xl text-center"><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Muito além das artes</span><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Uma plataforma feita para você <span className="text-[#ff913f]">criar, apresentar e vender.</span></h2><p className="mt-5 text-base leading-8 text-white/68">As artes são só o começo. Veja os recursos que acompanham seu acesso.</p></div></Reveal>
        <div className="space-y-8 sm:space-y-12">{features.map((feature,i) => <Reveal key={feature.id}><article id={`recurso-${feature.id}`} className={`scroll-mt-24 grid items-center gap-8 rounded-[30px] border border-white/10 bg-[#1a1519] p-4 sm:p-6 lg:grid-cols-2 lg:gap-12 lg:p-9`}>
          <div className={i % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}><span className="text-xs font-black uppercase tracking-[.2em] text-[#ff913f]">{feature.category}</span><h3 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{feature.title}</h3><p className="mt-5 text-base leading-8 text-white/69">{feature.text}</p><div className="mt-7 space-y-3">{feature.points.map(t => <div className="flex items-start gap-3 text-sm text-white/78" key={t}><BadgeCheck size={18} className="mt-0.5 shrink-0 text-[#ff913f]"/>{t}</div>)}</div><button onClick={() => goPurchase(`feature_${feature.id}`)} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#ffb57b] underline underline-offset-8 hover:text-white">Garantir acesso a este recurso <ArrowUpRight size={17}/></button></div>
          <Picture src={feature.image} alt={feature.alt} className={i % 2 === 0 ? 'lg:order-2' : 'lg:order-1'} />
        </article></Reveal>)}</div>
      </div></section>

      <section className="px-4 py-20 sm:px-6 lg:py-24"><div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <Reveal><Picture src="/uploads/rebrand/ecossistema-completo.webp" alt="Caneca mascote e o ecossistema de ferramentas da Click&Gruda" /></Reveal>
        <Reveal delay={.06}><div><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Tudo conectado</span><h2 className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl">Sua biblioteca. Suas ferramentas. <span className="text-[#ff913f]">Seu negócio evoluindo.</span></h2><p className="mt-6 text-base leading-8 text-white/70">Além das artes, você encontra um ecossistema com mais de 45 ferramentas para apoiar tarefas de criação e gestão. Tudo pensado para economizar etapas no dia a dia de quem trabalha com personalizados.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{[{icon: Layers3, text:'Biblioteca organizada'},{icon: WandSparkles,text:'Gerador de mockups 3D'},{icon: Store,text:'Loja online'},{icon: Zap,text:'45+ ferramentas extras'}].map(x => {const Icon=x.icon;return <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold" key={x.text}><Icon size={18} className="shrink-0 text-[#ff913f]"/>{x.text}</div>})}</div></div></Reveal>
      </div></section>

      <section id="como-funciona" className="scroll-mt-24 border-y border-white/10 bg-[#161216] px-4 py-20 sm:px-6 lg:py-24"><div className="mx-auto max-w-7xl"><Reveal className="text-center"><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Simples de começar</span><h2 className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl">Da primeira busca ao próximo pedido.</h2></Reveal><div className="mt-10 grid gap-4 md:grid-cols-3">{[
        {num:'01',icon:MousePointerClick,title:'Garanta seu acesso',text:'Faça seu cadastro, escolha a forma de pagamento e entre na plataforma após a confirmação.'},
        {num:'02',icon:Search,title:'Encontre e baixe',text:'Pesquise por tema, explore categorias e escolha as artes que fazem sentido para seu pedido.'},
        {num:'03',icon:ShoppingBag,title:'Apresente e venda',text:'Produza seus personalizados, use mockups para divulgar e compartilhe sua vitrine online.'},
      ].map((item,i) => {const Icon=item.icon;return <Reveal delay={i*.05} key={item.num}><div className="h-full rounded-[26px] border border-white/10 bg-white/5 p-6"><div className="flex items-center justify-between"><Icon className="text-[#ff913f]" size={26}/><span className="text-3xl font-black text-white/15">{item.num}</span></div><h3 className="mt-5 text-xl font-black">{item.title}</h3><p className="mt-3 text-sm leading-7 text-white/67">{item.text}</p></div></Reveal>})}</div><Reveal><div className="mt-8 text-center"><button onClick={() => goPurchase('how_it_works')} className="inline-flex items-center gap-2 rounded-full bg-[#ff7b22] px-7 py-4 font-black hover:bg-[#ff9445]">{buyLabel}<ArrowRight size={18}/></button></div></Reveal></div></section>

      <section className="px-4 py-14 sm:px-6 lg:py-20"><div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[30px] border border-[#ff913f]/20 bg-[linear-gradient(115deg,#221513,#141116)] p-5 sm:p-8 lg:grid-cols-[1fr_1.02fr] lg:p-10"><Reveal><div><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Ideias novas, toda semana</span><h2 className="mt-4 text-3xl font-black sm:text-4xl">Sua criatividade não para. <span className="text-[#ff913f]">Nosso acervo também não.</span></h2><p className="mt-5 max-w-xl text-base leading-8 text-white/70">Entre uma encomenda e outra, descubra novidades, novas categorias e temas para explorar. Seu acesso inclui as atualizações do acervo dentro das regras da plataforma.</p></div></Reveal><Reveal delay={.07}><Picture src="/uploads/rebrand/studio-escritorio.webp" alt="Mascote da Click&Gruda no estúdio de criação e produção" /></Reveal></div></section>

      <section id="investimento" className="scroll-mt-24 border-y border-white/10 bg-[#131015] px-4 py-20 sm:px-6 lg:py-24"><span id="preco" aria-hidden="true" className="relative -top-24"/><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><Reveal><div><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Seu próximo passo</span><h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Tudo isso por menos do que você imagina. <span className="text-[#ff913f]">Sem mensalidade na promoção vitalícia.</span></h2><p className="mt-5 text-base leading-8 text-white/70">Em vez de comprar novos packs toda vez que surgir um tema diferente, tenha uma biblioteca em expansão e recursos para facilitar sua produção e divulgação.</p><div className="mt-8 space-y-4 text-sm text-white/78"><p className="flex items-center gap-3"><Check size={18} className={ORANGE}/>Mais de 8.000 artes selecionadas</p><p className="flex items-center gap-3"><Check size={18} className={ORANGE}/>Novos lançamentos semanalmente</p><p className="flex items-center gap-3"><Check size={18} className={ORANGE}/>Mockups 3D e loja online inclusos</p><p className="flex items-center gap-3"><Check size={18} className={ORANGE}/>Mais de 45 ferramentas no ecossistema</p></div></div></Reveal>
        <Reveal delay={.09}><div className="relative isolate overflow-hidden rounded-[32px] border border-[#ff913f]/40 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,128,31,.26),transparent_60%),linear-gradient(180deg,#2a1a19_0%,#151115_100%)] p-6 shadow-[0_35px_85px_rgba(0,0,0,.4)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-[#ff913f]/25 bg-[#ff913f]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-[#ffb27a]">Acesso Click&Gruda</span>{campaignActive && <span className="rounded-full bg-[#ff7b22] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.09em]">Oferta vitalícia</span>}</div>
          <h3 className="mt-7 text-3xl font-black">Uma biblioteca inteira à sua disposição.</h3><p className="mt-2 text-base leading-7 text-white/66">Artes, novidades e ferramentas para quem trabalha com personalizados.</p>
          <div className="mt-7 border-t border-white/10 pt-7"><div className="flex flex-wrap items-baseline gap-3"><strong className="text-[clamp(3.25rem,7vw,5rem)] font-black tracking-[-.055em] text-white">{price}</strong><span className="text-base font-bold text-[#ffb27a]">{campaignActive ? 'pagamento único' : 'plano vigente'}</span></div>{campaignActive && <p className="mt-1 text-sm text-white/65">Acesso vitalício promocional até {SALES.promoEndsLabel}.</p>}</div>
          <div className="mt-8 space-y-3">{['Biblioteca com mais de 8 mil artes para sublimação','Novidades adicionadas toda semana','Busca, categorias, filtros e datas sazonais','Gerador de mockups 3D incluso','Loja online e ferramentas extras inclusas'].map(t => <div key={t} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-3.5 text-sm text-white/82"><Check size={17} className="mt-0.5 shrink-0 text-[#ff913f]"/>{t}</div>)}</div>
          <button onClick={() => goPurchase('pricing_buy')} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#ff7b22] px-5 py-4 text-base font-black shadow-[0_18px_40px_rgba(255,123,34,.25)] transition hover:bg-[#ff9445]">{buyLabel}<ArrowUpRight size={21}/></button>
          <div className="mt-5 space-y-2 text-xs leading-6 text-white/57"><p className="flex items-start gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-[#ff913f]"/>Pagamento e liberação conforme a opção escolhida no checkout.</p><p className="flex items-start gap-2"><Download size={16} className="mt-1 shrink-0 text-[#ff913f]"/>Pode haver cota diária de downloads de artes diferentes; consulte as regras do portal.</p><p className="flex items-start gap-2"><Clock3 size={16} className="mt-1 shrink-0 text-[#ff913f]"/>Condição vitalícia disponível somente durante o período promocional.</p></div>
        </div></Reveal>
      </div></section>

      <section id="perguntas" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-24"><div id="faq" className="relative -top-24" aria-hidden="true"/><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.85fr_1.15fr] lg:px-8"><Reveal><span className="text-xs font-black uppercase tracking-[.24em] text-[#ff913f]">Sem dúvidas na hora de escolher</span><h2 className="mt-4 text-3xl font-black sm:text-4xl">Perguntas frequentes</h2><p className="mt-5 text-base leading-8 text-white/66">Confira os detalhes sobre pagamento, downloads e utilização das artes. Se precisar, nossa equipe também atende pelo WhatsApp.</p><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', {location:'faq_support'})} className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-bold text-white/85 hover:border-[#ff913f]/40"><MessageCircle size={17} className="text-[#ff913f]"/> Conversar no WhatsApp <ArrowUpRight size={16}/></a></Reveal>
        <Reveal delay={.08}><div className="rounded-[27px] border border-white/10 bg-white/[.045] px-5 sm:px-7"><Accordion type="single" collapsible onValueChange={(value) => { if (value) track('faq_open', { location: value }) }}>{[0,1,2,3,6,8,9,11,14].map(idx => {const f=FAQ_ITEMS[idx];return <AccordionItem key={f.q} value={`faq-${idx}`} className="border-white/10"><AccordionTrigger className="py-5 text-base font-bold leading-6 text-white/90 hover:text-[#ffb27a] hover:no-underline">{f.q}</AccordionTrigger><AccordionContent className="text-sm leading-7 text-white/64">{f.a}</AccordionContent></AccordionItem>})}</Accordion><div className="border-t border-white/10 py-5 text-sm text-white/60">Ainda tem alguma dúvida? <Link className="font-bold text-[#ffb27a] hover:underline" href="/guia">Veja nosso guia completo.</Link></div></div></Reveal>
      </div></section>

      <section className="px-4 pb-20 sm:px-6 lg:pb-24"><div className="mx-auto max-w-7xl"><Reveal><div className="relative isolate overflow-hidden rounded-[32px] border border-[#ff913f]/25 bg-[radial-gradient(ellipse_at_top,rgba(255,128,31,.24),transparent_65%),#191116] px-6 py-12 text-center sm:px-10 sm:py-16"><span className="text-xs font-black uppercase tracking-[.24em] text-[#ffb27a]">Sua próxima criação começa aqui</span><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Você cuida das suas vendas. <span className="text-[#ff913f]">A gente facilita suas artes.</span></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/71">Entre para a Click&Gruda e tenha uma biblioteca organizada, atualizada e pronta para acompanhar os seus próximos projetos.</p><button onClick={() => goPurchase('final_cta')} className="mt-8 inline-flex min-h-14 w-full max-w-[380px] items-center justify-center gap-2 rounded-full bg-[#ff7b22] px-7 py-4 text-base font-black transition hover:bg-[#ff9445]">{buyLabel}<ArrowUpRight size={19}/></button>{campaignActive && <p className="mt-4 text-xs font-medium text-white/56">{price} · pagamento único · oferta promocional até 31/12/2026</p>}</div></Reveal></div></section>
    </main>

    <footer className="border-t border-white/10 bg-[#0b0a0d] px-4 py-10 sm:px-6"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-8"><div><Logo dark/><p className="mt-4 max-w-md text-sm leading-7 text-white/54">Artes para canecas com curadoria, ferramentas e soluções para quem vive de personalizados.</p><small className="mt-5 block text-xs text-white/35">© {new Date().getFullYear()} Click&Gruda. Todos os direitos reservados.</small></div><div><strong className="text-xs uppercase tracking-[.2em] text-white/45">Explore</strong><div className="mt-4 flex flex-col gap-3 text-sm text-white/72"><button className="text-left hover:text-white" onClick={() => scrollTo('biblioteca')}>Biblioteca</button><button className="text-left hover:text-white" onClick={() => scrollTo('recursos')}>Recursos</button><button className="text-left hover:text-white" onClick={() => scrollTo('investimento')}>Planos e preço</button><button className="text-left hover:text-white" onClick={goLogin}>Entrar</button></div></div><div><strong className="text-xs uppercase tracking-[.2em] text-white/45">Informações</strong><div className="mt-4 flex flex-col gap-3 text-sm text-white/72"><Link href="/sobre" className="hover:text-white">Sobre nós</Link><Link href="/blog" className="hover:text-white">Blog</Link><Link href="/guia" className="hover:text-white">Guia técnico</Link><a href={WHATSAPP.link()} target="_blank" rel="noopener noreferrer" className="hover:text-white">Suporte</a></div></div></div></footer>

    <a className="fixed bottom-24 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg sm:bottom-6 sm:right-6 sm:h-14 sm:w-14" href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" aria-label="Falar com suporte pelo WhatsApp"><MessageCircle size={24}/></a>
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ff913f]/20 bg-[#0c0a0e]/96 px-4 py-3 shadow-[0_-10px_35px_rgba(0,0,0,.32)] backdrop-blur-xl sm:hidden"><div className="mx-auto flex max-w-md items-center justify-between gap-3"><div className="min-w-0"><strong className="block text-base font-black">{campaignActive ? price : 'Click&Gruda'}</strong><span className="block truncate text-[11px] text-white/57">{campaignActive ? 'Pagamento único · oferta vitalícia' : 'Conheça as condições do acesso'}</span></div><button onClick={() => goPurchase('sticky_mobile')} className="shrink-0 rounded-full bg-[#ff7b22] px-5 py-3 text-xs font-black text-white">{hasAccess ? 'Meu portal' : 'COMPRAR AGORA'} <ArrowRight size={14} className="inline"/></button></div></div>
  </div>
}
