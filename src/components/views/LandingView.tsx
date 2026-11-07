'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, BadgeCheck, Box, CalendarDays, Download, Layers3, Menu, MessageCircle, ShieldCheck, Sparkles, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ShowcaseCarousel } from '@/components/landing/ShowcaseCarousel'
import { SALES } from '@/components/landing/sales-content'
import { Logo } from '@/components/shared/Logo'
import { DemoAccessButton } from '@/components/shared/DemoAccessButton'
import { leaveDemoForAccount } from '@/lib/demo-client'
import { toast } from 'sonner'
import { FAQ_ITEMS, LANDING_FAQ_INDICES } from '@/lib/knowledge'
import { track } from '@/lib/analytics'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { useStore } from '@/lib/store'
import { formatBRL } from '@/lib/types'
import { useFreeSignup } from '@/hooks/use-free-signup'

const NAV = [['biblioteca', 'Biblioteca'], ['recursos', 'O que você recebe'], ['studio-mockup', 'Bônus incluídos'], ['investimento', 'Acesso completo'], ['faq', 'Dúvidas']] as const

export function LandingView() {
  const user = useStore(s => s.user)
  const queryClient = useQueryClient()
  const setView = useStore(s => s.setView)
  const setAuthMode = useStore(s => s.setAuthMode)
  const setPendingIntent = useStore(s => s.setPendingIntent)
  const [menuOpen, setMenuOpen] = useState(false)
  const reduced = useReducedMotion()
  const freeSignup = useFreeSignup()
  // A campanha tem preço aprovado fixo; nunca ocultá-lo enquanto o catálogo carrega.
  const priceCents = SALES.defaultPriceCents
  const price = formatBRL(priceCents)
  const priceConfirmed = true
  // A cota do teste não representa a quantidade total de artes do acervo.

  const campaignActive = priceConfirmed && priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const hasAccess = Boolean(user?.hasAccess && !user.isDemo)
  const hasFullAccess = hasAccess && !user?.isTrial
  const canStartTrial = freeSignup && (!user || user.isDemo)
  const buyLabel = hasFullAccess ? 'Acessar minha biblioteca' : 'Garantir acesso completo'
  const startLabel = hasAccess ? user?.isTrial ? 'Continuar meu teste' : 'Acessar minha biblioteca' : canStartTrial ? 'Começar teste grátis' : 'Começar pela Biblioteca'
  useEffect(() => { track('landing_view', { location: 'home' }) }, [])
  const goPurchase = async (location: string) => {
    track('cta_click', { location, intent: 'checkout', price_cents: priceCents })
    setMenuOpen(false)
    if (user?.isDemo) { try { await leaveDemoForAccount(queryClient, 'register') } catch (e) { toast.error((e as Error).message) }; return }
    if (hasFullAccess) { setView('portal'); return }
    if (user) { window.location.assign('/comprar'); return }
    setAuthMode('register'); setPendingIntent('checkout'); setView('auth')
  }
  const goStart = async (location: string) => {
    track('cta_click', { location, intent: hasAccess ? 'portal' : 'free_signup' })
    setMenuOpen(false)
    if (hasAccess) { setView('portal'); return }
    if (user?.isDemo) {
      try { await leaveDemoForAccount(queryClient, 'register', false) }
      catch (error) { toast.error((error as Error).message) }
      return
    }
    if (user) { window.location.assign('/comprar'); return }
    setAuthMode('register'); setPendingIntent(null); setView('auth')
  }
  const goLogin = async () => { track('cta_click', { location: 'login', intent: 'auth' }); setMenuOpen(false); if (user?.isDemo) { try { await leaveDemoForAccount(queryClient, 'login', false) } catch (e) { toast.error((e as Error).message) }; return }; setAuthMode('login'); setView('auth') }
  const scrollTo = (id: string) => {
    setMenuOpen(false)
    track('cta_click', { location: 'navigation', intent: id })
    // Wait for the mobile menu to collapse before measuring the target position.
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }))
  }

  return <div className="cg-sales-page min-h-screen overflow-x-clip pb-20 lg:pb-0">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0b0e]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
        <button type="button" aria-label="Voltar ao início" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}><Logo dark /></button>
        <nav aria-label="Navegação principal" className="hidden items-center gap-6 text-[13px] font-semibold text-white/75 xl:flex">{NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id) }} className="transition-colors hover:text-[#ffab70]">{label}</a>)}</nav>
        <div className="hidden items-center gap-3 xl:flex"><button onClick={goLogin} className="rounded-full px-4 py-3 text-sm font-semibold text-white/80 hover:text-white">Entrar</button><button onClick={() => goStart('header_trial')} className="cg-sales-button px-5 py-3 text-sm">{hasAccess ? 'Minha biblioteca' : canStartTrial ? 'Testar grátis' : 'Começar'} <ArrowUpRight size={16} /></button></div>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} className="rounded-xl border border-white/15 p-3 xl:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menuOpen && <nav aria-label="Navegação no celular" className="border-t border-white/10 bg-[#141016] p-4 xl:hidden"><div className="grid gap-1">{NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id) }} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/5">{label}</a>)}</div><div className="mt-3 flex gap-3"><button onClick={goLogin} className="flex-1 rounded-full border border-white/15 py-3 text-sm font-bold">Entrar</button><button onClick={() => goStart('mobile_menu_trial')} className="cg-sales-button flex-1 px-4 py-3 text-sm">{hasAccess ? 'Minha biblioteca' : canStartTrial ? 'Testar grátis' : 'Começar'}</button></div></nav>}
    </header>
    <main>
      <section className="cg-home-hero" aria-labelledby="home-hero-title">
        <picture className="cg-home-hero-art">
          <source media="(max-width: 1023px)" srcSet="/uploads/rebrand/hero-clickgruda-premium-mobile.webp" />
          {/* Precompressed art direction: load only the matching mobile/desktop asset. */}
          <img src="/uploads/rebrand/hero-clickgruda-premium-1920.webp" width={1920} height={900} alt="" fetchPriority="high" loading="eager" decoding="async" />
        </picture>
        <div className="cg-home-hero-shade" aria-hidden="true" />
        <div className="cg-home-hero-inner">
          <div className="cg-home-hero-copy">
            <p className="cg-home-hero-kicker"><span aria-hidden="true" />{SALES.heroKicker}</p>
            <h1 id="home-hero-title" className="cg-home-hero-title">
              {SALES.heroTitle.map((line, i) => <span key={line} className={i === 2 ? 'cg-home-hero-accent' : undefined}>{line}{i < SALES.heroTitle.length - 1 ? ' ' : ''}</span>)}
            </h1>
            <p className="cg-home-hero-description">{SALES.heroDescription}</p>



            {canStartTrial && <p className="cg-home-trial-summary"><strong>20 downloads em até 24 horas.</strong><span>Studio Mockup e Editor por 7 dias, incluídos no teste.</span></p>}
            <div className="cg-home-hero-actions" aria-label="Comece pela Biblioteca">
              <button type="button" onClick={() => goStart('hero_trial')} className="cg-sales-button px-5 py-4 text-sm">{startLabel} <ArrowRight size={18} /></button>
              {!hasAccess && <DemoAccessButton location="landing_hero_arts" label="Ver prévias sem cadastro" className="cg-sales-outline-button px-5 py-4 text-sm" />}
            </div>
            <p className="cg-home-hero-note"><ShieldCheck size={14} aria-hidden="true" />{hasAccess ? 'Sua conta reúne a Biblioteca e os bônus do seu acesso.' : canStartTrial ? 'Sem cartão no cadastro. Os prazos começam quando você cria sua conta.' : 'Conheça o acervo e escolha seu acesso à Biblioteca.'}</p>

          </div>
        </div>
      </section>

      <section id="biblioteca" className="cg-sales-section py-16 lg:py-20" aria-labelledby="showcase-heading"><div className="mx-auto max-w-7xl px-5 sm:px-8"><p className="cg-sales-eyebrow">Uma amostra real da biblioteca</p><h2 id="showcase-heading" className="cg-sales-heading mt-3">Do pedido do cliente à arte certa.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">Veja estilos e temas que ajudam você a apresentar opções para cada ocasião.</p></div><div className="mt-9"><ShowcaseCarousel /></div></section>
      <section id="recursos" className="cg-sales-section border-y border-white/10 bg-[#121014] px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="package-heading">
        <div className="mx-auto max-w-7xl">
          <p className="cg-sales-eyebrow">A Biblioteca é o ponto de partida</p>
          <h2 id="package-heading" className="cg-sales-heading mt-4">Encontre a arte certa.<br />Crie e apresente no Studio.</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <article className="rounded-[24px] border border-orange-400/30 bg-[#21181a] p-6 sm:p-8 lg:col-span-2">
              <div className="flex items-center gap-3 text-[#ffad74]"><Download size={23} aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-widest">Seu acesso principal</span></div>
              <h3 className="mt-5 text-2xl font-bold">Biblioteca de artes para canecas</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Encontre artes por tema, ocasião e estilo. Explore categorias, salve favoritas e acompanhe os lançamentos para preparar os pedidos que chegam até você.</p>
              <ul className="mt-5 space-y-2 text-sm text-white/75"><li>Busca e categorias para encontrar a opção certa.</li><li>Favoritos para guardar suas próximas ideias.</li><li>Lançamentos para renovar as opções que você oferece.</li></ul>
              <button type="button" onClick={() => goStart('package_trial')} className="cg-sales-button mt-6 px-6 py-3.5 text-sm">{startLabel} <ArrowRight size={17} /></button>
            </article>
            <article className="rounded-[24px] border border-white/10 bg-white/[.025] p-6 sm:p-8">
              <div className="flex items-center gap-3 text-white/60"><Layers3 size={23} aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-widest">Bônus incluídos</span></div>
              <h3 className="mt-5 text-xl font-bold">Studio Mockup + Editor</h3>
              <p className="mt-3 text-sm leading-7 text-white/65">Monte sua composição no Editor e apresente a caneca no Studio Mockup. Os dois fazem parte do pacote de quem tem acesso à Biblioteca.</p>
              <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-7 text-white/75">Seu código de ativação fica no <strong className="text-[#ffb780]">Meu acesso e código do Studio</strong>, no topo do portal. Um caminho claro da escolha da arte à apresentação.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="cg-sales-eyebrow">Simples de colocar na rotina</p><h2 className="cg-sales-heading mt-4">Uma conta na Biblioteca. Um caminho para criar.</h2><p className="mt-5 text-base leading-8 text-white/65">Tudo começa na Biblioteca: encontre suas artes, acesse os bônus e escolha quando liberar o pacote completo.</p></div><ol className="mt-9 grid gap-4 md:grid-cols-3">{SALES.steps.map(step => <li key={step.num} className="rounded-[24px] border border-white/10 bg-white/[.03] p-6"><span className="text-3xl font-bold tracking-tight text-[#ff9b50]">{step.num}</span><h3 className="mt-5 text-xl font-bold">{step.title}</h3><p className="mt-2 text-sm font-medium text-white/85">{step.subtitle}</p><p className="mt-3 text-sm leading-7 text-white/60">{step.description}</p></li>)}</ol></div></section>

      <section className="cg-sales-section bg-[#14141a] px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="occasions-title"><div className="mx-auto max-w-7xl"><p className="cg-sales-eyebrow">Ocasiões que vendem</p><h2 id="occasions-title" className="cg-sales-heading mt-3">Sempre existe um motivo para presentear.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">Tenha temas à mão quando o pedido aparecer — seja uma homenagem, uma data especial ou uma brincadeira entre amigos.</p><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">{[{ icon: CalendarDays, title: 'Datas comemorativas', detail: 'Prepare sua próxima campanha.' },{ icon: BadgeCheck, title: 'Profissões', detail: 'Presentes para reconhecer.' },{ icon: Sparkles, title: 'Fé e inspiração', detail: 'Mensagens que emocionam.' },{ icon: Layers3, title: 'Frases e humor', detail: 'A caneca com personalidade.' },{ icon: Box, title: 'Amizade', detail: 'Lembranças para compartilhar.' },{ icon: Sparkles, title: 'Hobbies e paixões', detail: 'Temas com a cara de cada cliente.' }].map(({icon: Icon,title,detail})=><div key={title} className="rounded-2xl border border-white/10 bg-[#1d1d26] p-5 transition-colors hover:border-orange-500/40"><Icon className="mb-5 h-5 w-5 text-[#ff8a2a]" strokeWidth={1.8}/><h3 className="font-bold text-white">{title}</h3><p className="mt-2 text-xs leading-6 text-white/55">{detail}</p></div>)}</div></div></section>
      <section id="studio-mockup" className="cg-sales-section px-5 pb-16 sm:px-8 lg:pb-24" aria-labelledby="studio-mockup-title">
        <div className="cg-home-studio mx-auto max-w-7xl">
          <div className="cg-home-studio-icon" aria-hidden="true"><Box size={34} strokeWidth={1.3} /><span>3D</span></div>
          <div className="cg-home-studio-content">
            <p className="cg-sales-eyebrow">Bônus do acesso à Biblioteca</p>
            <h2 id="studio-mockup-title">Monte no Editor. Apresente no Studio Mockup.</h2>
            <p>Use o Editor para montar sua composição e o Studio Mockup para mostrar a estampa em uma caneca virtual antes de produzir.</p>
            <p className="cg-home-studio-access"><ShieldCheck size={15} aria-hidden="true" /><span><strong>Incluídos no pacote da Biblioteca.</strong> No portal, encontre seu código no Meu acesso e código do Studio e clique em Copiar código. O Studio abre em outra plataforma e reúne os dois recursos.</span></p>
          </div>
          <div className="cg-home-studio-actions">
            <a href={SALES.STUDIO_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'landing_studio', intent: 'mockup', destination: SALES.STUDIO_URL })} className="cg-sales-outline-button px-6 py-3.5 text-sm" aria-label="Abrir Studio com Mockup e Editor em outra plataforma">Studio · Mockup + Editor <ArrowUpRight size={17} /></a>
            <button type="button" onClick={() => goStart('landing_studio_code')} className="cg-home-studio-code">{hasAccess ? 'Ver meu código na Biblioteca' : 'Começar pela Biblioteca'} <ArrowRight size={13} aria-hidden="true" /></button>
          </div>
        </div>
      </section>

      <section id="video" className="cg-sales-section bg-[#131015] px-5 py-16 sm:px-8 lg:py-20"><div className="mx-auto max-w-5xl"><div className="mx-auto max-w-3xl text-center"><p className="cg-sales-eyebrow">Veja antes de decidir</p><h2 className="cg-sales-heading mt-4">Veja como é encontrar sua próxima arte.</h2><p className="mt-5 text-base leading-8 text-white/65">Assista à navegação pela plataforma e conheça a biblioteca em uso. Veja a busca, as coleções e o caminho até a escolha da arte.</p></div><div className="mt-8 overflow-hidden rounded-[26px] border border-white/15 bg-black p-2"><div className="relative aspect-video overflow-hidden rounded-[19px]"><iframe title="Conheça a Click&Gruda — apresentação em vídeo" src="https://player.vimeo.com/video/1238613293?title=0&byline=0&portrait=0&dnt=1&loop=1&autopause=0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" /></div></div><div className="mt-7 text-center"><button onClick={() => goStart('after_video_trial')} className="cg-sales-button px-7 py-4 text-sm">{startLabel} <ArrowRight size={17} /></button></div></div></section>

      <section id="investimento" className="cg-sales-section border-y border-white/10 bg-[#171219] px-5 py-16 sm:px-8 lg:py-24"><span id="preco" className="cg-sales-section block" /><div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16"><div><p className="cg-sales-eyebrow">Incluído no seu acesso</p><h2 className="cg-sales-heading mt-4">Acesso completo à Biblioteca.<span className="mt-1 block text-[#ff913f]">Com Studio incluído.</span></h2><p className="mt-5 text-base leading-8 text-white/70">Um acesso para escolher as artes, preparar suas composições e apresentar o resultado ao cliente. Organize suas ideias em um fluxo que acompanha os pedidos do dia a dia.</p><ul className="mt-7 space-y-3">{['Biblioteca de artes com curadoria e novos lançamentos', 'Downloads ilimitados no acesso completo', 'Busca, categorias, favoritos e datas sazonais', 'Studio incluído: Mockup 3D + Editor Online', 'Futuras atualizações e novos produtos para membros', 'Sugestões de temas e melhorias simples de qualidade'].map(item => <li key={item} className="flex items-center gap-3 text-sm text-white/85"><BadgeCheck size={18} className="shrink-0 text-[#ff9b50]" />{item}</li>)}</ul></div><div className="rounded-[30px] border border-[#ff9b50]/35 bg-[#231a20] p-7 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-9"><span className="inline-flex rounded-full bg-[#ff913f]/15 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#ffb17c]">{campaignActive ? 'Oferta de acesso vitalício' : 'Acesso à plataforma'}</span><h3 className="mt-6 text-xl font-semibold">{campaignActive ? 'Biblioteca completa + bônus incluídos.' : 'Conheça as condições atuais de acesso.'}</h3><div className="mt-6 flex flex-wrap items-end gap-2"><strong className="text-[clamp(2rem,5vw,3.8rem)] font-bold leading-none tracking-[-.04em]">{priceConfirmed ? price : 'Consulte o valor'}</strong><span className="pb-1 text-sm text-white/60">{campaignActive ? 'pagamento único' : 'no checkout'}</span></div><p className="mt-4 text-sm leading-7 text-white/65">{campaignActive ? 'Uma compra, acesso vitalício na oferta. O mesmo código do teste continua válido para o Studio, sem o prazo de 7 dias. A Biblioteca e o Studio continuam reunidos no seu acesso.' : 'Veja preço, modalidade e condições vigentes no checkout antes de confirmar sua contratação.'}</p><p className="mt-4 text-xs leading-6 text-white/60">Acesso individual: um dispositivo conectado por vez. Adicionais simultâneos são opcionais e tratados com o suporte.</p><button onClick={() => goPurchase('pricing')} className="cg-sales-button mt-7 w-full px-5 py-4 text-sm">{buyLabel} <ArrowUpRight size={18} /></button><p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/60"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#ffab70]" /><span>Pagamento seguro <strong className="font-bold text-[#f5f5f7]">via Cakto</strong> · Liberação automática após a confirmação do pagamento.</span></p>{campaignActive && <p className="mt-3 text-xs leading-relaxed text-white/50">Condição disponível para novas contratações até 31/12/2026. O acesso vitalício contratado continua após o fim da campanha.</p>}</div></div></section>

      <section id="faq" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.75fr_1.25fr] lg:gap-16"><div><p className="cg-sales-eyebrow">Decida com clareza</p><h2 className="cg-sales-heading mt-4">Perguntas frequentes</h2><p className="mt-5 text-sm leading-7 text-white/65">Tem uma dúvida sobre o seu caso? Fale com a gente.</p><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'faq_support', intent: 'whatsapp' })} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"><MessageCircle size={16} className="text-[#ffab70]" /> Conversar no WhatsApp</a></div><div><Accordion type="single" collapsible onValueChange={value => { if (value) track('faq_open', { location: value }) }}>{LANDING_FAQ_INDICES.map(i => <AccordionItem key={FAQ_ITEMS[i].q} value={`faq-${i}`} className="border-white/10"><AccordionTrigger className="py-5 text-left text-[15px] font-semibold leading-7 text-white/90 hover:text-[#ffb17c] hover:no-underline">{FAQ_ITEMS[i].q}</AccordionTrigger><AccordionContent className="text-sm leading-7 text-white/65">{FAQ_ITEMS[i].a}</AccordionContent></AccordionItem>)}</Accordion><p className="mt-5 text-sm text-white/60">Quer mais detalhes? <Link href="/guia" className="font-semibold text-[#ffb17c] underline underline-offset-4">Veja o guia completo da plataforma.</Link></p></div></div></section>

      <section className="px-5 pb-16 sm:px-8 lg:pb-24"><div className="mx-auto max-w-7xl rounded-[30px] border border-[#ff9b50]/20 bg-[radial-gradient(ellipse_at_top,rgba(255,145,63,.15),transparent_75%),#19131b] px-6 py-12 text-center sm:px-10 sm:py-16"><p className="cg-sales-eyebrow">Sua próxima ideia começa aqui</p><h2 className="cg-sales-heading mx-auto mt-4 max-w-3xl">Qual será a próxima<span className="mt-1 block text-[#ff913f]">caneca que você vai criar?</span></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">Encontre artes selecionadas, prepare suas opções e apresente a próxima ideia ao seu cliente. Sua biblioteca fica pronta para acompanhar os pedidos que vierem.</p><button onClick={() => goStart('final_trial')} className="cg-sales-button mt-7 w-full max-w-sm px-6 py-4 text-sm">{startLabel} <ArrowUpRight size={18} /></button></div></section>
    </main>
    <footer className="border-t border-white/10 px-5 py-10 text-white/55 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 md:flex-row md:items-center"><Logo dark /><nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold"><Link href="/blog" className="hover:text-white">Blog do sublimador</Link><a href={SALES.STUDIO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white" onClick={() => track('cta_click', { location: 'footer_studio', intent: 'mockup' })}>Studio · Mockup + Editor ↗</a><Link href="/guia" className="hover:text-white">Guia completo</Link><Link href="/sobre" className="hover:text-white">Sobre a Click & Gruda</Link><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" className="hover:text-white">Suporte</a></nav><p className="text-[11px]">© {new Date().getFullYear()} Click & Gruda</p></div></footer>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#100d12]/95 px-4 py-3 backdrop-blur-xl lg:hidden"><button onClick={() => goStart('mobile_sticky_trial')} className="cg-sales-button min-h-12 w-full px-4 py-3 text-sm">{startLabel} <ArrowUpRight size={17} /></button></div>
  </div>
}
