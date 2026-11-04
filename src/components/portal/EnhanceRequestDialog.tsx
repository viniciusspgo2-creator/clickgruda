'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ImageUp, Loader2, Send, Trash2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { track } from '@/lib/analytics'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXT = ['png', 'jpg', 'jpeg', 'webp']
const MAX_NOTE = 400

/**
 * EnhanceRequestDialog — envio de arte própria pixelizada / em baixa qualidade.
 * O arquivo vai direto para o Painel Admin Master (ArtEnhanceRequest) e a
 * equipe devolve a arte com a qualidade melhorada.
 */
export function EnhanceRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reabre limpo a cada nova sessão do diálogo
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setError('')
    }
  }, [open])

  // Limpa a prévia quando fecha
  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreviewUrl('')
      setNote('')
    }
  }, [open])

  const pick = (f: File | null | undefined) => {
    if (!f) return
    const ext = (f.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      setError('Formato não suportado. Envie PNG, JPG ou WEBP.')
      return
    }
    if (f.size > MAX_SIZE) {
      setError('Arquivo muito grande. Máximo: 10MB.')
      return
    }
    setError('')
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Escolha a imagem da sua arte para enviar.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (note.trim()) fd.append('note', note.trim())
      const res = await fetch('/api/enhance-requests', { method: 'POST', body: fd })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar agora. Tente novamente.')
      track('enhance_request', { size: file.size, hasNote: !!note.trim() })
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-zinc-200 bg-white p-0 sm:p-0" aria-describedby="enhance-desc">
        <DialogHeader className="rounded-t-3xl bg-zinc-950 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-white">
            <Wand2 className="h-5 w-5 text-orange-400" /> Melhorar qualidade da arte
          </DialogTitle>
          <DialogDescription id="enhance-desc" className="text-sm font-medium text-zinc-400">
            Sua arte está pixelizada ou de baixa qualidade? Nós melhoramos ela pra você — grátis para assinantes.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-5">
          {status === 'sent' ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </motion.div>
              <h3 className="mt-4 text-lg font-black text-zinc-900">Arte enviada! ✨</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-500">
                Recebemos a sua arte. Nossa equipe vai melhorar a qualidade e você vai receber o resultado em breve.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="mt-5 h-10 rounded-xl bg-zinc-950 px-6 font-bold text-white hover:bg-zinc-800"
              >
                Fechar
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Área de upload */}
              {file && previewUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <img src={previewUrl} alt="Prévia da arte enviada" className="mx-auto max-h-56 w-full object-contain p-2" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      setPreviewUrl('')
                    }}
                    aria-label="Remover imagem"
                    className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-zinc-200 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-500"
                >
                  <ImageUp className="h-8 w-8" />
                  <span className="text-sm font-bold">Toque para escolher a sua arte</span>
                  <span className="text-[11px] font-semibold">PNG, JPG ou WEBP · até 10MB</span>
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  pick(e.target.files?.[0])
                  e.target.value = ''
                }}
              />

              <div className="space-y-1.5">
                <Label htmlFor="enhance-note" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  Observação <span className="font-medium normal-case text-zinc-400">(opcional)</span>
                </Label>
                <textarea
                  id="enhance-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
                  placeholder="ex: quero usar numa caneca, precisa ficar bem nítida..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-800 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-zinc-400">A arte vai direto para a nossa equipe.</p>
                <Button
                  type="submit"
                  disabled={status === 'sending' || !file}
                  className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 font-black text-white shadow-lg shadow-orange-500/30 hover:brightness-105"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      Enviar arte <Send className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
