'use client'

import { ManualPaymentDialog } from '@/components/admin/ManualPaymentDialog'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, CheckCircle2, Copy, Loader2, MessageCircle, RefreshCw, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/** Senha fácil de ditar no WhatsApp: sem 0/O, 1/l/I. Ex.: "gruda-K7Mq" */
function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(5)
  crypto.getRandomValues(bytes)
  return 'gruda-' + Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

type Created = { id: string; name: string; email: string; password: string; hasAccess: boolean; whatsapp: string; downloadLimit: number | null }

/** Cadastro manual de cliente — para quem fechou a compra pelo WhatsApp. */
export function NewUserDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [grantAccess, setGrantAccess] = useState(false)
  const [limited, setLimited] = useState(false)
  const [downloadLimit, setDownloadLimit] = useState('5')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Created | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setWhatsapp('')
    setPassword(generatePassword())
    setGrantAccess(false)
    setLimited(false)
    setDownloadLimit('5')
    setError('')
    setCreated(null)
  }

  const submit = async () => {
    setError('')
    if (limited && (!/^\d+$/.test(downloadLimit) || Number(downloadLimit) > 100000)) { setError('Informe um limite de downloads de 0 a 100.000.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, grantAccess, whatsapp, downloadLimit: limited ? Number(downloadLimit) : null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Não foi possível cadastrar.')
        return
      }
      setCreated({ id: data.user.id, name: data.user.name, email: data.user.email, password, hasAccess: data.user.hasAccess, whatsapp: data.user.whatsapp || whatsapp, downloadLimit: limited ? Number(downloadLimit) : null })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    } catch {
      setError('Sem conexão. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const message = created
    ? `Olá, ${created.name.split(' ')[0]}! 🎉 Seu acesso à Click & Gruda está ${created.hasAccess ? 'liberado' : 'criado'}.\n\n` +
      `🔗 Entre em: ${typeof window !== 'undefined' ? window.location.origin : ''}\n` +
      `📧 E-mail: ${created.email}\n` +
      `🔑 Senha: ${created.password}\n` +
      (created.downloadLimit !== null ? `🎁 Acesso de teste: até ${created.downloadLimit} download(s).\n\n` : '\n') +
      `Qualquer dúvida é só me chamar por aqui!`
    : ''

  const waDigits = created?.whatsapp.replace(/\D/g, '') || ''
  const waUrl = waDigits.length >= 10 ? `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}` : ''

  return (
    <>
      <Button
        onClick={() => {
          reset()
          setOpen(true)
        }}
        className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25"
      >
        <UserPlus className="mr-1.5 h-4 w-4" /> Novo usuário
      </Button>

      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-md rounded-3xl border-zinc-200 bg-white p-0 sm:p-0" aria-describedby="newuser-desc">
          <DialogHeader className="rounded-t-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-left">
            <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-white">
              <UserPlus className="h-5 w-5" /> Novo usuário
            </DialogTitle>
            <DialogDescription id="newuser-desc" className="text-sm font-medium text-orange-50">
              Crie acessos completos ou contas para testes com downloads limitados.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-5">
            {created ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                  <p className="text-sm font-black">
                    Cliente cadastrado{created.hasAccess ? ' e com acesso liberado' : ' (sem acesso ainda)'}!
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs leading-relaxed text-zinc-600">
                  <p><b className="text-zinc-800">E-mail:</b> {created.email}</p>
                  <p><b className="text-zinc-800">Senha:</b> <span className="font-mono">{created.password}</span></p>
                  {created.downloadLimit !== null && <p className="mt-1 font-bold text-orange-600">Teste limitado a {created.downloadLimit} downloads.</p>}
                  <p className="mt-2 text-[11px] text-amber-600">Anote ou envie agora: depois de fechar esta janela a senha não pode ser vista de novo (só redefinida).</p>
                </div>
                <textarea
                  readOnly
                  value={message}
                  rows={7}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(message)
                        toast.success('Mensagem copiada!')
                      } catch {
                        toast.error('Não consegui copiar. Selecione o texto e copie.')
                      }
                    }}
                    className="h-10 flex-1 rounded-xl font-bold"
                  >
                    <Copy className="mr-1.5 h-4 w-4" /> Copiar mensagem
                  </Button>
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-sm font-black text-white hover:bg-emerald-600"
                    >
                      <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
                    </a>
                  ) : null}
                </div>
                <ManualPaymentDialog user={created} />
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={reset} className="h-10 flex-1 rounded-xl font-bold text-zinc-500">
                    Cadastrar outro
                  </Button>
                  <Button onClick={() => setOpen(false)} className="h-10 flex-1 rounded-xl bg-zinc-950 font-bold hover:bg-zinc-800">
                    <Check className="mr-1.5 h-4 w-4" /> Concluir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="nu-name" className="text-xs font-bold uppercase tracking-wide text-zinc-500">Nome do cliente</Label>
                  <Input id="nu-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-email" className="text-xs font-bold uppercase tracking-wide text-zinc-500">E-mail (será o login)</Label>
                  <Input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-wa" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    WhatsApp com DDD <span className="font-medium normal-case text-zinc-400">(obrigatório)</span>
                  </Label>
                  <Input id="nu-wa" type="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} maxLength={24} placeholder="(62) 99999-9999" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-pass" className="text-xs font-bold uppercase tracking-wide text-zinc-500">Senha</Label>
                  <div className="flex gap-2">
                    <Input id="nu-pass" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl font-mono" />
                    <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())} aria-label="Gerar outra senha" className="h-11 w-11 shrink-0 rounded-xl p-0">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <label className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
                  <span>
                    <span className="block text-sm font-bold text-zinc-800">Liberar acesso agora</span>
                    <span className="block text-xs text-zinc-500">Concede acesso. O pagamento é registrado separadamente.</span>
                  </span>
                  <Switch checked={grantAccess} onCheckedChange={(checked) => { setGrantAccess(checked); if (!checked) setLimited(false) }} />
                </label>
                <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/70 px-3.5 py-3">
                  <label className="flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-bold text-zinc-800">Conta de teste — limitar downloads</span>
                      <span className="block text-xs text-zinc-500">Quando atingir a cota, as artes ficam embaçadas e o download é bloqueado.</span>
                    </span>
                    <Switch checked={limited} onCheckedChange={(checked) => { setLimited(checked); if (checked) setGrantAccess(true) }} />
                  </label>
                  {limited && <div className="space-y-1.5">
                    <Label htmlFor="nu-download-limit" className="text-xs font-bold text-zinc-700">Quantidade de downloads permitidos</Label>
                    <Input id="nu-download-limit" type="number" inputMode="numeric" min={0} max={100000} step={1} value={downloadLimit} onChange={e => setDownloadLimit(e.target.value)} className="h-10 rounded-xl bg-white" />
                    <p className="text-[11px] text-zinc-500">Cada download conta, inclusive baixar a mesma arte novamente.</p>
                  </div>}
                </div>
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
                <Button
                  onClick={submit}
                  disabled={saving}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Cadastrar cliente
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
