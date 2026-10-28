'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Loader2 } from 'lucide-react'
import { leaveDemoForAccount } from '@/lib/demo-client'
import type { AuthMode } from '@/lib/store'
import { toast } from 'sonner'

export function DemoConversionActions() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const go = async (mode: AuthMode) => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true)
    try { await leaveDemoForAccount(queryClient, mode) }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível continuar.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  return <div className="flex flex-wrap items-center justify-center gap-3">
    <button type="button" disabled={busy} onClick={() => go('register')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-400 px-4 py-2.5 text-sm font-extrabold text-[#17120f] transition-colors hover:bg-orange-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Liberar meu acesso</button>
    <button type="button" disabled={busy} onClick={() => go('login')} className="min-h-11 rounded-xl px-2 py-2 text-sm font-bold text-[#f1f5f9] underline underline-offset-4 hover:text-orange-200 focus-visible:outline-2 focus-visible:outline-orange-300 disabled:opacity-60">Já tenho conta</button>
  </div>
}
