/**
 * Upload de artes (lado do navegador) — compartilhado entre o formulário
 * de "Nova arte" e o envio em lote (até 20 por vez).
 *
 * Com Cloudflare R2: PNG ORIGINAL -> bucket privado | prévia WebP -> bucket público,
 * direto do navegador (URLs assinadas). Sem R2 (dev): upload simples pelo servidor.
 */

import { MAX_ART_SIZE, MAX_ART_SIZE_LABEL } from './upload-limits'
export { MAX_ART_SIZE } from './upload-limits'
export const ALLOWED_ART_EXT = ['png', 'jpg', 'jpeg', 'webp']

export type UploadedArt = { imageUrl: string; originalKey?: string; r2: boolean }

type CorsDiagnosis = { ok?: boolean; error?: string; buckets?: { configured: boolean; label: string; message: string }[] }
let corsRepair: Promise<CorsDiagnosis> | null = null

/** Envios em lote compartilham uma verificação em andamento. Não transmite a imagem pela Vercel. */
async function repairUploadCors(): Promise<CorsDiagnosis> {
  if (!corsRepair) {
    corsRepair = (async () => {
      try {
        const response = await fetch('/api/admin/upload/cors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'repair' }) })
        const data = await response.json()
        return response.ok ? data : { ok: false, error: data.error || 'Não foi possível verificar a permissão de envio.' }
      } catch { return { ok: false, error: 'Não foi possível verificar o R2. Confira sua conexão e tente novamente.' } }
    })().finally(() => { corsRepair = null })
  }
  return corsRepair
}

async function sendR2Files(parts: { label: string; url: string; type: string; body: Blob }[]) {
  const send = (part: typeof parts[number]) => fetch(part.url, { method: 'PUT', headers: { 'Content-Type': part.type }, body: part.body })
  const results = await Promise.allSettled(parts.map(send))
  if (results.some(result => result.status === 'rejected')) {
    // Falha de fetch também pode ser rede, DNS, extensão ou URL expirada. CORS exige verificação.
    const diagnosis = await repairUploadCors()
    if (!diagnosis.ok) {
      const details = diagnosis.error || diagnosis.buckets?.filter(bucket => !bucket.configured).map(bucket => `${bucket.label}: ${bucket.message}`).join(' ') || 'Confira a configuração do R2.'
      throw new Error(`Não foi possível enviar a arte. ${details} No master, abra Configurações → Cloudflare R2 → Verificar e corrigir upload.`)
    }
    await Promise.all(results.map(async (result, index) => {
      if (result.status === 'rejected') {
        try { results[index] = { status: 'fulfilled', value: await send(parts[index]) } }
        catch { throw new Error(`A permissão de CORS foi confirmada, mas o envio de ${parts[index].label} ainda falhou. Confira a conexão, bloqueadores do navegador e as credenciais do R2; tente novamente.`) }
      }
    }))
  }
  for (let index = 0; index < results.length; index++) {
    const result = results[index]
    if (result.status !== 'fulfilled') throw new Error(`Falha de conexão no envio de ${parts[index].label}. Tente novamente.`)
    if (!result.value.ok) {
      const response = result.value
      const detail = await response.text().catch(() => '')
      const code = /<Code>([^<]+)<\/Code>/.exec(detail)?.[1]
      throw new Error(`R2 recusou o envio (${response.status}${code ? ` · ${code}` : ''}) — ${parts[index].label}. Confira chaves, nomes dos buckets, permissões e tente enviar novamente.`)
    }
  }
}

/** Gera a prévia WebP (máx. 1000px de largura) no próprio navegador. */
export function makePreview(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 1000
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objUrl)
        return reject(new Error('canvas'))
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objUrl)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('webp'))), 'image/webp', 0.72)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objUrl)
      reject(new Error('img'))
    }
    img.src = objUrl
  })
}

/** Envia UMA arte. Lança Error com mensagem pronta para mostrar ao admin. */
export async function uploadArtFile(file: File): Promise<UploadedArt> {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  if (!ALLOWED_ART_EXT.includes(ext)) throw new Error('Formato não suportado. Use PNG, JPG ou WEBP.')
  if (file.size > MAX_ART_SIZE) throw new Error(`Arquivo muito grande. Máximo: ${MAX_ART_SIZE_LABEL}.`)

  try {
    const signRes = await fetch('/api/admin/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalExt: ext, fileSize: file.size }),
    })
    const sign = await signRes.json()
    if (!signRes.ok) throw new Error(sign.error || 'Erro ao preparar o upload.')

    if (sign.r2) {
      const preview = await makePreview(file)
      await sendR2Files([
        { label: 'bucket dos originais', url: sign.originalPutUrl, type: sign.originalType, body: file },
        { label: 'bucket das prévias', url: sign.previewPutUrl, type: 'image/webp', body: preview },
      ])
      return { imageUrl: sign.previewUrl, originalKey: sign.originalKey, r2: true }
    }

    // Na Vercel, formulários multipart enviados a funções têm limite de 4,5 MB.
    // Arquivos maiores precisam ir direto para o R2, por meio da URL assinada.
    if (sign.requiresR2ForLargeFiles && file.size > 4 * 1024 * 1024) {
      throw new Error('Para enviar artes acima de 4 MB na Vercel, ative o Cloudflare R2 no Admin Master (Configurações).')
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro no upload.')
    return { imageUrl: data.url, originalKey: undefined, r2: false }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'img') throw new Error('Não consegui ler essa imagem. Use PNG, JPG ou WEBP válidos.')
    throw new Error(msg || 'Falha no upload.')
  }
}
