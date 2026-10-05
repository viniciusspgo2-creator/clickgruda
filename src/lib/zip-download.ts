import { zipSync } from 'fflate'

export type ZipScope = {
  scope: 'category' | 'event' | 'launch' | 'selected' | 'all'
  id?: string
  /** nome legível — vira o nome do arquivo e da pasta dentro do ZIP */
  label: string
  /** pular as artes que a pessoa já baixou (padrão: sim) */
  skipDownloaded?: boolean
}

export type ZipProgress = {
  done: number
  total: number
  failed: number
  parts: number
  current?: string
  /** artes que ficaram para amanhã (limite diário) */
  deferred: number
  /** artes puladas por já terem sido baixadas antes */
  skipped: number
  /** o limite diário foi atingido no meio do download (o que já tinha baixado foi salvo) */
  limitReached: boolean
  limit: number
}

export class ZipLimitError extends Error {
  limit: number
  constructor(limit: number) {
    super('DAILY_LIMIT')
    this.limit = limit
  }
}

export class ZipCorsError extends Error {
  constructor() {
    super(
      'O navegador bloqueou a leitura dos arquivos no Cloudflare R2. No bucket dos ORIGINAIS, adicione uma regra de CORS permitindo o método GET para o endereço deste site.'
    )
  }
}

/** ~120MB por ZIP: o navegador guarda cada parte na memória antes de salvar. */
const PART_LIMIT_BYTES = 120 * 1024 * 1024
const CONCURRENCY = 3

function slug(s: string) {
  return (
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'artes'
  )
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function filenameFromDisposition(h: string | null): string | null {
  if (!h) return null
  const star = /filename\*=UTF-8''([^;]+)/i.exec(h)
  if (star) {
    try {
      return decodeURIComponent(star[1])
    } catch {
      /* cai para o próximo formato */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(h)
  return plain ? plain[1] : null
}

async function fetchOriginal(art: { id: string; code: string }, signal: AbortSignal): Promise<{ name: string; data: Uint8Array }> {
  const res = await fetch(`/api/arts/${art.id}/download?via=zip`, { signal })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    if (j.code === 'DAILY_LIMIT') throw new ZipLimitError(Number(j.limit) || 0)
    throw new Error(j.error || `Erro ${res.status}`)
  }
  if ((res.headers.get('content-type') || '').includes('application/json')) {
    // original no R2 privado → URL assinada de curta duração
    const j = (await res.json()) as { url: string; filename?: string }
    let file: Response
    try {
      file = await fetch(j.url, { signal })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      throw new ZipCorsError()
    }
    if (!file.ok) throw new Error(`Arquivo indisponível (${file.status})`)
    return { name: j.filename || `${art.code}.png`, data: new Uint8Array(await file.arrayBuffer()) }
  }
  const name = filenameFromDisposition(res.headers.get('content-disposition')) || `${art.code}.png`
  return { name, data: new Uint8Array(await res.arrayBuffer()) }
}

/**
 * Baixa um recorte do acervo (categoria, data comemorativa, lançamentos...) em arquivos ZIP.
 * Tudo no navegador: o servidor só entrega as URLs assinadas — nada passa pelo limite de tempo da Vercel.
 * Os arquivos já são PNG (compactados), então o ZIP é "só empacotar" (nível 0) — rápido.
 */
export async function downloadScopeAsZip(
  target: ZipScope,
  onProgress: (p: ZipProgress) => void,
  signal: AbortSignal
): Promise<ZipProgress> {
  const qs = new URLSearchParams({ scope: target.scope })
  if (target.skipDownloaded !== false) qs.set('skip', '1')
  if (target.id) qs.set('id', target.id)
  const listRes = await fetch(`/api/arts/ids?${qs.toString()}`, { signal })
  const list = await listRes.json().catch(() => ({}))
  if (!listRes.ok) throw new Error(list.error || 'Não foi possível listar as artes.')
  const all: { id: string; code: string; title: string }[] = list.arts || []
  const alreadyHad: number = list.alreadyHad || 0
  if (!all.length) {
    throw new Error(
      alreadyHad > 0
        ? `Você já baixou as ${alreadyHad} artes desta seleção. Desmarque “Pular artes que já baixei” se quiser baixar de novo.`
        : 'Não há artes nesta seleção.'
    )
  }
  // limite diário: baixa só o que ainda cabe hoje; o resto fica para amanhã
  const remaining: number | null = typeof list.remaining === 'number' ? list.remaining : null
  const limit: number = list.limit || 0
  if (remaining !== null && remaining <= 0) throw new ZipLimitError(limit)
  const arts = remaining !== null ? all.slice(0, remaining) : all

  const base = slug(target.label)
  const progress: ZipProgress = {
    done: 0,
    total: arts.length,
    failed: 0,
    parts: 0,
    deferred: all.length - arts.length,
    skipped: alreadyHad,
    limitReached: false,
    limit,
  }
  let files: Record<string, Uint8Array> = {}
  let bytes = 0
  let cursor = 0
  let fatal: Error | null = null

  const flush = (last: boolean) => {
    if (!Object.keys(files).length) return
    progress.parts += 1
    const name = last && progress.parts === 1 ? `${base}.zip` : `${base}-parte-${progress.parts}.zip`
    const zipped = zipSync(files, { level: 0 })
    saveBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), name)
    files = {}
    bytes = 0
  }

  const worker = async () => {
    while (!fatal && !signal.aborted && !progress.limitReached) {
      const i = cursor++
      if (i >= arts.length) return
      const art = arts[i]
      let result: { name: string; data: Uint8Array } | null = null
      for (let attempt = 0; attempt < 2 && !result; attempt++) {
        try {
          result = await fetchOriginal(art, signal)
        } catch (e) {
          if (e instanceof ZipCorsError) {
            fatal = e
            return
          }
          if (e instanceof ZipLimitError) {
            progress.limitReached = true
            progress.limit = e.limit || progress.limit
            return
          }
          if (e instanceof DOMException && e.name === 'AbortError') return
          if (attempt === 1) progress.failed += 1
        }
      }
      if (result) {
        files[`${base}/${result.name}`] = result.data
        bytes += result.data.byteLength
        // salva a parte atual quando enche (síncrono: sem corrida entre os 3 downloads em paralelo)
        if (bytes >= PART_LIMIT_BYTES) flush(false)
      }
      progress.done += 1
      progress.current = art.title
      onProgress({ ...progress })
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  if (fatal) throw fatal
  if (signal.aborted) throw new DOMException('Cancelado', 'AbortError')
  flush(true)
  if (progress.limitReached) progress.deferred += progress.total - progress.done
  onProgress({ ...progress })
  return progress
}
