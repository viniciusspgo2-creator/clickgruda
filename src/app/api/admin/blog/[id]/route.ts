import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { slugifyBlogTitle } from '@/lib/blog-posts'

async function allowed() {
  const user = await getSessionUser()
  return user?.role === 'ADMIN'
}

const CATEGORIES = ['guias', 'negocios', 'equipamentos', 'artes', 'sazonal', 'dicas', 'tendencias', 'novidades'] as const

function validateInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dados do artigo inválidos.')
  const b = body as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 150) : ''
  if (title.length < 5) throw new Error('O título precisa ter pelo menos 5 caracteres.')
  let slug = typeof b.slug === 'string' ? slugifyBlogTitle(b.slug) : ''
  if (!slug) slug = slugifyBlogTitle(title)
  if (slug.length < 3) throw new Error('Não foi possível gerar um endereço (slug) para o artigo.')
  const description = typeof b.description === 'string' ? b.description.trim().slice(0, 300) : ''
  if (description.length < 20) throw new Error('A descrição precisa ter pelo menos 20 caracteres.')
  const category = typeof b.category === 'string' && (CATEGORIES as readonly string[]).includes(b.category) ? b.category : 'dicas'
  const keywords = Array.isArray(b.keywords)
    ? b.keywords.filter((k): k is string => typeof k === 'string').map((k) => k.trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : typeof b.keywords === 'string'
      ? b.keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : []
  const cover = typeof b.cover === 'string' ? b.cover.trim().slice(0, 500) : ''
  const coverAlt = typeof b.coverAlt === 'string' ? b.coverAlt.trim().slice(0, 200) : ''
  const content = typeof b.content === 'string' ? b.content : ''
  if (content.trim().length < 100) throw new Error('O conteúdo precisa ter pelo menos 100 caracteres.')
  const seoTitle = typeof b.seoTitle === 'string' ? b.seoTitle.trim().slice(0, 150) : ''
  const published = b.published === true
  return { title, slug, description, category, keywords, cover: cover || null, coverAlt: coverAlt || null, content, seoTitle: seoTitle || null, published }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) return jsonError('Artigo não encontrado.', 404)
  return Response.json({ post })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const { id } = await params
  const body = await req.json().catch(() => null)
  try {
    const data = validateInput(body)
    const current = await db.blogPost.findUnique({ where: { id } })
    if (!current) return jsonError('Artigo não encontrado.', 404)
    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.published ? current.publishedAt ?? new Date() : null,
      },
    })
    return Response.json({ post })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return jsonError('Já existe um artigo com este endereço (slug).', 409)
    return jsonError(error instanceof Error ? error.message : 'Não foi possível salvar o artigo.', 400)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const { id } = await params
  const current = await db.blogPost.findUnique({ where: { id } })
  if (!current) return jsonError('Artigo não encontrado.', 404)
  await db.blogPost.delete({ where: { id } })
  return Response.json({ ok: true })
}
