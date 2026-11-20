'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function MemberAccessDialog({ user }: { user: { id: string; name: string; status: string; extraDevices?: number; lastAccessAt?: string | null } }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [extra, setExtra] = useState('0')
  const [blocked, setBlocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ extraDevices: Number(extra), blocked }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      await Promise.all([qc.invalidateQueries({ queryKey: ['admin-users'] }), qc.invalidateQueries({ queryKey: ['admin-security'] })])
      setOpen(false); toast.success('Permissões de acesso atualizadas.')
    } catch (error) { toast.error((error as Error).message || 'Não foi possível salvar.') }
    finally { setSaving(false) }
  }
  return <><Button type="button" size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold" onClick={() => { setExtra(String(user.extraDevices || 0)); setBlocked(user.status === 'BLOCKED'); setOpen(true) }}>Gerenciar acesso</Button>
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value) }}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Acesso de {user.name}</DialogTitle><DialogDescription>Plano individual: um dispositivo por vez. Habilite adicionais somente após confirmar a contratação com o cliente.</DialogDescription></DialogHeader>
      <p className="text-xs text-zinc-500">Último acesso: {user.lastAccessAt ? <span className="font-bold text-zinc-700">{new Date(user.lastAccessAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })} (Horário de Brasília)</span> : <span className="italic">nunca acessou</span>}</p>
      <div className="space-y-2"><Label htmlFor={`extra-${user.id}`}>Acessos simultâneos adicionais contratados</Label><Input id={`extra-${user.id}`} type="number" min={0} max={500} step={1} value={extra} onChange={event => setExtra(event.target.value)} /><p className="text-xs leading-5 text-zinc-500">R$ 14,90 por adicional, conforme condições combinadas no suporte. Limite total: {1 + Math.max(0, Math.min(500, Number(extra) || 0))} dispositivo(s). Reduzir o limite encerra as sessões excedentes.</p></div>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-4"><span className="text-sm font-bold text-red-800">Bloquear esta conta</span><Switch checked={blocked} onCheckedChange={setBlocked} /></label><p className="text-xs leading-5 text-zinc-500">O bloqueio encerra as sessões e impede novos logins. O histórico e a contratação do cliente são preservados para análise da equipe.</p>
      <Button onClick={save} disabled={saving} className="h-11 rounded-xl">{saving ? 'Salvando…' : 'Salvar permissões'}</Button>
    </DialogContent></Dialog></>
}
