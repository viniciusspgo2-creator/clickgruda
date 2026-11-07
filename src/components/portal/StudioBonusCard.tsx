'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
type Bonus = {
  state: string
  code: string | null
  entitlement?: string
  trialEndsAt?: string
  active?: boolean
}
export function StudioBonusCard() {
  const qc = useQueryClient(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const query = useQuery<{ bonus: Bonus | null }>({
    queryKey: ['studio-bonus'],
    queryFn: async () => {
      const r = await fetch('/api/account/studio', { cache: 'no-store' })
      if (!r.ok) throw Error('Não foi possível consultar o bônus.')
      const d = await r.json()
      if (d.bonus?.state === 'pending') {
        const sync = await fetch('/api/account/studio', { method: 'POST' })
        if (sync.ok) return sync.json()
      }
      return d
    },
    refetchInterval: (data) =>
      data.state.data?.bonus?.state === 'pending' ? 30000 : false,
    retry: 1,
  })
  const bonus = query.data?.bonus
  if (!bonus) return null
  async function requestCode() {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/account/studio', { method: 'POST' }),
        d = await r.json()
      if (!r.ok) throw Error(d.error)
      qc.setQueryData(['studio-bonus'], d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="border-b border-orange-400/20 bg-[#141d2e] px-4 py-5 text-white sm:px-7">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-orange-300">
            Seu bônus: Studio Mockup e Editor
          </h2>
          <p className="mt-1 text-sm text-slate-200">
            {bonus.entitlement === 'TRIAL'
              ? `Teste até ${new Date(bonus.trialEndsAt!).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })} (Brasília). O prazo continua mesmo após encerrar os downloads de teste da Biblioteca.`
              : bonus.entitlement === 'REVOKED' || bonus.state === 'blocked'
                ? 'Acesso bloqueado. Entre em contato com o suporte.'
                : 'Incluído no seu acesso completo à Biblioteca.'}
          </p>
          {bonus.state === 'pending' && (
            <p role="status" className="mt-2 text-sm text-orange-200">
              Estamos sincronizando seu código. Sua conta e a data original do
              teste estão preservadas.
            </p>
          )}
          {bonus.code && (
            <p className="mt-3 break-all font-mono text-lg">{bonus.code}</p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {bonus.code && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(bonus.code!)
                  toast.success('Código copiado!')
                } catch {
                  toast.error('Selecione o código para copiar.')
                }
              }}
            >
              Copiar código
            </Button>
          )}
          {bonus.state === 'unlinked' && (
            <Button disabled={busy} onClick={requestCode}>
              {busy ? 'Sincronizando…' : 'Gerar meu código do Studio'}
            </Button>
          )}
          <a
            href="https://clickteste.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-500 px-5 py-2 font-bold text-white hover:bg-orange-400"
          >
            Abrir Studio e Editor
          </a>
        </div>
      </div>
    </section>
  )
}
