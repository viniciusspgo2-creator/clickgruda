'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarClock,
  Eye,
  Flame,
  Loader2,
  MessageCircle,
  Search,
  SearchX,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/lib/store'
import { getCategoryIcon } from '@/lib/category-icons'
import { WHATSAPP } from '@/lib/site'
import { formatArtCode } from '@/lib/art-code'
import { cn } from '@/lib/utils'

type SharedArt = {
  id: string
  code: number
  title: string
  imageUrl: string
  isLaunch: boolean
  category: { name: string; emoji: string; icon: string } | null
  tags: { name: string }[]
}

type SharedCatalog = {
  ownerName: string
  ownerWhatsapp: string
  createdAt: string
  expiresAt: string
}

/**
 * SharedCatalogView — catálogo público aberto pelo link temporário
 * (?catalogo=TOKEN) que o assinante envia para o CLIENTE dele.
 *
 * Somente navegação: sem preços, sem download, sem favoritos.
 * O cliente escolhe a arte e responde ao assinante pelo WhatsApp.
 */
export function SharedCatalogView() {
  const token = useStore((s) => s.shareToken)
  const setView = useStore((s) => s.setView)

  const [q, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [q])

  const catalogQ = useQuery<{ catalog: SharedCatalog; arts: SharedArt[] }>({
    queryKey: ['shared-catalog', token],
    queryFn: async () => {
      const res = await fetch(`/api/public/catalog/${token}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Catálogo indisponível.')
      }
      return res.json()
    },
    enabled: !!token,
    retry: false,
  })

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; icon: string; count: number }>()
    for (const a of catalogQ.data?.arts || []) {
      if (!a.category) continue
      const c = map.get(a.category.name) || { ...a.category, count: 0 }
      c.count += 1
      map.set(a.category.name, c)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [catalogQ.data])

  const arts = useMemo(() => {
    let list = catalogQ.data?.arts || []
    if (categoryId) list = list.filter((a) => a.category?.name === categoryId)
    if (search) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(search) ||
          formatArtCode(a.code).toLowerCase().includes(search) ||
          (a.category?.name || '').toLowerCase().includes(search) ||
          a.tags.some((t) => t.name.toLowerCase().includes(search))
      )
    }
    return list
  }, [catalogQ.data, categoryId, search])

  if (!token) {
    return (
      <EmptyState
        title="Catálogo não encontrado"
        message="Este link está incompleto. Peça um novo link para quem compartilhou com você."
      />
    )
  }

  if (catalogQ.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <SharedHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <Skeleton className="h-28 w-full rounded-3xl bg-zinc-200/70" />
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[21/9.5] w-full rounded-2xl bg-zinc-200/70" />
            ))}
          </div>
        </main>
        <div className="flex items-center justify-center gap-2 pb-10 text-sm font-bold text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> Abrindo o catálogo...
        </div>
      </div>
    )
  }

  if (catalogQ.isError) {
    return (
      <EmptyState
        title="Catálogo indisponível"
        message={catalogQ.error instanceof Error ? catalogQ.error.message : 'Tente novamente mais tarde.'}
      />
    )
  }

  const { catalog, arts: allArts } = catalogQ.data!
  const expires = new Date(catalog.expiresAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  /**
   * Mensagem do cliente para o sublimador. Vai com CÓDIGO + título + categoria +
   * link direto para a arte no portal do sublimador — assim ele acha a arte
   * em 1 toque, sem depender só do nome.
   */
  const choiceUrl = (art: SharedArt) => {
    const owner = (catalog.ownerWhatsapp || '').replace(/\D/g, '')
    const phone = owner || WHATSAPP.number
    const code = formatArtCode(art.code)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const lines = [
      owner
        ? 'Olá! Escolhi uma arte do seu catálogo ✨'
        : 'Olá! Recebi um catálogo de artes da Click & Gruda e escolhi uma arte ✨',
      '',
      `🔢 Código: ${code}`,
      `🎨 Arte: ${art.title}`,
      ...(art.category ? [`📂 Categoria: ${art.category.name}`] : []),
      ...(origin ? ['', `🔎 Abrir a arte: ${origin}/?arte=${art.code}`] : []),
      '',
      'Pode me passar mais detalhes?',
    ]
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <SharedHeader />

      {/* Faixa de contexto */}
      <div className="border-b border-orange-100 bg-orange-50/70">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2.5 text-center text-[12px] font-semibold text-zinc-500 sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            Catálogo de <strong className="text-zinc-700">{catalog.ownerName}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-orange-500" />
            disponível até {expires}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-orange-500" />
            somente visualização
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
            Escolha a sua arte favorita ✨
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Toque em &quot;<strong className="text-zinc-700">Quero esta arte</strong>&quot; para avisar{' '}
            {catalog.ownerName.split(' ')[0]} pelo WhatsApp — a mensagem já vai prontinha com o código e o nome da arte.
          </p>
        </motion.div>

        {/* Busca + categorias */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Buscar por nome, tema, categoria ou código..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm shadow-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            />
          </div>
          <span className="text-sm font-semibold text-zinc-400">
            {arts.length} {arts.length === 1 ? 'arte' : 'artes'}
          </span>
        </div>

        {categories.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryId(null)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                !categoryId ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25' : 'bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-orange-600'
              )}
            >
              Todas
            </button>
            {categories.map((c) => {
              const icon = getCategoryIcon(c.icon)
              return (
                <button
                  key={c.name}
                  onClick={() => setCategoryId(categoryId === c.name ? null : c.name)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors',
                    categoryId === c.name
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                      : 'bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-orange-600'
                  )}
                >
                  {icon ? <icon.Icon className="h-3.5 w-3.5" /> : <span>{c.emoji}</span>}
                  {c.name}
                  <span className={cn('rounded-full px-1.5 text-[10px]', categoryId === c.name ? 'bg-white/25' : 'bg-zinc-100')}>
                    {c.count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Grid de artes */}
        {arts.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
              <SearchX className="h-7 w-7 text-orange-400" />
            </div>
            <h3 className="mt-3 text-base font-black text-zinc-800">Nenhuma arte encontrada</h3>
            <p className="mt-1 text-sm text-zinc-400">Tente outra busca ou toque em &quot;Todas&quot; nas categorias.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {arts.map((art, i) => {
              const catIcon = art.category ? getCategoryIcon(art.category.icon) : null
              return (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35, ease: 'easeOut' }}
                  whileHover={{ y: -4 }}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-orange-500/10"
                >
                  <div className="relative aspect-[21/9.5] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#fdf7f2,#f6f3f0)]">
                    <img
                      src={art.imageUrl}
                      alt={art.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    {art.isLaunch && (
                      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                        <Flame className="h-3 w-3" /> Novo
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-black text-zinc-900">{art.title}</h3>
                      <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-zinc-500">
                        {formatArtCode(art.code)}
                      </span>
                    </div>
                    {art.category && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                        <span className="flex h-4 w-4 items-center justify-center">
                          {catIcon ? <catIcon.Icon className="h-3.5 w-3.5" /> : <span className="text-[11px]">{art.category.emoji}</span>}
                        </span>
                        {art.category.name}
                      </p>
                    )}
                    {(() => {
                      const wa = choiceUrl(art)
                      return (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-600"
                        >
                          <MessageCircle className="h-4 w-4" /> Quero esta arte
                        </a>
                      )
                    })()}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white py-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1 px-4 text-center text-[11px] text-zinc-400 sm:flex-row sm:px-6 sm:text-left">
          <span>Link temporário gerado pela plataforma Click &amp; Gruda</span>
          <button onClick={() => setView('landing')} className="font-bold text-zinc-400 transition-colors hover:text-orange-600">
            Conheça a plataforma →
          </button>
        </div>
      </footer>
    </div>
  )
}

function SharedHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo compact />
        <span className="rounded-full bg-zinc-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
          Catálogo temporário
        </span>
      </div>
    </header>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
        <SearchX className="h-8 w-8 text-orange-400" />
      </div>
      <h1 className="mt-4 text-xl font-black text-zinc-900">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500">{message}</p>
      <div className="mt-6">
        <Logo />
      </div>
    </div>
  )
}
