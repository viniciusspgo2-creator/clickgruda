'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { formatArtCode } from '@/lib/art-code'
import type { ArtItem } from '@/lib/types'

export function PortalDeleteArtDialog({ art, onClose, onDeleted }: { art: ArtItem; onClose: () => void; onDeleted: (art: ArtItem) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function remove() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/arts/' + encodeURIComponent(art.id), { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok && response.status !== 404) throw Error(data.error || 'Não foi possível excluir a arte. Tente novamente.')
      onDeleted(art)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sem conexão. Tente novamente.')
    } finally { setBusy(false) }
  }
  return <AlertDialog open onOpenChange={open => { if (!open && !busy) onClose() }}>
    <AlertDialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl border-zinc-200 bg-white text-zinc-900" onEscapeKeyDown={event => { if (busy) event.preventDefault() }}>
      <AlertDialogHeader>
        <AlertDialogTitle>Excluir esta arte da Biblioteca?</AlertDialogTitle>
        <AlertDialogDescription className="text-zinc-600">A arte será removida do acervo para todos os membros. Esta é a mesma exclusão disponível no painel Admin.</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-xs font-bold text-orange-700">{formatArtCode(art.code)}</p><p className="mt-1 break-words text-sm font-semibold">{art.title}</p></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy} className="border-zinc-200 bg-white text-zinc-800">Cancelar</AlertDialogCancel>
        <AlertDialogAction disabled={busy} onClick={event => { event.preventDefault(); remove() }} className="bg-red-600 text-white hover:bg-red-700">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}{busy ? 'Excluindo…' : 'Confirmar exclusão'}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
}
