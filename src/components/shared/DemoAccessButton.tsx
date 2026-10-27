'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, Loader2 } from 'lucide-react'
import { enterPublicDemo } from '@/lib/demo-client'
import { cn } from '@/lib/utils'

export function DemoAccessButton({ location, className, disabled = false, onBusyChange }: {
  location: string; className?: string; disabled?: boolean; onBusyChange?: (busy: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const busyRef = useRef(false)
  const open = async () => {
    if (disabled || busyRef.current) return
    busyRef.current = true; setBusy(true); onBusyChange?.(true); setError('')
    try { await enterPublicDemo(queryClient, location) }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível abrir a demonstração.') }
    finally { busyRef.current = false; setBusy(false); onBusyChange?.(false) }
  }
  return <div className="min-w-0">
    <button type="button" onClick={open} disabled={disabled || busy} aria-busy={busy} className={cn('inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 disabled:cursor-wait disabled:opacity-60', className)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}{busy ? 'Abrindo demonstração…' : 'Conhecer por dentro'}
    </button>
    {error && <p role="alert" className="mt-2 max-w-sm text-sm font-semibold text-red-500">{error}</p>}
  </div>
}
