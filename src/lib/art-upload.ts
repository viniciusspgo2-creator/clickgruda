/**
 * Upload de artes (lado do navegador) — compartilhado entre o formulário
 * de "Nova arte" e o envio em lote (até 20 por vez).
 *
 * Com Cloudflare R2: PNG ORIGINAL -> bucket privado | prévia WebP -> bucket público,
 * direto do navegador (URLs assinadas). Sem R2 (dev): upload simples pelo servidor.
 */

export const MAX_ART_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_ART_EXT = ['png', 'jpg', 'jpeg', 'webp']

export type UploadedArt = { imageUrl: string; originalKey?: string; r2: boolean }

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
  if (file.size > MAX_ART_SIZE) throw new Error('Arquivo muito grande. Máximo: 10MB.')

  try {
    const signRes = await fetch('/api/admin/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalExt: ext }),
    })
    const sign = await signRes.json()
    if (!signRes.ok) throw new Error(sign.error || 'Erro ao preparar o upload.')

    if (sign.r2) {
      const preview = await makePreview(file)
      let o: Response
      let p: Response
      try {
        ;[o, p] = await Promise.all([
          fetch(sign.originalPutUrl, { method: 'PUT', headers: { 'Content-Type': sign.originalType }, body: file }),
          fetch(sign.previewPutUrl, { method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: preview }),
        ])
      } catch {
        // fetch só "lança" quando o navegador bloqueia: na prática, CORS do bucket
        throw new Error('O navegador bloqueou o envio ao R2 (CORS). Configure o CORS nos DOIS buckets permitindo este site.')
      }
      if (!o.ok || !p.ok) {
        const bad = !o.ok ? o : p
        const detail = await bad.text().catch(() => '')
        const code = /<Code>([^<]+)<\/Code>/.exec(detail)?.[1]
        throw new Error(
          `R2 recusou o envio (${bad.status}${code ? ` · ${code}` : ''}) — ${!o.ok ? 'bucket dos originais' : 'bucket das prévias'}. Confira chaves, nomes dos buckets e permissões do token.`
        )
      }
      return { imageUrl: sign.previewUrl, originalKey: sign.originalKey, r2: true }
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
