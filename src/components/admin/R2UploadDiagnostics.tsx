'use client'

import { useState } from 'react'
import { CheckCircle2, ClipboardCopy, Loader2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BucketCorsResult } from '@/lib/r2-cors'

type Diagnosis = { ok: boolean; origin: string; buckets: BucketCorsResult[]; policy: unknown[] }

export function R2UploadDiagnostics({ disabled = false }: { disabled?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Diagnosis | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const verify = async () => {
    setBusy(true); setError(''); setResult(null); setCopied(false)
    try {
      const response = await fetch('/api/admin/upload/cors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'repair' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível verificar o envio.')
      setResult(data)
    } catch (error) { setError(error instanceof Error ? error.message : 'Falha de conexão. Tente novamente.') }
    finally { setBusy(false) }
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(result?.policy, null, 2)); setCopied(true) }
    catch { setError('Não foi possível copiar. Selecione e copie a regra abaixo.') }
  }
  return <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-zinc-900">
    <p className="text-sm font-extrabold">Permissão de envio deste site</p>
    <p className="mt-2 text-xs leading-6 text-zinc-600">Verifica o domínio atual nos buckets de originais e prévias e tenta completar a regra de CORS quando necessário. Preserva as regras existentes e mantém o bucket dos originais privado.</p>
    <Button type="button" onClick={verify} disabled={disabled || busy} className="mt-3 h-11 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}{busy ? 'Verificando…' : 'Verificar e corrigir upload'}</Button>
    {disabled && <p className="mt-2 text-xs font-semibold text-orange-800">Salve as configurações abaixo antes de verificar.</p>}
    {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
    {result && <div className="mt-4 space-y-3" aria-live="polite"><p className="break-all text-xs text-zinc-600">Site verificado: {result.origin}</p>{result.buckets.map(bucket => <div key={bucket.bucket} className="rounded-xl border border-zinc-200 bg-white p-3"><p className="flex items-center gap-2 text-sm font-bold">{bucket.configured && <CheckCircle2 className="h-4 w-4 text-emerald-700" />}{bucket.label}: <span className="break-all font-mono text-xs">{bucket.bucket}</span></p><p className="mt-1 text-xs leading-6 text-zinc-600">{bucket.message}</p></div>)}{result.ok ? <p className="text-sm font-bold text-emerald-800">Permissão confirmada. Tente enviar a arte novamente.</p> : <div className="text-xs leading-6 text-zinc-700"><p>Se a chave não permite editar o CORS, abra a Cloudflare → R2 → cada bucket indicado → Settings → CORS Policy → JSON. Adicione a regra abaixo às regras existentes e salve. Não ative acesso público no bucket dos originais.</p><Button type="button" variant="outline" onClick={copy} className="my-2 rounded-xl bg-white"><ClipboardCopy className="mr-2 h-4 w-4" />{copied ? 'Regra copiada' : 'Copiar regra CORS'}</Button><pre className="max-h-64 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">{JSON.stringify(result.policy, null, 2)}</pre></div>}</div>}
  </div>
}
