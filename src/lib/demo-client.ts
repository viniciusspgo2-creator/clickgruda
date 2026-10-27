'use client'

import type { QueryClient } from '@tanstack/react-query'
import { useStore, type AuthMode, type SessionUser } from '@/lib/store'
import { track } from '@/lib/analytics'

export async function enterPublicDemo(queryClient: QueryClient, location: string) {
  const response = await fetch('/api/auth/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  const data = await response.json()
  if (!response.ok || !data.user?.hasAccess) throw new Error(data.error || 'Não foi possível abrir a demonstração.')
  // Limpa artes e dados da identidade anterior antes de montar o portal.
  queryClient.clear()
  const state = useStore.getState()
  state.resetFilters()
  state.setPendingIntent(null)
  state.setUser(data.user as SessionUser)
  state.setView('portal')
  track('feature_click', { location, intent: 'public_demo' })
}

export async function leaveDemoForAccount(queryClient: QueryClient, mode: AuthMode, checkout = mode === 'register') {
  if (useStore.getState().user?.isDemo) {
    const response = await fetch('/api/auth/logout', { method: 'POST' })
    if (!response.ok) throw new Error('Não foi possível sair da demonstração. Tente novamente.')
    queryClient.clear()
    useStore.getState().setUser(null)
  }
  const state = useStore.getState()
  state.resetFilters()
  state.setAuthMode(mode)
  state.setPendingIntent(checkout ? 'checkout' : null)
  state.setView('auth')
  track('cta_click', { location: 'demo_upgrade', intent: mode })
}
