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
  Lock,
  Flame,
  Heart,
  LayoutGrid,
  Lightbulb,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
  Box,
  SunMedium,
  MoonStar,
  ExternalLink,
  RotateCcw,
  Search,
  SearchX,
  Settings2,
  Layers3,
  ArrowUpRight,
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
import { ThemeSuggestionDialog } from '@/components/portal/ThemeSuggestionDialog'
import { TagFilterPanel } from '@/components/portal/TagFilterPanel'
import { DiscoveryShelf } from '@/components/portal/DiscoveryShelf'
import { ArtPreviewDialog } from '@/components/portal/ArtPreviewDialog'
import { DemoConversionActions } from '@/components/portal/DemoConversionActions'
import { EnhanceRequestDialog } from '@/components/portal/EnhanceRequestDialog'
import { LoadMoreFooter } from '@/components/shared/LoadMoreFooter'
import { ZipDownloadDialog } from '@/components/portal/ZipDownloadDialog'
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
  const selectCategory = useStore((s) => s.selectCategory)
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
  const [portalTheme, setPortalTheme] = useState<'dark' | 'light'>('dark')
  const [mockupDialogOpen, setMockupDialogOpen] = useState(false)
  const [mockupArt, setMockupArt] = useState<ArtItem | null>(null)
  const openMockup = (art?: ArtItem) => { setMockupArt(art ?? null); setMockupDialogOpen(true) }


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

  // A sessão é acompanhada pelo AppShell, inclusive fora do portal.

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
    enabled: !!user?.hasAccess ,
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
        toast.error(data.error || 'Erro ao baixar a arte.')
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
    if (user?.isDemo && ['favoritas', 'downloads'].includes(nextTab)) { toast.info('Favoritos e downloads ficam disponíveis após ativar o acesso.'); return }
    setFilter({ tab: nextTab, categoryIds: [], tagIds: [], q: '', seasonalEventId: null, ...(nextSort ? { sort: nextSort } : {}) })
    setSearchInput('')
    scrollToResults()
  }
  const toggleTheme = () => setPortalTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  const mockupSupportMessage = 'Olá! Sou assinante da Click & Gruda e quero solicitar o meu código grátis para acessar o gerador de mockups 3D.'

  const openExternal = (url: string, source: string) => {
    track(source, { source: 'portal' })
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const toggleCategory = (id: string) => {
    setSearchInput('')
    selectCategory(id)
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
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Não foi possível sair. Tente novamente.')
      queryClient.clear(); setUser(null); resetFilters(); setView('landing')
    } catch (error) { toast.error((error as Error).message) }
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
              const restricted = Boolean(user.isDemo && ['favoritas', 'downloads'].includes(item.id))
              const count = item.id === 'todas' ? counts?.arts : item.id === 'lancamentos' ? counts?.lancamentos : item.id === 'selecionadas' ? counts?.selecionadas : item.id === 'reprovadas' ? counts?.reprovadas : item.id === 'favoritas' ? counts?.favoritas : item.id === 'downloads' ? counts?.minhasDownloads : undefined
              return (
                <button key={item.id} type="button" aria-current={active ? 'page' : undefined} aria-disabled={restricted}
                  onClick={() => restricted ? toast.info('Este recurso fica disponível após ativar o acesso.') : setFilter({ tab: item.id, ...(item.id === 'todas' ? { sort: 'recentes' } : {}), ...(item.id !== 'sazonal' ? { seasonalEventId: null } : {}) })}
                  className={cn('cg-sidebar-link', active && 'cg-sidebar-link-active')}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 flex-1 text-left">{item.label === 'Todas' ? 'Visão geral' : item.label}</span>
                  {restricted && <Lock className="ml-auto h-3.5 w-3.5 opacity-60" />}
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
          <span className="cg-sidebar-status"><ShieldCheck className="h-4 w-4"/> {user.isDemo ? 'Visita de demonstração' : 'Membro com acesso ativo'}</span>
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
              onClick={() => openMockup()}
              className="cg-header-quicklink cg-header-mockup"
            >
              <Box className="h-4 w-4 shrink-0" />
              <span className="cg-header-quicklabel">Gerador de Mockup</span>
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
                {user.isDemo ? <EyeOff className="h-3.5 w-3.5 text-orange-500" /> : <Crown className="h-3.5 w-3.5 text-orange-500" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>
                <div className="text-sm font-bold text-zinc-900">{user.name}</div>
                <div className="truncate text-xs font-normal text-zinc-400">{user.isPublicDemo ? 'Demonstração sem cadastro' : user.email}</div>
              </DropdownMenuLabel>
              <div className="px-2 pb-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-600">
                  <ShieldCheck className="h-3 w-3" /> {user.isDemo ? 'Demonstração' : 'Acesso ativo'}
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
                <LogOut className="mr-2 h-4 w-4" /> {user.isDemo ? 'Sair da demonstração' : 'Sair da conta'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Atalhos próprios do mobile — mantêm a busca legível no cabeçalho. */}
        <nav className="cg-mobile-quicklinks mx-auto flex w-full max-w-[1600px] items-center gap-2 px-4 pb-2.5 md:hidden sm:px-7" aria-label="Ferramentas rápidas">
          <button type="button" onClick={() => openMockup()} className="cg-header-quicklink cg-header-mockup flex-1 justify-center">
            <Box className="h-4 w-4" /> Gerador de Mockup <ExternalLink className="h-3 w-3" />
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
              const restricted = Boolean(user.isDemo && ['favoritas', 'downloads'].includes(t.id))
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
                  aria-disabled={restricted}
                  onClick={() => restricted ? toast.info('Este recurso fica disponível após ativar o acesso.') : setFilter({ tab: t.id, ...(t.id !== 'sazonal' ? { seasonalEventId: null } : {}) })}
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
                  {restricted && <Lock className="h-3 w-3" />}
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
        <div className="border-b border-white/15 bg-[#122039] px-4 py-4 sm:px-6" role="region" aria-label="Demonstração da plataforma">
          <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-4">
            <div><p className="flex items-center gap-2 text-sm font-extrabold text-[#ffbd8a]"><EyeOff className="h-4 w-4" /> Você está na demonstração</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#dbe6f8]">Explore categorias, busca e datas sazonais. As imagens são prévias protegidas; os arquivos para produção e os downloads são exclusivos de membros.</p></div>
            <DemoConversionActions />
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
        {(
          <div className="cg-member-toolbar mb-5 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Ações e informações da biblioteca">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400"><ShieldCheck className="h-4.5 w-4.5" /></span>
              <div>
                <p className="text-xs font-extrabold text-slate-100">Sua biblioteca, sempre à mão</p>
                <p className="text-[11px] leading-relaxed text-slate-300">Downloads ilimitados para criar suas canecas · Não achou o que queria? Peça uma arte.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button onClick={() => user.isDemo ? toast.info('Sugestões liberadas após a assinatura.') : setSuggestionOpen(true)} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-orange-400/30 bg-orange-500/15 px-3 text-xs font-bold text-orange-200 transition-colors hover:bg-orange-500/25 sm:flex-none"><Lightbulb className="h-3.5 w-3.5" /> Sugerir arte</button>
              <button onClick={() => (user.isDemo ? toast.info('Disponível após a ativação do acesso.') : setEnhanceOpen(true))} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#0b1423] px-3 text-xs font-bold text-slate-100 transition-colors hover:bg-[#253550] sm:flex-none"><Wand2 className="h-3.5 w-3.5" /> Melhorar minha arte</button>
            </div>
          </div>
        )}

        {/* Categorias com números reais e barra de busca sempre visível. */}
        <div className="cg-category-toolbar mb-3" aria-label="Categorias do acervo">
          <ChipScroller activeKey={categoryIds[0] ?? 'all'} fadeFrom="from-[#121e30]">
            <button type="button" data-active={categoryIds.length === 0 && tab === 'todas'} onClick={() => { setFilter({ tab: 'todas', categoryIds: [], seasonalEventId: null }); scrollToResults() }} className={cn('cg-category-pill', categoryIds.length === 0 && tab === 'todas' ? 'cg-category-pill-active' : '')}>Todas <span>{counts?.arts?.toLocaleString('pt-BR') ?? '…'}</span></button>
            {(catalogQ.data?.categories ?? []).map((category) => <button type="button" key={category.id} data-active={categoryIds.includes(category.id)} aria-pressed={categoryIds.includes(category.id)} onClick={() => { setFilter({ tab: 'todas', categoryIds: categoryIds.includes(category.id) ? categoryIds.filter(id => id !== category.id) : [category.id], seasonalEventId: null }); scrollToResults() }} className={cn('cg-category-pill', categoryIds.includes(category.id) && 'cg-category-pill-active')}>{category.emoji} {category.name} <span>{category.artCount.toLocaleString('pt-BR')}</span></button>)}
          </ChipScroller>
        </div>
        <div className="cg-filter-toolbar sticky top-[82px] z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-2.5 sm:top-[82px]" aria-label="Barra de navegação das artes">
          <button type="button" onClick={() => setMenuOpen(true)} className="cg-filter-button inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold"><SlidersHorizontal className="h-4 w-4" /> Mais filtros{categoryIds.length + tagIds.length > 0 ? ` (${categoryIds.length + tagIds.length})` : ''}</button>
          <label className="cg-inline-search relative flex min-w-[145px] flex-1 items-center" aria-label="Buscar no acervo"><Search className="pointer-events-none absolute left-3 h-4 w-4 text-orange-300" /><input type="search" value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Buscar tema, arte ou código…" className="h-9 w-full rounded-xl border border-white/15 bg-[#1b2c46] pl-9 pr-2 text-xs text-white outline-none placeholder:text-slate-400 focus:border-orange-400" /></label>
          <span className="hidden text-xs font-semibold text-slate-300 lg:inline">{total.toLocaleString('pt-BR')} {total === 1 ? 'resultado' : 'resultados'}</span>
          <Select value={sort} onValueChange={value => setFilter({ sort: value as typeof sort })}>
            <SelectTrigger aria-label="Ordenar artes" className="cg-sort-trigger h-9 w-[125px] shrink-0 rounded-xl text-xs font-bold sm:w-[165px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="recentes">Mais recentes</SelectItem><SelectItem value="baixadas">Mais baixadas</SelectItem><SelectItem value="nome">Nome (A–Z)</SelectItem></SelectContent>
          </Select>
        </div>

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
          </h1>
          <span className="text-sm font-semibold text-slate-300">
            {total} {total === 1 ? 'arte' : 'artes'}
          </span>
        </div>

        {/* Grid */}
        {artsQ.isLoading ? (
          <div className="cg-member-grid grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-[#172338] p-2.5 sm:p-3.5">
                <Skeleton className="aspect-[16/9] w-full rounded-xl bg-slate-700/35" />
                <Skeleton className="mt-3 h-4 w-2/3 rounded bg-slate-700/35" />
                <Skeleton className="mt-2 h-3 w-1/3 rounded bg-slate-700/35" />
                <Skeleton className="mt-3 h-3 w-1/2 rounded bg-slate-700/35" />
              </div>
            ))}
          </div>
        ) : arts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#172338] px-5 py-12 text-center">
            <img src="/uploads/rebrand/mascote-principal.webp" alt="Mascote Click & Gruda" loading="lazy" className="h-28 w-28 object-contain sm:h-36 sm:w-36" />
            <h3 className="mt-3 text-lg font-bold text-white">Nenhuma arte para essa busca.</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-300">
              {tab === 'favoritas'
                ? 'Toque no coraçãozinho das artes que você ama para vê-las aqui.'
                : tab === 'selecionadas'
                  ? 'As artes especiais escolhidas a dedo pela nossa equipe vão aparecer aqui.'
                  : counts?.lancamentos ? `Temos ${counts.lancamentos.toLocaleString('pt-BR')} lançamentos no acervo. Limpe os filtros para conhecer.` : 'Experimente outro tema ou limpe os filtros para encontrar mais artes.'}
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
          <div className="cg-member-grid grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
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
                  onOpenMockup={(chosen) => openMockup(chosen)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Rolagem híbrida: carrega sozinho até um limite, depois "Carregar mais" */}
        {arts.length > 0 && (
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
              <Download className="h-3.5 w-3.5" /> Downloads ilimitados
            </span>
          </div>
        </div>
      </footer>

      {/* ================= HAMBURGER MENU (Categorias + Tags) ================= */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="cg-filter-drawer flex w-[min(90vw,355px)] flex-col overflow-hidden border-white/10 bg-[#121d2f] p-0 text-slate-100 sm:max-w-[355px]">
          <SheetHeader className="border-b border-white/10 p-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Menu className="h-4.5 w-4.5 text-orange-500" /> Explorar artes
            </SheetTitle>
          </SheetHeader>

          <div className="cg-filter-drawer-scroll min-h-0 flex-1 overflow-y-auto p-5">
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
            <div className="space-y-1" role="radiogroup" aria-label="Escolha uma categoria">
              {(catalogQ.data?.categories || []).map((c) => {
                const active = categoryIds.includes(c.id)
                const catIcon = getCategoryIcon(c.icon)
                return (
                  <button
                    key={c.id}
                    onClick={() => { toggleCategory(c.id); setMenuOpen(false) }}
                    role="radio"
                    aria-checked={active}
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
          <div className="shrink-0 border-t border-white/10 bg-[#101a2b] p-4 shadow-[0_-8px_24px_rgba(0,0,0,.22)]">
            <Button onClick={() => setMenuOpen(false)} className="h-11 w-full rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600">
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
            <DialogDescription className="text-sm leading-relaxed text-slate-300">{user.isDemo ? 'O gerador de mockups 3D é um recurso para membros. A demonstração permite conhecer a biblioteca; o uso do gerador depende da ativação do seu acesso.' : <>O mockup é <strong className="text-white">premium</strong>, e você assinante tem acesso gratuito. Se ainda não tem o código de acesso, solicite ao suporte o seu código grátis.</>}</DialogDescription>
          </DialogHeader>
          {mockupArt && <div className="rounded-xl border border-orange-400/20 bg-orange-400/[.07] p-3 text-xs leading-5 text-slate-200"><strong className="block text-orange-200">Arte selecionada: {mockupArt.title}</strong>O Studio não importa esta estampa automaticamente. {user.isDemo ? "Na demonstração, conheça o acervo. Após ativar seu acesso, baixe a arte e envie o arquivo ao Studio." : "Baixe a arte pelo botão abaixo e, no gerador, envie o arquivo para visualizar a caneca em 3D."}</div>}
          <DialogFooter className="mt-2 flex-col gap-2 sm:flex-row sm:justify-between">
            {user.isDemo ? <DemoConversionActions /> : <>
            <Button type="button" variant="outline" onClick={() => window.open(WHATSAPP.link(mockupSupportMessage), '_blank', 'noopener,noreferrer')} className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10">Solicitar código grátis</Button>
            {mockupArt && <Button type="button" variant="outline" disabled={downloadStates[mockupArt.id] === 'loading'} onClick={() => handleDownload(mockupArt)} className="border-white/15 bg-white/5 text-white hover:bg-white/10"><Download className="mr-1.5 h-4 w-4" /> Baixar esta arte</Button>}
            <Button type="button" onClick={() => { setMockupDialogOpen(false); openExternal('https://clicktools.vercel.app/', 'mockup_platform_open') }} className="bg-orange-500 text-white hover:bg-orange-600">Abrir Studio Mockup 3D</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= SUGESTÃO DE TEMA (envia ao Admin Master) ================= */}
      <ArtPreviewDialog art={previewArt} open={!!previewArt} onOpenChange={(open) => !open && setPreviewId(null)} demo={!!user.isDemo} downloadState={previewArt ? downloadStates[previewArt.id] || 'idle' : 'idle'} onDownload={handleDownload} onFavorite={toggleFavorite} onCategory={toggleCategory} onTag={viewTag} onSeasonal={viewSeasonal} />
      <ThemeSuggestionDialog open={suggestionOpen} onOpenChange={setSuggestionOpen} />
      <EnhanceRequestDialog open={enhanceOpen} onOpenChange={setEnhanceOpen} />
      <ZipDownloadDialog open={zipOpen} onOpenChange={setZipOpen} catalog={catalogQ.data} />
    </div>
  )
}
