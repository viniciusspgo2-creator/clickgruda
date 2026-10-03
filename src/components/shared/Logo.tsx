'use client'

import { Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
        <Coffee className="h-4.5 w-4.5 text-white" fill="white" strokeWidth={2.2} />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white border-2 border-orange-500" />
      </div>
      {!compact && (
        <div className="leading-none">
          <span
            className={cn(
              'font-extrabold tracking-tight text-lg whitespace-nowrap',
              dark ? 'text-white' : 'text-zinc-950'
            )}
          >
            Click <span className="text-orange-500">&amp;</span> Gruda
          </span>
          <span
            className={cn(
              'block text-[9px] font-bold uppercase tracking-[0.28em] mt-0.5',
              dark ? 'text-zinc-500' : 'text-zinc-400'
            )}
          >
            artes para canecas
          </span>
        </div>
      )}
    </div>
  )
}
