'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, Globe, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { SITE_URL } from '@/lib/site'
import { MARKETING_KEYS, type MarketingKey, type PublicMarketingConfig } from '@/lib/marketing-config'

type ResponseData = { settings: Record<string, string>; marketing: PublicMarketingConfig; siteUrl: string }

const FIELDS: { key: MarketingKey; label: string; placeholder: string; hint: string }[] = [
  { key: 'gsc_verification', label: 'Google Search Console — código de verificação', placeholder: 'Token ou meta tag google-site-verification', hint: 'No Search Console, adicione https://www.clickgruda.com.br/ como Prefixo do URL e escolha Tag HTML. Cole a tag, salve e depois clique em Verificar no Google.' },
  { key: 'bing_verification', label: 'Bing Webmaster Tools — código de verificação', placeholder: 'Token ou meta tag msvalidate.01', hint: 'Opcional. Cole o código da tag HTML fornecida pelo Bing.' },
  { key: 'meta_domain_verification', label: 'Meta Business — verificação do domínio', placeholder: 'Token ou meta tag facebook-domain-verification', hint: 'Opcional. A verificação do domínio é diferente do ID do Pixel.' },
  { key: 'meta_pixel_id', label: 'Meta Pixel — ID', placeholder: 'Somente os números do Pixel', hint: 'Gerenciador de Eventos da Meta → sua fonte de dados → Configurações → ID do conjunto de dados/Pixel. Após salvar, use Testar eventos e aceite os cookies no site.' },
  { key: 'ga4_id', label: 'Google Analytics 4 — ID de medição', placeholder: 'G-XXXXXXXXXX', hint: 'Analytics → Administrador → Fluxos de dados → Web. Se houver GTM abaixo, publique a tag GA4 dentro do contêiner; o script direto será desativado para evitar duplicação.' },
  { key: 'gtm_id', label: 'Google Tag Manager — ID do contêiner', placeholder: 'GTM-XXXXXXX', hint: 'Opcional. Publique suas tags no GTM. Para páginas virtuais, use o evento cg_page_view; para conversões, begin_checkout, auth_submit e purchase. Se usar o Pixel direto acima, não instale o mesmo Pixel no GTM.' },
]

export function AdminSeoSection() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<Record<MarketingKey, string>>>({})
  const [loaded, setLoaded] = useState(false)
  const query = useQuery<ResponseData>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Não foi possível carregar as integrações.')
      return res.json()
    },
  })

  useEffect(() => {
    if (!query.data || loaded) return
    const values: Partial<Record<MarketingKey, string>> = {}
    // Ausência de chave preserva fallback de ambiente; string vazia o desativa.
    for (const key of MARKETING_KEYS) if (key in query.data.settings) values[key] = query.data.settings[key]
    setForm(values)
    setLoaded(true)
  }, [query.data, loaded])

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar.')
      return data as ResponseData
    },
    onSuccess: data => {
      queryClient.setQueryData(['admin-settings'], data)
      toast.success('Integrações salvas. Abra uma nova página do site para conferir as tags.')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const set = (key: MarketingKey, value: string) => setForm(current => ({ ...current, [key]: value }))
  const effective = query.data?.marketing
  const fallback: Partial<Record<MarketingKey, string>> = {
    gsc_verification: effective?.gscVerification, bing_verification: effective?.bingVerification,
    meta_domain_verification: effective?.metaDomainVerification,
    ga4_id: effective?.ga4Id, gtm_id: effective?.gtmId, meta_pixel_id: effective?.metaPixelId,
    official_social_urls: effective?.socialUrls.join('\n'),
  }
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success('Endereço copiado.') }
    catch { toast.error('Copie o endereço exibido na tela.') }
  }

  if (query.isError) return <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-700">{query.error.message} <button onClick={() => query.refetch()} className="underline">Tentar novamente</button></p>
  if (!loaded) return <div className="h-72 animate-pulse rounded-2xl bg-zinc-200/70" />
  return <div className="max-w-5xl space-y-6">
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-black text-zinc-950"><Globe className="h-5 w-5 text-orange-600" /> SEO, GEO e integrações</h2>
      <p className="mt-2 break-all text-sm text-zinc-700">Endereço principal: <strong>{query.data?.siteUrl || SITE_URL}</strong></p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600">Sitemap, canonical e dados estruturados usam este domínio. Salvar um código aqui instala a tag; a confirmação da propriedade acontece na ferramenta do Google, Bing ou Meta.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {['/sitemap.xml', '/robots.txt', '/llms.txt', '/llms-full.txt'].map(path => <div key={path} className="flex min-w-0 items-center gap-2 rounded-xl border border-orange-100 bg-white p-3">
          <a href={path} target="_blank" rel="noreferrer" className="min-w-0 flex-1 break-all text-xs font-bold text-orange-700">{path} <ExternalLink className="inline h-3 w-3" /></a>
          <button onClick={() => copy(`${SITE_URL}${path}`)} aria-label={`Copiar endereço ${path}`}><Copy className="h-4 w-4 text-zinc-500" /></button>
        </div>)}
      </div>
    </section>

    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-black text-zinc-900">Códigos e identificadores</h2>
      <p className="mt-2 text-xs text-zinc-500">Informe os códigos das suas contas. Estes campos não recebem senha, chave de API ou script completo.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {FIELDS.map(field => <div key={field.key} className="space-y-2">
          <Label htmlFor={`seo-${field.key}`} className="text-xs font-bold text-zinc-700">{field.label}</Label>
          <Input id={`seo-${field.key}`} value={form[field.key] ?? fallback[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder} className="rounded-xl font-mono text-xs" autoComplete="off" maxLength={600} />
          <p className="text-xs leading-relaxed text-zinc-500">{field.hint}</p>
        </div>)}
      </div>
      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-zinc-50 p-4">
        <div><Label htmlFor="seo-consent" className="font-bold">Solicitar autorização para cookies opcionais</Label><p className="mt-1 text-xs text-zinc-500">Quando ativo, Pixel, GA4 e GTM aguardam o aceite do visitante. A escolha pode ser alterada no botão Cookies do site.</p></div>
        <Switch id="seo-consent" checked={(form.marketing_consent_required ?? String(effective?.consentRequired ?? true)) === 'true'} onCheckedChange={value => set('marketing_consent_required', String(value))} />
      </div>
      <div className="mt-6 space-y-2"><Label htmlFor="seo-social" className="text-xs font-bold">Perfis oficiais da marca — um endereço HTTPS por linha</Label><Textarea id="seo-social" value={form.official_social_urls ?? fallback.official_social_urls ?? ''} onChange={e => set('official_social_urls', e.target.value)} placeholder="Cole somente perfis reais da Click & Gruda" className="min-h-24 rounded-xl text-xs" /><p className="text-xs text-zinc-500">Os perfis preenchidos serão publicados em sameAs nos dados estruturados. Deixe vazio até confirmar os endereços.</p></div>
    </section>

    <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
      <h2 className="text-base font-black text-zinc-950">Concluir no Search Console</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5">
        <li>Abra o <a className="font-bold text-orange-700 underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Google Search Console</a> na sua conta.</li>
        <li>Se já existe uma propriedade deste domínio, mantenha-a. Caso use Prefixo do URL, selecione <strong>https://www.clickgruda.com.br/</strong>. Propriedade do tipo Domínio exige validação no DNS.</li>
        <li>Para validar por Tag HTML, cole o código no campo acima, salve e clique em Verificar no Google. A tag precisa estar na página publicada.</li>
        <li>Em Sitemaps, envie <strong className="break-all">{SITE_URL}/sitemap.xml</strong>.</li>
        <li>Inspecione a página inicial e solicite indexação. Revise os URLs do site anterior; redirecione cada um para um destino equivalente quando existir.</li>
      </ol>
      <p className="mt-4 text-xs text-zinc-500">Reutilizar o mesmo domínio não exige a ferramenta Mudança de endereço. Não exclua o histórico da propriedade nem redirecione todos os URLs antigos para a página inicial.</p>
    </section>

    <section className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-black text-zinc-950">Eventos preparados para a Meta</h2>
      <table className="mt-4 w-full text-left text-xs text-zinc-600"><thead><tr className="border-b"><th className="p-2">Evento</th><th className="p-2">Quando acontece</th></tr></thead><tbody>
        {[['PageView', 'Abertura de uma página pública'], ['CompleteRegistration', 'Cadastro concluído com sucesso'], ['InitiateCheckout', 'Entrada no checkout'], ['Purchase', 'Confirmação de pagamento automático enquanto o checkout está aberto'], ['Contact', 'Clique de contato pelo WhatsApp']].map(([event, when]) => <tr key={event} className="border-b border-zinc-100"><td className="p-2 font-mono">{event}</td><td className="p-2">{when}</td></tr>)}
      </tbody></table>
      <p className="mt-3 text-xs text-zinc-500">Pagamento por chave PIX e conta apenas pré-aprovada não geram Purchase. A API de Conversões da Meta exige uma integração adicional; não está ativada por inserir o ID do Pixel.</p>
    </section>
    <Button onClick={() => save.mutate()} disabled={save.isPending} className="h-12 w-full rounded-xl bg-orange-600 font-black text-white sm:w-auto">
      {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar SEO e integrações
    </Button>
  </div>
}
