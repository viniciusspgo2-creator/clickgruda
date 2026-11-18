'use client'
import { useEffect, useRef, useState } from 'react'
import { Pause, Play, X, Expand } from 'lucide-react'
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


export function ShowcaseCarousel() {
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('TODAS')
  const [selected, setSelected] = useState<ShowArt | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (selected) dialog.current?.showModal()
    else if (dialog.current?.open) dialog.current.close()
  }, [selected])
  const all = [...ROW_A, ...ROW_B]
  const rows = filter === 'TODAS' ? [ROW_A, ROW_B] : [all.filter(a => a.cat === filter)]
  return <div className="cgx-carousel" data-paused={paused || Boolean(selected)} data-filtered={filter !== 'TODAS'} role="region" aria-label="Amostras da biblioteca">
    <div className="cgx-carousel-toolbar cgx-container">
      <div className="cgx-filter-chips" aria-label="Filtrar artes">{['TODAS','FRASES','RELIGIÃO','FLORK','COMEMORATIVAS','SAZONAL'].map(cat => <button key={cat} type="button" aria-pressed={filter === cat} onClick={() => setFilter(cat)}>{({TODAS:'Todas',FRASES:'Frases',RELIGIÃO:'Fé',FLORK:'Flork',COMEMORATIVAS:'Temas',SAZONAL:'Sazonais'} as Record<string,string>)[cat]}</button>)}</div>
      <button type="button" className="cgx-pause" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={14}/> : <Pause size={14}/>} {paused ? 'Reproduzir' : 'Pausar'}</button>
    </div>
    {rows.map((arts, row) => <div className="cgx-marquee-viewport" key={filter + row}><div className={'cgx-marquee-track' + (row ? ' reverse' : '')}>
      {(filter === 'TODAS' ? [false,true] : [false]).map(duplicate => <div className="cgx-marquee-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>{arts.map(art => <button type="button" className="cgx-art-card" key={art.src} tabIndex={duplicate ? -1 : 0} onClick={() => setSelected(art)} aria-label={'Ampliar: ' + art.title}>
        {/* Native images keep duplicate carousel slides cheap and avoid layout shifts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.src} alt={duplicate ? '' : art.alt} width="960" height="434" loading="lazy" decoding="async"/>
        <span><b>{art.title}</b><Expand size={16}/></span>
      </button>)}</div>)}
    </div></div>)}
    <dialog ref={dialog} className="cgx-art-dialog" onClose={() => setSelected(null)} onClick={e => {if(e.target === e.currentTarget) setSelected(null)}} aria-labelledby="cgx-art-title">
      <div className="cgx-dialog-head"><div><small>UMA AMOSTRA DO ACERVO</small><h3 id="cgx-art-title">{selected?.title}</h3></div><button type="button" onClick={() => setSelected(null)} aria-label="Fechar ampliação"><X/></button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {selected && <img src={selected.src} alt={selected.alt} width="960" height="434"/>}
      <p>Explore os temas e encontre sua próxima arte na biblioteca.</p>
    </dialog>
  </div>
}

