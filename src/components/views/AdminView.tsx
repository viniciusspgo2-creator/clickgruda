'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CalendarHeart,
  Check,
  Clock3,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  Image,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  TrendingUp,
  User as UserIcon,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Logo } from '@/components/shared/Logo'
import { AdminArtsSection, AdminCategoriesSection, AdminSuggestionsSection, AdminTagsSection, AdminSeasonalSection, AdminSettingsSection } from '@/components/views/AdminSections'
import { useStore } from '@/lib/store'
import { formatBRL } from '@/lib/types'
import { cn } from '@/lib/utils'

export type AdminSection =
  | 'dashboard'
  | 'arts'
  | 'categories'
  | 'tags'
  | 'seasonal'
  | 'users'
  | 'payments'
  | 'sugestoes'
  | 'settings'

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'arts', label: 'Artes', icon: Image },
  { id: 'categories', label: 'Categorias', icon: ShoppingBag },
  { id: 'tags', label: 'Tags', icon: Tag },
  { id: 'seasonal', label: 'Datas Sazonais', icon: CalendarHeart },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'sugestoes', label: 'Sugestões de Tema', icon: Lightbulb },
  { id: 'settings', label: 'Configurações', icon: Settings },
]

export function AdminView() {
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const setView = useStore((s) => s.setView)
  const [section, setSection] = useState<AdminSection>('dashboard')
  const [mobileNav, setMobileNav] = useState(false)

  // Badge de sugestões novas (compartilha o cache com o Dashboard)
  const statsQ = useQuery<{ stats: { suggestionsNew?: number } }>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await fetch('/api/admin/stats')).json(),
    enabled: user?.role === 'ADMIN',
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
  const newSuggestions = statsQ.data?.stats?.suggestionsNew ?? 0

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-center text-white">
        <div>
          <ShieldCheck className="mx-auto h-12 w-12 text-orange-500" />
          <h1 className="mt-4 text-2xl font-black">Área restrita ao Master</h1>
          <Button onClick={() => setView('landing')} className="mt-6 rounded-xl bg-orange-500 font-bold">
            Voltar ao site
          </Button>
        </div>
      </div>
    )
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setView('landing')
  }

  const nav = (
    <nav className="space-y-1" aria-label="Seções do painel">
      {SECTIONS.map((s) => {
        const active = section === s.id
        return (
          <button
            key={s.id}
            onClick={() => {
              setSection(s.id)
              setMobileNav(false)
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all',
              active
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-600/25'
                : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
            )}
          >
            <s.icon className="h-4.5 w-4.5" />
            {s.label}
            {s.id === 'sugestoes' && newSuggestions > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white">
                {newSuggestions}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-zinc-100">
      {/* ============ SIDEBAR DESKTOP ============ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-zinc-950 p-4 lg:flex">
        <div className="px-2 py-3">
          <Logo dark />
        </div>
        <div className="mt-4 mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-400">
            <Crown className="h-3 w-3" /> Painel Master
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-zinc-300">{user.email}</p>
        </div>

        {nav}

        <div className="mt-auto space-y-1.5 border-t border-zinc-800/80 pt-3">
          <button
            onClick={() => setView('portal')}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-white"
          >
            <ExternalLink className="h-4.5 w-4.5" /> Ver portal
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4.5 w-4.5" /> Sair
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="glass-header sticky top-0 z-30 border-b border-zinc-200">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl lg:hidden"
                onClick={() => setMobileNav(true)}
                aria-label="Abrir menu do painel"
              >
                <Menu className="h-4.5 w-4.5" />
              </Button>
              <h1 className="text-lg font-black tracking-tight text-zinc-900">
                {SECTIONS.find((s) => s.id === section)?.label}
              </h1>
            </div>
            <Button
              onClick={() => setView('portal')}
              variant="outline"
              className="hidden h-9 rounded-xl border-zinc-200 text-sm font-bold text-zinc-600 sm:inline-flex"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Ver portal
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {section === 'dashboard' && <DashboardSection onNavigate={setSection} />}
            {section === 'arts' && <AdminArtsSection />}
            {section === 'categories' && <AdminCategoriesSection />}
            {section === 'tags' && <AdminTagsSection />}
            {section === 'seasonal' && <AdminSeasonalSection />}
            {section === 'users' && <UsersSection />}
            {section === 'payments' && <PaymentsSection />}
            {section === 'sugestoes' && <AdminSuggestionsSection />}
            {section === 'settings' && <AdminSettingsSection />}
          </motion.div>
        </main>
      </div>

      {/* Mobile nav */}
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="w-72 bg-zinc-950 p-4">
          <SheetHeader className="p-2 text-left">
            <SheetTitle className="text-white">
              <Logo dark />
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">{nav}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ==================== DASHBOARD ==================== */

type AdminStats = {
  stats: {
    users: number
    usersWithAccess: number
    arts: number
    categories: number
    tags: number
    events: number
    downloads: number
    revenueCents: number
    approvedPayments: number
    pendingPayments: number
    pendingManualCount?: number
  }
  pendingManualUsers?: { id: string; name: string; email: string; status: string; updatedAt: string }[]
  recentPayments: {
    id: string
    userName: string
    userEmail: string
    provider: string
    amountCents: number
    status: string
    createdAt: string
  }[]
  recentUsers: { id: string; name: string; email: string; hasAccess: boolean; createdAt: string }[]
  recentSuggestions?: { id: string; message: string; name: string; contact: string; status: string; createdAt: string }[]
}

function DashboardSection({ onNavigate }: { onNavigate?: (s: AdminSection) => void }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await fetch('/api/admin/stats')).json(),
  })

  const releaseUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasAccess: true }),
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Conta liberada! Acesso ativo no portal.')
    },
    onError: () => toast.error('Erro ao liberar a conta.'),
  })

  if (isLoading || !data) {
    return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-200/70" />)}</div>
  }

  const s = data.stats
  const cards = [
    { label: 'Receita total', value: formatBRL(s.revenueCents), icon: TrendingUp, hint: `${s.approvedPayments} pagamentos aprovados`, accent: true },
    { label: 'Usuários', value: s.users, icon: Users, hint: `${s.usersWithAccess} com acesso ativo` },
    { label: 'Artes no acervo', value: s.arts, icon: Image, hint: `${s.categories} categorias · ${s.tags} tags` },
    { label: 'Downloads', value: s.downloads, icon: Download, hint: s.pendingPayments === 1 ? '1 pagamento pendente' : `${s.pendingPayments} pagamentos pendentes` },
  ]

  return (
    <div className="space-y-6">
      {/* Aguardando liberação (PIX manual) */}
      {(data.pendingManualUsers?.length ?? 0) > 0 && (
        <div className="rounded-2xl border-2 border-orange-300 bg-orange-50/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-orange-700">
              <Clock3 className="h-4 w-4" /> Aguardando liberação — PIX manual ({data.stats.pendingManualCount})
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-orange-300 bg-white text-xs font-bold text-orange-600 hover:bg-orange-100"
              onClick={() => onNavigate?.('users')}
            >
              Ver todos os clientes
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {data.pendingManualUsers!.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-800">{u.name}</p>
                  <p className="truncate text-xs text-zinc-400">{u.email}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => releaseUser.mutate(u.id)}
                  disabled={releaseUser.isPending}
                  className="h-8 rounded-lg bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Liberar acesso
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-orange-700/80">
            Cadastros pré-aprovados no checkout do PIX manual — libere após conferir o comprovante no WhatsApp.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={cn(
              'rounded-2xl border p-5 shadow-sm',
              c.accent ? 'border-orange-500/40 bg-gradient-to-br from-zinc-950 to-zinc-900 text-white' : 'border-zinc-200 bg-white'
            )}
          >
            <div className="flex items-center justify-between">
              <p className={cn('text-xs font-black uppercase tracking-wider', c.accent ? 'text-orange-400' : 'text-zinc-400')}>
                {c.label}
              </p>
              <c.icon className={cn('h-5 w-5', c.accent ? 'text-orange-400' : 'text-zinc-300')} />
            </div>
            <p className={cn('mt-2 text-3xl font-black tracking-tight', c.accent ? 'text-white' : 'text-zinc-950')}>{c.value}</p>
            <p className={cn('mt-1 text-xs font-medium', c.accent ? 'text-zinc-400' : 'text-zinc-400')}>{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent payments */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-700">
            <Receipt className="h-4 w-4 text-orange-500" /> Pagamentos recentes
          </h3>
          <div className="mt-3 space-y-2.5">
            {data.recentPayments.length === 0 && <p className="text-sm text-zinc-400">Nenhum pagamento ainda.</p>}
            {data.recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-800">{p.userName}</p>
                  <p className="truncate text-xs text-zinc-400">
                    {p.provider === 'MANUAL_PIX' ? 'PIX Manual' : p.provider} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-zinc-900">{formatBRL(p.amountCents)}</p>
                  <Badge
                    className={cn(
                      'text-[9px] font-black uppercase',
                      p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : p.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-zinc-100 text-zinc-500'
                    )}
                  >
                    {p.status === 'APPROVED' ? 'Aprovado' : p.status === 'PENDING' ? 'Pendente' : p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-700">
            <UserIcon className="h-4 w-4 text-orange-500" /> Novos clientes
          </h3>
          <div className="mt-3 space-y-2.5">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3.5 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-black text-white">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-800">{u.name}</p>
                    <p className="truncate text-xs text-zinc-400">{u.email}</p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    'shrink-0 text-[9px] font-black uppercase',
                    u.hasAccess ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                  )}
                >
                  {u.hasAccess ? 'Acesso ativo' : 'Sem acesso'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sugestões de tema recentes */}
      {data.recentSuggestions && data.recentSuggestions.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-700">
              <Lightbulb className="h-4 w-4 text-orange-500" /> Sugestões de tema recentes
            </h3>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => onNavigate?.('sugestoes')}
            >
              Ver todas
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {data.recentSuggestions.map((sg) => (
              <div key={sg.id} className="flex items-start justify-between gap-3 rounded-xl bg-zinc-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-800">{sg.message}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    {sg.name || sg.contact ? [sg.name, sg.contact].filter(Boolean).join(' · ') : 'Sugestão anônima'} ·{' '}
                    {new Date(sg.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge
                  className={cn(
                    'shrink-0 text-[9px] font-black uppercase',
                    sg.status === 'NEW' ? 'bg-orange-100 text-orange-700' : sg.status === 'SEEN' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {sg.status === 'NEW' ? 'Nova' : sg.status === 'SEEN' ? 'Vista' : 'Concluída'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================== USERS ==================== */

type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  hasAccess: boolean
  status: string
  isDemo?: boolean
  createdAt: string
  downloadsCount: number
  favoritesCount: number
}

function UsersSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ['admin-users'],
    queryFn: async () => (await fetch('/api/admin/users')).json(),
  })

  const patchUser = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'fail')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Usuário atualizado!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar usuário.'),
  })

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'fail')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Usuário excluído.')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao excluir.'),
  })

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-zinc-200/70" />

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead className="font-black text-zinc-500">Cliente</TableHead>
            <TableHead className="font-black text-zinc-500">Acesso</TableHead>
            <TableHead className="hidden font-black text-zinc-500 md:table-cell">Atividade</TableHead>
            <TableHead className="hidden font-black text-zinc-500 lg:table-cell">Cadastro</TableHead>
            <TableHead className="text-right font-black text-zinc-500">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 text-xs font-black text-orange-400">
                    {u.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-900">
                      {u.name} {u.role === 'ADMIN' && <Badge className="ml-1 bg-orange-100 text-[9px] font-black text-orange-600">MASTER</Badge>}
                    </p>
                    <p className="truncate text-xs text-zinc-400">{u.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {u.hasAccess ? (
                  <Badge className="bg-emerald-100 font-black uppercase text-emerald-700">Ativo</Badge>
                ) : u.status === 'PENDING_MANUAL' ? (
                  <Badge className="bg-orange-100 font-black uppercase text-orange-700">
                    <Clock3 className="mr-1 h-3 w-3" /> Aguardando PIX
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-100 font-black uppercase text-zinc-500">Sem acesso</Badge>
                )}
              </TableCell>
              <TableCell className="hidden text-sm text-zinc-500 md:table-cell">
                {u.downloadsCount} downloads · {u.favoritesCount} favoritas
              </TableCell>
              <TableCell className="hidden text-sm text-zinc-500 lg:table-cell">
                {new Date(u.createdAt).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      'h-8 rounded-lg text-xs font-bold',
                      u.hasAccess ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    )}
                    onClick={() => patchUser.mutate({ id: u.id, body: { hasAccess: !u.hasAccess } })}
                  >
                    {u.hasAccess ? 'Revogar' : 'Liberar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs font-bold text-zinc-500"
                    onClick={() => patchUser.mutate({ id: u.id, body: { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' } })}
                  >
                    {u.role === 'ADMIN' ? 'Tornar cliente' : 'Tornar master'}
                  </Button>
                  <ResetPasswordDialog
                    user={{ id: u.id, name: u.name }}
                    onSaved={(msg) => {
                      toast.success(msg)
                      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                    }}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {u.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso remove a conta, favoritos e histórico de downloads. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600" onClick={() => deleteUser.mutate(u.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * ResetPasswordDialog — redefinição de senha pelo Admin Master.
 * A plataforma não tem recuperação automática de senha por enquanto:
 * quando o cliente perder o acesso, o Master cria uma nova senha aqui
 * e envia para ele (WhatsApp/telefone).
 */
function ResetPasswordDialog({ user, onSaved }: { user: { id: string; name: string }; onSaved: (msg: string) => void }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (password.length < 6) {
      toast.error('A senha precisa ter no mínimo 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Falha ao redefinir.')
      onSaved(`Nova senha definida para ${user.name.split(' ')[0]} — envie para o cliente.`)
      setPassword('')
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao redefinir a senha.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setPassword('') }}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-orange-50 hover:text-orange-600"
          aria-label={`Redefinir senha de ${user.name}`}
          title="Redefinir senha"
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-zinc-950">
            <KeyRound className="h-5 w-5 text-orange-500" /> Redefinir senha
          </DialogTitle>
          <DialogDescription>
            Crie uma nova senha para <strong className="text-zinc-700">{user.name}</strong>. Como não há recuperação
            automática, envie a nova senha para o cliente pelo WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="nova-senha" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
            Nova senha (mín. 6 caracteres)
          </Label>
          <Input
            id="nova-senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ex: caneca2026"
            className="h-10 rounded-xl font-mono"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold text-zinc-500">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving || password.length < 6}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black text-white shadow-md shadow-orange-500/25"
          >
            {saving ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ==================== PAYMENTS ==================== */

type AdminPayment = {
  id: string
  userName: string
  userEmail: string
  provider: string
  amountCents: number
  status: string
  createdAt: string
  approvedAt: string | null
}

function PaymentsSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ payments: AdminPayment[] }>({
    queryKey: ['admin-payments'],
    queryFn: async () => (await fetch('/api/admin/payments')).json(),
  })

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/payments/${id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('fail')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Pagamento aprovado e acesso liberado!')
    },
    onError: () => toast.error('Erro ao aprovar pagamento.'),
  })

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-zinc-200/70" />

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead className="font-black text-zinc-500">Data</TableHead>
            <TableHead className="font-black text-zinc-500">Cliente</TableHead>
            <TableHead className="hidden font-black text-zinc-500 md:table-cell">Gateway</TableHead>
            <TableHead className="font-black text-zinc-500">Valor</TableHead>
            <TableHead className="font-black text-zinc-500">Status</TableHead>
            <TableHead className="text-right font-black text-zinc-500">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-400">
                Nenhum pagamento registrado ainda.
              </TableCell>
            </TableRow>
          )}
          {data?.payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-sm text-zinc-500">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell>
                <p className="text-sm font-bold text-zinc-900">{p.userName}</p>
                <p className="text-xs text-zinc-400">{p.userEmail}</p>
              </TableCell>
              <TableCell className="hidden">
                <Badge variant="outline" className="rounded-lg font-bold text-zinc-500">
                  {p.provider === 'MANUAL_PIX' ? 'PIX Manual' : p.provider}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-black text-zinc-900">{formatBRL(p.amountCents)}</TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    'font-black uppercase',
                    p.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : p.status === 'PENDING'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-zinc-100 text-zinc-500'
                  )}
                >
                  {p.status === 'APPROVED' ? 'Aprovado' : p.status === 'PENDING' ? 'Pendente' : p.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {p.status === 'PENDING' ? (
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
                    onClick={() => approve.mutate(p.id)}
                  >
                    Aprovar
                  </Button>
                ) : (
                  <span className="text-xs text-zinc-300">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
