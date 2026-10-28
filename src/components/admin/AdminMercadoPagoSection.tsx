'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Copy, CreditCard, Loader2, Save, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Status = { configured: boolean; signatureConfigured: boolean; preferred: boolean; webhookUrl: string }
export function AdminMercadoPagoSection() {
  const qc = useQueryClient()
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const query = useQuery<Status>({ queryKey: ['admin-mercadopago'], queryFn: async () => { const r = await fetch('/api/admin/mercadopago'); if (!r.ok) throw new Error('Não foi possível carregar as configurações.'); return r.json() } })
  const save = useMutation({ mutationFn: async () => {
    const r = await fetch('/api/admin/mercadopago', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, webhookSecret: secret, preferred: true }) })
    const data = await r.json(); if (!r.ok) throw new Error(data.error)
  }, onSuccess: () => { setToken(''); setSecret(''); setTestMessage(''); qc.invalidateQueries({ queryKey: ['admin-mercadopago'] }); qc.invalidateQueries({ queryKey: ['admin-settings'] }); qc.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Mercado Pago salvo como forma de pagamento principal.') }, onError: (e: Error) => toast.error(e.message) })
  const test = useMutation({ mutationFn: async () => { const r = await fetch('/api/admin/mercadopago/test', { method: 'POST' }); const data = await r.json(); if (!r.ok) throw new Error(data.error); return data }, onSuccess: data => setTestMessage(`${data.account}: ${data.message}`), onError: (e: Error) => { setTestMessage(''); toast.error(e.message) } })
  return <div className="max-w-5xl space-y-6">
    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-6"><h2 className="flex items-center gap-3 text-xl font-black text-zinc-950"><CreditCard className="h-6 w-6 text-sky-600" /> Mercado Pago</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600">Receba por PIX e libere o acesso automaticamente quando o Mercado Pago confirmar o pagamento. O valor já considera o cupom aplicado pelo cliente.</p><div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${query.data?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-zinc-600'}`}>{query.data?.configured ? 'Access Token cadastrado' : 'Aguardando Access Token'}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-zinc-600">{query.data?.signatureConfigured ? 'Assinatura do webhook configurada' : 'Cadastre a chave de assinatura do webhook'}</span></div></section>
    {query.isError && <p role="alert" className="text-sm text-red-600">{query.error.message}</p>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h3 className="text-base font-black text-zinc-950">1. Conectar sua aplicação</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">No Mercado Pago Developers, abra Suas integrações, selecione a aplicação de checkout e copie o Access Token das credenciais de produção.</p>
      <div className="mt-5 space-y-2"><Label htmlFor="mp-token">Access Token de produção</Label><Input id="mp-token" type="password" autoComplete="new-password" value={token} onChange={e => setToken(e.target.value)} placeholder={query.data?.configured ? 'Já cadastrado. Cole somente se quiser substituir.' : 'APP_USR-…'} /><p className="text-xs text-zinc-500">O token fica no servidor. Deixar este campo vazio preserva a credencial já salva.</p></div>
      <h3 className="mt-8 text-base font-black text-zinc-950">2. Configurar notificações de pagamento</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">Na aplicação do Mercado Pago, abra Webhooks. Cadastre a URL abaixo em produção, marque o evento Pagamentos e copie a chave secreta gerada para validar as assinaturas.</p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 p-3"><code className="min-w-0 flex-1 break-all text-xs text-zinc-700">{query.data?.webhookUrl || 'Carregando endereço…'}</code><button aria-label="Copiar URL do webhook" disabled={!query.data} onClick={async () => { try { await navigator.clipboard.writeText(query.data!.webhookUrl); toast.success('URL copiada.') } catch { toast.error('Copie o endereço exibido.') } }}><Copy className="h-4 w-4 text-zinc-500" /></button></div>
      <div className="mt-5 space-y-2"><Label htmlFor="mp-secret">Chave secreta da assinatura Webhook</Label><Input id="mp-secret" type="password" autoComplete="new-password" value={secret} onChange={e => setSecret(e.target.value)} placeholder={query.data?.signatureConfigured ? 'Já cadastrada. Cole somente se quiser substituir.' : 'Cole a chave de assinatura da sua aplicação'} /></div>
      <div className="mt-6 flex flex-wrap gap-3"><Button onClick={() => save.mutate()} disabled={save.isPending || query.isLoading} className="bg-sky-600 font-bold text-white">{save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar Mercado Pago</Button><Button variant="outline" onClick={() => test.mutate()} disabled={!query.data?.configured || test.isPending}>{test.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Testar credencial salva</Button></div>
      {testMessage && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{testMessage}</p>}
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-6"><h3 className="text-base font-black text-zinc-950">3. Conferir o fluxo de compra</h3><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-600"><li>Use uma conta de cliente sem acesso ativo para abrir o checkout.</li><li>Se houver um cupom da campanha, aplique e confira o subtotal, o desconto e o total.</li><li>Gere o PIX no Mercado Pago e conclua o pagamento.</li><li>Após a confirmação do gateway, a conta recebe acesso automaticamente. O webhook funciona mesmo se o cliente fechar a página.</li></ol><p className="mt-4 text-xs leading-relaxed text-zinc-500">Testar a credencial consulta a conta e não cria cobrança. A validação final de recebimento depende das credenciais reais, do webhook configurado e de uma transação confirmada no ambiente correspondente.</p></section>
  </div>
}
