import sharp from 'sharp'
import { isIP } from 'node:net'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { readLocalFile } from '@/lib/storage'
import { MAX_ART_SIZE } from '@/lib/upload-limits'
import { cachedProtectedPreview, cacheProtectedPreview } from '@/lib/protected-preview-cache'

export const runtime = 'nodejs'
const imageResponse = (bytes: Buffer) => new Response(new Uint8Array(bytes), { headers: {
  'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline',
} })

/** Prévia da demo: exibe composição e cores sem fornecer o arquivo de impressão.
 * Imagem reduzida, levemente suavizada e com marca-d’água.
 * Os originais R2 permanecem privados e nunca são enviados a esta sessão. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user?.hasAccess || !user.isDemo) return jsonError('Recurso disponível apenas para demonstração.', 403)
  const { id } = await params
  const art = await db.art.findUnique({ where: { id }, select: { imageUrl: true } })
  if (!art) return jsonError('Arte não encontrada.', 404)
  const cacheKey = `demo-v2:${id}:${art.imageUrl}`
  const cached = cachedProtectedPreview(cacheKey)
  if (cached) return imageResponse(cached)

  try {
    let buffer: Buffer | null = null
    if (art.imageUrl.startsWith('/uploads/')) {
      buffer = await readLocalFile(art.imageUrl)
      if (!buffer) {
        const res = await fetch(new URL(art.imageUrl, req.url), { signal: AbortSignal.timeout(8000), cache: 'no-store' })
        if (res.ok) buffer = Buffer.from(await res.arrayBuffer())
      }
    } else {
      const url = new URL(art.imageUrl)
      if (url.protocol !== 'https:' || url.username || url.password || isIP(url.hostname) || url.hostname === 'localhost' || url.hostname.endsWith('.local')) return jsonError('Prévia indisponível.', 400)
      const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(8000), cache: 'no-store' })
      const size = Number(res.headers.get('content-length') || 0)
      if (!res.ok || size > MAX_ART_SIZE || !(res.headers.get('content-type') || '').startsWith('image/')) return jsonError('Prévia indisponível.', 404)
      buffer = Buffer.from(await res.arrayBuffer())
    }
    if (!buffer || buffer.length > MAX_ART_SIZE) return jsonError('Prévia indisponível.', 404)

    // Prévia DEMO propositalmente desfocada no servidor; o navegador nunca recebe a versão nítida por esta rota.
    // A grade de marcas protege a amostra sem esconder o tema/composição da arte.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="355" viewBox="0 0 760 355">
      <g transform="rotate(-15 380 177.5)" fill="#ffffff" fill-opacity=".30" stroke="#152033" stroke-opacity=".32" stroke-width=".65" paint-order="stroke" font-family="Arial,sans-serif" font-size="20" font-weight="900" text-anchor="middle">
        <text x="120" y="55">CLICK &amp; GRUDA</text><text x="380" y="55">SOMENTE PRÉVIA</text><text x="640" y="55">CLICK &amp; GRUDA</text>
        <text x="120" y="175">SOMENTE PRÉVIA</text><text x="380" y="175">CLICK &amp; GRUDA</text><text x="640" y="175">SEM DOWNLOAD</text>
        <text x="120" y="295">CLICK &amp; GRUDA</text><text x="380" y="295">SEM DOWNLOAD</text><text x="640" y="295">SOMENTE PRÉVIA</text>
      </g>
    </svg>`
    const image = await sharp(buffer, { limitInputPixels: 30000000 })
      .rotate().resize({ width: 760, height: 355, fit: 'contain', background: '#e5e7eb' })
      .blur(3.2).composite([{ input: Buffer.from(svg), gravity: 'center' }])
      .webp({ quality: 53 }).toBuffer()
    cacheProtectedPreview(cacheKey, image)
    return imageResponse(image)
  } catch (e) {
    console.error('Erro na prévia protegida:', e)
    return jsonError('Prévia indisponível neste momento.', 502)
  }
}
