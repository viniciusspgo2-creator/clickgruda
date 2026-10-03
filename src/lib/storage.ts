import { getSettings } from '@/lib/settings'

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export function extToMime(ext: string): string {
  return MIME_BY_EXT[ext.toLowerCase()] || 'application/octet-stream'
}

export function isAllowedImageExt(ext: string): boolean {
  return ['png', 'jpg', 'jpeg', 'webp'].includes(ext.toLowerCase())
}

export type R2Config = {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  previewsBucket: string
  originalsBucket: string
  publicUrl: string
}

/** Retorna a config do R2 quando está ativo e completo; senão null. */
export async function getR2Config(): Promise<R2Config | null> {
  const s = await getSettings()
  const ok =
    s.r2_enabled === 'true' &&
    (s.r2_endpoint || '').trim() &&
    (s.r2_access_key_id || '').trim() &&
    (s.r2_secret_access_key || '').trim() &&
    (s.r2_bucket || '').trim() &&
    (s.r2_public_url || '').trim()
  if (!ok) return null
  return {
    endpoint: s.r2_endpoint.trim(),
    accessKeyId: s.r2_access_key_id.trim(),
    secretAccessKey: s.r2_secret_access_key.trim(),
    previewsBucket: s.r2_bucket.trim(),
    // Recomendado: bucket PRIVADO separado p/ originais. Se vazio, usa o mesmo bucket (chave aleatória, não exposta).
    originalsBucket: (s.r2_originals_bucket || '').trim() || s.r2_bucket.trim(),
    publicUrl: s.r2_public_url.trim().replace(/\/+$/, ''),
  }
}

export async function makeR2Client(cfg: R2Config) {
  const { S3Client } = await import('@aws-sdk/client-s3')
  return new S3Client({
    region: 'auto',
    endpoint: cfg.endpoint,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  })
}

/** URL assinada de upload (PUT) — o navegador envia o arquivo direto ao R2, sem passar pelo limite de 4,5MB da Vercel. */
export async function presignPut(cfg: R2Config, bucket: string, key: string, contentType: string): Promise<string> {
  const { PutObjectCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  const client = await makeR2Client(cfg)
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: 600 })
}

/** URL assinada de download do ORIGINAL (expira em 2 min) — gerada só para quem tem acesso pago. */
export async function presignOriginalGet(cfg: R2Config, key: string, filename: string): Promise<string> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3')
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')
  const client = await makeR2Client(cfg)
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: cfg.originalsBucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: 120 }
  )
}

/**
 * Stores an image. Uses Cloudflare R2 when configured, otherwise falls back
 * to local /public/uploads. Returns the public URL of the stored object.
 */
export async function putImage(buffer: Buffer, ext: string): Promise<string> {
  const s = await getSettings()
  const extClean = ext.toLowerCase()
  const key = `arts/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${extClean}`

  const r2Ready =
    s.r2_enabled === 'true' &&
    (s.r2_endpoint || '').trim() &&
    (s.r2_access_key_id || '').trim() &&
    (s.r2_secret_access_key || '').trim() &&
    (s.r2_bucket || '').trim()

  if (r2Ready) {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: 'auto',
      endpoint: s.r2_endpoint,
      credentials: {
        accessKeyId: s.r2_access_key_id,
        secretAccessKey: s.r2_secret_access_key,
      },
    })
    await client.send(
      new PutObjectCommand({
        Bucket: s.r2_bucket,
        Key: key,
        Body: buffer,
        ContentType: extToMime(extClean),
        CacheControl: 'public, max-age=31536000, immutable',
      })
    )
    const base = (s.r2_public_url || '').replace(/\/+$/, '')
    return base ? `${base}/${key}` : `/${key}`
  }

  /* Sem R2 configurado: em produção (Vercel) o filesystem é efêmero — bloqueia
     com orientação clara (R2 no Admin Master ou URL externa de CDN). */
  if (process.env.VERCEL) {
    throw new Error(
      'Armazenamento não configurado: ative o Cloudflare R2 no Admin Master (Configurações) ou use uma URL de imagem externa (CDN).'
    )
  }

  /* Fallback local (ambiente de desenvolvimento) */
  const fs = await import('fs/promises')
  const path = await import('path')
  const dir = path.join(process.cwd(), 'public', 'uploads', 'arts')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, path.basename(key)), buffer)
  return `/uploads/${key}`
}

/** Reads a local file under /public for download streaming. */
export async function readLocalFile(urlPath: string): Promise<Buffer | null> {
  if (!urlPath.startsWith('/uploads/')) return null
  const safe = urlPath.split('..').join('')
  const fs = await import('fs/promises')
  const path = await import('path')
  const file = path.join(process.cwd(), 'public', safe)
  try {
    return await fs.readFile(file)
  } catch {
    return null
  }
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
