'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Check, Download, Layers3, Menu, MessageCircle, Play, Search, ShieldCheck, Sparkles, Star, WandSparkles, X } from 'lucide-react'
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

const NAV = [['biblioteca', 'Biblioteca'], ['recursos', 'O que você recebe'], ['como-funciona', 'Como funciona'], ['investimento', 'Acesso'], ['faq', 'Dúvidas']] as const
const FEATURES = [
  { id: 'biblioteca', label: 'Encontre o que seu cliente pediu', title: 'A arte certa, sem perder a manhã procurando.', text: 'Busque por tema, ocasião ou estilo. Assim você dedica seu tempo ao pedido, não a abrir arquivos em pastas desorganizadas.', image: '/uploads/rebrand/busca-acervo.webp', alt: 'Mascote da Click & Gruda apresentando a busca por artes', points: ['Encontre artes para cada ocasião pelo nome ou categoria', 'Compare opções sem sair da biblioteca', 'Baixe o arquivo escolhido para preparar a impressão'] },
  { id: 'mockups', label: 'Mostre antes de produzir', title: 'Apresente a estampa na caneca em 3D.', text: 'Use o Studio Mockup para aplicar a arte escolhida em uma caneca virtual. Mostre uma prévia ao cliente antes da produção e tenha imagens para divulgar seu trabalho.', image: '/uploads/rebrand/mockup-studio.webp', alt: 'Prévia de caneca personalizada no gerador de mockups 3D', points: ['Visualize a proposta da caneca antes da impressão', 'Apresente opções ao cliente com mais clareza', 'Crie imagens para divulgar seus personalizados'] },
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
  const artCount = catalog?.counts?.arts ?? null
  const artCountLabel = artCount != null && artCount >= 100 ? `${artCount.toLocaleString('pt-BR')} artes prontas para conhecer` : artCount != null && artCount > 0 ? `${artCount.toLocaleString('pt-BR')} artes selecionadas com curadoria` : null
  const campaignActive = priceConfirmed && priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const hasAccess = Boolean(user?.hasAccess && !user.isDemo)
  const buyLabel = hasAccess ? 'Acessar minha plataforma' : campaignActive ? 'Garantir meu acesso vitalício' : 'Ver planos e valores'
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
  const scrollTo = (id: string) => { setMenuOpen(false); track('cta_click', { location: 'navigation', intent: id }); document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) }

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
      <section className="relative border-b border-white/10 bg-[radial-gradient(ellipse_at_85%_30%,rgba(255,123,34,.13),transparent_55%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-14 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:pb-20 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ff9b50]/25 bg-[#ff9b50]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#ffb580] sm:text-[11px]"><Star size={13} /> Biblioteca para quem vende canecas personalizadas</span>
            <h1 className="cg-sales-title mt-5">Escolha a arte, <span className="text-[#ff913f]">veja a caneca em 3D</span> e prepare a impressão com mais confiança.</h1>
            <p className="mt-5 max-w-[590px] text-[15px] leading-[1.75] text-white/75 sm:text-[17px]">{artCountLabel ? <><strong className="font-semibold text-white">{artCountLabel}.</strong>{' '}</> : null}Biblioteca de artes para sublimação, organizada por tema, com download do arquivo e Studio Mockup 3D. Novidades toda semana.</p>
            <ul className="mt-5 grid gap-3 text-[13px] text-white/85 sm:text-sm">
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9b50]" /> Encontre a arte por tema, ocasião ou estilo sem procurar em dezenas de pastas.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9b50]" /> Veja uma prévia 3D da caneca antes de gastar papel e tinta.</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9b50]" /> Baixe o arquivo para produção e confira as medidas do seu modelo de caneca.</li>
            </ul>
            <div className="mt-7 flex flex-col flex-wrap gap-3 sm:flex-row sm:items-start" aria-label="Escolha como conhecer a plataforma">
              <button type="button" onClick={() => goPurchase('hero_primary')} className="cg-sales-button min-h-12 px-7 py-3.5 text-sm sm:text-[15px]">{buyLabel} <ArrowUpRight size={18} /></button>
              {hasAccess
                ? <button type="button" onClick={() => setView('portal')} className="cg-sales-outline-button min-h-12 px-6 py-3.5 text-sm">Abrir biblioteca <ArrowRight size={17} /></button>
                : <DemoAccessButton location="landing_hero_arts" label="Conhecer as artes grátis" className="cg-sales-outline-button w-full px-6 py-3.5 text-white sm:w-auto" />}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <button type="button" onClick={() => scrollTo('video')} className="inline-flex items-center gap-2 font-semibold text-[#ffba8b] underline decoration-[#ff9b50]/40 underline-offset-4 hover:text-white"><Play size={16} /> Ver demonstração em vídeo</button>
              {!hasAccess && <span className="text-xs text-white/55">Você pode explorar a demonstração antes de contratar.</span>}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/65"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#ffab70]" />{hasAccess ? 'Seu acesso já está ativo. Entre no portal para ver o acervo.' : campaignActive ? <><strong className="font-semibold text-white">{price} no acesso vitalício promocional.</strong>{' '}Pagamento único, sem mensalidade para esta oferta.</> : priceConfirmed ? <><strong className="font-semibold text-white">{price}.</strong>{' '}Confira a modalidade e os termos atuais no checkout.</> : 'Consulte o preço e a modalidade de acesso atualizados ao avançar para o checkout.'}</p>
          </div>
          <div className="mx-auto w-full max-w-[510px]">
            <div className="relative overflow-hidden rounded-[30px] border border-[#ff9b50]/20 bg-[radial-gradient(ellipse_at_center,rgba(255,145,63,.13),transparent_70%),#131115] px-7 pb-2 pt-12 sm:px-10">
              <span className="absolute left-5 top-5 rounded-full border border-[#ff9b50]/20 bg-[#ff9b50]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-[#ffbc8d]">Seu parceiro criativo</span>
              <Image src="/uploads/rebrand/mascote-principal.webp" alt="Caneca mascote da Click & Gruda apresentando a plataforma de artes para sublimação" width={1122} height={1402} priority sizes="(max-width: 1023px) 85vw, 40vw" className="mx-auto block h-auto max-h-[445px] w-full object-contain" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">{[['Curadoria real', 'Artes escolhidas com cuidado'], ['Sempre em evolução', 'Novidades a cada semana']].map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4"><strong className="block text-sm font-bold text-[#ffad74]">{title}</strong><span className="mt-1 block text-xs leading-relaxed text-white/60">{text}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#161217]" aria-label="Diferenciais"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 py-7 sm:px-8 lg:grid-cols-4">{[{ Icon: Layers3, title: 'Variedade de temas', text: 'Para diferentes pedidos' }, { Icon: CalendarDays, title: 'Toda semana', text: 'Novidades na biblioteca' }, { Icon: WandSparkles, title: 'Mockup 3D', text: 'Para apresentar suas ideias' }, { Icon: Download, title: 'Downloads ilimitados', text: 'Com seu acesso ativo' }].map(({ Icon, title, text }) => <div key={title} className="flex items-start gap-3"><Icon size={21} className="mt-1 shrink-0 text-[#ff9b50]" /><div><strong className="text-[13px] font-bold sm:text-sm">{title}</strong><p className="mt-1 text-xs leading-relaxed text-white/60">{text}</p></div></div>)}</div></section>

      <section className="px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[1fr_1.15fr] lg:gap-16"><Reveal><p className="cg-sales-eyebrow">O que vale é a entrega</p><h2 className="cg-sales-heading mt-4">Seu tempo vale mais do que procurar arquivos.<span className="mt-1 block text-[#ff913f]">Use-o para atender pedidos.</span></h2></Reveal><Reveal><p className="text-base leading-8 text-white/75">Um número gigante no anúncio não resolve quando os arquivos vêm misturados e você precisa perder tempo separando o que serve. <strong className="font-semibold text-white">Seu negócio precisa de artes que você consiga encontrar, escolher e colocar para trabalhar.</strong></p><p className="mt-4 text-base leading-8 text-white/65">A Click & Gruda reúne curadoria, busca por tema e novidades semanais numa biblioteca fácil de explorar. Veja o sistema por dentro e decida com clareza.</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{[['Selecionadas', 'Cuidado na escolha das artes.'], ['Organizadas', 'Temas, busca e categorias.'], ['Renovadas', 'Novidades todas as semanas.']].map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><BadgeCheck size={19} className="text-[#ff9b50]" /><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-relaxed text-white/60">{text}</p></div>)}</div></Reveal></div><div className="mx-auto mt-9 flex max-w-7xl flex-wrap items-center gap-4 px-5 sm:px-8"><button type="button" onClick={() => goPurchase('benefits')} className="cg-sales-button px-6 py-3.5 text-sm">{buyLabel} <ArrowRight size={16}/></button><span className="text-xs text-white/55">Conheça a plataforma por dentro antes de contratar.</span></div></section>

      <section className="cg-sales-section border-y border-white/10 bg-[#110f13] px-5 py-16 sm:px-8 lg:py-20" aria-label="Comparação de formatos de biblioteca">
        <div className="mx-auto max-w-6xl">
          <p className="cg-sales-eyebrow">Não é mais um pack perdido no Drive</p>
          <h2 className="cg-sales-heading mt-4">Por que a Click & Gruda é diferente de um pack de artes soltas?</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">A diferença está no processo: pesquise dentro do sistema, escolha o arquivo e use o Studio Mockup 3D para apresentar sua ideia antes de produzir.</p>
          <div className="mt-7 overflow-x-auto rounded-[24px] border border-white/10 bg-[#1a151c]">
            <table className="w-full min-w-[580px] border-collapse text-left text-[13px] sm:text-sm">
              <thead><tr className="border-b border-white/10"><th className="w-1/2 px-5 py-4 font-semibold text-white/60">Em um pack de arquivos soltos</th><th className="px-5 py-4 font-bold text-[#ffb580]">Click & Gruda</th></tr></thead>
              <tbody>{[
                ['Você confere a arte isolada', 'Studio Mockup 3D para visualizar a caneca'],
                ['Ajustes e medidas precisam ser conferidos', 'Arquivo para download e conferência no seu fluxo de impressão'],
                ['Conteúdo estático, sem atualizações integradas', 'Novas artes adicionadas semanalmente'],
                ['Busca manual entre pastas e links', 'Busca por título, tema, categoria e tags no portal'],
              ].map(([before, after]) => <tr key={before} className="border-b border-white/10 last:border-0"><td className="px-5 py-4 text-white/60">{before}</td><td className="px-5 py-4 font-semibold text-white/90"><Check size={15} className="mr-2 inline-block text-[#ff9b50]" />{after}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-4"><button onClick={() => goPurchase('comparison')} className="cg-sales-button px-6 py-3 text-sm">{buyLabel} <ArrowUpRight size={16} /></button><span className="text-xs text-white/55">Veja o sistema em funcionamento antes de contratar.</span></div>
        </div>
      </section>

      <section id="video" className="cg-sales-section bg-[#131015] px-5 py-16 sm:px-8 lg:py-20"><div className="mx-auto max-w-5xl"><div className="mx-auto max-w-3xl text-center"><p className="cg-sales-eyebrow">Veja antes de decidir</p><h2 className="cg-sales-heading mt-4">Conheça a sua próxima biblioteca de artes.</h2><p className="mt-5 text-base leading-8 text-white/65">Assista à demonstração e veja como é explorar a plataforma. A melhor forma de entender o que você recebe é vendo tudo funcionar.</p></div><div className="mt-8 overflow-hidden rounded-[26px] border border-white/15 bg-black p-2"><div className="relative aspect-video overflow-hidden rounded-[19px]"><iframe title="Conheça a Click&Gruda — apresentação em vídeo" src="https://player.vimeo.com/video/1238613293?title=0&byline=0&portrait=0&dnt=1&loop=1&autopause=0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" /></div></div><div className="mt-7 text-center"><button onClick={() => goPurchase('after_video')} className="cg-sales-button px-7 py-4 text-sm">{buyLabel} <ArrowRight size={17} /></button></div></div></section>

      <section id="biblioteca" className="cg-sales-section py-16 lg:py-24"><div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16"><Reveal><p className="cg-sales-eyebrow">Um acervo de possibilidades</p><h2 className="cg-sales-heading mt-4">Do pedido de hoje à ideia que você ainda vai ter.</h2><p className="mt-5 text-base leading-8 text-white/70">Frases, profissões, fé, humor, amizade e datas especiais. Explore estilos para diferentes clientes e deixe suas favoritas à mão para o próximo pedido.</p><div className="mt-6 flex flex-wrap gap-2">{SALES.categories.slice(1).map(category => <span key={category} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-medium text-white/75">{category}</span>)}</div><p className="mt-6 flex items-center gap-2 text-sm font-medium text-[#ffb17c]"><Sparkles size={16} /> {artCountLabel ?? 'Artes selecionadas com curadoria, não volume artificial.'}</p></Reveal><Picture src="/uploads/rebrand/busca-acervo.webp" alt="Busca, categorias e coleções da biblioteca de artes Click & Gruda" /></div><div className="mx-auto mt-14 max-w-7xl px-5 sm:px-8"><h3 className="text-xl font-bold tracking-tight sm:text-2xl">{artCountLabel ? `Veja algumas das ${artCount?.toLocaleString('pt-BR')} artes da biblioteca.` : 'Uma prévia dos estilos que você encontra.'}</h3><p className="mt-2 text-xs text-white/55">Exemplos do acervo para conhecer a proposta visual.</p></div><ShowcaseCarousel /></section>

      <section id="recursos" className="cg-sales-section bg-[#131015] px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="mx-auto mb-10 max-w-3xl text-center"><p className="cg-sales-eyebrow">Da escolha à apresentação</p><h2 className="cg-sales-heading mt-4">Uma rotina mais prática começa com tudo no lugar.</h2></div><div className="space-y-7">{FEATURES.map((feature, i) => <Reveal key={feature.id}><article className="grid items-center gap-7 rounded-[28px] border border-white/10 bg-[#19151c] p-5 sm:p-8 lg:grid-cols-2 lg:gap-12"><div className={i % 2 ? 'lg:order-2' : ''}><p className="cg-sales-eyebrow">{feature.label}</p><h3 className="mt-4 text-[clamp(1.65rem,2.6vw,2.35rem)] font-bold leading-[1.16] tracking-[-.025em]">{feature.title}</h3><p className="mt-5 text-[15px] leading-8 text-white/70">{feature.text}</p><ul className="mt-6 space-y-3">{feature.points.map(point => <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-white/80"><Check size={17} className="mt-0.5 shrink-0 text-[#ff9b50]" />{point}</li>)}</ul><button onClick={() => goPurchase(`feature_${feature.id}`)} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#ffb17c] underline underline-offset-8">Conhecer meu acesso <ArrowUpRight size={16} /></button></div><div className={i % 2 ? 'lg:order-1' : ''}><Picture src={feature.image} alt={feature.alt} /></div></article></Reveal>)}</div><div className="mt-9 text-center"><button onClick={() => goPurchase('after_features')} className="cg-sales-button px-7 py-4 text-sm">{buyLabel} <ArrowRight size={17} /></button></div></div></section>

      <section id="como-funciona" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="cg-sales-eyebrow">Simples de colocar na rotina</p><h2 className="cg-sales-heading mt-4">Encontre. Baixe. Apresente.</h2><p className="mt-5 text-base leading-8 text-white/65">Da escolha da arte à conversa com o cliente, você ganha um caminho mais organizado para trabalhar.</p></div><ol className="mt-9 grid gap-4 md:grid-cols-3">{SALES.steps.map(step => <li key={step.num} className="rounded-[24px] border border-white/10 bg-white/[.03] p-6"><span className="text-3xl font-bold tracking-tight text-[#ff9b50]">{step.num}</span><h3 className="mt-5 text-xl font-bold">{step.title}</h3><p className="mt-2 text-sm font-medium text-white/85">{step.subtitle}</p><p className="mt-3 text-sm leading-7 text-white/60">{step.description}</p></li>)}</ol></div></section>

      <section id="investimento" className="cg-sales-section border-y border-white/10 bg-[#171219] px-5 py-16 sm:px-8 lg:py-24"><span id="preco" className="cg-sales-section block" /><div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16"><div><p className="cg-sales-eyebrow">Escolha praticidade para os próximos pedidos</p><h2 className="cg-sales-heading mt-4">Seu trabalho já exige muito.<span className="mt-1 block text-[#ff913f]">Encontrar artes pode ser mais fácil.</span></h2><p className="mt-5 text-base leading-8 text-white/70">Reúna sua busca por artes em um lugar organizado. Explore o acervo, acompanhe os lançamentos e use os recursos da plataforma para tirar suas ideias da tela.</p><ul className="mt-7 space-y-3">{['Biblioteca de artes com curadoria', 'Novidades adicionadas semanalmente', 'Downloads ilimitados com acesso ativo', 'Categorias, favoritos e datas sazonais', 'Gerador de mockups 3D incluído', 'Ferramentas para o seu dia a dia'].map(item => <li key={item} className="flex items-center gap-3 text-sm text-white/85"><BadgeCheck size={18} className="shrink-0 text-[#ff9b50]" />{item}</li>)}</ul></div><div className="rounded-[30px] border border-[#ff9b50]/35 bg-[#231a20] p-7 shadow-[0_24px_80px_rgba(0,0,0,.22)] sm:p-9"><span className="inline-flex rounded-full bg-[#ff913f]/15 px-3 py-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#ffb17c]">{campaignActive ? 'Oferta de acesso vitalício' : 'Acesso à plataforma'}</span><h3 className="mt-6 text-xl font-semibold">{campaignActive ? 'Uma compra. Sua biblioteca sempre por perto.' : 'Conheça as condições atuais de acesso.'}</h3><div className="mt-6 flex flex-wrap items-end gap-2"><strong className="text-[clamp(2rem,5vw,3.8rem)] font-bold leading-none tracking-[-.04em]">{priceConfirmed ? price : 'Consulte o valor'}</strong><span className="pb-1 text-sm text-white/60">{campaignActive ? 'pagamento único' : 'no checkout'}</span></div><p className="mt-4 text-sm leading-7 text-white/65">{campaignActive ? 'Sem mensalidade para quem contratar o acesso vitalício durante esta campanha. Novos lançamentos já estão incluídos.' : 'Veja preço, modalidade e condições vigentes no checkout antes de confirmar sua contratação.'}</p><button onClick={() => goPurchase('pricing')} className="cg-sales-button mt-7 w-full px-5 py-4 text-sm">{buyLabel} <ArrowUpRight size={18} /></button><p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/60"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#ffab70]" />Pagamento e liberação conforme a forma escolhida no checkout.</p>{campaignActive && <p className="mt-3 text-xs leading-relaxed text-white/50">Condição disponível para novas contratações até 31/12/2026. O acesso vitalício contratado continua após o fim da campanha.</p>}</div></div></section>

      <section id="faq" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[.75fr_1.25fr] lg:gap-16"><div><p className="cg-sales-eyebrow">Decida com clareza</p><h2 className="cg-sales-heading mt-4">O que você precisa saber antes de entrar.</h2><p className="mt-5 text-sm leading-7 text-white/65">Tem uma dúvida sobre o seu caso? Fale com a gente.</p><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" onClick={() => track('cta_click', { location: 'faq_support', intent: 'whatsapp' })} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"><MessageCircle size={16} className="text-[#ffab70]" /> Conversar no WhatsApp</a></div><div><Accordion type="single" collapsible onValueChange={value => { if (value) track('faq_open', { location: value }) }}>{LANDING_FAQ_INDICES.map(i => <AccordionItem key={FAQ_ITEMS[i].q} value={`faq-${i}`} className="border-white/10"><AccordionTrigger className="py-5 text-left text-[15px] font-semibold leading-7 text-white/90 hover:text-[#ffb17c] hover:no-underline">{FAQ_ITEMS[i].q}</AccordionTrigger><AccordionContent className="text-sm leading-7 text-white/65">{FAQ_ITEMS[i].a}</AccordionContent></AccordionItem>)}</Accordion><p className="mt-5 text-sm text-white/60">Quer mais detalhes? <Link href="/guia" className="font-semibold text-[#ffb17c] underline underline-offset-4">Veja o guia completo da plataforma.</Link></p></div></div></section>

      <section className="px-5 pb-16 sm:px-8 lg:pb-24"><div className="mx-auto max-w-7xl rounded-[30px] border border-[#ff9b50]/20 bg-[radial-gradient(ellipse_at_top,rgba(255,145,63,.15),transparent_75%),#19131b] px-6 py-12 text-center sm:px-10 sm:py-16"><p className="cg-sales-eyebrow">Sua próxima ideia começa aqui</p><h2 className="cg-sales-heading mx-auto mt-4 max-w-3xl">Você cuida dos seus clientes.<span className="mt-1 block text-[#ff913f]">A gente facilita suas artes.</span></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70">Curadoria, organização e novidades de verdade para acompanhar sua rotina de personalizados. Conheça a Click & Gruda e dê espaço para o seu próximo projeto.</p><button onClick={() => goPurchase('final_cta')} className="cg-sales-button mt-7 w-full max-w-sm px-6 py-4 text-sm">{buyLabel} <ArrowUpRight size={18} /></button></div></section>
    </main>
    <footer className="border-t border-white/10 px-5 py-10 text-white/55 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 md:flex-row md:items-center"><Logo dark /><nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold"><Link href="/blog" className="hover:text-white">Blog do sublimador</Link><Link href="/guia" className="hover:text-white">Guia completo</Link><Link href="/sobre" className="hover:text-white">Sobre a Click & Gruda</Link><a href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer" className="hover:text-white">Suporte</a></nav><p className="text-[11px]">© {new Date().getFullYear()} Click & Gruda</p></div></footer>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#100d12]/95 px-4 py-3 backdrop-blur-xl lg:hidden"><button onClick={() => goPurchase('mobile_sticky')} className="cg-sales-button min-h-12 w-full px-4 py-3 text-sm">{buyLabel} <ArrowUpRight size={17} /></button></div>
  </div>
}
