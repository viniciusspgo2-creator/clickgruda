'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import { SALES } from '@/components/landing/sales-content'
import { PremiumLanding } from '@/components/landing/PremiumLanding'
import { leaveDemoForAccount } from '@/lib/demo-client'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'
import { useStore } from '@/lib/store'
import { formatBRL } from '@/lib/types'
import { useFreeSignup } from '@/hooks/use-free-signup'

export function LandingView() {
  const user = useStore(s => s.user)
  const queryClient = useQueryClient()
  const setView = useStore(s => s.setView)
  const setAuthMode = useStore(s => s.setAuthMode)
  const setPendingIntent = useStore(s => s.setPendingIntent)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const reduced = useReducedMotion()
  const freeSignup = useFreeSignup()
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // A campanha tem preço aprovado fixo; nunca ocultá-lo enquanto o catálogo carrega.
  const priceCents = SALES.defaultPriceCents
  const price = formatBRL(priceCents)
  const priceConfirmed = true
  // A cota do teste não representa a quantidade total de artes do acervo.

  const campaignActive = priceConfirmed && priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const hasAccess = Boolean(user?.hasAccess && !user.isDemo)
  const hasFullAccess = hasAccess && !user?.isTrial
  const canStartTrial = Boolean(freeSignup && (!user || user.isDemo))
  const buyLabel = hasFullAccess ? 'Acessar minha biblioteca' : 'Garantir acesso completo'
  const startLabel = hasAccess ? user?.isTrial ? 'Continuar meu teste' : 'Acessar minha biblioteca' : canStartTrial ? 'Começar teste grátis' : 'Começar pela Biblioteca'
  useEffect(() => { track('landing_view', { location: 'home' }) }, [])
  const goPurchase = async (location: string) => {
    track('cta_click', { location, intent: 'checkout', price_cents: priceCents })
    setMenuOpen(false)
    if (user?.isDemo) { try { await leaveDemoForAccount(queryClient, 'register') } catch (e) { toast.error((e as Error).message) }; return }
    if (hasFullAccess) { setView('hub'); return }
    if (user) { window.location.assign('/comprar'); return }
    setAuthMode('register'); setPendingIntent('checkout'); setView('auth')
  }
  const goStart = async (location: string) => {
    track('cta_click', { location, intent: hasAccess ? 'portal' : 'free_signup' })
    setMenuOpen(false)
    if (hasAccess) { setView('hub'); return }
    if (user?.isDemo) {
      try { await leaveDemoForAccount(queryClient, 'register', false) }
      catch (error) { toast.error((error as Error).message) }
      return
    }
    if (user) { window.location.assign('/comprar'); return }
    setAuthMode('register'); setPendingIntent(null); setView('auth')
  }
  const goLogin = async () => { track('cta_click', { location: 'login', intent: 'auth' }); setMenuOpen(false); if (user?.isDemo) { try { await leaveDemoForAccount(queryClient, 'login', false) } catch (e) { toast.error((e as Error).message) }; return }; setAuthMode('login'); setView('auth') }
  const scrollTo = (id: string) => {
    setMenuOpen(false)
    track('cta_click', { location: 'navigation', intent: id })
    // Wait for the mobile menu to collapse before measuring the target position.
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }))
  }

  return <PremiumLanding
    menuOpen={menuOpen} setMenuOpen={setMenuOpen} showSticky={showSticky}
    reduced={Boolean(reduced)} price={price} campaignActive={campaignActive}
    hasAccess={hasAccess} hasFullAccess={hasFullAccess} canStartTrial={canStartTrial}
    startLabel={startLabel} buyLabel={buyLabel}
    goStart={goStart} goPurchase={goPurchase} goLogin={goLogin} scrollTo={scrollTo}
  />
}

