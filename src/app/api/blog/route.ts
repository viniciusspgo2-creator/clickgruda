import { getAllBlogListItems } from '@/lib/blog-posts'

/**
 * GET /api/blog?limit=3 — artigos públicos do blog (estáticos + criados no admin),
 * ordenados do mais recente para o mais antigo. Sem autenticação: usado pela
 * seção do blog na página inicial e pode ser consumido por qualquer visitante.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') ?? '6') || 6))
  const items = await getAllBlogListItems()
  return Response.json({ articles: items.slice(0, limit), total: items.length })
}
