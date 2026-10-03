/**
 * SiteChrome — header e footer compartilhados das páginas de conteúdo
 * (/blog, /blog/[slug], /sobre). Identidade visual idêntica à landing
 * (branco, laranja, preto, cinza-escuro), navegação real com <a>/<Link>
 * (crawlers seguem os links e a linkagem interna fortalece o cluster).
 */
import Link from 'next/link'
import { ArrowRight, Coffee } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

const NAV = [
  { label: 'Início', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Sobre', href: '/sobre' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Ir para a página inicial da Click & Gruda">
          <Logo dark />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-orange-50 hover:text-orange-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#preco"
          className="hidden h-10 items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 font-extrabold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-orange-500/50 hover:brightness-105 md:inline-flex"
        >
          Assinar R$ 47,90 <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </header>
  )
}

export function MobileNote() {
  return (
    <p className="mx-auto w-full max-w-6xl px-4 pt-3 text-xs font-medium text-zinc-400 sm:px-6 md:hidden">
      Navegue:{' '}
      {NAV.map((n, i) => (
        <span key={n.href}>
          {i > 0 && ' · '}
          <Link href={n.href} className="text-orange-600 underline underline-offset-2">
            {n.label}
          </Link>
        </span>
      ))}
    </p>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-zinc-950 py-10 text-zinc-400">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Logo dark />
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium" aria-label="Rodapé">
            <Link href="/" className="transition-colors hover:text-orange-400">
              Início
            </Link>
            <Link href="/blog" className="transition-colors hover:text-orange-400">
              Blog
            </Link>
            <Link href="/sobre" className="transition-colors hover:text-orange-400">
              Sobre
            </Link>
            <Link href="/#faq" className="transition-colors hover:text-orange-400">
              FAQ
            </Link>
            <Link href="/#preco" className="transition-colors hover:text-orange-400">
              Preço
            </Link>
          </nav>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Click &amp; Gruda · Feito para sublimadores
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
