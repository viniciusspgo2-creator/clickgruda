'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, BadgeCheck, Box, CalendarDays, Check, Download, Layers3, Menu, MessageCircle, Play, ShieldCheck, Sparkles, X } from 'lucide-react'
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
import { formatBRL, type CatalogData } from '@/lib/types'

const NAV = [['biblioteca', 'Biblioteca'], ['recursos', 'O que você recebe'], ['studio-mockup', 'Studio 3D'], ['investimento', 'Acesso'], ['faq', 'Dúvidas']] as const
const FEATURES = [
  { id: 'biblioteca', label: 'Encontre o que seu cliente pediu', title: 'A arte certa, sem perder a manhã procurando.', text: 'Busque por tema, ocasião ou estilo. Assim você dedica seu tempo ao pedido, não a abrir arquivos em pastas desorganizadas.', image: '/uploads/rebrand/busca-acervo.webp', alt: 'Mascote da Click & Gruda apresentando a busca por artes', points: ['Encontre artes para cada ocasião pelo nome ou categoria', 'Compare opções sem sair da biblioteca', 'Baixe o arquivo escolhido para preparar a impressão'] },
  { id: 'sazonais', label: 'Venda nas próximas datas', title: 'Antecipe as artes das campanhas sazonais.', text: 'Natal, Dia das Mães, Dia dos Namorados, profissões e outras ocasiões. Encontre temas prontos para preparar sua divulgação antes da demanda chegar.', image: '/uploads/rebrand/sazonais-calendario.webp', alt: 'Coleções de artes por datas comemorativas', points: ['Encontre artes para datas comemorativas', 'Ganhe agilidade para montar suas opções de venda', 'Acompanhe novidades adicionadas semanalmente'] },
] as const


function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={false} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : delay }}>{children}</motion.div>
}
function Picture({ src, alt }: { src: string; alt: string }) {
  return <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#151116]"><Image src={src} alt={alt} width={1672} height={941} sizes="(max-width: 1023px) 100vw, 50vw" className="block h-auto w-full" /></div>
}

export function LandingView() {
  const user = useStore(s => s.user)
  const queryClient = useQueryClient()
  const setView = useStore(s => s.setView)
  const setAuthMode = useStore(s => s.setAuthMode)
  const setPendingIntent = useStore(s => s.setPendingIntent)
  const [menuOpen, setMenuOpen] = useState(false)
  const reduced = useReducedMotion()
  const { data: catalog } = useQuery<CatalogData>({ queryKey: ['catalog'], queryFn: async () => { const r = await fetch('/api/catalog'); if (!r.ok) throw new Error('Catálogo indisponível'); return r.json() }, staleTime: 60_000 })
  const priceCents = catalog?.priceCents ?? SALES.defaultPriceCents
  const price = formatBRL(priceCents)
  const priceConfirmed = typeof catalog?.priceCents === 'number' && Number.isFinite(catalog.priceCents)
  const reportedArtCount = catalog?.counts?.arts
  const artCount = typeof reportedArtCount === 'number' && Number.isSafeInteger(reportedArtCount) && reportedArtCount > 0 ? reportedArtCount : null
  const artCountLabel = artCount != null ? `${artCount.toLocaleString('pt-BR')} artes para explorar na biblioteca` : null
  const campaignActive = priceConfirmed && priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const hasAccess = Boolean(user?.hasAccess && !user.isDemo)
  const buyLabel = hasAccess ? 'Acessar minha biblioteca' : campaignActive ? 'Quero meu acesso vitalício' : 'Quero acessar a biblioteca'
  useEffect(() => { track('landing_view', { location: 'home' }) }, [])
  const goPurchase = async (location: string) => {
    track('cta_click', { location, intent: 'checkout', price_cents: priceCents })
    setMenuOpen(false)
    if (user?.isDemo) { try { await leaveDemoForAccount(queryClient, 'register') } catch (e) { toast.error((e as Error).message) }; return }
    if (hasAccess) { setView('portal'); return }
    if (SALES.CHECKOUT_URL) { window.location.assign(SALES.CHECKOUT_URL); return }
    if (user) { setView('checkout'); return }
    setAuthMode('register'); setPendingIntent('checkout'); setView('auth')
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
        <div className="hidden items-center gap-3 xl:flex"><button onClick={goLogin} className="rounded-full px-4 py-3 text-sm font-semibold text-white/80 hover:text-white">Entrar</button><button onClick={() => goPurchase('header')} className="cg-sales-button px-5 py-3 text-sm">{hasAccess ? 'Meu portal' : 'Garantir meu acesso'} <ArrowUpRight size={16} /></button></div>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} className="rounded-xl border border-white/15 p-3 xl:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {menuOpen && <nav aria-label="Navegação no celular" className="border-t border-white/10 bg-[#141016] p-4 xl:hidden"><div className="grid gap-1">{NAV.map(([id, label]) => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id) }} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-white/5">{label}</a>)}</div><div className="mt-3 flex gap-3"><button onClick={goLogin} className="flex-1 rounded-full border border-white/15 py-3 text-sm font-bold">Entrar</button><button onClick={() => goPurchase('mobile_menu')} className="cg-sales-button flex-1 px-4 py-3 text-sm">{hasAccess ? 'Meu portal' : 'Quero meu acesso'}</button></div></nav>}
    </header>
    <main>
      <section className="cg-home-hero" aria-labelledby="home-hero-title">
        <picture className="cg-home-hero-art" aria-hidden="true">
          <source media="(max-width: 1023px)" srcSet="/uploads/rebrand/hero-studio-mascote-mobile-v2.webp" />
          {/* Precompressed art direction: load only the matching mobile/desktop asset. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/uploads/rebrand/hero-studio-mascote-v2.webp" width={1774} height={887} alt="" fetchPriority="high" loading="eager" decoding="async" />
        </picture>
        <div className="cg-home-hero-shade" aria-hidden="true" />
        <div className="cg-home-hero-inner">
          <div className="cg-home-hero-copy">
            <p className="cg-home-hero-kicker"><span aria-hidden="true" />{SALES.heroKicker}</p>
            <h1 id="home-hero-title" className="cg-home-hero-title">
              {SALES.heroTitle.map((line, i) => <span key={line} className={i === 2 ? 'cg-home-hero-accent' : undefined}>{line}{i < SALES.heroTitle.length - 1 ? ' ' : ''}</span>)}
            </h1>
            <p className="cg-home-hero-description">{SALES.heroDescription}</p>
            <ul className="cg-home-hero-benefits">
              <li><Check size={16} aria-hidden="true" /> Selecionadas a dedo</li>
              <li><Check size={16} aria-hidden="true" /> Novidades toda semana</li>
              <li><Check size={16} aria-hidden="true" /> Downloads ilimitados</li>
            </ul>
            {!hasAccess && campaignActive && <p className="cg-home-hero-offer"><strong>{price}</strong><span>Acesso vitalício<span>Pagamento único · sem mensalidade</span></span></p>}
            {!hasAccess && !campaignActive && priceConfirmed && <p className="cg-home-hero-offer"><strong>{price}</strong><span>Acesso à biblioteca<span>Confira as condições no checkout</span></span></p>}
            <div className="cg-home-hero-actions" aria-label="Acesso e demonstração da biblioteca">
              <button type="button" onClick={() => goPurchase('hero_primary')} className="cg-sales-button px-6 py-4 text-sm">{buyLabel} <ArrowUpRight size={18} /></button>
              {!hasAccess && <DemoAccessButton location="landing_hero_arts" label="Conhecer por dentro" className="cg-sales-outline-button px-5 py-4 text-sm" />}
            </div>
            <p className="cg-home-hero-note"><ShieldCheck size={14} aria-hidden="true" />{hasAccess ? 'Seu acesso está ativo. Sua próxima ideia já pode começar.' : 'Veja a biblioteca por dentro antes de comprar. Sem cadastro.'}</p>
            <div className="cg-home-hero-meta">
              <span><Layers3 size={15} aria-hidden="true" />{artCountLabel ?? 'Curadoria para quem trabalha com sublimação'}</span>
              <button type="button" onClick={() => scrollTo('video')}><Play size={14} aria-hidden="true" /> Ver em vídeo</button>
            </div>
          </div>
        </div>
      </section>

      <section className="cg-home-proof-strip" aria-label="O que acompanha seu acesso"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 py-7 sm:px-8 lg:grid-cols-4">{[{ Icon: Layers3, title: 'Artes selecionadas', text: 'Curadoria em cada coleção' }, { Icon: CalendarDays, title: 'Novidades semanais', text: 'Mais ideias para seus pedidos' }, { Icon: Box, title: 'Studio Mockup 3D', text: 'Gratuito para assinantes' }, { Icon: Download, title: 'Downloads ilimitados', text: 'Com seu acesso ativo' }].map(({ Icon, title, text }) => <div key={title} className="flex items-start gap-3"><Icon size={21} className="mt-1 shrink-0 text-[#ff9b50]" aria-hidden="true" /><div><strong className="text-[13px] font-bold sm:text-sm">{title}</strong><p className="mt-1 text-xs leading-relaxed text-white/60">{text}</p></div></div>)}</div></section>

      <section id="biblioteca" className="cg-sales-section py-16 lg:py-24"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16"><Reveal><p className="cg-sales-eyebrow">Artes para os pedidos que chegam até você</p><h2 className="cg-sales-heading mt-4">Seu cliente tem um tema. Você tem por onde começar.</h2><p className="mt-5 text-base leading-8 text-white/70">Frases, profissões, fé, humor, amizade e datas especiais. Explore estilos para diferentes clientes e deixe suas favoritas à mão para o próximo pedido.</p><div className="mt-6 flex flex-wrap gap-2">{SALES.categories.slice(1).map(category => <span key={category} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-medium text-white/75">{category}</span>)}</div><p className="mt-6 flex items-center gap-2 text-sm font-medium text-[#ffb17c]"><Sparkles size={16} /> {artCountLabel ?? 'Artes selecionadas a dedo e organizadas para sua rotina.'}</p></Reveal><Picture src="/uploads/rebrand/busca-acervo.webp" alt="Busca, categorias e coleções da biblioteca de artes Click & Gruda" /></div><div className="mx-auto mt-14 max-w-7xl px-5 sm:px-8"><h3 className="text-xl font-bold tracking-tight sm:text-2xl">{artCountLabel ? `Veja algumas das ${artCount?.toLocaleString('pt-BR')} artes da biblioteca.` : 'Uma prévia dos estilos que você encontra.'}</h3><p className="mt-2 text-xs text-white/55">Uma amostra real dos temas e estilos disponíveis na biblioteca.</p></div><ShowcaseCarousel /></section>

      <section className="px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="curadoria-title">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="cg-sales-eyebrow">Escolhidas a dedo. Fáceis de encontrar.</p>
            <h2 id="curadoria-title" className="cg-sales-heading mt-4">Seu tempo vale mais.<span className="mt-1 block text-[#ff913f]">A busca pela arte pode render mais.</span></h2>
          </Reveal>
          <Reveal>
            <p className="text-base leading-8 text-white/75">Seu cliente pede um tema. Você precisa de boas opções para apresentar. Na Click & Gruda, <strong className="font-semibold text-white">as artes estão organizadas por categorias, estilos e datas comemorativas</strong>, com busca e favoritos para facilitar o próximo pedido.</p>
            <p className="mt-4 text-base leading-8 text-white/65">A curadoria ajuda na escolha. Os lançamentos semanais renovam suas opções. E o Studio 3D ajuda seu cliente a visualizar a caneca antes da produção.</p>
            <button type="button" onClick={() => goPurchase('benefits')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#ffb17c] underline underline-offset-8">Quero essa praticidade <ArrowRight size={16} /></button>
          </Reveal>
        </div>
      </section>

      <section id="studio-mockup" className="cg-sales-section px-5 pb-16 sm:px-8 lg:pb-24" aria-labelledby="studio-mockup-title">
        <div className="cg-home-studio mx-auto max-w-7xl">
          <div className="cg-home-studio-icon" aria-hidden="true"><Box size={34} strokeWidth={1.3} /><span>3D</span></div>
          <div className="cg-home-studio-content">
            <p className="cg-sales-eyebrow">Studio Mockup 3D</p>
            <h2 id="studio-mockup-title">Sua arte. Na caneca. Antes de produzir.</h2>
            <p>Aplique a estampa em uma caneca virtual e apresente sua ideia ao cliente com mais clareza.</p>
            <p className="cg-home-studio-access"><ShieldCheck size={15} aria-hidden="true" /><span><strong>Gratuito para assinantes da biblioteca.</strong> Solicite seu código ao suporte.</span></p>
          </div>
          <div className="cg-home-studio-actions">
            <a href={SALES.STUDIO_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'landing_studio', intent: 'mockup', destination: SALES.STUDIO_URL })} className="cg-sales-outline-button px-6 py-3.5 text-sm" aria-label="Abrir Studio Mockup 3D em uma nova aba">Abrir Studio 3D <ArrowUpRight size={17} /></a>
            <a href={WHATSAPP.link('Olá! Sou assinante da Click & Gruda e quero solicitar meu código de acesso ao Studio Mockup 3D.')} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'landing_studio_code', intent: 'whatsapp' })} className="cg-home-studio-code">Solicitar meu código <ArrowUpRight size={13} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <section id="recursos" className="cg-sales-section bg-[#131015] px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="mx-auto mb-10 max-w-3xl text-center"><p className="cg-sales-eyebrow">O que muda no seu dia a dia</p><h2 className="cg-sales-heading mt-4">Menos procura. Mais ideias para oferecer.</h2></div><div className="space-y-7">{FEATURES.map((feature, i) => <Reveal key={feature.id}><article className="grid items-center gap-7 rounded-[28px] border border-white/10 bg-[#19151c] p-5 sm:p-8 lg:grid-cols-2 lg:gap-12"><div className={i % 2 ? 'lg:order-2' : ''}><p className="cg-sales-eyebrow">{feature.label}</p><h3 className="mt-4 text-[clamp(1.65rem,2.6vw,2.35rem)] font-bold leading-[1.16] tracking-[-.025em]">{feature.title}</h3><p className="mt-5 text-[15px] leading-8 text-white/70">{feature.text}</p><ul className="mt-6 space-y-3">{feature.points.map(point => <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-white/80"><Check size={17} className="mt-0.5 shrink-0 text-[#ff9b50]" />{point}</li>)}</ul><button onClick={() => goPurchase(`feature_${feature.id}`)} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#ffb17c] underline underline-offset-8">Quero essas facilidades <ArrowUpRight size={16} /></button></div><div className={i % 2 ? 'lg:order-1' : ''}><Picture src={feature.image} alt={feature.alt} /></div></article></Reveal>)}</div><div className="mt-9 text-center"><button onClick={() => goPurchase('after_features')} className="cg-sales-button px-7 py-4 text-sm">{buyLabel} <ArrowRight size={17} /></button></div></div></section>

      <section id="como-funciona" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="cg-sales-eyebrow">Simples de colocar na rotina</p><h2 className="cg-sales-heading mt-4">Escolha a arte. Mostre a ideia. Produza.</h2><p className="mt-5 text-base leading-8 text-white/65">Um caminho simples entre o tema que seu cliente pediu e a caneca que você vai produzir.</p></div><ol className="mt-9 grid gap-4 md:grid-cols-3">{SALES.steps.map(step => <li key={step.num} className="rounded-[24px] border border-white/10 bg-white/[.03] p-6"><span className="text-3xl font-bold tracking-tight text-[#ff9b50]">{step.num}</span><h3 className="mt-5 text-xl font-bold">{step.title}</h3><p className="mt-2 text-sm font-medium text-white/85">{step.subtitle}</p><p className="mt-3 text-sm leading-7 text-white/60">{step.description}</p></li>)}</ol></div></section>

      <section id="video" className="cg-sales-section bg-[#131015] px-5 py-16 sm:px-8 lg:py-20"><div className="mx-auto max-w-5xl"><div className="mx-auto max-w-3xl text-center"><p className="cg-sales-eyebrow">Veja antes de decidir</p><h2 className="cg-sales-heading mt-4">Veja como é encontrar sua próxima arte.</h2><p className="mt-5 text-base leading-8 text-white/65">Assista à navegação pela plataforma e conheça a biblioteca em uso. Veja a busca, as coleções e o caminho até a escolha da arte.</p></div><div className="mt-8 overflow-hidden rounded-[26px] border border-white/15 bg-black p-2"><div className="relative aspect-video overflow-hidden rounded-[19px]"><iframe title="Conheça a Click&Gruda — apresentação em vídeo" src="https://player.vimeo.com/video/1238613293?title=0&byline=0&portrait=0&dnt=1&loop=1&autopause=0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" /></div></div><div className="mt-7 text-center"><button onClick={() => goPurchase('after_video')} className="cg-sales-button px-7 py-4 text-sm">{buyLabel} <ArrowRight size={17} /></button></div></div></section>

      <section id="investimento" className="cg-sales-section border-y border-white/10 bg-[#171219] px-5 py-16 sm:px-8 lg:py-24"><span id="preco" className="cg-sales-section block" /><div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16"><div><p className="cg-sales-eyebrow">Tudo o que acompanha seu acesso</p><h2 className="cg-sales-heading mt-4">Uma biblioteca para criar.<span className="mt-1 block text-[#ff913f]">Mais praticidade para produzir.</span></h2><p className="mt-5 text-base leading-8 text-white/70">Receba acesso à biblioteca de artes para canecas, aos lançamentos semanais e ao Studio Mockup 3D. Encontre novas opções para apresentar aos seus clientes em um só lugar.</p><ul className="mt-7 space-y-3">{['Biblioteca de artes com curadoria', 'Novidades adicionadas semanalmente', 'Downloads ilimitados com acesso ativo', 'Categorias, favoritos e datas sazonais', 'Studio Mockup 3D gratuito para assinantes', 'Sugestões de temas pelo portal'].map(item => <li key={item} className="flex items-center gap-3 text-sm text-white/85"><BadgeCheck size={18} className="shrink-0 text-[#ff9b50]" />{item}</li>)}</ul></div><div className="rounded-[30px] border border-[#ff9b50]/35 bg-[#231a20] p-7 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-9"><span className="inline-flex rounded-full bg-[#ff913f]/15 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#ffb17c]">{campaignActive ? 'Oferta de acesso vitalício' : 'Acesso à plataforma'}</span><h3 className="mt-6 text-xl font-semibold">{campaignActive ? 'Artes, novidades e acesso vitalício.' : 'Conheça as condições atuais de acesso.'}</h3><div className="mt-6 flex flex-wrap items-end gap-2"><strong className="text-[clamp(2rem,5vw,3.8rem)] font-bold leading-none tracking-[-.04em]">{priceConfirmed ? price : 'Consulte o valor'}</strong><span className="pb-1 text-sm text-white/60">{campaignActive ? 'pagamento único' : 'no checkout'}</span></div><p className="mt-4 text-sm leading-7 text-white/65">{campaignActive ? 'Pagamento único na oferta vitalícia. Explore o acervo, baixe sem cota diária e receba os novos lançamentos sem custo adicional.' : 'Veja preço, modalidade e condições vigentes no checkout antes de confirmar sua contratação.'}</p><button onClick={() => goPurchase('pricing')} className="cg-sales-button mt-7 w-full px-5 py-4 text-sm">{buyLabel} <ArrowUpRight size={18} /></button><p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/60"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#ffab70]" />Crie sua conta e siga as instruções de pagamento e ativação. No atendimento manual, a equipe confirma a liberação pelo WhatsApp.</p>{campaignActive && <p className="mt-3 text-xs leading-relaxed text-white/50">Condição disponível para novas contratações até 31/12/2026. O acesso vitalício contratado continua após o fim da campanha.</p>}</div></div></section>

      <section id="faq" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.75fr_1.25fr] lg:gap-16"><div><p className="cg-sales-eyebrow">Decida com clareza</p><h2 className="cg-sales-heading mt-4">O que você precisa saber antes de entrar.</h2><p className="mt-5 text-sm leading-7 text-white/65">Tem uma dúvida sobre o seu caso? Fale com a gente.</p><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'faq_support', intent: 'whatsapp' })} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"><MessageCircle size={16} className="text-[#ffab70]" /> Conversar no WhatsApp</a></div><div><Accordion type="single" collapsible onValueChange={value => { if (value) track('faq_open', { location: value }) }}>{LANDING_FAQ_INDICES.map(i => <AccordionItem key={FAQ_ITEMS[i].q} value={`faq-${i}`} className="border-white/10"><AccordionTrigger className="py-5 text-left text-[15px] font-semibold leading-7 text-white/90 hover:text-[#ffb17c] hover:no-underline">{FAQ_ITEMS[i].q}</AccordionTrigger><AccordionContent className="text-sm leading-7 text-white/65">{FAQ_ITEMS[i].a}</AccordionContent></AccordionItem>)}</Accordion><p className="mt-5 text-sm text-white/60">Quer mais detalhes? <Link href="/guia" className="font-semibold text-[#ffb17c] underline underline-offset-4">Veja o guia completo da plataforma.</Link></p></div></div></section>

      <section className="px-5 pb-16 sm:px-8 lg:pb-24"><div className="mx-auto max-w-7xl rounded-[30px] border border-[#ff9b50]/20 bg-[radial-gradient(ellipse_at_top,rgba(255,145,63,.15),transparent_75%),#19131b] px-6 py-12 text-center sm:px-10 sm:py-16"><p className="cg-sales-eyebrow">Sua próxima ideia começa aqui</p><h2 className="cg-sales-heading mx-auto mt-4 max-w-3xl">Qual será a próxima<span className="mt-1 block text-[#ff913f]">caneca que você vai criar?</span></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">Encontre artes selecionadas, prepare suas opções e apresente a próxima ideia ao seu cliente. Sua biblioteca fica pronta para acompanhar os pedidos que vierem.</p><button onClick={() => goPurchase('final_cta')} className="cg-sales-button mt-7 w-full max-w-sm px-6 py-4 text-sm">{buyLabel} <ArrowUpRight size={18} /></button></div></section>
    </main>
    <footer className="border-t border-white/10 px-5 py-10 text-white/55 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 md:flex-row md:items-center"><Logo dark /><nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold"><Link href="/blog" className="hover:text-white">Blog do sublimador</Link><a href={SALES.STUDIO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white" onClick={() => track('cta_click', { location: 'footer_studio', intent: 'mockup' })}>Studio Mockup 3D ↗</a><Link href="/guia" className="hover:text-white">Guia completo</Link><Link href="/sobre" className="hover:text-white">Sobre a Click & Gruda</Link><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" className="hover:text-white">Suporte</a></nav><p className="text-[11px]">© {new Date().getFullYear()} Click & Gruda</p></div></footer>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#100d12]/95 px-4 py-3 backdrop-blur-xl lg:hidden"><button onClick={() => goPurchase('mobile_sticky')} className="cg-sales-button min-h-12 w-full px-4 py-3 text-sm">{buyLabel} <ArrowUpRight size={17} /></button></div>
  </div>
}
