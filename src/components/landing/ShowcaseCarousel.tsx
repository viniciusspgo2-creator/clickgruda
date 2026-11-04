'use client'

import Image from 'next/image'

/**
 * ShowcaseCarousel — vitrine do acervo em carrossel infinito deslizando
 * para a ESQUERDA (2 fileiras em velocidades diferentes).
 *
 * Microinterações: pausa no hover (classe .marquee-paused), zoom + glow
 * laranja no card, sweep de brilho, chip de categoria que revela no hover
 * e máscaras de degradê nas laterais para entrada/saída suaves.
 * Loop perfeito: cada item tem margem própria (mr) e a lista é duplicada —
 * o keyframe marquee-left move -50% exato.
 */

type ShowArt = { src: string; alt: string; title: string; cat: string }

const ROW_A: ShowArt[] = [
  { src: '/uploads/showcase/arte-flork-casal-nesmo.webp', alt: 'Arte flork casal escura para caneca de sublimação', title: 'Flork Casal — Nesmo', cat: 'FRASES' },
  { src: '/uploads/showcase/arte-paz-espirito.webp', alt: 'Arte religiosa Paz de Espírito em tons de lilás para caneca', title: 'Paz de Espírito', cat: 'RELIGIÃO' },
  { src: '/uploads/showcase/arte-rita-lee-tributo.webp', alt: 'Arte tributo colorida laranja para caneca de sublimação', title: 'Tributo Rita Lee', cat: 'COMEMORATIVAS' },
  { src: '/uploads/showcase/arte-flork-cafe-coragem.webp', alt: 'Arte flork fêmea de cowgirl para caneca — Deus, café e coragem', title: 'Deus, Café e Coragem', cat: 'FLORK' },
  { src: '/uploads/showcase/arte-calendario-goku-2027.webp', alt: 'Arte calendário 2027 anime laranja para caneca', title: 'Calendário 2027 Goku', cat: 'COMEMORATIVAS' },
  { src: '/uploads/showcase/arte-shopee-promocao.webp', alt: 'Arte divertida de compras online para caneca', title: 'Loja Favorita', cat: 'FRASES' },
  { src: '/uploads/showcase/arte-deus-fiel-flores.webp', alt: 'Arte floral religiosa clara para caneca de sublimação', title: 'Deus é Fiel', cat: 'RELIGIÃO' },
  { src: '/uploads/showcase/arte-flork-matrix.webp', alt: 'Arte flork Matrix verde escura para caneca', title: 'Florki Matrix', cat: 'FLORK' },
  { src: '/uploads/showcase/arte-corinthians-futebol.webp', alt: 'Arte futebol preta e branca para caneca de time', title: 'Aqui é Time!', cat: 'COMEMORATIVAS' },
  { src: '/uploads/showcase/arte-amigas-vencedoras.webp', alt: 'Arte amigas sorrindo rosa para caneca de amizade', title: 'Amigas Pra Sempre', cat: 'FLORK' },
]

const ROW_B: ShowArt[] = [
  { src: '/uploads/showcase/arte-halloween-terror-doce.webp', alt: 'Arte Halloween roxa e laranja para caneca sazonal', title: 'Terror & Doces', cat: 'SAZONAL' },
  { src: '/uploads/showcase/arte-boho-acalme-mente.webp', alt: 'Arte boho terrosa para caneca com frase de calma', title: 'Acalme a Mente', cat: 'FRASES' },
  { src: '/uploads/showcase/arte-goku-trono-paz.webp', alt: 'Arte anime laranja e amarela para caneca de sublimação', title: 'Modo Trono', cat: 'COMEMORATIVAS' },
  { src: '/uploads/showcase/arte-flork-lugar-favorito.webp', alt: 'Arte flork casal romântica branca para caneca', title: 'Lugar Favorito', cat: 'FLORK' },
  { src: '/uploads/showcase/arte-grita-te-achei.webp', alt: 'Arte roxa divertida para caneca de amizade', title: 'Te Achei D+!', cat: 'FLORK' },
  { src: '/uploads/showcase/arte-religiosa-eu-te-amo.webp', alt: 'Arte religiosa infantil creme para caneca cristã', title: 'Eu Te Amo', cat: 'RELIGIÃO' },
  { src: '/uploads/showcase/arte-fluminense-futebol.webp', alt: 'Arte futebol verde e vermelha para caneca de time', title: 'Time de Coração', cat: 'COMEMORATIVAS' },
  { src: '/uploads/showcase/arte-frases-rock-paz.webp', alt: 'Arte rock colorida escura para caneca com frase', title: 'Protejo Minha Paz', cat: 'FRASES' },
  { src: '/uploads/showcase/arte-calendario-senna-2027.webp', alt: 'Arte calendário 2027 amarela e verde para caneca', title: 'Calendário 2027', cat: 'COMEMORATIVAS' },
  { src: '/uploads/showcase/arte-meninas-superpoderosas.webp', alt: 'Arte roxa e rosa de personagens para caneca', title: 'Meninas Poderosas', cat: 'COMEMORATIVAS' },
]

function Card({ art }: { art: ShowArt }) {
  return (
    <div className="group relative mr-4 w-60 shrink-0 sm:mr-5 sm:w-80">
      <div className="relative aspect-[21/9.5] w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg shadow-black/40 transition-all duration-300 group-hover:z-10 group-hover:scale-[1.045] group-hover:border-orange-400/70 group-hover:shadow-2xl group-hover:shadow-orange-500/25 sm:rounded-3xl">
        <Image
          src={art.src}
          alt={art.alt}
          width={960}
          height={434}
          loading="lazy"
          sizes="(max-width: 640px) 240px, 320px"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        {/* sweep de brilho */}
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
          aria-hidden
        />
        {/* legenda que revela no hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-zinc-950/95 via-zinc-950/60 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 text-xs font-black text-white sm:text-sm">{art.title}</span>
            <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              {art.cat}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ arts, duration, offset = false }: { arts: ShowArt[]; duration: number; offset?: boolean }) {
  const doubled = [...arts, ...arts]
  return (
    <div
      className={`flex w-max animate-marquee-left will-change-transform ${offset ? 'pt-4 sm:pt-5' : ''}`}
      style={{ ['--marquee-duration' as string]: `${duration}s` }}
      aria-hidden={offset}
    >
      {doubled.map((art, i) => (
        <Card key={`${art.src}-${i}`} art={art} />
      ))}
    </div>
  )
}

export function ShowcaseCarousel() {
  return (
    <div className="relative mt-10" role="region" aria-label="Carrossel com amostras do acervo de artes">
      {/* máscaras laterais */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-zinc-950 to-transparent sm:w-24" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-zinc-950 to-transparent sm:w-24" aria-hidden />

      {/* hover em qualquer card pausa as duas fileiras (.marquee-paused) */}
      <div className="marquee-paused space-y-1 overflow-hidden py-2 sm:py-3">
        <Row arts={ROW_A} duration={58} />
        <Row arts={ROW_B} duration={76} offset />
      </div>
    </div>
  )
}
