import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Mail, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { SiteHeader, SiteFooter, MobileNote } from '@/components/blog/SiteChrome'
import { PageViewTracker } from '@/components/blog/PageViewTracker'
import { PRICE } from '@/lib/knowledge'
import { SITE, SITE_URL, CONTENT_PUBLISHED_ISO, todayISO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Sobre a Click & Gruda — Quem Produz as Artes e Como Funciona',
  description:
    'Conheça a Click & Gruda: plataforma brasileira de artes digitais para sublimação de canecas com acesso vitalício. Política editorial, revisão técnica e processo de produção do acervo.',
  keywords: [
    'sobre a click e gruda',
    'quem somos click gruda',
    'plataforma de artes para canecas',
    'política editorial click gruda',
  ],
  alternates: { canonical: '/sobre' },
  openGraph: {
    title: 'Sobre a Click & Gruda',
    description:
      'Quem somos, como produzimos o acervo e por que o acesso vitalício por pagamento único existe. Conteúdo institucional com revisão técnica.',
    siteName: SITE.name,
    locale: 'pt_BR',
    type: 'website',
    url: `${SITE_URL}/sobre`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre a Click & Gruda',
    description: 'Quem somos, como produzimos o acervo e a nossa política editorial.',
  },
}

export default function SobrePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${SITE_URL}/sobre#webpage`,
        url: `${SITE_URL}/sobre`,
        name: 'Sobre a Click & Gruda',
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: { '@id': `${SITE_URL}/#organization` },
        datePublished: CONTENT_PUBLISHED_ISO,
        dateModified: todayISO(),
        author: { '@type': 'Organization', name: SITE.author.name },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/sobre#page`,
        url: `${SITE_URL}/sobre`,
        description: 'Informações institucionais, processo de produção e política editorial da Click & Gruda.',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Sobre', item: `${SITE_URL}/sobre` },
        ],
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageViewTracker event="page_view" title="Sobre a Click & Gruda" />
      <script
        type="application/ld+json"
        id="sobre-schema"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <SiteHeader />
      <MobileNote />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Trilha de navegação" className="text-xs font-semibold text-zinc-400">
          <Link href="/" className="transition-colors hover:text-orange-400">
            Início
          </Link>
          <span className="mx-2 text-zinc-600">/</span>
          <span className="text-orange-500">Sobre</span>
        </nav>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Sobre a <span className="text-gradient-orange">Click &amp; Gruda</span>
        </h1>

        {/* BLUF */}
        <p className="mt-5 text-lg font-semibold leading-relaxed text-zinc-800">
          A Click &amp; Gruda é uma plataforma brasileira de artes digitais para sublimação de canecas: por um
          pagamento único de {PRICE} (sem mensalidade), o assinante obtém acesso vitalício e downloads ilimitados a
          todo o acervo — incluindo lançamentos frequentes — em artes no formato exato de 21 × 9,5 cm, prontas
          para prensagem térmica e para produzir e vender as suas canecas.
        </p>

        {/* Como produzimos */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <Sparkles className="mr-2 inline h-5 w-5 text-orange-500" />
          Como produzimos o acervo
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          <p>
            Cada arte do acervo nasce de um processo editorial: a equipe acompanha as tendências do varejo de
            personalizados (estilos de maior rotação, humor, profissões, fé, sazonalidade), define os designs da
            semana e os produz diretamente na área de estampa das canecas padrão de 325 ml — o cobre-caneca de
            21 × 9,5 cm — respeitando margens de segurança para a emenda e a alça.
          </p>
          <p>
            Antes de entrar no portal, as artes passam por verificação técnica: nitidez compatível com o tamanho
            impresso, elementos posicionados longe das dobras e formato pronto para imprimir espelhado e prensar,
            sem ajuste no editor.
          </p>
        </div>

        {/* Política editorial (E-E-A-T) */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <ShieldCheck className="mr-2 inline h-5 w-5 text-orange-500" />
          Política editorial e revisão técnica
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
          <p>
            Todo conteúdo publicado nesta plataforma (páginas de produto, guias do blog e materiais de apoio) é
            produzido pela <strong>Equipe Editorial Click &amp; Gruda</strong> e revisado tecnicamente pela{' '}
            <strong>Equipe de Produção</strong>, que valida medidas, parâmetros de prensagem e recomendações de
            insumos com base nos manuais dos fabricantes e nas boas práticas do mercado de sublimação.
          </p>
          <p>
            Quando identificamos imprecisão em conteúdo já publicado, corrigimos o material e atualizamos a data de
            revisão visível no rodapé das páginas — transparência é parte do compromisso com quem vive de canecas.
          </p>
          <p>
            Dados de mercado apresentados nos conteúdos (faixas de preço de equipamentos e insumos, por exemplo) são
            estimativas de referência do mercado brasileiro e devem ser confirmados com os fornecedores da sua
            região.
          </p>
        </div>

        {/* Dados institucionais */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <Users className="mr-2 inline h-5 w-5 text-orange-500" />
          Dados institucionais
        </h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Nome', value: SITE.name },
            { label: 'Atuação', value: 'Plataforma online de artes digitais para sublimação (e-commerce)' },
            { label: 'Área atendida', value: 'Brasil (conteúdo e suporte em português)' },
            { label: 'Modelo', value: `Acesso vitalício por pagamento único de ${PRICE}` },
            { label: 'Idioma', value: 'Português (pt-BR)' },
            { label: 'Contato', value: SITE.email },
          ].map((d) => (
            <div key={d.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <dt className="text-[11px] font-black uppercase tracking-wider text-zinc-400">{d.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-800">{d.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-500">
          <p className="flex items-center gap-2 font-bold text-zinc-700">
            <MapPin className="h-4 w-4 text-orange-500" /> Operação 100% digital
          </p>
          <p className="mt-1">
            A Click &amp; Gruda é uma operação 100% online: o produto é digital (download imediato), o pagamento é
            processado via PIX (Mercado Pago ou Asaas) e o suporte é feito por e-mail —{' '}
            <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:underline">
              <Mail className="h-3.5 w-3.5" />
              {SITE.email}
            </a>
          </p>
        </div>

        {/* CTA */}
        <aside className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 p-8 text-center text-white">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Pronto para conhecer o acervo de perto?
          </h2>
          <Link
            href="/#preco"
            className="mt-5 inline-flex h-13 items-center rounded-2xl bg-zinc-950 px-8 text-base font-black uppercase tracking-wide text-white shadow-2xl transition-all hover:scale-[1.03] hover:bg-zinc-900"
          >
            Ver as artes <ArrowRight className="ml-2 h-5 w-5 text-orange-400" />
          </Link>
        </aside>
      </main>

      <SiteFooter />
    </div>
  )
}
