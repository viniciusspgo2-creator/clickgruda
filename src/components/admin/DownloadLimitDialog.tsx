'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function DownloadLimitDialog({ user }: { user: { id: string; name: string; downloadLimit?: number | null; downloadsCount: number } }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [limited, setLimited] = useState(user.downloadLimit != null)
  const [value, setValue] = useState(String(user.downloadLimit ?? 5))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setLimited(user.downloadLimit != null); setValue(String(user.downloadLimit ?? 5)) }
  }, [open, user.downloadLimit])

  async function save() {
    if (limited && (!/^\d+$/.test(value) || Number(value) > 100000)) {
      toast.error('Informe um número inteiro de 0 até 100.000.'); return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLimit: limited ? Number(value) : null }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível atualizar o limite.')
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(limited ? 'Limite de downloads configurado!' : 'Downloads ilimitados liberados!')
      setOpen(false)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  return <Dialog open={open} onOpenChange={saving ? undefined : setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline" className="h-8 rounded-lg border-orange-200 text-xs font-bold text-orange-700"><Download className="mr-1 h-3.5 w-3.5" /> Limite</Button></DialogTrigger>
    <DialogContent className="max-w-md rounded-3xl bg-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg font-black text-zinc-950"><Download className="h-5 w-5 text-orange-500" /> Limite de downloads</DialogTitle>
        <DialogDescription>Configure quantas artes <strong>{user.name}</strong> poderá baixar durante o teste.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">Histórico registrado: <strong>{user.downloadsCount.toLocaleString('pt-BR')} downloads</strong>. A nova cota considera também os downloads anteriores.</div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <span><span className="block text-sm font-bold text-zinc-900">Ativar limite individual</span><span className="text-xs text-zinc-600">Desligado = downloads ilimitados</span></span>
          <Switch checked={limited} onCheckedChange={setLimited} />
        </label>
        {limited && <div className="space-y-1.5"><Label htmlFor="edit-user-downloads">Total de downloads permitidos</Label>
          <Input id="edit-user-downloads" type="number" min={0} max={100000} step={1} value={value} onChange={e => setValue(e.target.value)} />
          <p className="text-xs text-zinc-500">Ao atingir a cota, bloqueia o download e mostra prévias embaçadas. ZIP indisponível enquanto limitado.</p>
        </div>}
        <Button disabled={saving} onClick={save} className="h-11 w-full rounded-xl bg-orange-500 font-bold hover:bg-orange-600">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar limite</Button>
      </div>
    </DialogContent>
  </Dialog>
}
