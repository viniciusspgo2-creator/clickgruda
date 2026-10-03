'use client'

import { create } from 'zustand'

export type View = 'landing' | 'auth' | 'checkout' | 'portal' | 'admin' | 'catalogo'
export type PortalTab = 'todas' | 'lancamentos' | 'sazonal' | 'favoritas' | 'downloads' | 'compartilhar'
export type AuthMode = 'login' | 'register'
export type SortMode = 'recentes' | 'baixadas' | 'nome'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  hasAccess: boolean
  isDemo?: boolean
  /** ACTIVE | PENDING_MANUAL (aguardando liberação do PIX manual) */
  status?: string
}

export function saveView(view: View) {
  try {
    sessionStorage.setItem('cg_view', view)
  } catch {
    /* ignore */
  }
}

interface AppState {
  view: View
  setView: (v: View) => void
  ready: boolean
  setReady: (b: boolean) => void

  user: SessionUser | null
  setUser: (u: SessionUser | null) => void

  /** Token do catálogo compartilhado (/?catalogo=TOKEN) — página pública para o cliente do assinante */
  shareToken: string | null
  setShareToken: (t: string | null) => void

  authMode: AuthMode
  setAuthMode: (m: AuthMode) => void
  pendingIntent: 'checkout' | null
  setPendingIntent: (p: 'checkout' | null) => void

  menuOpen: boolean
  setMenuOpen: (b: boolean) => void

  // Portal filters
  tab: PortalTab
  q: string
  categoryIds: string[]
  tagIds: string[]
  sort: SortMode
  seasonalEventId: string | null
  setFilter: (partial: Partial<Pick<AppState, 'tab' | 'q' | 'categoryIds' | 'tagIds' | 'sort' | 'seasonalEventId'>>) => void
  resetFilters: () => void

  // Checkout
  checkoutProvider: 'MERCADOPAGO' | 'ASAAS' | null
  setCheckoutProvider: (p: 'MERCADOPAGO' | 'ASAAS' | null) => void
}

export const useStore = create<AppState>((set) => ({
  view: 'landing',
  setView: (v) => {
    saveView(v)
    set({ view: v })
  },
  ready: false,
  setReady: (b) => set({ ready: b }),

  user: null,
  setUser: (u) => set({ user: u }),

  shareToken: null,
  setShareToken: (t) => set({ shareToken: t }),

  authMode: 'login',
  setAuthMode: (m) => set({ authMode: m }),
  pendingIntent: null,
  setPendingIntent: (p) => set({ pendingIntent: p }),

  menuOpen: false,
  setMenuOpen: (b) => set({ menuOpen: b }),

  tab: 'todas',
  q: '',
  categoryIds: [],
  tagIds: [],
  sort: 'recentes',
  seasonalEventId: null,
  setFilter: (partial) => set(partial),
  resetFilters: () =>
    set({ tab: 'todas', q: '', categoryIds: [], tagIds: [], sort: 'recentes', seasonalEventId: null }),

  checkoutProvider: null,
  setCheckoutProvider: (p) => set({ checkoutProvider: p }),
}))
