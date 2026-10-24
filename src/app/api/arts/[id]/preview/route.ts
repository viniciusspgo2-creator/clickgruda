import sharp from 'sharp'
import { isIP } from 'node:net'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { readLocalFile } from '@/lib/storage'

export const runtime = 'nodejs'

/** Imagem demonstrativa: devolve SOMENTE amostra pequena, borrada e carimbada.
 * Os originais R2 permanecem privados e nunca são enviados a esta sessão. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user?.hasAccess || !user.isDemo) return jsonError('Recurso disponível apenas para demonstração.', 403)
  const { id } = await params
  const art = await db.art.findUnique({ where: { id }, select: { imageUrl: true } })
  if (!art) return jsonError('Arte não encontrada.', 404)

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
      if (!res.ok || size > 12 * 1024 * 1024 || !(res.headers.get('content-type') || '').startsWith('image/')) return jsonError('Prévia indisponível.', 404)
      buffer = Buffer.from(await res.arrayBuffer())
    }
    if (!buffer || buffer.length > 12 * 1024 * 1024) return jsonError('Prévia indisponível.', 404)

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="300"><g transform="rotate(-17 280 150)" fill="#ffffff" fill-opacity=".7" font-family="Arial,sans-serif" font-size="29" font-weight="900" text-anchor="middle"><text x="280" y="55">CLICK &amp; GRUDA</text><text x="280" y="155">SOMENTE PREVIEW</text><text x="280" y="255">SEM DOWNLOAD</text></g></svg>`
    const image = await sharp(buffer, { limitInputPixels: 30000000 })
      .rotate().resize({ width: 560, height: 300, fit: 'contain', background: '#dedee3' })
      .blur(9).composite([{ input: Buffer.from(svg), gravity: 'center' }])
      .webp({ quality: 38 }).toBuffer()
    return new Response(new Uint8Array(image), { headers: {
      'Content-Type': 'image/webp', 'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline',
    } })
  } catch (e) {
    console.error('Erro na prévia protegida:', e)
    return jsonError('Prévia indisponível neste momento.', 502)
  }
}
