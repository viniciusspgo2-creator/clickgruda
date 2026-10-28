import { Download, FileArchive, HardDriveDownload } from 'lucide-react'

/** Faixa informativa: incentiva o backup do acervo no computador do assinante (+ botão de ZIP). */
export function BackupStrip({ onZip, limit }: { onZip: () => void; limit: number }) {
  return (
    <div className="border-b border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 px-4 py-2.5 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm sm:flex">
            <HardDriveDownload className="h-4.5 w-4.5" />
          </span>
          <p className="text-[13px] leading-snug text-zinc-600">
            <span className="font-black text-orange-700">Faça download de todo o catálogo</span> e deixe salvo no seu computador como backup.{' '}
            <span className="inline-flex items-center gap-1 font-bold text-zinc-700">
              <Download className="h-3.5 w-3.5 text-orange-500" />{' '}
              {limit > 0 ? `Você pode baixar até ${limit} artes por dia — o limite renova todo dia à meia-noite.` : 'Você pode baixar quantas artes quiser, sem limite.'}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onZip}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-4 text-xs font-black text-white shadow-md shadow-orange-500/25 transition-transform hover:scale-[1.03] hover:bg-orange-600"
        >
          <FileArchive className="h-4 w-4" /> Baixar em ZIP
        </button>
      </div>
    </div>
  )
}
