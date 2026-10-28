'use client'

/**
 * PageViewTracker — dispara eventos de visualização (GA4/GTM)
 * nas páginas server-rendered do blog e sobre.
 */
import { useEffect } from 'react'
import { track } from '@/lib/analytics'

export function PageViewTracker({ event, title }: { event: string; title: string }) {
  useEffect(() => {
    track(event, { title })
  }, [event, title])
  return null
}
