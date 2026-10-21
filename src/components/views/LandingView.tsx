'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, BadgeCheck, CalendarDays, Check,
  CircleCheck, Clock3, Coffee, CreditCard, ExternalLink, FolderOpen,
  Gift, Heart, LayoutDashboard, LockKeyhole, Menu, MessageCircle,
  MousePointerClick, Paintbrush, Play, Search, ShieldCheck,
  ShoppingBag, Sparkles, Star, Store, Wallet, WandSparkles,
  X, Zap,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/shared/Logo'
import { ShowcaseCarousel } from '@/components/landing/ShowcaseCarousel'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { useStore } from '@/lib/store'
import { formatBRL, type CatalogData } from '@/lib/types'
import { FAQ_ITEMS } from '@/lib/knowledge'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const PROMO_END = new Date('2026-12-20T23:59:59-03:00').getTime()
const CATALOG_URL = 'https://www.clickgruda.com.br'
const FLOW = [
  { title: 'Encontre', detail: 'Busque por tema, categoria, tags ou data comemorativa.', icon: Search, number: '01' },
  { title: 'Apresente', detail: 'Use o mockup 3D para visualizar o produto com sua arte.', icon: WandSparkles, number: '02' },
  { title: 'Venda', detail: 'Divulgue seu trabalho com uma loja online própria.', icon: ShoppingBag, number: '03' },
]
const FEATURE_CARDS = [
  { icon: FolderOpen, title: 'Biblioteca que você realmente usa', label: 'ACERVO ORGANIZADO', detail: 'Nada de navegar por centenas de pastas. Use buscas, categorias, filtros, favoritos e coleções de datas especiais para achar o tema certo.', points: ['Artes selecionadas com curadoria', 'Novos conteúdos semanalmente', 'Busca e filtros inteligentes'], span: 'lg:col-span-2', tone: 'dark' },
  { icon: WandSparkles, title: 'Mostre antes de produzir', label: 'GERADOR DE MOCKUPS 3D', detail: 'Aplique suas artes em modelos de produtos e apresente suas ideias de uma maneira muito mais profissional.', points: ['Apresentação visual', 'Ferramenta para assinantes'], span: '', tone: 'light' },
  { icon: Store, title: 'Sua própria vitrine online', label: 'CATÁLOGO DIGITAL', detail: 'Crie sua loja digital e facilite a apresentação dos produtos aos clientes. Grátis para assinantes da Click&Gruda.', points: ['Sua marca, seus produtos', 'Link próprio para divulgar'], span: '', tone: 'light' },
  { icon: CalendarDays, title: 'Antecipe as datas que movimentam as vendas', label: 'DATAS SAZONAIS', detail: 'Encontre conteúdos para Natal, Dia das Mães, Namorados, profissões e muitas outras ocasiões sem perder tempo criando tudo do zero.', points: ['Datas organizadas por tema', 'Encontre ideias na hora certa'], span: 'lg:col-span-2', tone: 'dark' },
]
const comparison = [
  ['Encontrar a arte certa', 'Pastas, nomes soltos e várias tentativas', 'Pesquisa, categorias, tags e favoritos'],
  ['Datas comemorativas', 'Você precisa separar tudo manualmente', 'Temas sazonais organizados no portal'],
  ['Apresentar ao cliente', 'Montar uma prévia por fora', 'Ferramenta de mockup 3D disponível'],
  ['Divulgar produtos', 'Links e fotos espalhados', 'Loja online gratuita para assinantes'],
]
const miniFaq = [0, 2, 6, 8, 9, 11, 14].map(i => FAQ_ITEMS[i]).filter(Boolean)

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reducedMotion = useReducedMotion()
  return <motion.div initial={reducedMotion ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reducedMotion ? 0 : .5, delay }} className={className}>{children}</motion.div>
}

function ProductPreview({ artsCount }: { artsCount?: number }) {
  return (
    <div className="landing-preview relative mx-auto w-full max-w-[590px] select-none" aria-label="Representação ilustrativa do fluxo dentro da Click&Gruda">
      <div className="absolute -inset-8 rounded-[55px] bg-orange-500/15 blur-[55px]" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[24px] border border-white/20 bg-[#171b24] shadow-[0_35px_100px_-30px_rgba(0,0,0,0.8)] sm:rounded-[30px]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#20242e] px-4 py-3 sm:px-5">
          <div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#f26e60]" /><span className="h-2.5 w-2.5 rounded-full bg-[#e6bd62]" /><span className="h-2.5 w-2.5 rounded-full bg-[#58b998]" /></div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#151820] px-3 py-1 text-[10px] font-medium text-zinc-400"><LockKeyhole className="h-3 w-3 text-emerald-400" /> Sua área de trabalho</div>
          <LayoutDashboard className="h-4 w-4 text-zinc-500" />
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><div className="mb-1 text-[10px] font-black uppercase tracking-[.2em] text-orange-400">PAINEL DE CRIAÇÃO</div><div className="text-xl font-black tracking-tight text-white sm:text-2xl">Tudo no mesmo lugar.</div></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/15"><Sparkles className="h-5 w-5 text-orange-400" /></div>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.06] px-3 py-3 text-xs text-zinc-400"><Search className="h-4 w-4 text-orange-400" /> Buscar arte, categoria, ocasião ou código... <span className="ml-auto rounded-md border border-white/10 px-1.5 py-0.5 text-[10px]">⌘ K</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Todas as artes', 'Datas especiais', 'Favoritas'].map((tab, i) => <span key={tab} className={cn('rounded-full px-3 py-1.5 text-[10px] font-bold', i === 0 ? 'bg-orange-500 text-white' : 'border border-white/10 bg-white/5 text-zinc-400')}>{tab}</span>)}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
            {[
              { icon: FolderOpen, label: 'Biblioteca', detail: artsCount ? `${artsCount.toLocaleString('pt-BR')} artes` : 'Por categorias', color: 'text-orange-400', glow: 'bg-orange-500/10' },
              { icon: WandSparkles, label: 'Mockup 3D', detail: 'Seu estúdio', color: 'text-violet-300', glow: 'bg-violet-500/10' },
              { icon: Store, label: 'Loja online', detail: 'Sua vitrine', color: 'text-emerald-300', glow: 'bg-emerald-500/10' },
            ].map((card) => <div key={card.label} className="rounded-2xl border border-white/10 bg-white/[.045] p-3 sm:p-4"><div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', card.glow)}><card.icon className={cn('h-4 w-4', card.color)} /></div><div className="mt-5 text-[11px] font-bold text-white sm:text-xs">{card.label}</div><div className="mt-1 text-[10px] text-zinc-500">{card.detail}</div></div>)}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-orange-400/15 bg-gradient-to-r from-orange-500/10 to-transparent px-4 py-4">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20"><CalendarDays className="h-4 w-4 text-orange-400" /></div><div><div className="text-xs font-bold text-white">Coleções sazonais</div><div className="mt-1 text-[10px] text-zinc-400">Organize a produção por ocasião</div></div></div>
            <ArrowRight className="h-4 w-4 text-orange-400" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl border border-white/20 bg-white px-4 py-3 shadow-2xl sm:flex"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100"><Check className="h-4 w-4 text-emerald-700" /></span><div><div className="text-[11px] font-black text-zinc-900">Seu processo, simplificado.</div><div className="text-[10px] text-zinc-500">Da ideia à vitrine</div></div></div>
      <div className="mt-5 text-center text-[11px] text-zinc-500">Representação ilustrativa da organização e das ferramentas</div>
    </div>
  )
}

export function LandingView() {
  const user = useStore(s => s.user)
  const setView = useStore(s => s.setView)
  const setAuthMode = useStore(s => s.setAuthMode)
  const setPendingIntent = useStore(s => s.setPendingIntent)
  const [scrolled, setScrolled] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [showMobileCta, setShowMobileCta] = useState(false)
  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => { const r = await fetch('/api/catalog'); if (!r.ok) throw new Error('Não foi possível consultar os planos'); return r.json() },
    staleTime: 60_000,
  })
  const price = formatBRL(catalog?.priceCents ?? 4790)
  const campaignActive = (catalog?.priceCents ?? 4790) === 4790 && Date.now() <= PROMO_END
  const priceQualifier = campaignActive ? 'Acesso vitalício · pagamento único' : 'Confira as condições atuais no checkout'

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(y > 20)
      setShowMobileCta(y > 520)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goSignup = (location: string) => {
    track('cta_click', { location, intent: 'signup', price_cents: catalog?.priceCents ?? 4790 })
    if (user) { setView(user.hasAccess ? 'portal' : 'checkout'); return }
    setAuthMode('register')
    setPendingIntent('checkout')
    setView('auth')
  }
  const goLogin = () => { setMobileNav(false); setAuthMode('login'); setView('auth') }
  const scrollTo = (id: string) => {
    setMobileNav(false)
    track('cta_click', { location: 'navigation', intent: id })
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const goCatalog = () => { track('cta_click', { location: 'landing', intent: 'external_catalog' }) }
  const navLinks = [ ['Recursos', 'recursos'], ['Como funciona', 'como-funciona'], ['Ver artes', 'artes'], ['Investimento', 'preco'], ['Dúvidas', 'faq'] ]

  return (
    <div className="landing-v2 min-h-screen overflow-x-clip bg-[#f8f7f5] pb-16 font-sans text-zinc-950 md:pb-0">
      {campaignActive && <div className="relative z-[60] border-b border-orange-600 bg-orange-500 px-4 py-2 text-center text-[11px] font-bold tracking-wide text-zinc-950 sm:text-xs"><span className="inline-flex flex-wrap items-center justify-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Oferta especial: acesso vitalício por {price} <span className="hidden sm:inline">·</span> <span>até 20/12/2026</span> <button onClick={() => scrollTo('preco')} className="ml-1 inline-flex items-center gap-1 underline underline-offset-2">Ver oferta <ArrowRight className="h-3 w-3" /></button></span></div>}
      <header className={cn('sticky top-0 z-50 border-b transition-all duration-300', scrolled ? 'border-white/10 bg-[#11141b]/95 shadow-lg shadow-black/10 backdrop-blur-xl' : 'border-white/10 bg-[#14171e]')}>
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Click&Gruda — voltar ao início"><Logo dark /></button>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação da página de vendas">
            {navLinks.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="rounded-xl px-3.5 py-2 text-[13px] font-semibold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">{label}</button>)}
          </nav>
          <div className="hidden items-center gap-2 sm:flex"><button onClick={goLogin} className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-200 hover:bg-white/10">Entrar</button><Button onClick={() => goSignup('header')} className="h-11 rounded-xl bg-orange-500 px-5 font-extrabold text-zinc-950 shadow-lg shadow-orange-500/20 hover:bg-orange-400">{user?.hasAccess ? 'Meu portal' : 'Quero meu acesso'} <ArrowRight className="ml-1.5 h-4 w-4" /></Button></div>
          <button aria-expanded={mobileNav} aria-label={mobileNav ? 'Fechar navegação' : 'Abrir navegação'} onClick={() => setMobileNav(s => !s)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 text-white sm:hidden">{mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {mobileNav && <nav className="border-t border-white/10 bg-[#14171e] px-5 py-4 sm:hidden" aria-label="Navegação móvel">{navLinks.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="flex w-full items-center justify-between border-b border-white/5 py-3 text-left text-sm font-semibold text-zinc-200">{label}<ArrowRight className="h-4 w-4 text-orange-400" /></button>)}<button onClick={goLogin} className="mt-3 w-full py-2 text-sm font-bold text-zinc-300">Já tenho conta · Entrar</button></nav>}
      </header>

      {/* Nova hero: a vitrine visual demonstra a plataforma, sem repetir as artes do carrossel. */}
      <section className="relative isolate overflow-hidden bg-[#14171e] pb-20 pt-16 text-white sm:pb-24 sm:pt-20 xl:pt-24">
        <div aria-hidden="true" className="landing-hero-grid absolute inset-0 opacity-50" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-44 top-14 h-[450px] w-[450px] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_.95fr] xl:gap-16">
          <div className="max-w-[680px]">
            <Reveal><div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[.13em] text-orange-300"><span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-orange-400/60"/><span className="relative h-2 w-2 rounded-full bg-orange-400" /></span> Para quem vive de personalizados</div></Reveal>
            <Reveal delay={.05}><h1 className="mt-7 text-[clamp(2.9rem,5vw,5rem)] font-black leading-[1.065] tracking-[-.06em]">Sua criatividade merece mais que uma <span className="relative whitespace-nowrap text-orange-400">pasta de arquivos<span aria-hidden="true" className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-orange-400/70" /></span>.</h1></Reveal>
            <Reveal delay={.11}><p className="mt-7 max-w-xl text-base leading-[1.8] text-zinc-300 sm:text-lg">Encontre a arte certa, apresente seus produtos com mockups 3D e divulgue seu catálogo online. <strong className="font-bold text-white">Uma plataforma criada para você produzir mais e procurar menos.</strong></p></Reveal>
            <Reveal delay={.15}><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Button onClick={() => goSignup('hero_primary')} className="landing-cta group min-h-14 rounded-2xl bg-orange-500 px-7 text-base font-black text-zinc-950 shadow-[0_15px_40px_-12px_rgba(249,115,22,.55)] hover:bg-orange-400">{user?.hasAccess ? 'Entrar no meu portal' : 'Quero acessar a plataforma'} <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Button><button onClick={() => scrollTo('como-funciona')} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"><Play className="h-4 w-4 fill-orange-400 text-orange-400" /> Como funciona</button></div></Reveal>
            <Reveal delay={.2}><div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs font-semibold text-zinc-400"><span className="inline-flex items-center gap-1.5"><CircleCheck className="h-4 w-4 text-emerald-400" /> Artes selecionadas</span><span className="inline-flex items-center gap-1.5"><CircleCheck className="h-4 w-4 text-emerald-400" /> Atualização semanal</span><span className="inline-flex items-center gap-1.5"><CircleCheck className="h-4 w-4 text-emerald-400" /> Loja online para assinantes</span></div>{campaignActive && <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-orange-300"><Clock3 className="h-4 w-4" /> Condição especial: {price}, pagamento único até 20 de dezembro.</p>}</Reveal>
          </div>
          <Reveal delay={.17} className="lg:pl-2"><ProductPreview artsCount={catalog?.counts.arts} /></Reveal>
        </div>
        <div className="relative mx-auto mt-16 grid max-w-7xl gap-3 px-5 sm:grid-cols-3 sm:px-8 lg:mt-24">
          {[
            { icon: FolderOpen, title: catalog?.counts.arts ? `${catalog.counts.arts.toLocaleString('pt-BR')} artes no acervo` : 'Artes com curadoria', desc: 'Conteúdo organizado para encontrar' },
            { icon: Sparkles, title: 'Novidades toda semana', desc: 'Mais opções para novas encomendas' },
            { icon: BadgeCheck, title: 'Ferramentas no mesmo acesso', desc: 'Biblioteca, mockup e catálogo online' },
          ].map(s => <div key={s.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-400/10"><s.icon className="h-5 w-5 text-orange-400" /></span><div><div className="text-sm font-extrabold text-white">{s.title}</div><div className="mt-0.5 text-[11px] text-zinc-400">{s.desc}</div></div></div>)}
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white py-7"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 text-center text-xs font-black uppercase tracking-[.14em] text-zinc-500 sm:px-8"><span className="flex items-center gap-2"><Search className="h-4 w-4 text-orange-500" /> Encontre rápido</span><span className="flex items-center gap-2"><Paintbrush className="h-4 w-4 text-orange-500" /> Apresente melhor</span><span className="flex items-center gap-2"><Store className="h-4 w-4 text-orange-500" /> Divulgue sua loja</span><span className="flex items-center gap-2"><Heart className="h-4 w-4 text-orange-500" /> Ganhe tempo</span></div></section>

      <section id="recursos" className="scroll-mt-24 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl"><div className="landing-eyebrow"><Sparkles className="h-3.5 w-3.5" /> TUDO O QUE VOCÊ PRECISA NO MESMO LUGAR</div><h2 className="mt-5 text-3xl font-black leading-[1.14] tracking-[-.045em] sm:text-5xl">Menos ferramentas espalhadas.<br/><span className="text-orange-600">Mais trabalho fluindo.</span></h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600">A Click&Gruda foi pensada para o cotidiano de quem vende personalizados: pesquisa, criação, apresentação e divulgação sem um labirinto de arquivos.</p></Reveal>
        <div className="mt-11 grid gap-4 lg:grid-cols-3">{FEATURE_CARDS.map((f, i) => <Reveal key={f.title} className={f.span} delay={Math.min(i * .045, .2)}><div className={cn('group relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[28px] p-7 transition-all duration-300 hover:-translate-y-1 sm:p-9', f.tone === 'dark' ? 'bg-[#191d27] text-white' : 'border border-zinc-200 bg-white text-zinc-900 hover:shadow-xl hover:shadow-zinc-200/70')}><div className={cn('absolute -right-10 -top-10 h-56 w-56 rounded-full blur-3xl', f.tone === 'dark' ? 'bg-orange-500/10' : 'bg-orange-100/70')} /><div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15"><f.icon className="h-6 w-6 text-orange-500" /></div><p className={cn('relative z-10 mt-8 text-[10px] font-black tracking-[.19em]', f.tone === 'dark' ? 'text-orange-400' : 'text-orange-600')}>{f.label}</p><h3 className="relative z-10 mt-2 text-2xl font-black tracking-tight sm:text-[27px]">{f.title}</h3><p className={cn('relative z-10 mt-3 max-w-lg text-sm leading-[1.8]', f.tone === 'dark' ? 'text-zinc-300' : 'text-zinc-600')}>{f.detail}</p><div className="relative z-10 mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-6">{f.points.map(p => <span key={p} className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold', f.tone === 'dark' ? 'text-zinc-300' : 'text-zinc-600')}><Check className="h-3.5 w-3.5 text-orange-500" /> {p}</span>)}</div>{f.title.includes('vitrine') && <a onClick={goCatalog} href={CATALOG_URL} target="_blank" rel="noopener noreferrer" className="relative z-10 mt-5 inline-flex w-fit items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline">Conhecer o catálogo <ExternalLink className="h-3.5 w-3.5" /></a>}</div></Reveal>)}</div>
      </div></section>

      <section className="bg-white py-20 sm:py-24"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16"><Reveal><div className="landing-eyebrow"><Zap className="h-3.5 w-3.5" /> MUDANÇA REAL NA ROTINA</div><h2 className="mt-5 text-3xl font-black leading-[1.14] tracking-[-.045em] sm:text-5xl">Você não precisa de <span className="text-orange-600">200 mil arquivos</span> para trabalhar melhor.</h2><p className="mt-5 text-base leading-relaxed text-zinc-600">Quantidade por si só não resolve. O que faz diferença é encontrar a opção certa, quando o cliente precisa, e apresentar bem o seu trabalho.</p><Button onClick={() => scrollTo('preco')} className="mt-7 h-12 rounded-xl bg-zinc-950 px-6 font-black hover:bg-zinc-800">Conhecer o acesso <ArrowRight className="ml-2 h-4 w-4" /></Button></Reveal><Reveal delay={.1}><div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_22px_70px_-40px_rgba(0,0,0,.24)]"><div className="grid grid-cols-[.8fr_1fr_1fr] gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-4 text-[10px] font-black uppercase tracking-wide text-zinc-500 sm:px-6 sm:text-xs"><span>NA PRÁTICA</span><span>ARQUIVOS SOLTOS</span><span className="text-orange-600">CLICK&GRUDA</span></div>{comparison.map(([title, old, newer]) => <div key={title} className="grid grid-cols-[.8fr_1fr_1fr] gap-2 border-b border-zinc-100 px-4 py-4 text-[11px] leading-relaxed last:border-b-0 sm:px-6 sm:py-5 sm:text-sm"><div className="font-extrabold text-zinc-800">{title}</div><div className="flex items-start gap-1.5 text-zinc-500"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" /><span>{old}</span></div><div className="flex items-start gap-1.5 font-semibold text-zinc-800"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" /><span>{newer}</span></div></div>)}</div></Reveal></div></section>

      <section id="como-funciona" className="scroll-mt-24 bg-[#f2f0ed] py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><Reveal className="mx-auto max-w-3xl text-center"><div className="landing-eyebrow justify-center"><MousePointerClick className="h-3.5 w-3.5" /> SIMPLES DE USAR</div><h2 className="mt-5 text-3xl font-black tracking-[-.045em] sm:text-5xl">Do tema ao pedido.<br/><span className="text-orange-600">Tudo mais simples.</span></h2><p className="mt-5 text-zinc-600">Três etapas para transformar ideias em apresentações que ajudam você a vender.</p></Reveal><div className="mt-12 grid gap-4 md:grid-cols-3">{FLOW.map((f, i) => <Reveal key={f.title} delay={i * .1}><div className="relative h-full rounded-[26px] border border-zinc-200 bg-white p-7 shadow-sm sm:p-8"><span className="text-5xl font-black tracking-tighter text-zinc-100">{f.number}</span><span className="absolute right-6 top-7 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100"><f.icon className="h-5 w-5 text-orange-600" /></span><h3 className="mt-4 text-2xl font-black">{f.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.detail}</p></div></Reveal>)}</div><Reveal className="mt-9 flex flex-col items-center gap-3 text-center"><span className="text-xs font-semibold text-zinc-600">Tudo começa com uma conta na plataforma.</span><Button onClick={() => goSignup('workflow')} className="h-12 rounded-xl bg-orange-500 px-8 font-black text-zinc-950 hover:bg-orange-400">Quero começar <ArrowRight className="ml-2 h-4 w-4" /></Button></Reveal></div></section>

      <section id="artes" className="scroll-mt-24 overflow-hidden bg-[#14171e] py-20 text-white sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"><div className="max-w-2xl"><div className="landing-eyebrow border-orange-400/20 bg-orange-500/10 text-orange-300"><Star className="h-3.5 w-3.5" /> UMA PRÉVIA DO ACERVO</div><h2 className="mt-5 text-3xl font-black tracking-[-.045em] sm:text-5xl">As artes falam <span className="text-orange-400">por si.</span></h2><p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">Aqui você vê uma amostra das artes. Dentro da plataforma, a biblioteca fica organizada para pesquisar, favoritar e baixar com facilidade.</p></div><Button onClick={() => goSignup('showcase')} className="h-12 shrink-0 rounded-xl bg-orange-500 px-6 font-black text-zinc-950 hover:bg-orange-400">Acessar biblioteca <ArrowRight className="ml-2 h-4 w-4" /></Button></Reveal><ShowcaseCarousel /><p className="mt-5 text-center text-xs text-zinc-500">Amostra do acervo. As artes são compartilhadas entre os assinantes.</p></div></section>

      <section className="bg-white py-20 sm:py-24"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16"><Reveal><div className="landing-eyebrow"><Store className="h-3.5 w-3.5" /> UM BENEFÍCIO A MAIS</div><h2 className="mt-5 text-3xl font-black leading-tight tracking-[-.045em] sm:text-5xl">Seu catálogo online. <span className="text-orange-600">Sua marca em destaque.</span></h2><p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600">O acesso à Click&Gruda também inclui a possibilidade de criar sua própria loja online de produtos personalizados. Você organiza a vitrine e compartilha com seus clientes.</p><div className="mt-6 flex items-center gap-2 text-sm font-extrabold text-emerald-700"><CircleCheck className="h-5 w-5" /> Grátis para quem é assinante</div><a href={CATALOG_URL} target="_blank" rel="noopener noreferrer" onClick={goCatalog} className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 text-sm font-black text-white transition-colors hover:bg-zinc-800">Conhecer o catálogo <ExternalLink className="h-4 w-4" /></a></Reveal><Reveal delay={.1}><div className="relative overflow-hidden rounded-[30px] border border-zinc-200 bg-[#f7f3ee] p-6 sm:p-9"><div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-orange-200/60 blur-3xl"/><div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_-24px_rgba(0,0,0,.2)]"><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div className="flex items-center gap-2 text-sm font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100"><Store className="h-4 w-4 text-orange-600" /></span> Minha loja</div><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800">VITRINE ONLINE</span></div><div className="grid grid-cols-2 gap-3 p-4 sm:p-5">{[{icon: Coffee, title: 'Canecas personalizadas', tag: 'Seu catálogo'}, {icon: Gift, title: 'Presentes criativos', tag: 'Sua marca'}].map(item => <div key={item.title} className="rounded-xl bg-zinc-50 p-4"><div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-[#e7d6c7]"><item.icon className="h-10 w-10 text-orange-700" /></div><div className="mt-3 text-xs font-black text-zinc-800">{item.title}</div><div className="mt-1 text-[10px] text-zinc-400">{item.tag}</div></div>)}</div><div className="mx-5 mb-5 rounded-xl bg-zinc-950 px-4 py-3 text-center text-xs font-bold text-white">Confira nossos produtos <ArrowRight className="ml-1 inline h-3 w-3" /></div></div><p className="relative mt-4 text-center text-[11px] text-zinc-500">Ilustração conceitual de uma vitrine digital</p></div></Reveal></div></section>

      <section id="preco" className="relative scroll-mt-24 overflow-hidden bg-[#f3f1ed] py-20 sm:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.95fr_1.05fr] lg:gap-20"><Reveal><div className="landing-eyebrow"><Wallet className="h-3.5 w-3.5" /> ESCOLHA COM CLAREZA</div><h2 className="mt-5 text-3xl font-black leading-[1.13] tracking-[-.045em] sm:text-5xl">Uma plataforma para facilitar seu trabalho. <span className="text-orange-600">Um investimento direto.</span></h2><p className="mt-5 max-w-lg text-base leading-relaxed text-zinc-600">Você investe em organização, novas opções de artes e ferramentas úteis para seu negócio. Sem promessas irreais — veja o que está incluído e decida.</p><div className="mt-8 space-y-3">{['Biblioteca organizada e atualizada', 'Gerador de mockups 3D', 'Loja online gratuita para assinantes', 'Favoritos, filtros e coleções sazonais', 'Suporte pelos canais oficiais'].map(item => <div key={item} className="flex items-center gap-3 text-sm font-semibold text-zinc-800"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3.5 w-3.5 text-emerald-700" /></span>{item}</div>)}</div></Reveal><Reveal delay={.1}><div className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-7 shadow-[0_26px_90px_-35px_rgba(16,20,28,.25)] sm:p-10"><div className="absolute right-0 top-0 rounded-bl-2xl bg-zinc-950 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">{campaignActive ? 'OFERTA ATÉ 20/12' : 'PLANO DISPONÍVEL'}</div><div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-[11px] font-black text-orange-700"><Sparkles className="h-3.5 w-3.5" /> Click&Gruda</div><h3 className="mt-5 text-2xl font-black text-zinc-900">Acesso à plataforma</h3><p className="mt-2 text-sm text-zinc-500">Artes, organização e ferramentas em um só lugar.</p><div className="mt-7 flex items-end gap-2 border-b border-zinc-100 pb-6"><span className="text-5xl font-black tracking-[-.06em] text-zinc-950 sm:text-6xl">{price}</span><span className="pb-2 text-sm font-bold text-zinc-500">{campaignActive ? 'uma vez' : 'preço exibido'}</span></div><p className="mt-4 flex items-start gap-2 text-sm font-bold text-zinc-700"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {priceQualifier}</p>{campaignActive && <p className="mt-2 text-xs leading-relaxed text-zinc-500">Plano promocional vitalício: válido para novas contratações até 20 de dezembro de 2026, sujeito às condições apresentadas no checkout.</p>}<Button onClick={() => goSignup('pricing')} className="landing-cta mt-7 min-h-14 w-full rounded-2xl bg-orange-500 px-5 text-base font-black text-zinc-950 shadow-lg shadow-orange-500/25 hover:bg-orange-400">{user?.hasAccess ? 'Acessar minha plataforma' : 'Garantir meu acesso agora'} <ArrowRight className="ml-2 h-5 w-5" /></Button><p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">{campaignActive ? 'Pagamento único neste plano · sem mensalidades recorrentes' : 'Confira o tipo de plano e a validade no checkout antes de pagar'}</p><div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-zinc-100 pt-5 text-[11px] font-semibold text-zinc-500"><span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5"><Wallet className="h-3.5 w-3.5" /> PIX</span>{catalog?.providers?.mercadopago && <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5"><CreditCard className="h-3.5 w-3.5" /> Mercado Pago</span>}{catalog?.providers?.asaas && <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5"><CreditCard className="h-3.5 w-3.5" /> Asaas</span>}</div></div></Reveal></div></section>

      <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-16"><Reveal><div className="landing-eyebrow"><MessageCircle className="h-3.5 w-3.5" /> SEM LETRAS MIÚDAS</div><h2 className="mt-5 text-3xl font-black leading-[1.15] tracking-[-.045em] sm:text-5xl">Ainda tem alguma <span className="text-orange-600">dúvida?</span></h2><p className="mt-5 leading-relaxed text-zinc-600">A gente quer que você saiba exatamente como o acesso funciona antes de assinar.</p><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'faq', intent: 'support' })} className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-orange-600 hover:underline"><MessageCircle className="h-4 w-4" /> Falar com suporte <ArrowRight className="h-4 w-4" /></a></Reveal><Reveal delay={.1}><Accordion type="single" collapsible className="rounded-[26px] border border-zinc-200 px-5 sm:px-7">{miniFaq.map((f, i) => <AccordionItem key={f.q} value={`faq-${i}`} className="border-zinc-100"><AccordionTrigger onClick={() => track('faq_open', { question: f.q })} className="py-5 text-left text-sm font-extrabold text-zinc-900 hover:text-orange-600 hover:no-underline sm:text-base">{f.q}</AccordionTrigger><AccordionContent className="pb-5 text-sm leading-relaxed text-zinc-600">{f.a}</AccordionContent></AccordionItem>)}</Accordion><div className="mt-5 text-center text-xs text-zinc-500">Quer conhecer detalhes técnicos? <Link href="/guia" className="font-extrabold text-orange-600 hover:underline">Leia o guia completo</Link>.</div></Reveal></div></section>

      <section className="relative overflow-hidden bg-orange-500 py-16 sm:py-20"><div aria-hidden="true" className="absolute -right-16 -top-32 h-96 w-96 rounded-full border-[60px] border-white/10"/><div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8"><span className="rounded-full bg-zinc-950/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-950">COMECE PELO QUE IMPORTA</span><h2 className="mt-5 max-w-4xl text-3xl font-black leading-[1.12] tracking-[-.045em] text-zinc-950 sm:text-5xl">Pare de procurar arquivos. Comece a criar novas oportunidades.</h2><p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-zinc-900/80 sm:text-base">Biblioteca organizada, mockups 3D e sua loja online. Sua rotina de personalizados pode ficar muito mais prática.</p><Button onClick={() => goSignup('final_cta')} className="mt-8 min-h-14 rounded-2xl bg-zinc-950 px-8 text-base font-black text-white shadow-2xl hover:bg-zinc-800">{user?.hasAccess ? 'Entrar na plataforma' : 'Quero fazer parte'} <ArrowRight className="ml-2 h-5 w-5" /></Button>{campaignActive && <p className="mt-4 text-xs font-bold text-zinc-900/80">Oferta vitalícia de {price} disponível até 20/12/2026.</p>}</div></section>

      <footer className="bg-[#14171e] py-11 text-zinc-400"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row"><div><Logo dark /><p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">Artes organizadas e ferramentas práticas para quem trabalha com personalizados.</p><p className="mt-4 text-[11px] text-zinc-500">© {new Date().getFullYear()} Click&Gruda. Todos os direitos reservados.</p></div><div className="flex flex-wrap gap-x-12 gap-y-6"><div><p className="mb-3 text-xs font-black uppercase tracking-widest text-white">Plataforma</p><div className="space-y-3 text-sm"><button onClick={() => scrollTo('recursos')} className="block hover:text-orange-400">Recursos</button><button onClick={() => scrollTo('preco')} className="block hover:text-orange-400">Planos</button><a href={CATALOG_URL} target="_blank" rel="noopener noreferrer" className="block hover:text-orange-400">Catálogo online</a><button onClick={goLogin} className="block hover:text-orange-400">Entrar</button></div></div><div><p className="mb-3 text-xs font-black uppercase tracking-widest text-white">Saiba mais</p><div className="space-y-3 text-sm"><Link href="/sobre" className="block hover:text-orange-400">Sobre nós</Link><Link href="/blog" className="block hover:text-orange-400">Blog</Link><Link href="/guia" className="block hover:text-orange-400">Guia técnico</Link><a href={WHATSAPP.link()} target="_blank" rel="noopener noreferrer" className="block hover:text-orange-400">WhatsApp</a></div></div></div></div></footer>
      <a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" aria-label="Falar com o suporte no WhatsApp" className={cn('fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition-all hover:scale-105 hover:bg-emerald-600 md:bottom-5 md:right-5', showMobileCta ? 'bottom-24' : 'bottom-5')}><MessageCircle className="h-5 w-5" /></a>
      <div className={cn('fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,.12)] backdrop-blur-xl transition-transform duration-300 md:hidden', showMobileCta ? 'translate-y-0' : 'translate-y-full')}><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><div className="text-xs font-black text-zinc-900">{user?.hasAccess ? 'Seu portal está pronto' : campaignActive ? `${price} · pagamento único` : `Acesso por ${price}`}</div><div className="truncate text-[10px] font-medium text-zinc-500">{campaignActive ? 'Oferta até 20/12/2026' : 'Confira as condições'}</div></div><Button onClick={() => goSignup('mobile_sticky')} className="h-11 rounded-xl bg-orange-500 px-5 text-xs font-black text-zinc-950 hover:bg-orange-400">{user?.hasAccess ? 'Entrar' : 'Garantir acesso'} <ArrowRight className="ml-1 h-4 w-4" /></Button></div></div>
    </div>
  )
}
