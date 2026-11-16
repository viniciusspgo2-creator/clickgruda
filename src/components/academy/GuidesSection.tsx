'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'

type Guide = {
  id: string
  eyebrow: string
  title: string
  description: string
  images: { src: string; label: string }[]
}

const GUIDES: Guide[] = [
  {
    id: 'kit',
    eyebrow: 'PARA COMEÇAR',
    title: 'Kit Essencial para Iniciantes',
    description: 'O que você precisa para imprimir suas primeiras artes: da impressão à venda.',
    images: [
      { src: '/guias/kit-capa.webp', label: 'Capa — Kit essencial' },
      { src: '/guias/kit-etapa1.webp', label: 'Etapa 1 — Impressão' },
      { src: '/guias/kit-etapa2.webp', label: 'Etapa 2 — Prensagem' },
      { src: '/guias/kit-etapa3.webp', label: 'Etapa 3 — Acabamento e venda' },
    ],
  },
  {
    id: 'tempo',
    eyebrow: 'REFERÊNCIA RÁPIDA',
    title: 'Guia de Tempo & Temperatura',
    description: 'Parâmetros iniciais para 5 produtos. Sempre confira a ficha do fabricante.',
    images: [
      { src: '/guias/guia-tempo-capa.webp', label: 'Capa — Tempo & temperatura' },
      { src: '/guias/guia-tempo-tabela.webp', label: 'Tabela — 5 produtos' },
    ],
  },
  {
    id: 'ticket',
    eyebrow: 'VENDAS',
    title: 'Aumente seu Ticket Médio',
    description: 'Embalagem bonita valoriza a caneca, melhora a percepção e ajuda a cobrar mais.',
    images: [
      { src: '/guias/ticket-capa.webp', label: 'Capa — Ticket médio' },
      { src: '/guias/ticket-info.webp', label: 'Embalagem em valor' },
    ],
  },
  {
    id: 'gabaritos',
    eyebrow: 'MEDIDAS PRONTAS',
    title: 'Gabaritos para Canecas',
    description: 'Medidas prontas para diagramar suas artes com precisão: tarja branca e tradicional.',
    images: [
      { src: '/guias/gabaritos-capa.webp', label: 'Capa — Gabaritos' },
      { src: '/guias/gabaritos-medidas.webp', label: 'Medidas prontas' },
    ],
  },
]

function GuideCard({ guide }: { guide: Guide }) {
  const [index, setIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const total = guide.images.length
  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)
  const current = guide.images[index]
  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomed])
  return (
    <article className="flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#161920]">
      <div className="relative">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Ampliar ${current.label}`}
          className="block w-full cursor-zoom-in"
        >
          <img
            src={current.src}
            alt={current.label}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover object-top"
          />
        </button>
        <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label={`Ampliar ${current.label}`}
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/55 text-white transition hover:bg-black/75"
        >
          <Maximize2 size={18} />
        </button>
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagem anterior do guia"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white transition hover:bg-black/75"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próxima imagem do guia"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white transition hover:bg-black/75"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">
          {guide.eyebrow}
        </span>
        <h3 className="text-lg font-black leading-tight">{guide.title}</h3>
        <p className="text-[13px] leading-6 text-zinc-400">{guide.description}</p>
        <p className="mt-auto pt-2 text-[11px] font-bold text-zinc-500">{current.label}</p>
        {total > 1 && (
          <div className="flex gap-1.5 pt-1">
            {guide.images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ver imagem ${i + 1} de ${total}`}
                className={`h-1.5 rounded-full transition ${i === index ? 'w-6 bg-orange-500' : 'w-1.5 bg-white/25 hover:bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label={current.label}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Fechar imagem ampliada"
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
          >
            <X size={20} />
          </button>
          <img
            src={current.src}
            alt={current.label}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev() }}
                aria-label="Imagem anterior do guia"
                className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next() }}
                aria-label="Próxima imagem do guia"
                className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white">
            {current.label} • {index + 1}/{total}
          </span>
        </div>
      )}
    </article>
  )
}

export default function GuidesSection() {
  return (
    <section className="space-y-5" aria-label="Guias práticos">
      <header className="space-y-2">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-orange-400">
          <BookOpen size={15} /> Guias práticos
        </span>
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Consulte antes de produzir.
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-zinc-400">
          Kit essencial, tempo e temperatura, embalagem e gabaritos — tudo em imagens
          para deslizar e conferir na hora da produção.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {GUIDES.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>
    </section>
  )
}
