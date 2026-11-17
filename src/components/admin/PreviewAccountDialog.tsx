'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, ShieldCheck, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type PreviewUser = { id: string; name: string; email: string; previewMaxSessions?: number; isStudioOnly?: boolean }

export function PreviewAccountDialog({ user }: { user?: PreviewUser }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('Preview Click & Gruda')
  const [password, setPassword] = useState('')
  const [limit, setLimit] = useState('10')
  const [saving, setSaving] = useState(false)
  const [studioOnly, setStudioOnly] = useState(false)
  const isStudio = Boolean(user?.isStudioOnly)
  useEffect(() => { if (open) { setName(user?.name || 'Preview Click & Gruda'); setEmail(user?.email || ''); setLimit(String(user?.previewMaxSessions ?? 10)); setPassword(''); setStudioOnly(Boolean(user?.isStudioOnly)) } }, [open, user?.email, user?.name, user?.previewMaxSessions, user?.isStudioOnly])

  async function submit() {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/preview', {
        method: user ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user ? { id: user.id, maxSessions: Number(limit), password } : { name, email, password, maxSessions: Number(limit), studioOnly }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar a conta.')
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(user ? (isStudio ? 'Acesso Studio atualizado.' : 'Conta Preview atualizada.') : (studioOnly ? 'Acesso Studio criado! Compartilhe o e-mail e a senha definida.' : 'Conta Preview criada! Compartilhe o e-mail e a senha definida.'))
      // A senha aparece apenas no campo atual; nunca é recuperada da API.
      setOpen(false)
      setPassword('')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Erro ao salvar.') }
    finally { setSaving(false) }
  }

  return <>
    <Button onClick={() => setOpen(true)} variant="outline" className="h-10 rounded-xl border-orange-300 font-black text-orange-600"><Eye className="mr-2 h-4 w-4" />{user ? (isStudio ? 'Configurar Studio' : 'Configurar Preview') : 'Criar usuário Preview'}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg rounded-3xl"><DialogHeader>
      <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-orange-500" />{user ? (isStudio ? 'Gerenciar acesso só-Studio' : 'Gerenciar conta de avaliação') : 'Novo login universal'}</DialogTitle>
      <DialogDescription>{user ? (isStudio ? 'Login compartilhado só para o Studio 3D e 2D. Biblioteca em prévia protegida, downloads e bônus bloqueados; Academia liberada.' : 'Compartilhe este login para demonstrações. Acesso somente leitura, imagens protegidas e downloads bloqueados.') : 'Login universal compartilhado. Escolha o tipo: Preview (só visualização) ou Studio (só Studio 3D e 2D, com Biblioteca em prévia protegida e Academia liberada).'}</DialogDescription>
    </DialogHeader><div className="space-y-4 pt-2">
      {!user && <><div><Label>Tipo de acesso</Label><div className="mt-1 grid grid-cols-2 gap-2"><button type="button" onClick={() => setStudioOnly(false)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${!studioOnly ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-zinc-200 text-zinc-600'}`}>Preview · só visualização</button><button type="button" onClick={() => setStudioOnly(true)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${studioOnly ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-zinc-200 text-zinc-600'}`}>Studio · só Studio 3D e 2D</button></div><p className="mt-1 text-[11px] text-zinc-500">{studioOnly ? 'Quem entrar com este login usa o Studio 3D e 2D à vontade e a Academia, navega na Biblioteca com prévia protegida, mas não baixa artes nem abre os links dos bônus.' : 'Quem entrar com este login só navega e vê as artes, sem baixar nada.'}</p></div>
        <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 rounded-xl"/></div>
        <div><Label>E-mail usado no login</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="preview@seudominio.com" className="mt-1 rounded-xl" /></div></>}
      {user && <div className="rounded-xl bg-zinc-100 p-3 text-xs text-zinc-600">Login: <strong>{user.email}</strong>{isStudio && ' · só-Studio'}</div>}
      <div><Label>{user ? 'Nova senha (opcional)' : 'Senha inicial'}</Label><Input type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="mt-1 rounded-xl font-mono"/><p className="mt-1 text-[11px] text-zinc-500">A senha não poderá ser consultada depois. Ao redefinir, as sessões atuais serão desconectadas.</p></div>
      <div><Label>Acessos simultâneos permitidos (1 a 500)</Label><Input type="number" min={1} max={500} value={limit} onChange={(e) => setLimit(e.target.value)} className="mt-1 rounded-xl"/><p className="mt-1 text-[11px] text-zinc-500">Ao ultrapassar o limite, o dispositivo menos recente é desconectado. 10 e 20 são opções comuns.</p></div>
      <Button onClick={submit} disabled={saving} className="h-11 w-full rounded-xl bg-orange-500 font-black text-white hover:bg-orange-600"><UserPlus className="mr-2 h-4 w-4" />{saving ? 'Salvando...' : user ? 'Salvar configurações' : 'Criar acesso universal'}</Button>
    </div></DialogContent></Dialog>
  </>
}
