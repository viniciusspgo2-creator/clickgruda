'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AudioLines, ChevronDown, Pause, Play } from 'lucide-react'
import { track } from '@/lib/analytics'

/**
 * MiniPlayer — player flutuante do áudio de boas-vindas.
 * Nunca toca automaticamente: o usuário clica no botão laranja para expandir
 * e dar play. Barra de progresso clicável (seek), tempo, equalizador
 * animado enquanto toca e botão de minimizar.
 */

const SRC = '/audio/bem-vindo-click-gruda.m4a'

function fmt(s: number) {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export function MiniPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const tracked = useRef(false)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setTime(el.currentTime)
    const onMeta = () => setDur(el.duration)
    const onEnd = () => {
      setPlaying(false)
      setTime(0)
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      void el.play()
      setPlaying(true)
      if (!tracked.current) {
        tracked.current = true
        track('audio_play', { audio: 'bem-vindo' })
      }
    }
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    el.currentTime = (parseFloat(e.target.value) / 100) * el.duration
    setTime(el.currentTime)
  }

  const pct = dur > 0 ? (time / dur) * 100 : 0

  return (
    <div className="fixed bottom-4 left-4 z-40 print:hidden" role="region" aria-label="Player de áudio de boas-vindas">
      <audio ref={audioRef} src={SRC} preload="none" />

      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          /* ---------- Bolha minimizada ---------- */
          <motion.button
            key="bubble"
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 16 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            aria-label="Abrir player de boas-vindas"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-600/40 ring-4 ring-white/10 transition-shadow hover:shadow-2xl hover:shadow-orange-500/50"
          >
            {!playing && (
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-500/30" aria-hidden />
            )}
            {playing ? (
              <AudioLines className="relative h-6 w-6 text-white" />
            ) : (
              <Play className="relative ml-0.5 h-6 w-6 fill-white text-white" />
            )}
          </motion.button>
        ) : (
          /* ---------- Cartão expandido ---------- */
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-[290px] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950/95 text-white shadow-2xl backdrop-blur sm:w-[320px]"
          >
            {/* equalizador no topo */}
            <div className="flex h-1.5 items-end gap-[3px] bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 px-1" aria-hidden>
              {[0.5, 0.9, 0.35, 0.75, 0.55, 1, 0.4, 0.8, 0.6, 0.95, 0.45, 0.7].map((h, i) => (
                <span
                  key={i}
                  className={`w-full origin-bottom rounded-sm bg-white/70 ${playing ? 'animate-pulse' : 'opacity-40'}`}
                  style={{ height: `${h * 100}%`, animationDuration: `${0.5 + (i % 4) * 0.18}s`, animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">Bem-vindo ao Click &amp; Gruda</p>
                  <p className="text-[11px] font-medium text-zinc-400">Mensagem de boas-vindas · {fmt(dur)}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Minimizar player"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.06 }}
                  onClick={toggle}
                  aria-label={playing ? 'Pausar áudio' : 'Tocar áudio'}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-600/40"
                >
                  {playing ? (
                    <Pause className="h-5 w-5 fill-white text-white" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  )}
                </motion.button>

                <div className="min-w-0 flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={0.1}
                    value={pct}
                    onChange={seek}
                    aria-label="Progresso do áudio"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-orange-500 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-md"
                    style={{
                      background: `linear-gradient(to right, #f97316 ${pct}%, #3f3f46 ${pct}%)`,
                    }}
                  />
                  <div className="mt-1 flex justify-between text-[10px] font-bold tabular-nums text-zinc-500">
                    <span>{fmt(time)}</span>
                    <span>{fmt(dur)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
