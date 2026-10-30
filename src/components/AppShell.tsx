'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStore, type View } from '@/lib/store'
import { track } from '@/lib/analytics'
import { toast } from 'sonner'
import { formatArtCode } from '@/lib/art-code'
import { LandingView } from '@/components/views/LandingView'
import { SessionAccessDialog } from '@/components/shared/SessionAccessDialog'
const AuthView = dynamic(() => import('@/components/views/AuthView').then(module => module.AuthView))
const CheckoutView = dynamic(() => import('@/components/views/CheckoutView').then(module => module.CheckoutView))
const PortalView = dynamic(() => import('@/components/views/PortalView').then(module => module.PortalView))
const AdminView = dynamic(() => import('@/components/views/AdminView').then(module => module.AdminView))

const VALID_VIEWS: View[] = ['landing', 'auth', 'checkout', 'portal', 'admin']

/**
 * AppShell — casca client-side da SPA.
 *
 * GEO/LLMO: o estado inicial SEMPRE renderiza a view 'landing' durante o SSR
 * (crawlers de IA como GPTBot, ClaudeBot e PerplexityBot não executam JavaScript
 * e precisam receber o conteúdo completo no HTML bruto). A checagem de sessão
 * acontece depois, em useEffect, apenas ajustando a view quando necessário —
 * portanto usuários logados continuam caindo direto no portal/admin, agora
 * com a landing visível por alguns instantes em vez de uma splash screen.
 */
export function AppShell() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false } },
      })
  )

  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 520)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const setUser = useStore((s) => s.setUser)
  const userId = useStore(s => s.user?.id)
  const publicDemo = useStore(s => Boolean(s.user?.isPublicDemo))

  useEffect(() => {
    // Link direto da arte (?arte=42) — vem na mensagem do WhatsApp do cliente.
    // Abre o portal já buscando pelo código da arte.
    let arteParam: number | null = null
    try {
      const raw = new URLSearchParams(window.location.search).get('arte')
      const n = raw ? parseInt(raw, 10) : NaN
      arteParam = Number.isFinite(n) && n > 0 ? n : null
    } catch {
      arteParam = null
    }

    let cancelled = false
    const sessionRevision = useStore.getState().sessionRevision
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (cancelled || useStore.getState().sessionRevision !== sessionRevision) return
        setUser(data.user || null)
        if (data.reason === 'SESSION_REVOKED' || data.reason === 'ACCOUNT_BLOCKED') {
          useStore.getState().setSessionNotice(data.reason, data.deviceLimit)
        }
        if (arteParam) {
          useStore.getState().setFilter({ tab: 'todas', q: formatArtCode(arteParam), seasonalEventId: null })
          if (data.user?.hasAccess) {
            setView('portal')
          } else {
            useStore.getState().setAuthMode('login')
            setView(data.user ? 'landing' : 'auth')
          }
          return
        }
        let stored: string | null = null
        try {
          stored = sessionStorage.getItem('cg_view')
        } catch {
          stored = null
        }
        const next: View = stored && VALID_VIEWS.includes(stored as View) ? (stored as View) : 'landing'
        // Um link direto para uma seção comercial não deve restaurar o portal
        // da sessão anterior e ocultar a seção que o visitante solicitou.
        const landingAnchors = ['preco', 'investimento', 'faq', 'perguntas', 'artes', 'biblioteca', 'recursos', 'como-funciona', 'studio-mockup', 'video']
        if (landingAnchors.includes(window.location.hash.slice(1))) return
        if (next === 'portal' && (!data.user || !data.user.hasAccess)) return
        if (next === 'admin' && (!data.user || data.user.role !== 'ADMIN')) return
        if (next === 'checkout' && !data.user) return
        if (next !== useStore.getState().view) setView(next)
      } catch {
        /* mantém a landing */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setView, setUser])

  useEffect(() => {
    if (!userId) return
    let cancelled = false, running = false, lastCheck = 0
    const check = async () => {
      if (cancelled || running || document.visibilityState === 'hidden' || Date.now() - lastCheck < 10000) return
      running = true; lastCheck = Date.now()
      const revision = useStore.getState().sessionRevision
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!response.ok) return
        const data = await response.json()
        if (cancelled || useStore.getState().sessionRevision !== revision) return
        if (!data.user) {
          queryClient.clear()
          const state = useStore.getState()
          state.setUser(null); state.resetFilters(); state.setAuthMode('login'); state.setPendingIntent(null); state.setView(publicDemo ? 'landing' : 'auth')
          if (data.reason === 'SESSION_REVOKED' || data.reason === 'ACCOUNT_BLOCKED') state.setSessionNotice(data.reason, data.deviceLimit)
          else toast.info(publicDemo ? 'Esta visita terminou. Use Conhecer por dentro para abrir a demonstração novamente.' : 'Sua sessão terminou. Entre novamente para continuar.')
        } else {
          const current = useStore.getState().user
          if (current?.id !== data.user.id || current?.isDemo !== data.user.isDemo || current?.role !== data.user.role || current?.hasAccess !== data.user.hasAccess || current?.status !== data.user.status) {
            queryClient.clear(); setUser(data.user)
          }
        }
      } catch { /* Falha de conexão não encerra uma sessão válida. */ }
      finally { running = false }
    }
    const interval = window.setInterval(check, publicDemo ? 60000 : 30000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check) }
  }, [userId, publicDemo, queryClient, setUser])

  useEffect(() => {
    // Preserve internal deep links from blog/guia (/#preco, /#faq, /#artes).
    // Navigating between authenticated SPA views still resets to the top.
    if (view === 'landing' && window.location.hash) {
      let id = window.location.hash.slice(1)
      try { id = decodeURIComponent(id) } catch { /* malformed fragment */ }
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'auto' }))
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    track('spa_view_change', { view })
  }, [view])

  /* Scroll depth (25/50/75/100) — métrica de engajamento para GA4/GTM */
  useEffect(() => {
    const marks = new Set<number>()
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = Math.round((window.scrollY / max) * 100)
      for (const m of [25, 50, 75, 100]) {
        if (pct >= m && !marks.has(m)) {
          marks.add(m)
          track('scroll_depth', { percent: m, view: useStore.getState().view })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {view === 'landing' && <LandingView />}
            {view === 'auth' && <AuthView />}
            {view === 'checkout' && <CheckoutView />}
            {view === 'portal' && <PortalView />}
            {view === 'admin' && <AdminView />}
          </motion.div>
        </AnimatePresence>
        <SessionAccessDialog />
        {showBackToTop && <button type="button" title="Voltar ao topo" aria-label="Voltar ao topo da página" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })} className="fixed bottom-24 right-5 z-[65] flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-zinc-950 text-orange-400 shadow-xl transition hover:-translate-y-1 hover:bg-orange-600 hover:text-white focus-visible:outline-2 focus-visible:outline-orange-500 sm:bottom-24"><ArrowUp className="h-5 w-5"/></button>}
      </div>
    </QueryClientProvider>
  )
}
