'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, ChevronRight, Coffee, GraduationCap, Layers3, Menu, MessageCircle, MousePointer2, Play, ShieldCheck, Sparkles, WandSparkles, X } from 'lucide-react'
import { DemoAccessButton } from '@/components/shared/DemoAccessButton'
import { ShowcaseCarousel } from './ShowcaseCarousel'
import { BlogHomeSection } from './BlogHomeSection'
import { SALES } from './sales-content'
import { FAQ_ITEMS, LANDING_FAQ_INDICES } from '@/lib/knowledge'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { track } from '@/lib/analytics'
import './premium.css'

type Props = {
  menuOpen: boolean; setMenuOpen: (open: boolean) => void; showSticky: boolean; reduced: boolean;
  price: string; campaignActive: boolean; hasAccess: boolean; hasFullAccess: boolean; canStartTrial: boolean;
  startLabel: string; buyLabel: string; goStart: (location: string) => Promise<void>;
  goPurchase: (location: string) => Promise<void>; goLogin: () => Promise<void>; scrollTo: (id: string) => void;
}

const NAV = [['biblioteca', 'As artes'], ['recursos', 'A plataforma'], ['como-funciona', 'Para iniciantes'], ['investimento', 'Seu acesso']] as const
const PATHS: {label: string; title: string; description: string; steps: [string, string][]}[] = [
  { label: 'Estou começando', title: 'Seu primeiro passo não precisa ser um salto no escuro.', description: 'Encontre orientação, referências e ferramentas no mesmo lugar. Avance no seu ritmo, da escolha da arte à apresentação da caneca.', steps: [ ['Entenda o processo', 'Trilhas e videoaulas para conhecer materiais, impressão e sublimação.'], ['Pratique com uma arte pronta', 'Escolha no acervo e prepare a composição no Editor.'], ['Mostre antes de produzir', 'Use o mockup para apresentar sua ideia e alinhar o pedido com o cliente.'] ] },
  { label: 'Já produzo canecas', title: 'Menos procura. Mais espaço para criar.', description: 'Renove suas opções, organize o próximo pedido e use o conhecimento da plataforma para aprimorar a sua rotina.', steps: [ ['Encontre o tema do pedido', 'Busca, categorias e favoritos deixam suas referências por perto.'], ['Apresente uma opção melhor', 'Monte a composição e mostre a estampa aplicada em uma caneca virtual.'], ['Continue evoluindo', 'Explore dicas, macetes, materiais de apoio e os novos conteúdos do acervo.'] ] },
]

function Brand() {
  return <span className="cgx-brand"><span className="cgx-brand-icon"><Coffee size={23} /></span><span>Click <b>&</b> Gruda<small>SEU UNIVERSO CRIATIVO</small></span></span>
}

export function PremiumLanding(p: Props) {
  const root = useRef<HTMLDivElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [path, setPath] = useState(0)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [offerVisible, setOfferVisible] = useState(false)
  const journey = PATHS[path]

  useEffect(() => {
    const target = root.current
    if (!target) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - window.innerHeight
        target.style.setProperty('--cgx-progress', String(distance > 0 ? Math.min(1, window.scrollY / distance) : 0))
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    const offer = target.querySelector('#investimento')
    const observer = new IntersectionObserver(entries => setOfferVisible(entries.some(e => e.isIntersecting)), { threshold: 0.15 })
    if (offer) observer.observe(offer)
    const animations: Animation[] = []
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          animations.push(entry.target.animate([{ opacity: 0.4, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' }))
        }
        reveal.unobserve(entry.target)
      })
    }, { threshold: 0.12 })
    target.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el))
    return () => { window.removeEventListener('scroll', update); cancelAnimationFrame(frame); observer.disconnect(); reveal.disconnect(); animations.forEach(a => a.cancel()) }
  }, [])

  useEffect(() => {
    if (!p.menuOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { p.setMenuOpen(false); menuButton.current?.focus() }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [p.menuOpen, p.setMenuOpen])

  const purchase = (location: string) => void p.goPurchase(location)
  const start = (location: string) => void p.goStart(location)

  return <div ref={root} className="cg-premium">
    <a className="cgx-skip" href="#conteudo">Pular para o conteúdo</a>
    <div className="cgx-progress" aria-hidden="true" />
    <header className="cgx-header">
      <div className="cgx-container cgx-header-inner">
        <a href="#conteudo" aria-label="Click & Gruda — início"><Brand /></a>
        <nav className="cgx-desktop-nav" aria-label="Navegação principal">{NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); p.scrollTo(id) }}>{label}</a>)}</nav>
        <div className="cgx-header-actions"><button type="button" className="cgx-login" onClick={() => void p.goLogin()}>Entrar</button><button type="button" className="cgx-button cgx-button-small" onClick={() => start('header_trial')}>{p.hasAccess ? 'Meu espaço' : 'Começar agora'} <ArrowUpRight size={16} /></button></div>
        <button ref={menuButton} type="button" className="cgx-menu-toggle" aria-expanded={p.menuOpen} aria-controls="cgx-mobile-menu" aria-label={p.menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => p.setMenuOpen(!p.menuOpen)}>{p.menuOpen ? <X /> : <Menu />}</button>
      </div>
      {p.menuOpen && <nav id="cgx-mobile-menu" className="cgx-mobile-menu" aria-label="Navegação no celular">{NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); p.scrollTo(id) }}>{label}<ArrowUpRight size={16} /></a>)}<button type="button" onClick={() => void p.goLogin()}>Entrar na minha conta</button><button type="button" className="cgx-button" onClick={() => start('mobile_menu_trial')}>{p.startLabel}<ArrowRight size={18} /></button></nav>}
    </header>

    <main id="conteudo">
      <section className="cgx-hero" aria-labelledby="home-hero-title">
        <picture className="cgx-hero-art"><source media="(max-width: 700px)" srcSet="/uploads/landing-v3/hero-mobile.webp" /><img src="/uploads/landing-v3/hero-studio.webp" width="1672" height="941" alt="Mascote Click & Gruda em uma cadeira gamer, segurando uma caneca estampada em seu estúdio criativo" fetchPriority="high" decoding="async" /></picture>
        <div className="cgx-hero-shade" aria-hidden="true" />
        <div className="cgx-hero-orbit" aria-hidden="true" />
        <div className="cgx-container cgx-hero-inner">
          <div className="cgx-hero-copy">
            <p className="cgx-eyebrow"><span className="cgx-live-dot" /> UMA NOVA FASE PARA SUAS IDEIAS</p>
            <h1 id="home-hero-title">Sua criatividade.<br />Seu próximo<br /><em>grande começo.</em></h1>
            <p className="cgx-hero-description">Artes para canecas, ferramentas para apresentar e conhecimento para produzir. <strong>Do primeiro passo ao próximo pedido.</strong></p>
            <div className="cgx-hero-actions"><button type="button" className="cgx-button" onClick={() => start('hero_trial')}>{p.startLabel}<ArrowUpRight size={20} /></button>{!p.hasAccess && <DemoAccessButton location="landing_hero_arts" label="Conhecer por dentro" className="cgx-demo-button" />}</div>
            <p className="cgx-fine cgx-hero-note"><ShieldCheck size={15} />{p.canStartTrial ? 'Sem cartão. Até 20 downloads em 24h para conhecer a biblioteca.' : p.hasAccess ? 'Sua biblioteca, suas ferramentas e seu conhecimento. Tudo reunido.' : 'Explore as prévias e escolha o acesso ideal para você.'}</p>
          </div>
          <div className="cgx-floating-label cgx-label-one" aria-hidden="true"><span><Layers3 size={18} /></span><div>Uma ideia. Muitas possibilidades.<small>ARTES • STUDIO • ACADEMIA</small></div></div>
          <a href="#biblioteca" className="cgx-hero-scroll" onClick={e => { e.preventDefault(); p.scrollTo('biblioteca') }}><ArrowDown size={15} /> EXPLORE SEU NOVO ESPAÇO</a>
        </div>
      </section>

      <div className="cgx-proofbar"><div className="cgx-container"><span><Layers3 /> Milhares de artes</span><span><WandSparkles /> Mockup 3D + Editor</span><span><GraduationCap /> Trilhas e videoaulas</span><span><Sparkles /> Um universo em expansão</span></div></div>

      <section id="biblioteca" className="cgx-section cgx-gallery" aria-labelledby="showcase-heading">
        <span id="artes" className="cgx-anchor" />
        <div className="cgx-container cgx-section-head" data-reveal><div><p className="cgx-eyebrow">01 / SUA PRÓXIMA IDEIA JÁ PODE ESTAR AQUI</p><h2 id="showcase-heading">De “tem essa arte?”<br />para <em>“olha estas opções”.</em></h2></div><p>Explore uma amostra real da biblioteca. Temas, estilos e ocasiões para transformar referências em novos pedidos.</p></div>
        <ShowcaseCarousel />
        <div className="cgx-container cgx-gallery-bottom"><span><MousePointer2 size={16} /> Toque em uma arte para ver de perto.</span><button type="button" className="cgx-text-button" onClick={() => start('gallery_trial')}>Encontrar minha próxima arte <ArrowUpRight size={18} /></button></div>
      </section>

      <section id="recursos" className="cgx-section cgx-ecosystem" aria-labelledby="ecosystem-title">
        <div className="cgx-container">
          <div className="cgx-section-head" data-reveal><div><p className="cgx-eyebrow">02 / MUITO ALÉM DE UM PACK DE ARTES</p><h2 id="ecosystem-title">Um espaço para criar.<br /><em>Um caminho para evoluir.</em></h2></div><p>O acervo é o começo. Conecte suas ideias a ferramentas e conteúdos que ajudam em cada etapa.</p></div>
          <div className="cgx-resource-grid">
            <article className="cgx-resource cgx-resource-library" data-reveal><span className="cgx-resource-index">01</span><span className="cgx-icon-tile"><Layers3 /></span><p className="cgx-eyebrow">ENCONTRE</p><h3>Uma biblioteca.<br />Muitas possibilidades.</h3><p>Artes por tema, ocasião e estilo. Busca, favoritos e lançamentos para suas próximas criações.</p><div className="cgx-art-stack" aria-hidden="true">{SALES.artworks.slice(3, 6).map(art => <img key={art.src} src={art.src} alt="" loading="lazy" width="400" height="181" />)}</div><button type="button" className="cgx-text-button" onClick={() => start('resources_library')}>Explorar a biblioteca <ArrowUpRight size={18} /></button></article>
            <article id="studio-mockup" className="cgx-resource cgx-resource-studio" data-reveal><span className="cgx-resource-index">02</span><span className="cgx-icon-tile"><WandSparkles /></span><p className="cgx-eyebrow">APRESENTE</p><h3>A ideia ganha forma.<br />Antes da impressão.</h3><p>Monte no Editor e visualize no Mockup 3D. Mostre a composição ao cliente antes de produzir.</p><div className="cgx-studio-visual"><img src="/uploads/landing-v3/creative-tools.webp" alt="Caneca estampada e materiais criativos em uma composição tridimensional" width="800" height="600" loading="lazy" /></div><a className="cgx-text-button" href={SALES.STUDIO_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'landing_studio', intent: 'mockup', destination: SALES.STUDIO_URL })}>Conhecer o Studio <ArrowUpRight size={18} /></a></article>
            <article className="cgx-resource cgx-resource-learn" data-reveal><span className="cgx-resource-index">03</span><span className="cgx-icon-tile"><GraduationCap /></span><p className="cgx-eyebrow">APRENDA</p><h3>Mais clareza.<br />Na próxima etapa.</h3><p>Cursos, trilhas, videoaulas e dicas práticas para quem está começando ou quer aprimorar a produção.</p><div className="cgx-learning-list"><span><Play size={15} /> Videoaulas <i>NO SEU RITMO</i></span><span><BookOpen size={15} /> Guias e materiais <Check size={15} /></span><span><Sparkles size={15} /> Dicas e macetes <Check size={15} /></span></div><a className="cgx-text-button" href="#como-funciona" onClick={e => { e.preventDefault(); p.scrollTo('como-funciona') }}>Encontrar meu caminho <ArrowDown size={18} /></a></article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="cgx-section cgx-academy" aria-labelledby="academy-title">
        <div className="cgx-container cgx-academy-grid">
          <div className="cgx-academy-art" data-reveal><img src="/uploads/landing-v3/creative-tools.webp" alt="Livro, videoaula, guias e caneca estampada: recursos para aprender e criar" width="1200" height="900" loading="lazy" /><div className="cgx-academy-caption"><span className="cgx-icon-tile"><GraduationCap /></span><div>Conhecimento que sai da tela.<small>E ENTRA NA SUA ROTINA.</small></div></div></div>
          <div data-reveal><p className="cgx-eyebrow">03 / CADA PESSOA TEM UM COMEÇO</p><div className="cgx-tabs" role="tablist" aria-label="Seu momento na sublimação">{PATHS.map((item, i) => <button key={item.label} id={`journey-tab-${i}`} type="button" role="tab" aria-selected={path === i} aria-controls="journey-panel" tabIndex={path === i ? 0 : -1} onClick={() => { setPath(i); track('feature_click', { location: 'landing_journey', intent: i === 0 ? 'beginner' : 'experienced' }) }} onKeyDown={e => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : 1 - path; setPath(next); document.getElementById(`journey-tab-${next}`)?.focus() } }}>{item.label}</button>)}</div><div id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${path}`} tabIndex={0}><h2 id="academy-title">{journey.title}</h2><p className="cgx-body">{journey.description}</p><ol className="cgx-journey">{journey.steps.map(([title, description], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></div><button type="button" className="cgx-text-button" onClick={() => start('academy_start')}>Quero começar do meu jeito <ArrowUpRight size={18} /></button></div>
        </div>
      </section>

      <section className="cgx-section cgx-vault" aria-labelledby="vault-title"><div className="cgx-container cgx-vault-inner" data-reveal><div><p className="cgx-eyebrow">SEU REPERTÓRIO TAMBÉM CRESCE</p><h2 id="vault-title">Abriu a plataforma.<br /><em>Abriu possibilidades.</em></h2><p className="cgx-body">Links exclusivos, drives premium, cursos, livros, PDFs e materiais de apoio reunidos para ampliar suas referências.</p><p className="cgx-fine">Explore os conteúdos disponíveis na sua conta. Novidades e melhorias continuam chegando à plataforma.</p></div><div className="cgx-vault-cards" aria-label="Tipos de recursos"><div><BookOpen /><strong>Livros & PDFs</strong><span>CONSULTE E APRENDA</span></div><div><Play /><strong>Cursos & aulas</strong><span>AMPLIE SEU CONHECIMENTO</span></div><div><Layers3 /><strong>Drives & links</strong><span>DESCUBRA NOVAS REFERÊNCIAS</span></div></div></div></section>

      <section id="video" className="cgx-section cgx-video-section" aria-labelledby="video-title"><div className="cgx-container"><div className="cgx-center" data-reveal><p className="cgx-eyebrow">04 / CONHEÇA ANTES DE DECIDIR</p><h2 id="video-title">Por dentro do seu<br /><em>próximo espaço criativo.</em></h2><p className="cgx-body">Veja a biblioteca em uso, a navegação e o caminho até a sua próxima arte.</p></div><div className="cgx-video-shell" data-reveal><div className="cgx-window-bar"><span /><span /><span /><p>clickgruda.com.br / seu espaço criativo</p></div><div className="cgx-video">{videoLoaded ? <iframe title="Demonstração da plataforma Click & Gruda" src="https://player.vimeo.com/video/1238613293?title=0&byline=0&portrait=0&dnt=1&autoplay=1" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button type="button" className="cgx-video-poster" onClick={() => { setVideoLoaded(true); track('feature_click', { location: 'landing_video', intent: 'play' }) }} aria-label="Assistir à demonstração da plataforma"><img src="/uploads/landing-v3/platform-preview.webp" alt="Prévia da biblioteca e dos recursos Click & Gruda" width="1080" height="910" loading="lazy" /><span className="cgx-play"><Play size={28} fill="currentColor" /></span><strong>Veja a plataforma em ação</strong><small>Demonstração real · 1 min 10 s</small></button>}</div></div></div></section>

      <section id="investimento" className="cgx-section cgx-offer" aria-labelledby="offer-title"><span id="preco" className="cgx-anchor" /><div className="cgx-container cgx-offer-grid"><div data-reveal><p className="cgx-eyebrow">05 / SEU PRÓXIMO PASSO</p><h2 id="offer-title">Não é só baixar artes.<br />É ter de onde<br /><em>tirar a próxima ideia.</em></h2><p className="cgx-body">Reúna o acervo, as ferramentas de criação e o conhecimento em um único acesso.</p><ul className="cgx-inclusions">{['Milhares de artes organizadas por tema e ocasião', 'Downloads ilimitados no acesso completo', 'Studio Mockup 3D e Editor Online incluídos', 'Academia, trilhas, videoaulas e materiais de apoio', 'Novas artes e atualizações da plataforma'].map(item => <li key={item}><CheckCheck size={19} />{item}</li>)}</ul><div className="cgx-offer-support"><MessageCircle size={20} /><span>Quer entender se é para você?<a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer">Converse com nossa equipe <ArrowUpRight size={14} /></a></span></div></div><div className="cgx-price-card" data-reveal><div className="cgx-price-top"><span className="cgx-eyebrow">ACESSO COMPLETO</span><span className="cgx-price-badge">{p.campaignActive ? 'VITALÍCIO' : 'CONFIRA A OFERTA'}</span></div><h3>Seu universo criativo.<br />Em uma única conta.</h3><div className="cgx-price">{p.campaignActive ? <><strong>{p.price}</strong><span>pagamento único<br />sem mensalidade</span></> : <strong className="cgx-price-consult">Consulte as condições</strong>}</div><div className="cgx-price-rule" /><p>{p.campaignActive ? 'Biblioteca, Studio e Editor com acesso vitalício para quem contratar durante a campanha.' : 'Confira o valor e a modalidade de acesso disponíveis no checkout antes de contratar.'}</p><button type="button" className="cgx-button" onClick={() => purchase('pricing')}>{p.buyLabel}<ArrowUpRight size={21} /></button><p className="cgx-payment"><ShieldCheck size={15} /> Pagamento seguro via Cakto</p><p className="cgx-fine">Liberação após a confirmação do pagamento. Acesso individual, em um dispositivo por vez.</p>{p.campaignActive && <p className="cgx-campaign">Oferta válida até <strong>{SALES.promoEndsLabel}</strong>. O acesso contratado durante a oferta permanece vitalício.</p>}{p.canStartTrial && <button type="button" className="cgx-price-trial" onClick={() => start('pricing_trial')}>Prefiro conhecer com o teste grátis <ArrowRight size={15} /></button>}</div></div></section>

      {SALES.testimonials.length > 0 && <section className="cgx-section"><div className="cgx-container"><p className="cgx-eyebrow">QUEM JÁ FAZ PARTE</p><h2>Experiências com a plataforma.</h2><div className="cgx-quotes">{SALES.testimonials.map(item => <figure key={item.name}><blockquote>“{item.quote}”</blockquote><figcaption>{item.name} · {item.role}</figcaption></figure>)}</div></div></section>}

      <section id="faq" className="cgx-section cgx-faq" aria-labelledby="faq-title"><span id="perguntas" className="cgx-anchor" /><div className="cgx-container cgx-faq-grid"><div data-reveal><p className="cgx-eyebrow">SEM PONTAS SOLTAS</p><h2 id="faq-title">Você pergunta.<br /><em>A gente esclarece.</em></h2><p className="cgx-body">Tudo que você precisa saber para dar o próximo passo com clareza.</p><a className="cgx-text-button" href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'faq_support', intent: 'whatsapp' })}>Falar com o suporte <ArrowUpRight size={18} /></a></div><div className="cgx-faq-items">{LANDING_FAQ_INDICES.map(i => <details key={i} onToggle={e => { if (e.currentTarget.open) track('faq_open', { location: `faq-${i}` }) }}><summary>{FAQ_ITEMS[i].q}<span aria-hidden="true">+</span></summary><p>{FAQ_ITEMS[i].a}</p></details>)}<Link href="/guia" className="cgx-guide">Veja também o guia completo da plataforma <ChevronRight size={15} /></Link></div></div></section>

      <section className="cgx-section cgx-final"><div className="cgx-container" data-reveal><p className="cgx-eyebrow">SUA IDEIA MERECE SAIR DO PAPEL</p><h2>A próxima caneca<br />começa com <em>um click.</em></h2><button type="button" className="cgx-button" onClick={() => start('final_trial')}>{p.startLabel}<ArrowUpRight size={20} /></button><p className="cgx-fine">Artes. Ferramentas. Conhecimento. Seu próximo passo, no mesmo lugar.</p></div></section>
      <div className="cgx-blog"><BlogHomeSection /></div>
    </main>
    <footer className="cgx-footer"><div className="cgx-container"><a href="#conteudo"><Brand /></a><nav aria-label="Links do rodapé"><Link href="/blog">Blog</Link><Link href="/guia">Guia da plataforma</Link><Link href="/sobre">Sobre nós</Link><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer">Suporte</a><a href={SALES.STUDIO_URL} target="_blank" rel="noopener noreferrer">Studio <ArrowUpRight size={13} /></a></nav><p>© {new Date().getFullYear()} Click & Gruda</p></div></footer>
    {p.showSticky && !offerVisible && !p.menuOpen && <div className="cgx-sticky"><div><strong>{p.campaignActive ? p.price : 'Seu acesso completo'}</strong><span>{p.campaignActive ? 'pagamento único na oferta' : 'Confira as condições'}</span></div><button type="button" className="cgx-button cgx-button-small" onClick={() => purchase('mobile_sticky_buy')}>{p.hasFullAccess ? 'Minha biblioteca' : 'Quero meu acesso'}<ArrowUpRight size={17} /></button></div>}
  </div>
}
