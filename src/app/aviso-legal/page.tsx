import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail, MapPin, MessageCircle, Scale, ShieldCheck } from 'lucide-react'
import { SiteHeader, SiteFooter, MobileNote } from '@/components/blog/SiteChrome'
import { PageViewTracker } from '@/components/blog/PageViewTracker'
import { SITE, SITE_URL, CONTENT_UPDATED_ISO, WHATSAPP } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Aviso legal — Click & Gruda',
  description:
    'Ficha técnica da Click & Gruda: responsável, morada, contactos e informações legais sobre a venda de produtos digitais, incluindo compras processadas pela Digistore24.',
  alternates: { canonical: '/aviso-legal' },
  openGraph: {
    title: 'Aviso legal — Click & Gruda',
    description: 'Ficha técnica, contactos e informações legais da Click & Gruda.',
    siteName: SITE.name,
    locale: 'pt_PT',
    type: 'website',
    url: `${SITE_URL}/aviso-legal`,
  },
}

export default function AvisoLegalPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/aviso-legal#webpage`,
        url: `${SITE_URL}/aviso-legal`,
        name: 'Aviso legal — Click & Gruda',
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        dateModified: CONTENT_UPDATED_ISO,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Aviso legal', item: `${SITE_URL}/aviso-legal` },
        ],
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageViewTracker event="page_view" title="Aviso legal — Click & Gruda" />
      <script
        type="application/ld+json"
        id="aviso-legal-schema"
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
          <span className="text-orange-500">Aviso legal</span>
        </nav>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          Aviso <span className="text-gradient-orange">legal</span>
        </h1>
        <p className="mt-5 text-lg font-semibold leading-relaxed text-zinc-800">
          Ficha técnica e informações legais da Click &amp; Gruda, plataforma de artes digitais para sublimação
          de canecas.
        </p>

        {/* Ficha técnica */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <FileText className="mr-2 inline h-5 w-5 text-orange-500" />
          Ficha técnica
        </h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Responsável', value: 'Vinicius Alves de Araujo' },
            { label: 'Marca', value: 'Click & Gruda' },
            { label: 'Atividade', value: 'Venda de produtos digitais (artes para sublimação de canecas)' },
            { label: 'Operação', value: '100% online — produto digital, entrega imediata' },
          ].map((d) => (
            <div key={d.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <dt className="text-[11px] font-black uppercase tracking-wider text-zinc-400">{d.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-zinc-800">{d.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-600">
          <p className="flex items-center gap-2 font-bold text-zinc-700">
            <MapPin className="h-4 w-4 text-orange-500" /> Morada
          </p>
          <address className="mt-2 not-italic">
            Rua Rp 26, Qd. 40, Lt. 21 e 22, Casa 3 — Residencial Paraíso 2<br />
            Senador Canedo — GO, CEP 75260-093, Brasil
          </address>
        </div>

        {/* Contactos */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <Mail className="mr-2 inline h-5 w-5 text-orange-500" />
          Contactos
        </h2>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-zinc-600">
          <p>
            E-mail:{' '}
            <a href="mailto:contato@clickgruda.com.br" className="font-semibold text-orange-600 hover:underline">
              contato@clickgruda.com.br
            </a>
          </p>
          <p>
            WhatsApp:{' '}
            <a
              href={WHATSAPP.link()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              {WHATSAPP.display}
            </a>
          </p>
        </div>

        {/* Pagamentos */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <ShieldCheck className="mr-2 inline h-5 w-5 text-orange-500" />
          Pagamentos
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-600">
          <p>
            As compras feitas através da página da Digistore24 são processadas pela{' '}
            <strong>Digistore24 GmbH</strong> (Digistore24 Inc. para outras regiões), que é a responsável pela
            cobrança. Os dados de pagamento não passam pela Click &amp; Gruda.
          </p>
          <p>
            O acesso ao produto digital é libertado na conta Click &amp; Gruda com o mesmo e-mail usado na
            compra, após a confirmação do pagamento.
          </p>
        </div>

        {/* Devolução */}
        <h2 className="mt-12 text-2xl font-black tracking-tight text-zinc-950">
          <Scale className="mr-2 inline h-5 w-5 text-orange-500" />
          Devolução
        </h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-zinc-600">
          <p>
            Para compras feitas através da Digistore24, o cliente tem <strong>14 dias após a compra</strong> para
            pedir a devolução do valor pago, contactando o suporte pelo e-mail ou WhatsApp indicados acima. As
            condições completas estão na{' '}
            <Link href="/digistore24#devolucao" className="font-semibold text-orange-600 hover:underline">
              página da oferta
            </Link>
            .
          </p>
        </div>

        {/* Responsabilidade */}
        <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-relaxed text-zinc-500">
          <p>
            A Click &amp; Gruda é responsável pelo conteúdo desta plataforma e pelos produtos digitais
            vendidos. As artes seguem o formato de referência de 21 × 9,5 cm para canecas padrão de 325 ml;
            confirme as medidas da sua caneca e os ajustes da impressão antes de produzir.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
