'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarHeart,
  Clock3,
  Crown,
  Download,
  EyeOff,
  Flame,
  Heart,
  LayoutGrid,
  Lightbulb,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  SearchX,
  Settings2,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import { getCategoryIcon } from '@/lib/category-icons'
import { useStore, type PortalTab } from '@/lib/store'
import type { ArtItem, CatalogData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

type DownloadStates = Record<string, 'idle' | 'loading' | 'done'>

const TABS: { id: PortalTab; label: string; icon: React.ElementType }[] = [
  { id: 'todas', label: 'Todas', icon: LayoutGrid },
  { id: 'lancamentos', label: 'Lançamentos', icon: Flame },
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
  const [downloadStates, setDownloadStates] = useState<DownloadStates>({})
  const [suggestionOpen, setSuggestionOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setFilter({ q: searchInput }), 300)
    return () => clearTimeout(t)
  }, [searchInput, setFilter])

  // Guards (skip redirect if the active view already changed — e.g. during exit animation)
  useEffect(() => {
    const currentView = useStore.getState().view
    if (!user && currentView === 'portal') setView('auth')
    else if (user && !user.hasAccess && currentView === 'portal') setView('checkout')
  }, [user, setView])

  const catalogQ = useQuery<CatalogData>({
    queryKey: ['catalog'],
    queryFn: async () => (await fetch('/api/catalog')).json(),
  })

  const params = new URLSearchParams({ tab, sort })
  if (q) params.set('q', q)
  if (categoryIds.length) params.set('categories', categoryIds.join(','))
  if (tagIds.length) params.set('tags', tagIds.join(','))
  if (tab === 'sazonal' && seasonalEventId) params.set('event', seasonalEventId)

  const artsQ = useQuery<{ arts: ArtItem[]; total: number }>({
    queryKey: ['arts', tab, q, categoryIds, tagIds, sort, seasonalEventId],
    queryFn: async () => (await fetch(`/api/arts?${params.toString()}`)).json(),
    enabled: !!user?.hasAccess && tab !== 'compartilhar',
  })

  // Default seasonal event = next one
  useEffect(() => {
    if (tab === 'sazonal' && !seasonalEventId && catalogQ.data?.nextEvent) {
      setFilter({ seasonalEventId: catalogQ.data.nextEvent.id })
    }
  }, [tab, seasonalEventId, catalogQ.data, setFilter])

  const selectedEvent = catalogQ.data?.events.find((e) => e.id === seasonalEventId)
  const countdown = useCountdown(selectedEvent?.nextDate || catalogQ.data?.nextEvent?.nextDate)

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
      queryClient.setQueriesData<{ arts: ArtItem[] }>({ queryKey: ['arts'] }, (old) =>
        old
          ? {
              ...old,
              arts: old.arts.map((a) => (a.id === artId ? { ...a, favorited: !a.favorited } : a)),
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

  if (!user || !user.hasAccess) return null

  const counts = catalogQ.data?.counts
  const arts = artsQ.data?.arts ?? []
  const total = artsQ.data?.total ?? 0

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
    setUser(null)
    resetFilters()
    setView('landing')
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* ================= HEADER ================= */}
      <header className="glass-header sticky top-0 z-40 border-b border-zinc-200">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Button
            variant="outline"
            onClick={() => setMenuOpen(true)}
            className="h-10 shrink-0 gap-2 rounded-xl border-zinc-200 font-bold text-zinc-700 hover:bg-orange-50 hover:text-orange-600"
            aria-label="Abrir categorias"
          >
            <Menu className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Categorias</span>
          </Button>

          <button onClick={resetFilters} aria-label="Início do portal" className="shrink-0">
            <Logo compact />
          </button>

          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nome, tag, categoria ou código (CG-0042)..."
              className="h-10 rounded-xl border-zinc-200 bg-white pl-9 pr-9 text-sm focus-visible:ring-orange-500"
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
          </div>

          <div className="hidden md:block">
            <Select value={sort} onValueChange={(v) => setFilter({ sort: v as typeof sort })}>
              <SelectTrigger className="h-10 w-44 rounded-xl border-zinc-200 text-sm font-semibold text-zinc-600">
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5 text-orange-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="baixadas">Mais baixadas</SelectItem>
                <SelectItem value="nome">Nome (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin quick access */}
          {user.role === 'ADMIN' && (
            <Button
              variant="outline"
              onClick={() => setView('admin')}
              className="hidden h-10 shrink-0 rounded-xl border-orange-300 bg-orange-50 font-bold text-orange-600 hover:bg-orange-100 md:inline-flex"
            >
              <Settings2 className="mr-1.5 h-4 w-4" />
              Painel Master
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1.5 pl-1.5 pr-2.5 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-black text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[110px] truncate text-sm font-bold text-zinc-700 lg:inline">
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
                  <ShieldCheck className="h-3 w-3" /> Acesso vitalício ativo
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
              <DropdownMenuItem onClick={() => setSuggestionOpen(true)} className="font-bold text-orange-600">
                <Lightbulb className="mr-2 h-4 w-4" /> Sugerir um tema
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-2.5 pt-1">
            {TABS.map((t) => {
              const active = tab === t.id
              const badge =
                t.id === 'todas'
                  ? counts?.arts
                  : t.id === 'lancamentos'
                    ? counts?.lancamentos
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
                    active ? 'text-white' : 'text-zinc-500 hover:bg-orange-50 hover:text-orange-600'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="portal-tab-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-500/30"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <t.icon className={cn('h-4 w-4', active && 'text-white', !active && t.id === 'favoritas' && 'text-zinc-400')} />
                  {t.label}
                  {badge != null && badge > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                        active ? 'bg-white/25 text-white' : 'bg-zinc-100 text-zinc-500'
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
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
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

      {/* ================= SEASONAL HERO ================= */}
      {tab === 'sazonal' && catalogQ.data && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
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

              {countdown && (
                <div className="flex items-center gap-2.5">
                  {[
                    [countdown.days, 'dias'],
                    [countdown.hours, 'horas'],
                    [countdown.minutes, 'min'],
                    [countdown.seconds, 'seg'],
                  ].map(([v, l]) => (
                    <div key={l as string} className="rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-center shadow">
                      <div className="text-xl font-black text-orange-400 tabular-nums">{String(v).padStart(2, '0')}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{l}</div>
                    </div>
                  ))}
                </div>
              )}
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
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

        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-lg font-black tracking-tight text-zinc-900 sm:text-xl">
            {tab === 'todas' && 'Todo o acervo'}
            {tab === 'lancamentos' && (
              <span className="flex items-center gap-2">
                Lançamentos <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">novo</span>
              </span>
            )}
            {tab === 'sazonal' && 'Artes sazonais'}
            {tab === 'favoritas' && 'Suas favoritas'}
            {tab === 'downloads' && 'Baixadas por você'}
            {tab === 'compartilhar' && 'Compartilhar catálogo'}
          </h1>
          <span className="text-sm font-semibold text-zinc-400">
            {total} {total === 1 ? 'arte' : 'artes'}
          </span>
        </div>

        {/* Grid */}
        {tab === 'compartilhar' ? (
          <ShareCatalogSection />
        ) : artsQ.isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-3.5">
                <Skeleton className="aspect-[21/9.5] w-full rounded-xl bg-zinc-100" />
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
          <motion.div layout className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {arts.map((art) => (
                <ArtCard
                  key={art.id}
                  art={art}
                  demo={!!user.isDemo}
                  downloadState={downloadStates[art.id] || 'idle'}
                  onDownload={handleDownload}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-zinc-400 sm:px-6">
          <span>© {new Date().getFullYear()} Click &amp; Gruda · Acesso vitalício ativo</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSuggestionOpen(true)}
              className="inline-flex items-center gap-1.5 font-bold text-zinc-400 transition-colors hover:text-orange-600"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Sugerir um tema
            </button>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Downloads ilimitados
            </span>
          </div>
        </div>
      </footer>

      {/* ================= HAMBURGER MENU (Categorias + Tags) ================= */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto p-0 sm:w-[340px]">
          <SheetHeader className="border-b border-zinc-100 p-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-base font-black text-zinc-900">
              <Menu className="h-4.5 w-4.5 text-orange-500" /> Explorar artes
            </SheetTitle>
          </SheetHeader>

          <div className="p-5">
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

            <p className="mb-2.5 mt-6 text-[11px] font-black uppercase tracking-wider text-zinc-400">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {(catalogQ.data?.tags || []).map((t) => {
                const active = tagIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => setFilter({ tagIds: active ? tagIds.filter((i) => i !== t.id) : [...tagIds, t.id] })}
                    className={cn(
                      'rounded-full px-2.5 py-1.5 text-xs font-bold transition-all',
                      active
                        ? 'bg-zinc-950 text-white shadow'
                        : 'bg-zinc-100 text-zinc-500 hover:bg-orange-100 hover:text-orange-600'
                    )}
                  >
                    #{t.name}
                    <span className={cn('ml-1 text-[9px]', active ? 'text-zinc-400' : 'text-zinc-300')}>{t.artCount}</span>
                  </button>
                )
              })}
            </div>

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
        </SheetContent>
      </Sheet>

      {/* ================= SUGESTÃO DE TEMA (envia ao Admin Master) ================= */}
      <ThemeSuggestionDialog open={suggestionOpen} onOpenChange={setSuggestionOpen} />
    </div>
  )
}
