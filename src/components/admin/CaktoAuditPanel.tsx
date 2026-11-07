'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

type Audit = {
  events: { id: string; provider: string; eventType: string; customerEmail: string; outcome: string; receivedAt: string; isTest: boolean }[]
  purchases: { id: string; email: string; externalId: string; createdAt: string }[]
}
export function CaktoAuditPanel() {
  const [showTests, setShowTests] = useState(false)
  const query = useQuery<Audit>({
    queryKey: ['admin-cakto-audit'],
    queryFn: async () => { const r = await fetch('/api/admin/cakto-audit'); if (!r.ok) throw Error('Não foi possível consultar o histórico.'); return r.json() },
    staleTime: 30000,
  })
  const events = (query.data?.events || []).filter(e => showTests || !e.isTest)
  return <details className="mt-7 rounded-2xl border border-zinc-200 bg-white p-5">
    <summary className="cursor-pointer text-base font-black text-zinc-900">Histórico da integração Cakto</summary>
    <p className="mt-2 text-xs leading-6 text-zinc-500">Últimos 50 eventos recebidos. Um evento de aprovação em uma simulação não representa um pagamento real.</p>
    {query.isError && <p role="alert" className="mt-3 text-sm text-red-700">{query.error.message} <Button variant="link" onClick={() => query.refetch()}>Tentar novamente</Button></p>}
    {!!query.data?.purchases.length && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4"><p className="text-sm font-bold text-orange-800">Compras reais aguardando vínculo com uma conta</p>{query.data.purchases.map(p => <p key={p.id} className="mt-2 break-all text-xs text-orange-900">{p.email} · {new Date(p.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · pedido {p.externalId}</p>)}<p className="mt-3 text-xs text-orange-800">Confirme a titularidade com o cliente antes de vincular a compra. Testes da Cakto não aparecem nesta pendência.</p></div>}
    <label className="mt-4 flex items-center gap-2 text-sm text-zinc-600"><input type="checkbox" checked={showTests} onChange={e => setShowTests(e.target.checked)} /> Incluir eventos de teste</label>
    <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="text-zinc-500"><tr><th className="py-2">Recebido</th><th>Evento</th><th>Cliente</th><th>Resultado</th></tr></thead><tbody>{events.map(e => <tr key={e.id} className="border-t border-zinc-100 text-zinc-700"><td className="py-3 pr-3">{new Date(e.receivedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td><td className="pr-3 font-semibold">{e.eventType}{e.isTest && <span className="mt-1 block font-bold text-violet-700">Teste Cakto · sem faturamento</span>}</td><td className="pr-3">{e.customerEmail}</td><td>{e.outcome}</td></tr>)}</tbody></table></div>
    {!query.isPending && !query.isError && !events.length && <p className="mt-3 text-xs text-zinc-500">Nenhum evento real entre os últimos registros. Ative o filtro acima para consultar os testes.</p>}
  </details>
}
