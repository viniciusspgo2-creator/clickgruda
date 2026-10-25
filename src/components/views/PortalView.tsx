'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarHeart,
  ArrowRight,
  ChevronDown,
  Check,
  RefreshCw,
  Clock3,
  Crown,
  Download,
  EyeOff,
  Flame,
  Heart,
  LayoutGrid,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Box,
  Store,
  SunMedium,
  MoonStar,
  ExternalLink,
  RotateCcw,
  Search,
  SearchX,
  Settings2,
  Layers3,
  ArrowUpRight,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wand2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Logo } from '@/components/shared/Logo'
import { ArtCard } from '@/components/shared/ArtCard'
import { ChipScroller } from '@/components/shared/ChipScroller'
import { ShareCatalogSection } from '@/components/portal/ShareCatalogSection'
import { ThemeSuggestionDialog } from '@/components/portal/ThemeSuggestionDialog'
import { TagFilterPanel } from '@/components/portal/TagFilterPanel'
import { DiscoveryShelf } from '@/components/portal/DiscoveryShelf'
import { ArtPreviewDialog } from '@/components/portal/ArtPreviewDialog'
import { EnhanceRequestDialog } from '@/components/portal/EnhanceRequestDialog'
import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
import { ZipDownloadDialog } from '@/components/portal/ZipDownloadDialog'
import { DailyLimitDialog } from '@/components/portal/DailyLimitDialog'
import { WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import { getCategoryIcon } from '@/lib/category-icons'
import { useStore, type PortalTab } from '@/lib/store'
import type { ArtItem, CatalogData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

type DownloadStates = Record<string, 'idle' | 'loading' | 'done'>
type ArtsPage = { arts: ArtItem[]; total: number; page: number; pageSize: number; hasMore: boolean }

const TABS: { id: PortalTab; label: string; icon: React.ElementType }[] = [
  { id: 'todas', label: 'Todas', icon: LayoutGrid },
  { id: 'lancamentos', label: 'Lançamentos', icon: Flame },
  { id: 'selecionadas', label: 'Selecionadas', icon: Star },
  { id: 'reprovadas', label: 'Artes reprovadas', icon: EyeOff },
  { id: 'sazonal', label: 'Sazonal', icon: CalendarHeart },
  { id: 'favoritas', label: 'Favoritas', icon: Heart },
  { id: 'downloads', label: 'Meus downloads', icon: Download },
  { id: 'compartilhar', label: 'Compartilhar', icon: Share2 },
]

function useCountdown(targetIso: string | null | undefined) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return useMemo(() => {
    if (!targetIso) return null
    const diff = Math.max(0, new Date(targetIso).getTime() - now)
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    }
  }, [targetIso, now])
}


/** A contagem regressiva precisa de atualização por segundo apenas na aba Sazonal.
 * Mantê-la isolada evita renderizar novamente centenas de cards do portal a cada tick. */
function SeasonalCountdown({ targetIso }: { targetIso?: string | null }) {
  const countdown = useCountdown(targetIso)
  if (!countdown) return null
  return (
    <div className="flex items-center gap-2.5" aria-label="Tempo até a data sazonal">
      {([
        [countdown.days, 'dias'],
        [countdown.hours, 'horas'],
        [countdown.minutes, 'min'],
        [countdown.seconds, 'seg'],
      ] as const).map(([value, label]) => (
        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-center shadow">
          <div className="text-xl font-black text-orange-400 tabular-nums">{String(value).padStart(2, '0')}</div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{label}</div>
        </div>
      ))}
    </div>
  )
}

function SeasonalHighlights({
  catalog,
  onOpenAll,
  onSelect,
}: {
  catalog?: CatalogData
  onOpenAll: () => void
  onSelect: (eventId: string) => void
}) {
  const items = [...(catalog?.events || [])]
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
    .slice(0, 4)

  if (!items.length) return null

  return (
    <aside className="cg-seasonal-spotlight" aria-label="Datas sazonais em destaque">
      <div className="cg-seasonal-spotlight-head">
        <div>
          <div className="cg-seasonal-kicker">Calendário criativo</div>
          <h3>Datas sazonais</h3>
        </div>
        <button type="button" onClick={onOpenAll} className="cg-seasonal-link">
          Ver todas <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="cg-seasonal-listing">
        {items.map((event) => {
          const dateLabel = new Date(event.nextDate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })
          return (
            <button key={event.id} type="button" onClick={() => onSelect(event.id)} className="cg-seasonal-card-item">
              <span className="cg-seasonal-card-icon" aria-hidden="true">{event.emoji}</span>
              <span className="cg-seasonal-card-copy">
                <span className="cg-seasonal-card-title">{event.name}</span>
                <span className="cg-seasonal-card-meta">{event.artCount} artes disponíveis</span>
              </span>
              <span className="cg-seasonal-card-side">
                <span className="cg-seasonal-card-date">{dateLabel}</span>
                <span className="cg-seasonal-card-days">{event.daysLeft}d</span>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export function PortalView() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const setView = useStore((s) => s.setView)
  const menuOpen = useStore((s) => s.menuOpen)
  const setMenuOpen = useStore((s) => s.setMenuOpen)
  const tab = useStore((s) => s.tab)
  const q = useStore((s) => s.q)
  const categoryIds = useStore((s) => s.categoryIds)
  const tagIds = useStore((s) => s.tagIds)
  const sort = useStore((s) => s.sort)
  const seasonalEventId = useStore((s) => s.seasonalEventId)
  const setFilter = useStore((s) => s.setFilter)
  const resetFilters = useStore((s) => s.resetFilters)

  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState(q)
  const searchRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [downloadStates, setDownloadStates] = useState<DownloadStates>({})
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [enhanceOpen, setEnhanceOpen] = useState(false)
  const [zipOpen, setZipOpen] = useState(false)
  const [limitDialog, setLimitDialog] = useState<number | null>(null)
  const [portalTheme, setPortalTheme] = useState<'dark' | 'light'>('dark')
  const [mockupDialogOpen, setMockupDialogOpen] = useState(false)
  const [shopDialogOpen, setShopDialogOpen] = useState(false)
  const [previewWelcomeOpen, setPreviewWelcomeOpen] = useState(false)
  useEffect(() => {
    if (!user?.isPreview) return
    try {
      if (sessionStorage.getItem(`cg-preview-welcome-${user.id}`) !== '1') setPreviewWelcomeOpen(true)
    } catch { setPreviewWelcomeOpen(true) }
  }, [user?.id, user?.isPreview])
  function dismissPreviewWelcome() {
    setPreviewWelcomeOpen(false)
    try { if (user?.id) sessionStorage.setItem(`cg-preview-welcome-${user.id}`, '1') } catch { /* private browsing */ }
  }
  const openMockup = () => user?.isPreview ? openExternal('https://clicktools.vercel.app/', 'preview_mockup_open') : setMockupDialogOpen(true)
  const openShop = () => user?.isPreview ? openExternal('https://www.clickgruda.com.br', 'preview_store_open') : setShopDialogOpen(true)


  // O campo acompanha mudanças externas (logo, limpar filtros, troca de página).
  useEffect(() => { setSearchInput(q) }, [q])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedTheme = window.localStorage.getItem('cg-portal-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') setPortalTheme(savedTheme)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('cg-portal-theme', portalTheme)
  }, [portalTheme])

  // Atalho de produtividade: Ctrl/⌘ + K abre a busca; Esc fecha o foco.
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) searchRef.current?.blur()
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [])

  // Debounce: não consulta o servidor a cada tecla.
  useEffect(() => {
    if (searchInput === q) return
    const t = setTimeout(() => setFilter({ q: searchInput.trim() }), 350)
    return () => clearTimeout(t)
  }, [searchInput, q, setFilter])

  // Vigia da sessão: se este aparelho foi desconectado (limite de dispositivos), volta para o login
  useEffect(() => {
    if (!user || user.role === 'ADMIN') return
    let stopped = false
    const check = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        const data = await res.json()
        if (stopped) return
        if (!data.user && data.reason === 'SESSION_REVOKED') {
          toast.info('Sua conta foi aberta em outro aparelho e este foi desconectado. Entre novamente para continuar.')
          setUser(null)
          setView('auth')
        }
      } catch {
        /* sem rede: tenta de novo no próximo ciclo */
      }
    }
    const timer = setInterval(check, 120_000)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, setUser, setView])

  // Guards (skip redirect if the active view already changed — e.g. during exit animation)
  useEffect(() => {
    const currentView = useStore.getState().view
    if (!user && currentView === 'portal') setView('auth')
    else if (user && !user.hasAccess && currentView === 'portal') setView('checkout')
  }, [user, setView])

  const catalogQ = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await fetch('/api/catalog')
      if (!res.ok) throw new Error('Falha ao carregar filtros')
      return res.json()
    },
    staleTime: 60_000,
  })

  const suggestionsQ = useQuery<{ suggestions: string[]; related: string[] }>({
    queryKey: ['art-suggestions', q],
    queryFn: async () => {
      const response = await fetch(`/api/arts/suggestions?q=${encodeURIComponent(q)}`)
      if (!response.ok) throw new Error('Sugestões indisponíveis')
      return response.json()
    },
    enabled: !!user?.hasAccess && searchFocused && q.length >= 2,
    staleTime: 30_000,
    retry: false,
  })

  const params = new URLSearchParams({ tab, sort })
  if (q) params.set('q', q)
  if (categoryIds.length) params.set('categories', categoryIds.join(','))
  if (tagIds.length) params.set('tags', tagIds.join(','))
  if (tab === 'sazonal' && seasonalEventId) params.set('event', seasonalEventId)

  // Paginação no servidor + rolagem infinita (o acervo pode ter milhares de artes)
  const artsQ = useInfiniteQuery<ArtsPage, Error, InfiniteData<ArtsPage, number>, unknown[], number>({
    queryKey: ['arts', tab, q, categoryIds, tagIds, sort, seasonalEventId],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams(params)
      p.set('page', String(pageParam))
      const res = await fetch(`/api/arts?${p.toString()}`)
      if (!res.ok) throw new Error('Falha ao carregar as artes')
      return res.json()
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !!user?.hasAccess && tab !== 'compartilhar',
    staleTime: 15_000,
    retry: 1,
  })

  // "Todas as datas" representa realmente todos os eventos.
  // Nenhum efeito reativa o próximo evento depois que o cliente limpa o filtro.

  const selectedEvent = catalogQ.data?.events.find((e) => e.id === seasonalEventId)

  // ---------- Favorite (optimistic) ----------
  const favMutation = useMutation({
    mutationFn: async (artId: string) => {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artId }),
      })
      if (!res.ok) throw new Error('fail')
      return res.json() as Promise<{ favorited: boolean }>
    },
    onMutate: async (artId: string) => {
      queryClient.setQueriesData<InfiniteData<ArtsPage, number>>({ queryKey: ['arts'] }, (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((pg) => ({
                ...pg,
                arts: pg.arts.map((a) => (a.id === artId ? { ...a, favorited: !a.favorited } : a)),
              })),
            }
          : old
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      if (tab === 'favoritas') queryClient.invalidateQueries({ queryKey: ['arts'] })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['arts'] })
      toast.error('Não foi possível favoritar. Tente de novo.')
    },
  })

  const toggleFavorite = (art: ArtItem) => {
    if (user?.isDemo) {
      toast.info('Favoritos ficam disponíveis após a ativação do acesso.')
      return
    }
    track('favorite_toggle', { artId: art.id, artTitle: art.title })
    favMutation.mutate(art.id)
  }

  // ---------- Download ----------
  const handleDownload = async (art: ArtItem) => {
    if (!user) {
      setView('auth')
      return
    }
    if (!user.hasAccess) {
      setView('checkout')
      return
    }
    if (user.isDemo) {
      toast.info('Modo demonstração: os downloads são liberados após a ativação do seu acesso.')
      return
    }
    setDownloadStates((s) => ({ ...s, [art.id]: 'loading' }))
    try {
      const res = await fetch(`/api/arts/${art.id}/download`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.code === 'DAILY_LIMIT') setLimitDialog(Number(data.limit) || 500)
        else toast.error(data.error || 'Erro ao baixar a arte.')
        setDownloadStates((s) => ({ ...s, [art.id]: 'idle' }))
        return
      }
      let url: string
      let signed = false
      if ((res.headers.get('content-type') || '').includes('application/json')) {
        const data = await res.json()
        url = data.url // URL assinada do original (R2 privado) — o próprio R2 força o download
        signed = true
      } else {
        url = URL.createObjectURL(await res.blob())
      }
      const a = document.createElement('a')
      a.href = url
      const safeTitle = art.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()
      a.download = `click-gruda-${safeTitle}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      if (!signed) URL.revokeObjectURL(url)
      setDownloadStates((s) => ({ ...s, [art.id]: 'done' }))
      toast.success(`"${art.title}" baixada com sucesso! 🎉`)
      track('art_download', { artId: art.id, artTitle: art.title, category: art.category?.name })
      queryClient.invalidateQueries({ queryKey: ['arts'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch {
      toast.error('Falha no download. Tente novamente.')
      setDownloadStates((s) => ({ ...s, [art.id]: 'idle' }))
    }
  }

  const arts = useMemo(() => {
    const seen = new Set<string>()
    const out: ArtItem[] = []
    for (const pg of artsQ.data?.pages ?? []) {
      for (const a of pg.arts) {
        if (!seen.has(a.id)) {
          seen.add(a.id)
          out.push(a)
        }
      }
    }
    return out
  }, [artsQ.data])
  const total = artsQ.data?.pages[0]?.total ?? 0
  const previewArt = arts.find((art) => art.id === previewId) ?? null

  const scrollToResults = () => {
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }))
  }
  const navigateTab = (nextTab: PortalTab, nextSort?: typeof sort) => {
    setFilter({ tab: nextTab, categoryIds: [], tagIds: [], q: '', seasonalEventId: null, ...(nextSort ? { sort: nextSort } : {}) })
    setSearchInput('')
    scrollToResults()
  }
  const toggleTheme = () => setPortalTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  const mockupSupportMessage = 'Olá! Sou assinante da Click & Gruda e quero solicitar o meu código grátis para acessar o gerador de mockups 3D.'
  const shopSupportMessage = 'Olá! Quero solicitar o meu voucher vitalício da Loja Online da Click & Gruda.'

  const openExternal = (url: string, source: string) => {
    track(source, { source: 'portal' })
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const toggleCategory = (id: string) => {
    setFilter({ tab: 'todas', categoryIds: categoryIds.includes(id) ? categoryIds.filter((value) => value !== id) : [id], tagIds: [], seasonalEventId: null })
    scrollToResults()
  }
  const viewSeasonal = (id: string) => {
    setFilter({ tab: 'sazonal', categoryIds: [], tagIds: [], q: '', seasonalEventId: id })
    setSearchInput('')
    scrollToResults()
  }
  const viewTag = (id: string) => {
    setFilter({ tab: 'todas', categoryIds: [], tagIds: [id], seasonalEventId: null, q: '' })
    setSearchInput('')
    scrollToResults()
  }
  const applySuggestion = (text: string) => {
    setSearchInput(text)
    setFilter({ q: text, tab: 'todas', seasonalEventId: null, categoryIds: [], tagIds: [] })
    setSearchFocused(false)
    searchRef.current?.blur()
    scrollToResults()
  }

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = artsQ

  if (!user || !user.hasAccess) return null

  const counts = catalogQ.data?.counts

  const activeFilterChips: { label: string; onRemove: () => void }[] = [
    ...categoryIds.map((id) => ({
      label: catalogQ.data?.categories.find((c) => c.id === id)?.name || 'Categoria',
      onRemove: () => setFilter({ categoryIds: categoryIds.filter((c) => c !== id) }),
    })),
    ...tagIds.map((id) => ({
      label: `#${catalogQ.data?.tags.find((t) => t.id === id)?.name || 'tag'}`,
      onRemove: () => setFilter({ tagIds: tagIds.filter((t) => t !== id) }),
    })),
  ]

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    try { if (user?.isPreview) sessionStorage.removeItem(`cg-preview-welcome-${user.id}`) } catch { /* ignore */ }
    setUser(null)
    resetFilters()
    setView('landing')
  }

  return (
    <div onContextMenu={user.isDemo ? (event) => event.preventDefault() : undefined} className={cn("cg-portal relative flex min-h-screen flex-col bg-[#080d18] text-slate-100 lg:pl-[248px]", portalTheme === 'light' && 'cg-theme-light')}>
      {/* Navegação fixa de desktop. Todos os destinos usam os filtros originais da biblioteca. */}
      <aside className="cg-portal-sidebar fixed inset-y-0 left-0 z-50 hidden w-[248px] flex-col lg:flex" aria-label="Navegação principal da Click&Gruda">
        <button type="button" className="cg-sidebar-brand" onClick={() => { resetFilters(); setSearchInput(''); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }} aria-label="Ir para a página inicial da biblioteca">
          <Logo dark />
        </button>
        <div className="cg-sidebar-welcome">
          <span className="cg-sidebar-welcome-dot" /> SUA ÁREA CRIATIVA
        </div>
        <div className="cg-sidebar-scroll no-scrollbar">
          <p className="cg-sidebar-heading">BIBLIOTECA</p>
          <nav className="cg-sidebar-nav" aria-label="Explorar a biblioteca">
            {TABS.map((item) => {
              const active = tab === item.id
              const count = item.id === 'todas' ? counts?.arts : item.id === 'lancamentos' ? counts?.lancamentos : item.id === 'selecionadas' ? counts?.selecionadas : item.id === 'reprovadas' ? counts?.reprovadas : item.id === 'favoritas' ? counts?.favoritas : item.id === 'downloads' ? counts?.minhasDownloads : undefined
              return (
                <button key={item.id} type="button" aria-current={active ? 'page' : undefined}
                  onClick={() => setFilter({ tab: item.id, ...(item.id === 'todas' ? { sort: 'recentes' } : {}), ...(item.id !== 'sazonal' ? { seasonalEventId: null } : {}) })}
                  className={cn('cg-sidebar-link', active && 'cg-sidebar-link-active')}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 flex-1 text-left">{item.label === 'Todas' ? 'Visão geral' : item.label}</span>
                  {typeof count === 'number' && count > 0 && <span className="cg-sidebar-count">{count > 9999 ? `${Math.floor(count / 1000)}k+` : count.toLocaleString('pt-BR')}</span>}
                </button>
              )
            })}
          </nav>
          <p className="cg-sidebar-heading mt-7">ACESSO RÁPIDO</p>
          <nav className="cg-sidebar-nav" aria-label="Atalhos da plataforma">
            <button type="button" className="cg-sidebar-link" onClick={() => { setMenuOpen(true) }}><SlidersHorizontal className="h-[18px] w-[18px]"/><span>Categorias e filtros</span><ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-50"/></button>
            <button type="button" className="cg-sidebar-link" onClick={() => { navigateTab('todas', 'baixadas') }}><Flame className="h-[18px] w-[18px]"/><span>Mais baixadas</span></button>
            {!user.isDemo && <button type="button" className="cg-sidebar-link" onClick={() => setZipOpen(true)}><Download className="h-[18px] w-[18px]"/><span>Baixar catálogo em ZIP</span></button>}
            <button type="button" className="cg-sidebar-link" onClick={() => user.isDemo ? toast.info('Sugestões liberadas após a assinatura.') : setSuggestionOpen(true)}><Lightbulb className="h-[18px] w-[18px]"/><span>Sugerir uma arte</span></button>
            {user.role === 'ADMIN' && <button type="button" className="cg-sidebar-link" onClick={() => setView('admin')}><Settings2 className="h-[18px] w-[18px]"/><span>Painel Master</span></button>}
          </nav>
        </div>
        <div className="cg-sidebar-bottom">
          <span className="cg-sidebar-status"><ShieldCheck className="h-4 w-4"/> Membro com acesso ativo</span>
          <p>Seu espaço para criar sem limites de ideias.</p>
        </div>
      </aside>
      {/* ================= HEADER ================= */}
      <header className="cg-portal-header sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-3 px-4 sm:px-7">
          <Button
            variant="outline"
            onClick={() => setMenuOpen(true)}
            className="cg-header-explore h-10 shrink-0 gap-2 rounded-xl font-bold transition-colors"
            aria-label="Abrir categorias e filtros"
          >
            <Menu className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Categorias</span>
            {categoryIds.length + tagIds.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{categoryIds.length + tagIds.length}</span>}
          </Button>

          <button onClick={() => { resetFilters(); setSearchInput('') }} aria-label="Início do portal" className="shrink-0 lg:hidden">
            <Logo compact />
          </button>

          <div className="relative min-w-0 flex-1 sm:max-w-2xl" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSearchFocused(false)
          }}>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={searchRef}
              aria-label="Buscar artes por título, categoria, tag ou código"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applySuggestion(searchInput.trim())
                }
                if (e.key === 'Escape') setSearchFocused(false)
              }}
              autoComplete="off"
              placeholder="O que você quer criar hoje? Busque temas, personagens, códigos..."
              className="cg-portal-search h-11 rounded-xl pl-10 pr-9 text-sm focus-visible:ring-orange-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {searchFocused && searchInput.trim().length >= 2 && (
              <div className="cg-search-suggestions absolute left-0 right-0 top-[calc(100%+9px)] z-[70] max-h-[350px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl" role="group" aria-label="Sugestões de busca">
                <p className="px-3 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">Buscar no acervo</p>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applySuggestion(searchInput.trim())} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold text-orange-700 hover:bg-orange-50"><Search className="h-4 w-4" /> Pesquisar “{searchInput.trim()}” <ArrowRight className="ml-auto h-4 w-4" /></button>
                {(suggestionsQ.data?.suggestions || []).map((title) => (
                  <button key={title} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applySuggestion(title)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-50"><Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" /><span className="line-clamp-1">{title}</span></button>
                ))}
                {(suggestionsQ.data?.related.length ?? 0) > 0 && <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">Também pode interessar</p>}
                <div className="flex flex-wrap gap-1 px-2 pb-1">{(suggestionsQ.data?.related || []).map((related) => <button type="button" key={related} onMouseDown={(e) => e.preventDefault()} onClick={() => applySuggestion(related)} className="rounded-lg bg-zinc-100 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 hover:bg-orange-50 hover:text-orange-700">{related}</button>)}</div>
              </div>
            )}
          </div>

          {/* Acessos rápidos: mesmos destinos dos cards já existentes. */}
          <div className="cg-header-quicklinks hidden shrink-0 items-center gap-2 md:flex" aria-label="Acessos rápidos">
            <button
              type="button"
              aria-label="Abrir informações do Gerador de Mockup"
              title="Gerador de Mockup"
              onClick={openMockup}
              className="cg-header-quicklink"
            >
              <Box className="h-4 w-4 shrink-0" />
              <span className="cg-header-quicklabel">Gerador de Mockup</span>
              <ExternalLink className="cg-header-external h-3 w-3 shrink-0" />
            </button>
            <button
              type="button"
              aria-label="Abrir informações da Loja Online"
              title="Loja Online"
              onClick={openShop}
              className="cg-header-quicklink cg-header-quicklink-shop"
            >
              <Store className="h-4 w-4 shrink-0" />
              <span className="cg-header-quicklabel">Loja Online</span>
              <ExternalLink className="cg-header-external h-3 w-3 shrink-0" />
            </button>
            <button type="button" onClick={toggleTheme} className="cg-theme-toggle" aria-label={portalTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'} title={portalTheme === 'dark' ? 'Tema claro' : 'Tema escuro'}>
              {portalTheme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              <span className="cg-header-quicklabel">{portalTheme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Admin quick access */}
          {user.role === 'ADMIN' && (
            <Button
              variant="outline"
              onClick={() => setView('admin')}
              className="hidden h-10 shrink-0 rounded-xl border-white/15 bg-white/5 font-bold text-orange-300 hover:bg-white/10 lg:hidden md:inline-flex"
            >
              <Settings2 className="mr-1.5 h-4 w-4" />
              Painel Master
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cg-user-trigger flex shrink-0 items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-black text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[110px] truncate text-sm font-bold text-slate-100 xl:inline">
                  {user.name.split(' ')[0]}
                </span>
                <Crown className="h-3.5 w-3.5 text-orange-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="text-sm font-bold text-zinc-900">{user.name}</div>
                <div className="truncate text-xs font-normal text-zinc-400">{user.email}</div>
              </DropdownMenuLabel>
              <div className="px-2 pb-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                  <ShieldCheck className="h-3 w-3" /> Acesso ativo
                </span>
              </div>
              <DropdownMenuSeparator />
              {user.role === 'ADMIN' && (
                <DropdownMenuItem onClick={() => setView('admin')} className="font-bold text-orange-600">
                  <Settings2 className="mr-2 h-4 w-4" /> Painel Master
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setView('landing')}>
                <Sparkles className="mr-2 h-4 w-4" /> Ver landing page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => user.isDemo ? toast.info('Sugestões liberadas após a assinatura.') : setSuggestionOpen(true)} className="font-bold text-orange-600">
                <Lightbulb className="mr-2 h-4 w-4" /> Sugerir uma nova arte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Atalhos próprios do mobile — mantêm a busca legível no cabeçalho. */}
        <nav className="cg-mobile-quicklinks mx-auto flex w-full max-w-[1600px] items-center gap-2 px-4 pb-2.5 md:hidden sm:px-7" aria-label="Ferramentas rápidas">
          <button type="button" onClick={openMockup} className="cg-header-quicklink flex-1 justify-center">
            <Box className="h-4 w-4" /> Gerador de Mockup <ExternalLink className="h-3 w-3" />
          </button>
          <button type="button" onClick={openShop} className="cg-header-quicklink cg-header-quicklink-shop flex-1 justify-center">
            <Store className="h-4 w-4" /> Loja Online <ExternalLink className="h-3 w-3" />
          </button>
          <button type="button" onClick={toggleTheme} className="cg-theme-toggle flex-none px-3">
            {portalTheme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
        </nav>

        {/* Tabs */}
        <div className="cg-portal-mobile-tabs mx-auto w-full max-w-[1600px] px-4 sm:px-7 lg:hidden">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2.5 pt-1">
            {TABS.map((t) => {
              const active = tab === t.id
              const badge =
                t.id === 'todas'
                  ? counts?.arts
                  : t.id === 'lancamentos'
                    ? counts?.lancamentos
                    : t.id === 'selecionadas'
                      ? counts?.selecionadas
                      : t.id === 'reprovadas'
                    ? counts?.reprovadas
                    : t.id === 'favoritas'
                      ? counts?.favoritas
                      : t.id === 'downloads'
                        ? counts?.minhasDownloads
                        : null
              return (
                <button
                  key={t.id}
                  onClick={() => setFilter({ tab: t.id, ...(t.id !== 'sazonal' ? { seasonalEventId: null } : {}) })}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors',
                    active ? 'text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="portal-tab-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-500/30"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <t.icon className={cn('h-4 w-4', active && 'text-white', !active && t.id === 'favoritas' && 'text-zinc-400', !active && t.id === 'selecionadas' && 'text-amber-500')} />
                  {t.label}
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                        active ? 'bg-white/25 text-white' : 'bg-white/10 text-slate-300'
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* ================= DEMO BANNER ================= */}
      {user.isDemo && (
        <div className="border-b border-orange-200 bg-orange-50 px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-orange-700">
              <EyeOff className="h-4 w-4" />
              Você está no modo demonstração
            </span>
            <span className="text-[13px] text-zinc-500">
              As artes ficam protegidas (embaçadas) e os downloads bloqueados até a ativação do acesso.
            </span>
          </div>
        </div>
      )}

      {/* Download ZIP permanece disponível no menu lateral, sem faixa ocupando o topo. */}

      {/* ================= HERO PANORÂMICA / EXPERIÊNCIA 3.8 =================
          Um único fundo sem recortes. Títulos, CTAs e números são HTML interativo
          sobre a área escura livre da imagem. Em telas estreitas ficam abaixo. */}
      {tab === 'todas' && !q && categoryIds.length === 0 && tagIds.length === 0 && (
        <section className="cg-welcome-shell cg-complete-hero-shell mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-7 lg:pt-8" aria-label="Boas-vindas à biblioteca">
          <div className="cg-hero-seamless">
            {/* A composição de fundo é UMA imagem inteira: sem colunas, cortes ou zoom. */}
            <img
              src="/uploads/cg-hero-fundo-limpo.webp"
              alt=""
              className="cg-hero-seamless-image"
              width={2048}
              height={682}
              fetchPriority="high"
              decoding="async"
            />
            <div className="cg-hero-seamless-shade" aria-hidden="true" />
            <div className="cg-hero-seamless-copy">
              <p className="cg-hero-kicker">SUA BIBLIOTECA, SEU PRÓXIMO PROJETO</p>
              <p className="cg-hero-greeting">Olá, {user.name.split(' ')[0]}<span aria-hidden="true"> ✦</span></p>
              <h1 className="cg-hero-title">Sua criatividade <span>em outro nível.</span></h1>
              <p className="cg-hero-description">
                Artes para personalizados, ferramentas exclusivas e muito mais para você produzir com agilidade, praticidade e visual profissional.
              </p>
              <div className="cg-hero-dynamic-actions" aria-label="Ações da biblioteca">
                <button type="button" className="cg-primary-action" onClick={() => navigateTab('todas', 'recentes')}>
                  <Layers3 className="h-4 w-4" /> Explorar artes <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" className="cg-secondary-action" onClick={() => navigateTab('lancamentos', 'recentes')}>
                  <Flame className="h-4 w-4" /> Ver lançamentos
                </button>
              </div>
              <div className="cg-hero-metrics" aria-label="Indicadores da plataforma">
                <div className="cg-hero-metric">
                  <Layers3 className="h-[18px] w-[18px] text-orange-400" />
                  <span><strong aria-live="polite">{counts?.arts != null ? counts.arts.toLocaleString('pt-BR') : '…'}</strong>artes no acervo</span>
                </div>
                <div className="cg-hero-metric">
                  <Star className="h-[18px] w-[18px] text-orange-400" />
                  <span><strong>45+</strong>ferramentas</span>
                </div>
                <div className="cg-hero-metric">
                  <Sparkles className="h-[18px] w-[18px] text-orange-400" />
                  <span><strong>Novidades</strong>toda semana</span>
                </div>
              </div>
            </div>
          </div>
          <p className="cg-hero-mobile-context">
            <strong>Sua criatividade em outro nível.</strong> Artes para personalizados, ferramentas exclusivas e muito mais para você produzir mais rápido.
          </p>
          <div className="cg-hero-mobile-actions" aria-label="Ações da biblioteca">
            <button type="button" className="cg-primary-action" onClick={() => navigateTab('todas', 'recentes')}>
              <Layers3 className="h-4 w-4" /> Explorar artes <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" className="cg-secondary-action" onClick={() => navigateTab('lancamentos', 'recentes')}>
              <Flame className="h-4 w-4" /> Ver lançamentos
            </button>
          </div>
        </section>
      )}

      {/* ================= SEASONAL HERO ================= */}
      {tab === 'sazonal' && catalogQ.data && (
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-2xl sm:p-8"
          >
            <div className="bg-grid-dark absolute inset-0" aria-hidden />
            <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-orange-600/30 blur-[70px]" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15 text-4xl shadow-inner">
                  {(selectedEvent || catalogQ.data.nextEvent)?.emoji}
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">
                    Próxima data comemorativa
                  </p>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {(selectedEvent || catalogQ.data.nextEvent)?.name}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                    <Clock3 className="h-3.5 w-3.5 text-orange-400" />
                    {new Date((selectedEvent || catalogQ.data.nextEvent)?.nextDate || '').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <SeasonalCountdown targetIso={selectedEvent?.nextDate || catalogQ.data.nextEvent?.nextDate} />
            </div>

            {/* Event chips — setas + arrastar + deslizar; centraliza a data ativa */}
            <ChipScroller className="relative mt-6" activeKey={seasonalEventId || 'all'}>
              <button
                data-active={!seasonalEventId}
                onClick={() => setFilter({ seasonalEventId: null })}
                className={cn(
                  'shrink-0 select-none rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                  !seasonalEventId ? 'bg-orange-500 text-white shadow-md shadow-orange-600/30' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                )}
              >
                Todas as datas
              </button>
              {catalogQ.data.events.map((e) => (
                <button
                  key={e.id}
                  data-active={seasonalEventId === e.id}
                  onClick={() => setFilter({ seasonalEventId: e.id })}
                  className={cn(
                    'flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                    seasonalEventId === e.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-600/30'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  )}
                >
                  <span>{e.emoji}</span> {e.name}
                  <span className={cn('rounded-full px-1.5 text-[10px]', seasonalEventId === e.id ? 'bg-white/25' : 'bg-zinc-800')}>
                    {e.artCount}
                  </span>
                </button>
              ))}
            </ChipScroller>
          </motion.div>
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <main className="cg-portal-main mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-7 lg:py-8">
        
        {tab === 'todas' && !q && (
          <div className="cg-overview-row mb-7">
            <DiscoveryShelf catalog={catalogQ.data} onTab={navigateTab} onCategory={toggleCategory} onSeasonal={viewSeasonal} activeCategories={categoryIds} />
          </div>
        )}

        {/* Informações de assinatura ocupam apenas uma linha e não empurram a grade. */}
        {tab !== 'compartilhar' && (
          <div className="cg-member-toolbar mb-5 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Ações e informações da biblioteca">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400"><ShieldCheck className="h-4.5 w-4.5" /></span>
              <div>
                <p className="text-xs font-extrabold text-slate-100">Sua biblioteca, sempre à mão</p>
                <p className="text-[11px] leading-relaxed text-slate-300">{catalogQ.data?.quota?.limit ? `Downloads hoje: ${catalogQ.data.quota.used} de ${catalogQ.data.quota.limit}` : 'Encontre, favorite e baixe suas artes'} · Não achou o que queria? Peça uma arte.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button onClick={() => user.isDemo ? toast.info('Sugestões liberadas após a assinatura.') : setSuggestionOpen(true)} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-orange-400/30 bg-orange-500/15 px-3 text-xs font-bold text-orange-200 transition-colors hover:bg-orange-500/25 sm:flex-none"><Lightbulb className="h-3.5 w-3.5" /> Sugerir arte</button>
              <button onClick={() => (user.isDemo ? toast.info('Disponível após a ativação do acesso.') : setEnhanceOpen(true))} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#0b1423] px-3 text-xs font-bold text-slate-100 transition-colors hover:bg-[#253550] sm:flex-none"><Wand2 className="h-3.5 w-3.5" /> Melhorar minha arte</button>
            </div>
          </div>
        )}

        {tab !== 'compartilhar' && (
          <div className="cg-filter-toolbar sticky top-[82px] z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-2.5 sm:top-[82px]" aria-label="Barra de navegação das artes">
            <button type="button" onClick={() => setMenuOpen(true)} className="cg-filter-button inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold"><SlidersHorizontal className="h-4 w-4" /> Categorias e filtros{categoryIds.length + tagIds.length > 0 ? ` (${categoryIds.length + tagIds.length})` : ''}</button>
            <span className="hidden text-xs font-semibold text-slate-300 sm:inline">{total.toLocaleString('pt-BR')} {total === 1 ? 'resultado' : 'resultados'}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-xs font-semibold text-slate-300 sm:inline">Ordenar por</span>
              <Select value={sort} onValueChange={(value) => setFilter({ sort: value as typeof sort })}>
                <SelectTrigger className="cg-sort-trigger h-9 w-[157px] rounded-xl text-xs font-bold sm:w-[172px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="recentes">Mais recentes</SelectItem><SelectItem value="baixadas">Mais baixadas</SelectItem><SelectItem value="nome">Nome (A–Z)</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active filters */}
        {(activeFilterChips.length > 0 || q) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {q && (
              <button
                onClick={() => setSearchInput('')}
                className="flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-bold text-white"
              >
                Busca: "{q}" <X className="h-3 w-3" />
              </button>
            )}
            {activeFilterChips.map((chip, i) => (
              <button
                key={i}
                onClick={chip.onRemove}
                className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-200"
              >
                {chip.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={() => {
                resetFilters()
                setSearchInput('')
              }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-red-500"
            >
              <RotateCcw className="h-3 w-3" /> limpar tudo
            </button>
          </div>
        )}

        <div ref={resultsRef} className="cg-library-heading mb-5 flex scroll-mt-36 items-baseline justify-between">
          <h1 className="text-lg font-black tracking-tight text-zinc-900 sm:text-xl">
            {tab === 'todas' && 'Todo o acervo'}
            {tab === 'lancamentos' && (
              <span className="flex items-center gap-2">
                Lançamentos <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">novo</span>
              </span>
            )}
            {tab === 'reprovadas' && 'Sub-biblioteca · Artes com design reprovado'}
            {tab === 'selecionadas' && (
              <span className="flex items-center gap-2">
                Artes selecionadas <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-500" />
              </span>
            )}
            {tab === 'sazonal' && 'Artes sazonais'}
            {tab === 'favoritas' && 'Suas favoritas'}
            {tab === 'downloads' && 'Baixadas por você'}
            {tab === 'compartilhar' && 'Compartilhar catálogo'}
          </h1>
          <span className="text-sm font-semibold text-slate-300">
            {total} {total === 1 ? 'arte' : 'artes'}
          </span>
        </div>

        {/* Grid */}
        {tab === 'compartilhar' ? (
          user.isDemo ? <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center text-sm font-bold text-orange-800">A criação de catálogos compartilhados está bloqueada na conta de avaliação.</div> : <ShareCatalogSection />
        ) : artsQ.isError ? (
          <div role="alert" className="rounded-3xl border border-rose-200 bg-white px-5 py-12 text-center shadow-sm">
            <SearchX className="mx-auto h-9 w-9 text-rose-400" />
            <h2 className="mt-3 text-lg font-black text-zinc-900">Não foi possível carregar as artes</h2>
            <p className="mt-1 text-sm text-zinc-500">Verifique sua conexão e tente novamente. Seus filtros foram preservados.</p>
            <Button onClick={() => artsQ.refetch()} className="mt-5 rounded-xl bg-orange-500 font-bold hover:bg-orange-600"><RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente</Button>
          </div>
        ) : artsQ.isLoading ? (
          <div className="cg-member-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-3.5">
                <Skeleton className="aspect-[16/9] w-full rounded-xl bg-zinc-100" />
                <Skeleton className="mt-3 h-4 w-2/3 rounded bg-zinc-100" />
                <Skeleton className="mt-2 h-3 w-1/3 rounded bg-zinc-100" />
                <Skeleton className="mt-3 h-9 w-full rounded-xl bg-zinc-100" />
              </div>
            ))}
          </div>
        ) : arts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
              <SearchX className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="mt-4 text-lg font-black text-zinc-800">Nenhuma arte encontrada</h3>
            <p className="mt-1 max-w-xs text-sm text-zinc-400">
              {tab === 'favoritas'
                ? 'Toque no coraçãozinho das artes que você ama para vê-las aqui.'
                : tab === 'selecionadas'
                  ? 'As artes especiais escolhidas a dedo pela nossa equipe vão aparecer aqui.'
                  : 'Tente ajustar a busca ou limpar os filtros para ver mais artes.'}
            </p>
            <Button
              onClick={() => {
                resetFilters()
                setSearchInput('')
              }}
              className="mt-5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-bold shadow-md shadow-orange-500/25"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="cg-member-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {arts.map((art) => (
                <ArtCard
                  key={art.id}
                  art={art}
                  demo={!!user.isDemo}
                  downloadState={downloadStates[art.id] || 'idle'}
                  onDownload={handleDownload}
                  onToggleFavorite={toggleFavorite}
                  onPreview={(chosen) => setPreviewId(chosen.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Rolagem híbrida: carrega sozinho até um limite, depois "Carregar mais" */}
        {tab !== 'compartilhar' && arts.length > 0 && (
          <LoadMoreFooter
            loaded={arts.length}
            total={total}
            pagesLoaded={artsQ.data?.pages.length ?? 0}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            resetKey={JSON.stringify([tab, q, categoryIds, tagIds, sort, seasonalEventId])}
          />
        )}

      </main>

      <footer className="cg-portal-footer mt-auto border-t border-white/10 py-5">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 text-xs text-zinc-400 sm:px-6">
          <span>© {new Date().getFullYear()} Click &amp; Gruda · Acesso ativo</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => user.isDemo ? toast.info('Sugestões liberadas após a assinatura.') : setSuggestionOpen(true)}
              className="inline-flex items-center gap-1.5 font-bold text-zinc-400 transition-colors hover:text-orange-600"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Sugerir uma nova arte
            </button>
            <span className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> {catalogQ.data?.quota?.limit ? `Até ${catalogQ.data.quota.limit} artes por dia` : 'Baixe suas artes a qualquer hora'}
            </span>
          </div>
        </div>
      </footer>

      {/* ================= HAMBURGER MENU (Categorias + Tags) ================= */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex w-[min(90vw,355px)] flex-col overflow-hidden p-0 sm:max-w-[355px]">
          <SheetHeader className="border-b border-zinc-100 p-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-base font-black text-zinc-900">
              <Menu className="h-4.5 w-4.5 text-orange-500" /> Explorar artes
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 scrollbar-thin">
            <div className="mb-5">
              <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-zinc-400">Ordenar artes</p>
              <Select value={sort} onValueChange={(v) => setFilter({ sort: v as typeof sort })}>
                <SelectTrigger className="h-10 w-full rounded-xl border-zinc-200 text-xs font-semibold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">Mais recentes</SelectItem>
                  <SelectItem value="baixadas">Mais baixadas</SelectItem>
                  <SelectItem value="nome">Nome (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-zinc-400">Categorias</p>
            <div className="space-y-1">
              {(catalogQ.data?.categories || []).map((c) => {
                const active = categoryIds.includes(c.id)
                const catIcon = getCategoryIcon(c.icon)
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      setFilter({
                        categoryIds: active ? categoryIds.filter((i) => i !== c.id) : [...categoryIds, c.id],
                      })
                    }
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
                      active
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                        : 'text-zinc-600 hover:bg-orange-50 hover:text-orange-600'
                    )}
                  >
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center text-base', active && 'text-white')}>
                      {catIcon ? <catIcon.Icon className="h-4.5 w-4.5" /> : c.emoji}
                    </span>
                    <span className="flex-1 text-left">{c.name}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                        active ? 'bg-white/25 text-white' : 'bg-zinc-100 text-zinc-400'
                      )}
                    >
                      {c.artCount}
                    </span>
                  </button>
                )
              })}
            </div>

            {!user.isDemo && (
              <button type="button" onClick={() => { setMenuOpen(false); setZipOpen(true) }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300/60 bg-orange-50 px-3 py-3 text-xs font-bold text-orange-700 hover:bg-orange-100">
                <Download className="h-4 w-4" /> Baixar catálogo em ZIP (opcional)
              </button>
            )}

            {catalogQ.isError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">Falha ao carregar os filtros. <button type="button" onClick={() => catalogQ.refetch()} className="font-bold underline">Tentar de novo</button></p>}
            <TagFilterPanel tags={catalogQ.data?.tags ?? []} selected={tagIds} onChange={(ids) => setFilter({ tagIds: ids })} />

            <Button
              onClick={() => {
                resetFilters()
                setSearchInput('')
                setMenuOpen(false)
              }}
              variant="outline"
              className="mt-7 w-full rounded-xl border-zinc-200 font-bold text-zinc-600"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> Limpar filtros
            </Button>
          </div>
          <div className="shrink-0 border-t border-zinc-200 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,.04)]">
            <Button onClick={() => setMenuOpen(false)} className="h-11 w-full rounded-xl bg-zinc-950 font-black text-white hover:bg-zinc-800">
              <Check className="mr-2 h-4 w-4 text-orange-400" />
              Ver {artsQ.isFetching ? 'resultados' : `${total.toLocaleString('pt-BR')} artes`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Botão flutuante de suporte — WhatsApp */}
      <a
        href={WHATSAPP.link(WHATSAPP_MESSAGES.support)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com o suporte no WhatsApp"
        className="group fixed bottom-5 right-5 z-40 flex h-13 items-center gap-2 rounded-full bg-emerald-500 py-3 pl-3.5 pr-3.5 text-white shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 hover:bg-emerald-600 sm:pr-4 print:hidden"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30 opacity-60 group-hover:opacity-0" aria-hidden />
          <MessageCircle className="relative h-6 w-6" />
        </span>
        <span className="hidden text-sm font-black sm:inline">Suporte</span>
      </a>

      <Dialog open={mockupDialogOpen} onOpenChange={setMockupDialogOpen}>
        <DialogContent className="cg-access-dialog rounded-3xl border-white/10 bg-[#121a2a] text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-white"><Box className="h-5 w-5 text-orange-400" /> Gerador de Mockups 3D</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-300">O mockup é <strong className="text-white">premium</strong>, e você assinante tem acesso gratuito. Se ainda não tem o código de acesso, solicite ao suporte o seu código grátis.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => window.open(WHATSAPP.link(mockupSupportMessage), '_blank', 'noopener,noreferrer')} className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">Solicitar código grátis</Button>
            <Button type="button" onClick={() => { setMockupDialogOpen(false); openExternal('https://clicktools.vercel.app/', 'mockup_platform_open') }} className="bg-orange-500 text-white hover:bg-orange-600">Continuar para o gerador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shopDialogOpen} onOpenChange={setShopDialogOpen}>
        <DialogContent className="cg-access-dialog rounded-3xl border-white/10 bg-[#121a2a] text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-white"><Store className="h-5 w-5 text-orange-400" /> Loja Online</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-300">Para acessar a loja online, solicite ao suporte o seu <strong className="text-white">voucher vitalício</strong>. Assim que ele for liberado, você pode entrar normalmente pela plataforma.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => window.open(WHATSAPP.link(shopSupportMessage), '_blank', 'noopener,noreferrer')} className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">Solicitar voucher</Button>
            <Button type="button" onClick={() => { setShopDialogOpen(false); openExternal('https://www.clickgruda.com.br', 'catalog_store_open') }} className="bg-orange-500 text-white hover:bg-orange-600">Ir para a Loja Online</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup comercial exclusivo da conta universal Preview. */}
      <Dialog open={previewWelcomeOpen && !!user.isPreview} onOpenChange={(value) => { if (!value) dismissPreviewWelcome() }}>
        <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto rounded-3xl border border-orange-500/25 bg-[#121a2a] p-6 text-white sm:p-8">
          <DialogHeader>
            <span className="mb-2 w-fit rounded-full border border-orange-400/30 bg-orange-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300">Bem-vindo à Click & Gruda</span>
            <DialogTitle className="text-left text-2xl font-black leading-tight text-white sm:text-3xl">Explore por dentro. Imagine o que você pode criar.</DialogTitle>
            <DialogDescription className="pt-2 text-left text-sm leading-7 text-slate-300">
              Esta é uma demonstração da nossa biblioteca, pensada para quem trabalha com personalizados e não quer perder tempo em pastas desorganizadas. Aqui, qualidade vem antes de quantidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
            <p><strong className="text-orange-300">Novas artes toda semana.</strong> Nosso acervo cresce com curadoria, e evitamos adicionar arquivos apenas para inflar números.</p>
            <p><strong className="text-orange-300">Estamos em expansão.</strong> Queremos trazer mais novidades, cursos e dicas práticas para quem cria e vende personalizados.</p>
            <p><strong className="text-orange-300">Nossa meta:</strong> chegar à virada de 2026 para 2027 com 15 mil artes selecionadas. É um objetivo de crescimento, não uma quantidade já disponível.</p>
          </div>
          <p className="text-xs leading-5 text-slate-400">Neste modo você pode conhecer a biblioteca e explorar os recursos, mas downloads, gravações e edições não estão liberados. As estampas aparecem em prévias protegidas.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={dismissPreviewWelcome} className="h-12 rounded-xl bg-orange-500 font-black text-white hover:bg-orange-600">Começar a navegar <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
            <Button onClick={dismissPreviewWelcome} variant="outline" className="h-12 rounded-xl border-white/25 bg-white/5 font-bold text-slate-100 hover:bg-white/10">Fechar</Button>
          </div>
          <a href={WHATSAPP.link('Olá! Conheci a versão Preview da Click & Gruda e quero saber como liberar meu acesso completo.')} target="_blank" rel="noopener noreferrer" className="text-center text-xs font-bold text-orange-300 underline underline-offset-4">Gostou da plataforma? Saiba como ter acesso completo</a>
        </DialogContent>
      </Dialog>

      {/* ================= SUGESTÃO DE TEMA (envia ao Admin Master) ================= */}
      <ArtPreviewDialog art={previewArt} open={!!previewArt} onOpenChange={(open) => !open && setPreviewId(null)} demo={!!user.isDemo} downloadState={previewArt ? downloadStates[previewArt.id] || 'idle' : 'idle'} onDownload={handleDownload} onFavorite={toggleFavorite} onCategory={toggleCategory} onTag={viewTag} onSeasonal={viewSeasonal} />
      <ThemeSuggestionDialog open={suggestionOpen} onOpenChange={setSuggestionOpen} />
      <EnhanceRequestDialog open={enhanceOpen} onOpenChange={setEnhanceOpen} />
      <ZipDownloadDialog open={zipOpen} onOpenChange={setZipOpen} catalog={catalogQ.data} />
      <DailyLimitDialog open={limitDialog !== null} onOpenChange={(o) => !o && setLimitDialog(null)} limit={limitDialog ?? 500} />
    </div>
  )
}
