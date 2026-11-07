'use client'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'

type Journey = { registered: number; downloaded: number; purchased: number; conversionRate: number; trackedSince: string | null }
export function TrialJourneyPanel({ range, start, end, ready }: { range: string; start: string; end: string; ready: boolean }) {
  const query = useQuery<Journey>({
    queryKey: ['admin-trial-journey', range, start, end], enabled: ready, staleTime: 30000,
    queryFn: async () => {
      const params = new URLSearchParams({ range })
      if (range === 'custom') { params.set('start', start); params.set('end', end) }
      const r = await fetch('/api/admin/trial-journey?' + params, { cache: 'no-store' })
      const d = await r.json()
      if (!r.ok) throw Error(d.error || 'Não foi possível consultar os testes grátis.')
      return d
    },
  })
  const data = query.data
  return <section className="rounded-xl border border-orange-200 bg-orange-50/30 p-4" aria-labelledby="trial-journey-title">
    <h4 id="trial-journey-title" className="text-sm font-extrabold text-zinc-900">Do teste grátis ao pacote completo</h4>
    <p className="mt-1 text-xs leading-5 text-zinc-600">Contas grátis criadas no período selecionado. Cada cliente conta uma vez em cada indicador; downloads e compras podem acontecer depois desse período.</p>
    {query.isError ? <p role="alert" className="mt-3 text-sm text-red-700">{query.error.message} <Button variant="link" onClick={() => query.refetch()}>Tentar novamente</Button></p> : <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">{[
      ['Cadastros grátis', data?.registered], ['Baixaram ao menos uma arte', data?.downloaded], ['Compraram o pacote', data?.purchased], ['Conversão em compra', data ? data.conversionRate.toLocaleString('pt-BR') + '%' : undefined],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-orange-100 bg-white p-3"><p className="text-xs text-zinc-600">{label}</p><p className="mt-1 text-2xl font-black tabular-nums text-zinc-900">{!ready ? '—' : query.isPending ? '…' : value ?? '—'}</p></div>)}</div>}
    <p className="mt-3 text-[11px] leading-5 text-zinc-500">{data?.trackedSince ? `Acompanhamento iniciado em ${new Date(data.trackedSince).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} (Brasília).` : 'O acompanhamento começa com os novos cadastros grátis após esta atualização.'} Contas anteriores não são reclassificadas. Cortesias e pagamentos estornados não contam como compra. Conversão = compradores ÷ cadastros, inclusive quem comprou antes de baixar.</p>
  </section>
}
