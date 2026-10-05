import { Download, HardDriveDownload } from 'lucide-react'

/** Faixa informativa: incentiva o backup do acervo no computador do assinante. */
export function BackupStrip() {
  return (
    <div className="border-b border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-x-3 gap-y-1 text-center sm:justify-start sm:text-left">
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm sm:flex">
          <HardDriveDownload className="h-4.5 w-4.5" />
        </span>
        <p className="text-[13px] leading-snug text-zinc-600">
          <span className="font-black text-orange-700">Faça download de todo o catálogo</span> e deixe salvo no seu computador como backup.{' '}
          <span className="inline-flex items-center gap-1 font-bold text-zinc-700">
            <Download className="h-3.5 w-3.5 text-orange-500" /> Você pode baixar quantas artes quiser, sem limite.
          </span>
        </p>
      </div>
    </div>
  )
}
