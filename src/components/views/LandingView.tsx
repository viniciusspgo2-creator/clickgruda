'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check,
  ChevronDown, Clock3, Coffee, CreditCard, FolderSearch, Gift, Heart,
  Layers3, Menu, MessageCircle, MousePointer2, Search, ShieldCheck,
  ShoppingBag, Sparkles, Store, WandSparkles, X,
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Logo } from '@/components/shared/Logo'
import { SALES } from '@/components/landing/sales-content'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { useStore } from '@/lib/store'
import { formatBRL, type CatalogData } from '@/lib/types'
import { FAQ_ITEMS } from '@/lib/knowledge'
import { track } from '@/lib/analytics'

const animation = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }
const FEATURED = SALES.artworks.slice(0, 8)

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .1 }} transition={{ ...animation, duration: reduced ? 0 : .65, delay: reduced ? 0 : delay }}>{children}</motion.div>
}

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [count, setCount] = useState(value)
  const reduced = useReducedMotion()
  useEffect(() => {
    setCount(value)
    if (reduced || !ref.current || !('IntersectionObserver' in window)) return
    let frame = 0
    let start = 0
    let played = false
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting || played) return
      played = true
      const tick = (t: number) => {
        if (!start) start = t
        const progress = Math.min(1, (t - start) / 1250)
        setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      setCount(0)
      frame = requestAnimationFrame(tick)
      observer.disconnect()
    }, { threshold: .4 })
    observer.observe(ref.current)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [value, reduced])
  return <span ref={ref} className="tabular-nums">{count.toLocaleString('pt-BR')}</span>
}

/** Elementos da galeria são imagens reais incluídas no projeto, não mockups inventados. */
function ArtWall() {
  const reduced = useReducedMotion()
  const cols = [FEATURED.slice(0, 4), FEATURED.slice(4, 8)]
  return (
    <div className="cg-wall-frame" aria-label="Prévia de artes reais da biblioteca Click&Gruda">
      <div className="cg-wall-top"><div className="flex items-center gap-2"><span className="cg-status-dot" /> <span>SELEÇÃO CLICK&GRUDA</span></div><span>ACERVO REAL <ArrowUpRight size={13} /></span></div>
      <div className="cg-wall-inner">
        {cols.map((col, c) => <div key={c} className={`cg-wall-col cg-wall-col-${c + 1}`}>
          {[...col, ...col].map((art, i) => <div className="cg-wall-art" key={`${art.src}-${i}`} aria-hidden={i >= col.length}>
            <Image src={art.src} alt={i >= col.length ? '' : `Arte pronta: ${art.title}`} width={480} height={217} sizes="(max-width: 640px) 45vw, 320px" priority={c === 0 && i < 2} loading={c === 0 && i < 2 ? undefined : 'lazy'} />
            <span>{art.category}</span>
          </div>)}
        </div>)}
      </div>
      <div className="cg-wall-shade" aria-hidden="true" />
      <div className="cg-wall-floating"><span className="cg-wall-floating-icon"><FolderSearch size={19}/></span><span><b>Arte boa é arte encontrada.</b><small>Temas, filtros e datas em um lugar.</small></span></div>
      {reduced && <span className="sr-only">Animações desativadas por preferência de acessibilidade.</span>}
    </div>
  )
}

function ArtworkCard({ art, index }: { art: (typeof SALES.artworks)[number]; index: number }) {
  return <motion.div layout initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .94 }} transition={{ duration: .25 }} className="cg-art-card" key={art.src}>
    <div className="cg-art-card-media">
      <Image src={art.src} alt={`Exemplo real de arte para caneca: ${art.title}`} width={960} height={434} sizes="(max-width: 550px) 90vw, (max-width: 1024px) 45vw, 30vw" loading={index < 3 ? 'eager' : 'lazy'} />
      <span className="cg-art-hover">EXEMPLO DO ACERVO <ArrowUpRight size={14}/></span>
    </div>
    <div className="cg-art-card-info"><span>{art.title}</span><span className="cg-art-card-cat">{art.category}</span></div>
  </motion.div>
}

function InteractiveLibrary({ goSignup }: { goSignup: (source: string) => void }) {
  const [category, setCategory] = useState<string>('Todas')
  const [search, setSearch] = useState('')
  const arts = useMemo(() => SALES.artworks.filter(a =>
    (category === 'Todas' || a.category === category) &&
    `${a.title} ${a.category}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))
  ).slice(0, 9), [category, search])

  return <section id="biblioteca" className="cg-library scroll-mt-24"><span id="artes" aria-hidden="true" className="cg-legacy-anchor"/><span id="recursos" aria-hidden="true" className="cg-legacy-anchor"/>
    <div className="cg-container">
      <Reveal><div className="cg-section-top"><span className="cg-overline"><span className="cg-overline-line" /> POR DENTRO DA BIBLIOTECA</span><span className="cg-index">02 / A EXPERIÊNCIA</span></div></Reveal>
      <div className="cg-library-heading"><Reveal><h2 className="cg-heading">Sua próxima arte está <em>por aqui.</em></h2></Reveal><Reveal delay={.1}><p>Explore uma pequena amostra de arquivos do nosso acervo. Escolha um tema, pesquise e veja como é mais simples encontrar ideias.</p></Reveal></div>
      <Reveal><div className="cg-browser" aria-label="Demonstração interativa de filtro e pesquisa com imagens reais">
        <div className="cg-browser-toolbar"><span><span className="cg-browser-circles"><i/><i/><i/></span> EXPLORAR ARTES</span><span className="cg-browser-caption"><span className="cg-status-dot" /> prévia interativa</span></div>
        <div className="cg-browser-content">
          <div className="cg-browser-intro"><div><strong>Encontre seu próximo favorito.</strong><p>Uma seleção de verdade. Só uma prévia da biblioteca completa.</p></div><span className="cg-sample-tag">AMOSTRAS DO ACERVO</span></div>
          <label className="cg-search"><Search size={20} aria-hidden="true"/><span className="sr-only">Pesquisar artes da demonstração</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Experimente buscar por casal, café, Goku..." type="search" /><span className="cg-search-hint">BUSCAR</span></label>
          <div className="cg-filters" role="group" aria-label="Filtrar exemplos de artes por categoria">
            {SALES.categories.map(c => <button key={c} type="button" aria-pressed={c === category} className={c === category ? 'cg-filter cg-filter-active' : 'cg-filter'} onClick={() => { setCategory(c); track('landing_filter', { category: c }) }}>{c}</button>)}
          </div>
          <div className="cg-result-meta" aria-live="polite"><span><span className="cg-status-dot"/> {arts.length} {arts.length === 1 ? 'amostra encontrada' : 'amostras encontradas'}</span><span>IMAGENS REAIS DO ACERVO</span></div>
          <motion.div layout className="cg-art-grid">
            <AnimatePresence mode="popLayout">{arts.map((art, i) => <ArtworkCard key={art.src} art={art} index={i}/>)}</AnimatePresence>
          </motion.div>
          {arts.length === 0 && <div className="cg-empty"><Search size={28}/><b>Nenhuma amostra corresponde à busca.</b><p>Esta é apenas uma demonstração com parte das artes.</p><button onClick={() => { setCategory('Todas'); setSearch('') }}>Ver todas as amostras</button></div>}
          <div className="cg-browser-end"><div><b>Isso é só o começo.</b><span>O portal reúne muito mais artes, categorias, filtros e novidades.</span></div><button className="cg-text-link" onClick={() => goSignup('library_preview')}>Acessar biblioteca <ArrowUpRight size={18}/></button></div>
        </div>
      </div></Reveal>
    </div>
  </section>
}

function StorySteps() {
  const [active, setActive] = useState(0)
  const steps = SALES.steps
  return <section id="como-funciona" className="cg-story scroll-mt-20"><div className="cg-container">
    <Reveal><div className="cg-section-top cg-section-top-dark"><span className="cg-overline"><span className="cg-overline-line"/> SIMPLES ASSIM</span><span className="cg-index">03 / COMO FUNCIONA</span></div></Reveal>
    <div className="cg-story-layout"><div className="cg-story-sticky"><Reveal><h2 className="cg-heading cg-heading-light">Da ideia à caneca. <em>Sem complicar.</em></h2><p>Uma rotina mais fluida começa com o que você precisa encontrar.</p></Reveal>
      <div className="cg-story-progress" aria-label={`Etapa ${active + 1} de 3`}><div style={{ width: `${(active + 1) / 3 * 100}%` }}/></div>
      <div className="cg-story-current"><span>{steps[active].num} / 03</span><b>{steps[active].title}</b><span><ArrowDownRight size={29}/></span></div>
    </div>
    <div className="cg-story-list">{steps.map((s, i) => <motion.article key={s.num} className={`cg-story-step ${active === i ? 'cg-story-step-active' : ''}`} onViewportEnter={() => setActive(i)} viewport={{ margin: '-25% 0px -40% 0px' }}><span className="cg-story-step-index">{s.num} / ETAPA</span><div className="cg-story-glyph">{i === 0 ? <Search size={34}/> : i === 1 ? <Layers3 size={34}/> : <ShoppingBag size={34}/>}</div><h3>{s.title}.</h3><b>{s.subtitle}</b><p>{s.description}</p></motion.article>)}</div>
    </div>
  </div></section>
}

function Compare() {
  const [mode, setMode] = useState<'sem' | 'com'>('com')
  return <section className="cg-compare"><div className="cg-container cg-compare-layout">
    <Reveal><div><span className="cg-overline"><span className="cg-overline-line"/> MAIS CURADORIA. MENOS CONFUSÃO.</span><h2 className="cg-heading">Não é sobre ter <em>200 mil arquivos.</em></h2><p>Você não precisa de um pacote gigantesco onde mal encontra o que procura. Precisa de boas artes, organização e novas opções sempre chegando.</p><div className="cg-comparison-note"><span>200 MIL</span><p>É o tipo de número anunciado por packs genéricos. <b>Não é a quantidade de artes da Click&Gruda.</b></p></div></div></Reveal>
    <Reveal delay={.12}><div className="cg-compare-widget"><div className="cg-compare-toggle" role="group" aria-label="Comparação de experiências"><button aria-pressed={mode === 'sem'} className={mode === 'sem' ? 'selected' : ''} onClick={() => setMode('sem')}>Pastas soltas</button><button aria-pressed={mode === 'com'} className={mode === 'com' ? 'selected' : ''} onClick={() => setMode('com')}>Com Click&Gruda <Sparkles size={15}/></button></div><AnimatePresence mode="wait"><motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .25 }} className={`cg-compare-content ${mode === 'com' ? 'cg-compare-positive' : ''}`}><span className="cg-compare-tag">{mode === 'com' ? 'UM JEITO MAIS LEVE' : 'O JEITO COMPLICADO'}</span><h3>{mode === 'com' ? 'A arte certa. Na hora certa.' : 'Cadê aquela arte mesmo?'}</h3><div className="cg-compare-rows">{(mode === 'com' ? ['Categorias e temas organizados', 'Busca e filtros dentro do portal', 'Novas artes adicionadas semanalmente', 'Coleções para datas especiais'] : ['Arquivos espalhados em várias pastas', 'Nomes que não ajudam a localizar', 'Horas até encontrar uma opção boa', 'Datas importantes sem planejamento']).map((v,i) => <div key={v}><span>{mode === 'com' ? <Check size={16}/> : <X size={16}/>}</span><p>{v}</p><span className="cg-compare-row-number">0{i+1}</span></div>)}</div><span className="cg-compare-footnote">COMPARAÇÃO ILUSTRATIVA DE FLUXOS DE TRABALHO</span></motion.div></AnimatePresence></div></Reveal>
  </div></section>
}

export function LandingView() {
  const user = useStore(s => s.user)
  const setView = useStore(s => s.setView)
  const setAuthMode = useStore(s => s.setAuthMode)
  const setPendingIntent = useStore(s => s.setPendingIntent)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollPercent, setScrollPercent] = useState(0)
  const [showMobileCta, setShowMobileCta] = useState(false)
  const reduced = useReducedMotion()
  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ['catalog'], queryFn: async () => { const r = await fetch('/api/catalog'); if (!r.ok) throw Error('Catálogo indisponível'); return r.json() }, staleTime: 60_000,
  })
  const isEstimated = !catalog || catalog.counts.arts <= 0
  const count = isEstimated ? SALES.estimatedArtCount : catalog.counts.arts
  const priceCents = catalog?.priceCents ?? SALES.defaultPriceCents
  const price = formatBRL(priceCents)
  const campaignActive = priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const navigateSignup = (source: string) => {
    track('cta_click', { location: source, intent: 'signup', price_cents: priceCents })
    if (user?.hasAccess) { setView('portal'); return }
    if (SALES.CHECKOUT_URL) { window.location.assign(SALES.CHECKOUT_URL); return }
    if (user) { setView('checkout'); return }
    setAuthMode('register'); setPendingIntent('checkout'); setView('auth')
  }
  const goLogin = () => { setMenuOpen(false); setAuthMode('login'); setView('auth') }
  const goSection = (id: string) => { setMenuOpen(false); track('cta_click', { location: 'navigation', intent: id }); document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) }
  const handleMagnet = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch' || reduced) return
    const box = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - box.left - box.width / 2) * .1
    const dy = (e.clientY - box.top - box.height / 2) * .15
    e.currentTarget.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
  }
  const resetMagnet = (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.style.transform = '' }
  const handleSpotlight = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch' || reduced) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
  }
  useEffect(() => {
    let raf = 0
    const update = () => { raf = 0; const y = window.scrollY; const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); setScrolled(y > 20); setShowMobileCta(y > 620); setScrollPercent(Math.min(100, Math.round(100 * y / max))) }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])
  const nav = [{ label: 'A biblioteca', id: 'biblioteca' }, { label: 'Como funciona', id: 'como-funciona' }, { label: 'Planos', id: 'investimento' }]

  return <div className="cg-sales min-h-screen overflow-x-clip text-[#181923]">
    <div className="cg-scroll-progress" aria-hidden="true" style={{ transform: `scaleX(${scrollPercent / 100})` }} />
    <header className={`cg-header ${scrolled ? 'cg-header-scrolled' : ''}`}>
      <div className="cg-container cg-header-inner"><button className="cg-logo-button" aria-label="Click&Gruda, voltar ao início" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}><Logo dark /></button>
        <nav className="cg-nav" aria-label="Navegação principal">{nav.map(n => <button key={n.id} onClick={() => goSection(n.id)}>{n.label}</button>)}</nav>
        <div className="cg-header-actions"><button className="cg-signin" onClick={goLogin}>Entrar</button><button className="cg-button cg-button-sm" onClick={() => navigateSignup('header')}>{user?.hasAccess ? 'Meu portal' : 'Garantir acesso'} <ArrowUpRight size={17}/></button><button className="cg-mobile-menu" aria-expanded={menuOpen} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23}/> : <Menu size={23}/>}</button></div>
      </div>
      {menuOpen && <nav className="cg-mobile-nav" aria-label="Navegação móvel">{nav.map(n => <button key={n.id} onClick={() => goSection(n.id)}>{n.label}<ArrowUpRight size={17}/></button>)}<button onClick={goLogin}>Entrar na minha conta<ArrowRight size={17}/></button><button onClick={() => navigateSignup('mobile_menu')}>Garantir meu acesso<ArrowRight size={17}/></button></nav>}
    </header>

    <main>
      <section className="cg-hero cg-spotlight" onPointerMove={handleSpotlight}>
        <div className="cg-hero-grid" aria-hidden="true"/><div className="cg-hero-halo" aria-hidden="true"/>
        <div className="cg-container cg-hero-inner">
          <div className="cg-hero-copy"><Reveal><div className="cg-hero-eyebrow"><span className="cg-status-dot" />{SALES.heroKicker}<ArrowUpRight size={14}/></div></Reveal>
            <h1 className="cg-hero-title">{SALES.heroTitle.map((word, i) => <span className="cg-title-line" key={word}><motion.span initial={reduced ? false : { y: '105%' }} animate={{ y: 0 }} transition={{ ...animation, delay: reduced ? 0 : .12 + i * .12 }}>{i === 1 || i === 3 ? <em>{word}</em> : word}</motion.span></span>)}</h1>
            <Reveal delay={.27}><p className="cg-hero-description">{SALES.heroDescription}</p></Reveal>
            <Reveal delay={.35}><div className="cg-hero-actions"><button className="cg-button cg-button-big cg-magnetic" onPointerMove={handleMagnet} onPointerLeave={resetMagnet} onClick={() => navigateSignup('hero_primary')}>{user?.hasAccess ? 'Abrir minha biblioteca' : 'Quero acessar a biblioteca'} <span><ArrowUpRight size={21}/></span></button><button className="cg-hero-link" onClick={() => goSection('biblioteca')}>Explorar as artes <ArrowRight size={17}/></button></div></Reveal>
            <Reveal delay={.4}><div className="cg-hero-proof"><span><BadgeCheck size={17}/> Selecionadas a dedo</span><span><CalendarDays size={17}/> Novas artes toda semana</span></div></Reveal>
          </div>
          <Reveal className="cg-hero-visual" delay={.25}><ArtWall /></Reveal>
        </div>
        <div className="cg-container cg-hero-metrics"><div className="cg-hero-count"><span className="cg-count-number">{isEstimated && <small>~</small>}<CountUp value={count}/></span><span className="cg-count-label">{isEstimated ? 'artes no acervo (aprox.)' : 'artes cadastradas'}<strong>COM CURADORIA DE VERDADE</strong></span></div><div className="cg-metrics-note"><span className="cg-orbit" aria-hidden="true"><Sparkles size={19}/></span><p>Uma biblioteca viva.<b>Cresce a cada semana.</b></p></div><span className="cg-metrics-scroll">ROLE PARA DESCOBRIR <ArrowDownRight size={19}/></span></div>
      </section>

      <div className="cg-ticker" aria-label="Benefícios da biblioteca"><div>{['ARTE BOA É ARTE QUE VOCÊ USA','ORGANIZADA POR CATEGORIAS','NOVIDADES SEMANAIS','PENSE NA CRIAÇÃO, NÃO NAS PASTAS', 'ARTE BOA É ARTE QUE VOCÊ USA','ORGANIZADA POR CATEGORIAS','NOVIDADES SEMANAIS','PENSE NA CRIAÇÃO, NÃO NAS PASTAS'].map((x,i) => <span key={i}><span className="cg-ticker-star">✳</span>{x}</span>)}</div></div>

      <section className="cg-problem"><div className="cg-container cg-problem-layout"><Reveal><div className="cg-problem-label"><span>01 / A VIRADA</span><span className="cg-problem-spark">✳</span></div></Reveal><Reveal delay={.07}><div><h2>Tem gente colecionando arquivos.<br/><em>A gente prefere facilitar seu trabalho.</em></h2><p>Chega de comprar aqueles packs com a promessa de 200 mil artes, navegar por pastas infinitas e não aproveitar quase nada. Aqui, cada nova coleção tem um propósito: ajudar você a criar.</p><button className="cg-simple-link" onClick={() => goSection('biblioteca')}>Descubra a diferença <ArrowUpRight size={19}/></button></div></Reveal></div></section>

      <InteractiveLibrary goSignup={navigateSignup}/>
      <StorySteps />

      <section className="cg-seasonal"><div className="cg-container"><Reveal><div className="cg-section-top"><span className="cg-overline"><span className="cg-overline-line"/> SEMPRE HÁ UMA PRÓXIMA DATA</span><span className="cg-index">04 / DATAS QUE CONECTAM</span></div></Reveal><div className="cg-seasonal-head"><Reveal><h2 className="cg-heading">Sua criatividade <em>acompanha o calendário.</em></h2></Reveal><Reveal delay={.1}><p>Datas especiais movimentam os personalizados. Com as coleções sazonais, você encontra inspirações para preparar seus próximos trabalhos.</p></Reveal></div><div className="cg-seasonal-list">{SALES.seasons.map((item, i) => <Reveal key={item.index} delay={i * .04}><div className="cg-seasonal-item"><span className="cg-season-number">{item.index}</span><div><h3>{item.name}</h3><p>{item.note}</p></div><span className="cg-season-month">{item.moment}</span><ArrowUpRight className="cg-season-arrow" size={23}/></div></Reveal>)}</div></div></section>

      <Compare />

      <section className="cg-extras"><div className="cg-container cg-extras-layout"><Reveal><div><span className="cg-overline"><span className="cg-overline-line"/> E AINDA TEM MAIS</span><h2>Você vem pelas artes.<br/><em>Leva mais possibilidades.</em></h2><p>Além da biblioteca, sua assinatura inclui duas ferramentas para valorizar e divulgar seu trabalho.</p></div></Reveal><Reveal delay={.1}><div className="cg-extras-cards"><div className="cg-extra"><span><WandSparkles size={22}/></span><div><b>Gerador de mockups 3D</b><p>Apresente suas estampas aplicadas em produtos antes de produzir.</p></div><ArrowUpRight size={18}/></div><div className="cg-extra"><span><Store size={22}/></span><div><b>Sua loja online</b><p>Monte uma vitrine digital para divulgar seus produtos via link e WhatsApp.</p></div><ArrowUpRight size={18}/></div></div></Reveal></div></section>

      <section id="investimento" className="cg-pricing cg-spotlight scroll-mt-20" onPointerMove={handleSpotlight}><span id="preco" aria-hidden="true" className="cg-legacy-anchor"/><div className="cg-container cg-pricing-layout"><Reveal><div className="cg-pricing-copy"><span className="cg-overline"><span className="cg-overline-line"/> O PRÓXIMO PASSO É SEU</span><h2 className="cg-heading cg-heading-light">Sua biblioteca começa <em>com uma escolha.</em></h2><p>Artes selecionadas a dedo. Tudo organizado para facilitar sua produção. E novas opções chegando semanalmente.</p><div className="cg-pricing-quiet"><span><Heart size={19}/> Para quem vive de personalizados.</span><span><Clock3 size={19}/> Menos busca. Mais criação.</span></div></div></Reveal><Reveal delay={.13}><div className="cg-price-border"><div className="cg-price-card"><div className="cg-price-top"><span><Sparkles size={16}/> ACESSO CLICK&GRUDA</span>{campaignActive && <b>CONDIÇÃO PROMOCIONAL</b>}</div><h3>Sua biblioteca de artes.</h3><p>E dois benefícios para completar sua rotina criativa.</p><div className="cg-price-amount"><strong>{price}</strong><span>{campaignActive ? 'pagamento único' : 'valor exibido no catálogo'}</span></div><div className="cg-price-includes"><div><Check size={17}/><b>Biblioteca de artes organizada</b></div><div><Check size={17}/><b>Novas artes toda semana</b></div><div><Check size={17}/><b>Busca, filtros e coleções sazonais</b></div><div><Gift size={17}/><span>Gerador de mockups 3D incluso</span></div><div><Gift size={17}/><span>Loja online inclusa</span></div></div><button className="cg-button cg-button-big cg-price-button" onClick={() => navigateSignup('pricing')}>{user?.hasAccess ? 'Acessar meu portal' : 'Quero liberar meu acesso'}<ArrowUpRight size={21}/></button><div className="cg-price-disclaimer"><ShieldCheck size={17}/><span>{campaignActive ? `Acesso vitalício promocional por pagamento único até ${SALES.promoEndsLabel}. Consulte as condições no checkout.` : 'Confira as condições e o tipo de plano no checkout antes de pagar.'}</span></div><div className="cg-payment-note"><CreditCard size={16}/><span>Opções de pagamento apresentadas no checkout</span></div></div></div></Reveal></div></section>

      <section id="perguntas" className="cg-faq scroll-mt-20"><span id="faq" aria-hidden="true" className="cg-legacy-anchor"/><div className="cg-container cg-faq-layout"><Reveal><div><span className="cg-overline"><span className="cg-overline-line"/> DIRETO AO PONTO</span><h2 className="cg-heading">Ainda ficou alguma <em>dúvida?</em></h2><p>Entenda os detalhes antes de assinar. Informação clara faz parte de uma boa experiência.</p><a className="cg-simple-link" href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'faq_support' })}><MessageCircle size={18}/> Falar pelo WhatsApp <ArrowUpRight size={17}/></a></div></Reveal><Reveal delay={.1}><div className="cg-faq-list"><Accordion type="single" collapsible>{SALES.faqIndices.map((idx) => { const f = FAQ_ITEMS[idx]; return <AccordionItem value={`faq-${idx}`} key={f.q}><AccordionTrigger onClick={() => track('faq_open', { question: f.q })}>{f.q}</AccordionTrigger><AccordionContent>{f.a}</AccordionContent></AccordionItem> })}</Accordion><p>Quer mais detalhes sobre a plataforma? <Link href="/guia">Veja nosso guia completo <ArrowUpRight size={15}/></Link></p></div></Reveal></div></section>

      <section className="cg-final"><div className="cg-container cg-final-inner"><Reveal><span>É HORA DE CRIAR</span><h2>A próxima grande ideia pode estar <em>a um clique.</em></h2><p>Entre para a Click&Gruda e descubra uma forma mais simples de encontrar artes que fazem sentido para o seu trabalho.</p><button className="cg-button cg-button-dark" onClick={() => navigateSignup('final_cta')}>{user?.hasAccess ? 'Abrir minha biblioteca' : 'Quero minha biblioteca'} <ArrowUpRight size={21}/></button></Reveal><span aria-hidden="true" className="cg-final-asterisk">✳</span></div></section>
    </main>

    <footer className="cg-footer"><div className="cg-container cg-footer-layout"><div><Logo dark /><p>Artes selecionadas a dedo para quem transforma criatividade em personalizados.</p><small>© {new Date().getFullYear()} Click&Gruda. Todos os direitos reservados.</small></div><div><span>EXPLORE</span><button onClick={() => goSection('biblioteca')}>Biblioteca de artes</button><button onClick={() => goSection('investimento')}>Investimento</button><button onClick={goLogin}>Entrar na conta</button><a href={SALES.EXTERNAL_CATALOG_URL} target="_blank" rel="noopener noreferrer">Catálogo online</a></div><div><span>SAIBA MAIS</span><Link href="/sobre">Sobre nós</Link><Link href="/blog">Blog</Link><Link href="/guia">Guia técnico</Link><a href={WHATSAPP.link()} target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div></footer>

    <a className="cg-whatsapp" href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" aria-label="Conversar com suporte pelo WhatsApp"><MessageCircle size={23}/></a>
    <div className={`cg-mobile-sticky ${showMobileCta ? 'cg-mobile-sticky-visible' : ''}`}><div><b>{campaignActive ? `${price} · pagamento único` : `Acesso por ${price}`}</b><span>{campaignActive ? 'Promoção vitalícia até 20/12' : 'Consulte as condições'}</span></div><button onClick={() => navigateSignup('mobile_sticky')}>{user?.hasAccess ? 'Meu portal' : 'Garantir acesso'} <ArrowUpRight size={17}/></button></div>
  </div>
}
