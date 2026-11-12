'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BLOG_CATEGORY_LABELS } from '@/content/blog'

type BlogPostRow = {
  id: string
  slug: string
  title: string
  description: string
  category: string
  keywords: string[]
  cover: string | null
  coverAlt: string | null
  seoTitle: string | null
  content: string
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

const EMPTY_FORM = {
  id: '',
  title: '',
  slug: '',
  description: '',
  category: 'dicas',
  keywords: '',
  cover: '',
  coverAlt: '',
  seoTitle: '',
  content: '',
  published: false,
}

const CATEGORY_OPTIONS = [
  ...Object.entries(BLOG_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  { value: 'dicas', label: 'Dicas' },
  { value: 'tendencias', label: 'Tendências' },
  { value: 'novidades', label: 'Novidades' },
]

export function AdminBlogSection() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<{ posts: BlogPostRow[] }>({
    queryKey: ['admin-blog'],
    queryFn: async () => {
      const res = await fetch('/api/admin/blog', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar os artigos do blog')
      return res.json()
    },
  })

  const posts = data?.posts ?? []

  const startNew = () => {
    setForm(EMPTY_FORM)
    setEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startEdit = (post: BlogPostRow) => {
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      category: post.category,
      keywords: post.keywords.join(', '),
      cover: post.cover ?? '',
      coverAlt: post.coverAlt ?? '',
      seoTitle: post.seoTitle ?? '',
      content: post.content,
      published: post.published,
    })
    setEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        category: form.category,
        keywords: form.keywords,
        cover: form.cover,
        coverAlt: form.coverAlt,
        seoTitle: form.seoTitle,
        content: form.content,
        published: form.published,
      }
      const res = await fetch(form.id ? `/api/admin/blog/${form.id}` : '/api/admin/blog', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Não foi possível salvar o artigo.')
      toast.success(form.id ? 'Artigo atualizado.' : 'Artigo criado.')
      setForm(EMPTY_FORM)
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o artigo.')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (post: BlogPostRow) => {
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, keywords: post.keywords.join(', '), published: !post.published }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Não foi possível alterar a publicação.')
      toast.success(!post.published ? 'Artigo publicado.' : 'Artigo despublicado (virou rascunho).')
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a publicação.')
    }
  }

  const remove = async (post: BlogPostRow) => {
    if (!window.confirm(`Excluir o artigo "${post.title}"? Essa ação não pode ser desfeita.`)) return
    setDeletingId(post.id)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Não foi possível excluir o artigo.')
      toast.success('Artigo excluído.')
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível excluir o artigo.')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) return <p className="rounded-xl bg-white p-5 text-sm text-zinc-500">Carregando artigos do blog…</p>
  if (isError) return <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">Falha ao carregar os artigos do blog.</p>

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-zinc-900">
              <BookOpen className="h-5 w-5 text-orange-500" /> Blog do sublimador
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Os artigos publicados aparecem no <span className="font-semibold text-zinc-700">/blog</span> público, na
              seção do blog da página inicial e no sitemap do Google. Artigos em rascunho não aparecem para ninguém.
              O conteúdo é em Markdown: use <code className="rounded bg-zinc-100 px-1">## Título</code> para seções,{' '}
              <code className="rounded bg-zinc-100 px-1">**negrito**</code> e <code className="rounded bg-zinc-100 px-1">- item</code> para
              listas. A publicação leva até 1 minuto para aparecer no site.
            </p>
          </div>
          {!editing && (
            <Button onClick={startNew} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo artigo
            </Button>
          )}
        </div>

        {editing && (
          <div className="mt-6 space-y-4 border-t border-zinc-100 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="blog-title">Título *</Label>
                <Input id="blog-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Tendências de artes para canecas em 2026" />
              </div>
              <div>
                <Label htmlFor="blog-slug">Endereço (slug)</Label>
                <Input id="blog-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="gerado-automaticamente-do-titulo" />
                <p className="mt-1 text-xs text-zinc-400">Deixe vazio para gerar do título. O endereço final é /blog/seu-slug.</p>
              </div>
              <div>
                <Label htmlFor="blog-category">Categoria</Label>
                <select
                  id="blog-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="blog-description">Descrição (resumo que aparece no Google e na lista) *</Label>
                <Textarea id="blog-description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Uma frase que resume o artigo e convida a leitura." />
              </div>
              <div>
                <Label htmlFor="blog-cover">Imagem de capa (URL)</Label>
                <Input id="blog-cover" value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} placeholder="/uploads/minha-capa.png ou https://…" />
              </div>
              <div>
                <Label htmlFor="blog-cover-alt">Texto alternativo da capa</Label>
                <Input id="blog-cover-alt" value={form.coverAlt} onChange={(e) => setForm({ ...form, coverAlt: e.target.value })} placeholder="Descreva a imagem para o Google e leitores de tela" />
              </div>
              <div>
                <Label htmlFor="blog-seo-title">Título para o Google (opcional)</Label>
                <Input id="blog-seo-title" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="Se vazio, usa o título do artigo" />
              </div>
              <div>
                <Label htmlFor="blog-keywords">Palavras-chave (separadas por vírgula)</Label>
                <Input id="blog-keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="sublimação de canecas, artes para caneca, tendências" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="blog-content">Conteúdo (Markdown) *</Label>
                <Textarea
                  id="blog-content"
                  rows={16}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder={'## Subtítulo\n\nEscreva o artigo aqui. Use **negrito**, listas com - item e links [texto](https://…).'}
                  className="font-mono text-sm leading-6"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-orange-500" />
                Publicar agora (se desmarcado, fica como rascunho)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {form.id ? 'Salvar alterações' : 'Criar artigo'}
              </Button>
              <Button variant="outline" onClick={() => { setForm(EMPTY_FORM); setEditing(false) }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-500">
          Artigos criados no admin ({posts.length})
        </h3>
        {posts.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Nenhum artigo criado por aqui ainda. Os 6 artigos fixos do blog (guia, custos, prensa, artes, passo a passo
            e datas comemorativas) continuam no ar — eles são gerenciados no código e não aparecem nesta lista.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-zinc-900">{post.title}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    /blog/{post.slug} · {BLOG_CATEGORY_LABELS[post.category] ?? post.category} ·{' '}
                    {new Date(post.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${post.published ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {post.published ? 'Publicado' : 'Rascunho'}
                </span>
                {post.published && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-bold text-zinc-600 hover:border-orange-300 hover:text-orange-600">
                    <Eye className="h-4 w-4" /> Ver
                  </a>
                )}
                <Button variant="outline" size="sm" onClick={() => togglePublish(post)} className="gap-1.5">
                  {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {post.published ? 'Despublicar' : 'Publicar'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => startEdit(post)} className="gap-1.5">
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => remove(post)} disabled={deletingId === post.id} className="gap-1.5 text-red-600 hover:text-red-700">
                  {deletingId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Excluir
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
