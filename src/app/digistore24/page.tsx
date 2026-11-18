import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Infinity as InfinityIcon,
  Mail,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Ds24Header, Ds24Footer, DS24_CHECKOUT_URL } from '@/components/digistore24/Ds24Chrome'
import { PageViewTracker } from '@/components/blog/PageViewTracker'
import { SALES } from '@/components/landing/sales-content'
import { SITE_URL } from '@/lib/site'

/**
 * Página de vendas exclusiva do canal Digistore24.
 * REGRA: nenhum link de venda fora da Digistore24 — sem /#preco, /comprar,
 * Cakto, Hotmart ou Kiwify. Preço em EUR, devolução de 14 dias visível e
 * aviso legal no rodapé (exigências da aprovação GmbH do produto 768342).
 */
export const metadata: Metadata = {
  title: 'Click & Gruda — Artes para Sublimação de Canecas + Studio 3D | €14,90',
  description:
    'Milhares de artes para sublimação de canecas organizadas por tema, com Studio Mockup 3D, Editor Online e Academia. Acesso por 2 anos por pagamento único de €14,90, com devolução em 14 dias. Pagamento seguro via Digistore24.',
  // keywords e twitter.description próprios: os globais do layout trazem
  // "acesso vitalício artes" e "downloads ilimitados", banidos na análise GmbH.
  keywords: ['artes para sublimação', 'canecas personalizadas', 'sublimação de canecas', 'mockup 3D', 'artes para canecas'],
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/digistore24` },
  openGraph: {
    title: 'Click & Gruda — Artes para Canecas + Studio 3D',
    description:
      'Acesso por 2 anos por €14,90. Milhares de artes para sublimação, mockup 3D e editor online. Devolução em 14 dias.',
    siteName: 'Click & Gruda',
    locale: 'pt_PT',
    type: 'website',
    url: `${SITE_URL}/digistore24`,
  },
  twitter: {
    card: 'summary_large_image',
    description:
      'Acesso por 2 anos por €14,90. Milhares de artes para sublimação, mockup 3D e editor online. Devolução em 14 dias.',
  },
}

const PRICE_LABEL = '€14,90'

/**
 * Copy Digistore24: o contrato B2B da Digistore24 (ponto 3) proíbe prometer
 * acesso sem limite de duração — o máximo permitido é 2 anos. A copy
 * compartilhada SALES continua com a promessa original na landing principal
 * (Cakto); aqui ela é adaptada SÓ na renderização desta página, sem tocar
 * em sales-content.ts. Dois itens do SALES trazem essa promessa: benefits
 * e valueStack. As strings comparadas abaixo são as originais do SALES e
 * nunca chegam ao HTML — só o texto já adaptado é renderizado.
 */
const DS24_BENEFITS = SALES.benefits.map((b) => ({
  ...b,
  text: b.text.replace('no seu acesso vitalício', 'no seu acesso de 2 anos'),
}))
const DS24_VALUE_STACK = SALES.valueStack.map((v) => ({
  ...v,
  name: v.name === 'Atualizações vitalícias' ? 'Atualizações incluídas por 2 anos' : v.name,
}))

function CheckoutButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={DS24_CHECKOUT_URL}
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-base font-black uppercase tracking-wide text-white shadow-2xl shadow-orange-500/30 transition-all hover:scale-[1.02] hover:brightness-105 ${className}`}
    >
      Garantir acesso por 2 anos — {PRICE_LABEL}
      <ArrowRight className="ml-2 h-5 w-5" />
    </a>
  )
}

export default function Digistore24SalesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageViewTracker event="page_view" title="Oferta Digistore24 — Click & Gruda" />
      <Ds24Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        {/* HERO */}
        <section className="py-12 text-center sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
            {SALES.heroKicker}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl">
            A sua próxima caneca{' '}
            <span className="text-gradient-orange">pronta para vender</span>{' '}
            sem criar do zero.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600">
            {SALES.heroDescription}
          </p>

          {/* Cartão de preço */}
          <div className="mx-auto mt-10 max-w-md rounded-3xl border-2 border-orange-500 bg-orange-50/60 p-6 text-left shadow-xl shadow-orange-500/10">
            <p className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Acesso por 2 anos · Pagamento único
            </p>
            <p className="mt-2 text-5xl font-black tracking-tight text-zinc-950">
              {PRICE_LABEL}
              <span className="ml-2 align-middle text-sm font-bold text-zinc-500">uma só vez, por 2 anos</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-zinc-700">
              {[
                'Milhares de artes para canecas com curadoria',
                'Studio Mockup 3D e Editor Online incluídos',
                'Academia de Sublimação + curso de impressão',
                'Novos lançamentos incluídos, sem mensalidade',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <CheckoutButton className="mt-6 w-full" />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-zinc-500">
              <CreditCard className="h-3.5 w-3.5" />
              Pagamento seguro processado pela Digistore24
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-zinc-500">
              <RefreshCcw className="h-3.5 w-3.5" />
              Devolução em 14 dias — ver condições abaixo
            </p>
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="py-10">
          <h2 className="text-center text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            Parece-lhe familiar?
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SALES.problems.map((p) => (
              <div key={p.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="font-black text-zinc-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="py-10">
          <h2 className="text-center text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            O que muda com o acesso completo
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DS24_BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm">
                <h3 className="font-black text-zinc-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{b.text}</p>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
              <InfinityIcon className="h-6 w-6 text-orange-400" />
              <h3 className="mt-3 font-black">2 anos, sem mensalidade</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Paga uma vez e usa o acesso por 2 anos — incluindo os lançamentos futuros.
              </p>
            </div>
          </div>
        </section>

        {/* O QUE ESTÁ INCLUÍDO */}
        <section className="py-10">
          <h2 className="text-center text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            O que está incluído
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {DS24_VALUE_STACK.map((v) => (
              <div key={v.name} className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-700">
                  {v.tag}
                </span>
                <div>
                  <h3 className="font-black text-zinc-900">{v.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{v.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="py-10">
          <h2 className="text-center text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            Como funciona
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                num: '01',
                title: 'Crie a sua conta gratuita',
                text: 'Crie a conta gratuita na Click & Gruda com o mesmo e-mail que vai usar na compra — é esse e-mail que liberta o acesso.',
              },
              {
                num: '02',
                title: 'Conclua a compra',
                text: 'O pagamento é feito de forma segura no checkout da Digistore24. Assim que for aprovado, o acesso por 2 anos é libertado automaticamente.',
              },
              {
                num: '03',
                title: 'Use por 2 anos',
                text: 'Entre na plataforma com a sua conta e use a biblioteca, o Studio 3D e o Editor durante 2 anos, sem mensalidade.',
              },
            ].map((s) => (
              <div key={s.num} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-3xl font-black text-orange-500">{s.num}</p>
                <h3 className="mt-3 font-black text-zinc-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-zinc-500">
            <Mail className="mr-1 inline h-4 w-4 text-orange-500" />
            Importante: crie a conta gratuita com o mesmo e-mail da compra antes de pagar, para o acesso ser
            libertado automaticamente. Se já tem conta, use o mesmo e-mail no checkout.
          </p>
        </section>

        {/* DEVOLUÇÃO 14 DIAS */}
        <section id="devolucao" className="scroll-mt-24 py-10">
          <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-8">
            <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-zinc-950">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              Devolução em 14 dias
            </h2>
            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-zinc-700">
              <p>
                Tem <strong>14 dias após a compra</strong> para pedir a devolução do valor pago, caso o acesso não
                seja o que esperava. Basta contactar o suporte através do e-mail{' '}
                <a href="mailto:contato@clickgruda.com.br" className="font-semibold text-orange-600 hover:underline">
                  contato@clickgruda.com.br
                </a>{' '}
                ou do WhatsApp{' '}
                <a
                  href="https://wa.me/556298387816"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-orange-600 hover:underline"
                >
                  +55 62 9838-7816
                </a>
                , indicando o e-mail usado na compra.
              </p>
              <p>
                Após a confirmação do pedido dentro do prazo, o valor é devolvido pelo mesmo meio de pagamento
                utilizado na compra, através da Digistore24.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ curto */}
        <section className="py-10">
          <h2 className="text-center text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            Perguntas frequentes
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            {[
              {
                q: 'O pagamento é seguro?',
                a: 'Sim. A cobrança é processada pela Digistore24, uma plataforma de pagamentos internacional. Os seus dados de pagamento não passam pela Click & Gruda.',
              },
              {
                q: 'Como recebo o acesso depois de pagar?',
                a: 'O acesso por 2 anos é libertado automaticamente na conta Click & Gruda com o mesmo e-mail usado na compra. Crie a conta gratuita com esse e-mail antes de comprar — ou use a conta que já tem.',
              },
              {
                q: 'O acesso tem prazo?',
                a: 'Sim, o acesso dura 2 anos a partir da compra: paga uma vez e usa durante 2 anos, incluindo os novos lançamentos de artes e recursos.',
              },
              {
                q: 'Posso pedir a devolução?',
                a: 'Sim, em até 14 dias após a compra, contactando o suporte pelo e-mail ou WhatsApp indicados na secção de devolução.',
              },
              {
                q: 'As artes servem para qualquer caneca?',
                a: 'As artes seguem o formato de referência de 21 × 9,5 cm para canecas padrão de 325 ml. Confirme as medidas da sua caneca e os ajustes da impressão.',
              },
            ].map((f) => (
              <div key={f.q} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="font-black text-zinc-900">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-10">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 p-8 text-center text-white sm:p-12">
            <Sparkles className="mx-auto h-8 w-8" />
            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Pronto para vender a sua próxima caneca?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Acesso por 2 anos por {PRICE_LABEL}, pagamento único, com devolução em 14 dias.
            </p>
            <CheckoutButton className="mt-6 bg-zinc-950 shadow-none" />
            <p className="mt-4 text-xs font-semibold text-white/80">
              Pagamento seguro via Digistore24 ·{' '}
              <Link href="/aviso-legal" className="underline underline-offset-2">
                Aviso legal
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Ds24Footer />
    </div>
  )
}
