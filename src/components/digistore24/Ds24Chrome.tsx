/**
 * Chrome mínimo das páginas do canal Digistore24 (/digistore24 e /digistore24/obrigado).
 * Sem nenhum link de venda fora da Digistore24: nada de /#preco, /comprar ou
 * checkout Cakto/Hotmart/Kiwify — só o checkout Digistore24 e o aviso legal.
 */
import Link from 'next/link'
import { Coffee } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export const DS24_CHECKOUT_URL = 'https://www.checkout-ds24.com/product/768342'

export function Ds24Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/digistore24" aria-label="Click & Gruda — oferta Digistore24">
          <Logo />
        </Link>
        <Link
          href={DS24_CHECKOUT_URL}
          className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 font-extrabold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:brightness-105"
        >
          Garantir acesso — €14,90
        </Link>
      </div>
    </header>
  )
}

export function Ds24Footer() {
  return (
    <footer className="mt-auto bg-zinc-950 py-10 text-zinc-400">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo dark />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium" aria-label="Rodapé">
            <Link href="/digistore24" className="transition-colors hover:text-orange-400">
              Oferta
            </Link>
            <Link href="/digistore24#devolucao" className="transition-colors hover:text-orange-400">
              Devolução em 14 dias
            </Link>
            <Link href="/aviso-legal" className="transition-colors hover:text-orange-400">
              Aviso legal
            </Link>
          </nav>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Click &amp; Gruda · Pagamento seguro via Digistore24
          </p>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-600">
          <Coffee className="h-3 w-3" />
          Plataforma de artes digitais para sublimação de canecas · Acesso vitalício por pagamento único
        </p>
      </div>
    </footer>
  )
}
