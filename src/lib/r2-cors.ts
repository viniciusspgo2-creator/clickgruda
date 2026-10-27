import { GetBucketCorsCommand, PutBucketCorsCommand, type CORSRule } from '@aws-sdk/client-s3'
import { makeR2Client, presignPut, type R2Config } from '@/lib/storage'
import { SITE_URL } from '@/lib/site'
import { createHash, randomUUID } from 'node:crypto'

const RULE_ID = 'clickgruda-browser-upload'

/** Apenas domínios da aplicação; nunca aceita um domínio arbitrário enviado pelo cliente. */
export function uploadOrigins(env = process.env) {
  const origins = new Set([new URL(SITE_URL).origin, 'https://clickgruda.com.br'])
  for (const host of [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (host && /^[a-z0-9.-]+\.vercel\.app$/i.test(host)) origins.add(`https://${host.toLowerCase()}`)
  }
  if (env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000')
    origins.add('http://127.0.0.1:3000')
  }
  return [...origins]
}

export function uploadCorsRule(origins: string[]): CORSRule {
  return { ID: RULE_ID, AllowedOrigins: origins, AllowedMethods: ['GET', 'PUT', 'HEAD'], AllowedHeaders: ['*'], ExposeHeaders: ['ETag', 'Content-Disposition'], MaxAgeSeconds: 3600 }
}

/** Preserva regras de outros serviços, inclusive uma configuração anterior da própria plataforma. */
export function mergeUploadCorsRules(existing: CORSRule[], origins: string[]): CORSRule[] {
  const old = existing.find(rule => rule.ID === RULE_ID)
  const managed = { ...uploadCorsRule([...new Set([...(old?.AllowedOrigins || []), ...origins])]), AllowedMethods: [...new Set([...(old?.AllowedMethods || []), 'GET', 'PUT', 'HEAD'])], ExposeHeaders: [...new Set([...(old?.ExposeHeaders || []), 'ETag', 'Content-Disposition'])] }
  return [...existing.filter(rule => rule.ID !== RULE_ID), managed]
}

export type BucketCorsResult = {
  bucket: string
  label: string
  configured: boolean
  repaired: boolean
  message: string
  code?: string
}

function failure(error: unknown): { code: string; message: string } {
  const code = error && typeof error === 'object' && 'name' in error ? String(error.name) : ''
  if (['AccessDenied', 'Forbidden', 'Unauthorized'].includes(code)) return { code: 'AccessDenied', message: 'A chave atual não pode consultar ou editar o CORS. Configure a regra em Cloudflare → R2 → este bucket → Settings → CORS Policy. Não é necessário trocar a chave que já envia arquivos.' }
  if (code === 'NoSuchBucket') return { code, message: 'Bucket não encontrado. Confira o nome e o Account Endpoint salvos nas configurações.' }
  if (['InvalidAccessKeyId', 'SignatureDoesNotMatch', 'InvalidToken'].includes(code)) return { code, message: 'A Cloudflare recusou as credenciais. Confira o endpoint e se a chave possui acesso a este bucket.' }
  return { code: 'R2Unavailable', message: 'Não foi possível consultar o R2. Confira a conexão, o endpoint e tente novamente. Nenhuma regra existente foi substituída.' }
}

/** Testa a mesma permissão usada pelo navegador, sem enviar ou criar nenhum arquivo. */
async function preflight(cfg: R2Config, bucket: string, origin: string) {
  const url = await presignPut(cfg, bucket, `diagnostics/cors-${randomUUID()}.png`, 'image/png')
  const response = await fetch(url, {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })
  const allowedOrigin = response.headers.get('access-control-allow-origin')
  const methods = (response.headers.get('access-control-allow-methods') || '').toUpperCase().split(/\s*,\s*/)
  const headers = (response.headers.get('access-control-allow-headers') || '').toLowerCase().split(/\s*,\s*/)
  return response.ok && (allowedOrigin === origin || allowedOrigin === '*') && methods.includes('PUT') && (headers.includes('*') || headers.includes('content-type'))
}

export async function diagnoseR2Cors(cfg: R2Config, origin: string, repair: boolean) {
  const origins = uploadOrigins()
  if (!origins.includes(origin)) throw new Error('Origem de upload não autorizada.')
  const buckets = [...new Set([cfg.originalsBucket, cfg.previewsBucket])]
  const results: BucketCorsResult[] = await Promise.all(buckets.map(async bucket => {
    const label = cfg.originalsBucket === cfg.previewsBucket ? 'Originais e prévias' : bucket === cfg.originalsBucket ? 'Originais' : 'Prévias'
    const result = { bucket, label, configured: false, repaired: false, message: '' }
    try {
      if (await preflight(cfg, bucket, origin)) return { ...result, configured: true, message: 'Este site tem permissão para enviar arquivos a este bucket.' }
      if (!repair) return { ...result, code: 'CorsMissing', message: 'O R2 não confirmou a permissão de upload deste site. Use Verificar e corrigir ou aplique a regra no painel da Cloudflare.' }
      const client = await makeR2Client(cfg)
      let rules: CORSRule[] = []
      try {
        rules = (await client.send(new GetBucketCorsCommand({ Bucket: bucket }), { abortSignal: AbortSignal.timeout(8000) })).CORSRules || []
      } catch (error) {
        if (!(error && typeof error === 'object' && 'name' in error && error.name === 'NoSuchCORSConfiguration')) throw error
      }
      const command = new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules: mergeUploadCorsRules(rules, origins) } })
      // PutBucketCors exige checksum no SDK novo mesmo com WHEN_REQUIRED.
      // O R2 aceita Content-MD5, mas não os headers AWS de algoritmo desta operação.
      command.middlewareStack.addRelativeTo(next => async args => {
        const request = args.request as { headers: Record<string, string>; body: string | Uint8Array }
        for (const header of Object.keys(request.headers)) {
          if (header.toLowerCase() === 'x-amz-sdk-checksum-algorithm' || header.toLowerCase().startsWith('x-amz-checksum-')) delete request.headers[header]
        }
        request.headers['content-md5'] = createHash('md5').update(request.body).digest('base64')
        return next(args)
      }, { relation: 'after', toMiddleware: 'flexibleChecksumsMiddleware', name: 'r2CorsChecksumCompatibility' })
      await client.send(command, { abortSignal: AbortSignal.timeout(8000) })
      result.repaired = true
      result.configured = await preflight(cfg, bucket, origin)
      result.message = result.configured ? 'Permissão corrigida e confirmada para este site.' : 'Regra salva. A Cloudflare ainda não confirmou a alteração; aguarde alguns instantes e verifique novamente.'
      return result
    } catch (error) {
      return { ...result, ...failure(error) }
    }
  }))
  return { ok: results.every(result => result.configured), origin, origins, buckets: results, policy: [uploadCorsRule(origins)] }
}
