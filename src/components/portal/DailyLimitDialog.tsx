'use client'

import { PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/** Aviso amigável quando a pessoa chega ao limite diário de downloads. */
export function DailyLimitDialog({
  open,
  onOpenChange,
  limit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  limit: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-zinc-200 bg-white p-0 text-center sm:p-0" aria-describedby="limit-desc">
        <DialogHeader className="items-center px-6 pb-2 pt-8">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <PartyPopper className="h-8 w-8" />
          </span>
          <DialogTitle className="mt-3 text-lg font-black text-zinc-900">
            Você baixou bastante hoje! 🎉
          </DialogTitle>
          <DialogDescription id="limit-desc" className="text-sm leading-relaxed text-zinc-500">
            Você chegou ao limite de <b className="text-zinc-800">{limit} downloads</b> de hoje. Para não sobrecarregar o
            sistema, o limite renova todo dia à <b className="text-zinc-800">meia-noite</b>.
            <br />
            Volte amanhã e baixe mais {limit}!
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-3">
          <Button onClick={() => onOpenChange(false)} className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black">
            Combinado, volto amanhã
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
