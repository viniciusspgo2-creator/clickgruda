'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { Ruler, Star, Zap } from 'lucide-react'

/**
 * HeroCollage — colagem de artes reais do acervo no lugar da foto estática.
 *
 * Técnica: cartões sobrepostos (uns cobrindo parte dos outros, com corte
 * proposital nas bordas), profundidade por parallax de mouse (cada camada
 * se move com um fator diferente), flutuação suave e lift no hover.
 * A grade escura do hero "engole" a arte de fundo escura — harmonia por
 * contraste: laranja (marca), rosa, roxo e claro se alternam.
 */

type Art = {
  src: string
  alt: string
  /** posicionamento dentro do palco (classes tailwind) */
  wrap: string
  rotate: number
  /** fator de profundidade do parallax (px de deslocamento máximo) */
  depth: number
  /** duração da flutuação em segundos */
  float: number
  priority?: boolean
}

const ARTS: Art[] = [
  {
    src: '/uploads/hero-arts/arte-flork-casal-nesmo.webp',
    alt: 'Arte flork casal preta e colorida para caneca — acervo Click & Gruda',
    wrap: 'left-[-6%] top-[1%] w-[56%]',
    rotate: -8,
    depth: 14,
    float: 7,
  },
  {
    src: '/uploads/hero-arts/arte-deus-fiel-flores.webp',
    alt: 'Arte floral clara "Deus é fiel" para caneca religiosa',
    wrap: 'left-[50%] top-[-1%] w-[48%]',
    rotate: 7,
    depth: 20,
    float: 8,
  },
  {
    src: '/uploads/hero-arts/arte-rita-lee-tributo.webp',
    alt: 'Arte tributo colorida em tons de laranja para caneca de sublimação',
    wrap: 'left-[17%] top-[24%] w-[66%]',
    rotate: -2,
    depth: 26,
    float: 6,
    priority: true,
  },
  {
    src: '/uploads/hero-arts/arte-calendario-senna-2027.webp',
    alt: 'Arte calendário 2027 esportiva amarela e verde para caneca',
    wrap: 'left-[-4%] top-[50%] w-[54%]',
    rotate: 3.5,
    depth: 10,
    float: 9,
  },
  {
    src: '/uploads/hero-arts/arte-flork-grita-linda.webp',
    alt: 'Arte flork rosa divertida para caneca — lançamentos frequentes',
    wrap: 'left-[48%] top-[56%] w-[56%]',
    rotate: -4,
    depth: 32,
    float: 5.5,
  },
]

function CollageCard({
  art,
  mx,
  my,
  index,
}: {
  art: Art
  mx: MotionValue<number>
  my: MotionValue<number>
  index: number
}) {
  const x = useSpring(useTransform(mx, (v) => v * art.depth), { stiffness: 60, damping: 18 })
  const y = useSpring(useTransform(my, (v) => v * art.depth * 0.55), { stiffness: 60, damping: 18 })

  return (
    <motion.div
      style={{ x, y, zIndex: 10 + index * 8 }}
      className={`absolute ${art.wrap}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 34, rotate: art.rotate + 6, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, rotate: art.rotate, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          scale: 1.06,
          rotate: 0,
          zIndex: 44,
          transition: { type: 'spring', stiffness: 260, damping: 20 },
        }}
        className="group relative"
      >
        <div
          className="animate-float-soft overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_28px_60px_-18px_rgba(0,0,0,0.85)] transition-[box-shadow] duration-300 group-hover:ring-2 group-hover:ring-orange-400/70 group-hover:shadow-[0_34px_70px_-16px_rgba(234,88,12,0.45)]"
          style={{ animationDuration: `${art.float}s`, animationDelay: `${index * 0.6}s` }}
        >
          <Image
            src={art.src}
            alt={art.alt}
            width={1000}
            height={453}
            priority={art.priority}
            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 40vw, 340px"
            className="h-auto w-full object-cover"
          />
          {/* brilho no hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 opacity-0 transition-opacity duration-300 group-hover:via-white/15 group-hover:opacity-100" />
        </div>
      </motion.div>
    </motion.div>
  )
}

export function HeroCollage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 50, damping: 20 })
  const my = useSpring(rawY, { stiffness: 50, damping: 20 })

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  const onMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="relative mx-auto w-full max-w-lg"
    >
      {/* palco da colagem */}
      <div
        ref={stageRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative h-[300px] w-full select-none sm:h-[400px] lg:h-[470px]"
      >
        {ARTS.map((art, i) => (
          <CollageCard key={art.src} art={art} mx={mx} my={my} index={i} />
        ))}

        {/* vinheta para fundir com o fundo escuro do hero */}
        <div
          className="pointer-events-none absolute inset-x-[-8%] bottom-[-6%] h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-[-4%] left-[-8%] w-16 bg-gradient-to-r from-zinc-950/80 to-transparent"
          aria-hidden
        />
      </div>

      {/* badges flutuantes (mantidos da versão anterior) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.45 }}
        className="absolute -left-2 top-8 z-[45] rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 shadow-xl backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Ruler className="h-4 w-4 text-orange-400" /> 21×9,5 cm
        </div>
        <div className="text-[10px] font-medium text-zinc-400">medida exata da caneca</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.45 }}
        className="absolute -right-2 bottom-24 z-[45] rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 shadow-xl backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Zap className="h-4 w-4 text-orange-400" /> Alta resolução
        </div>
        <div className="text-[10px] font-medium text-zinc-400">pronta pra sublimar</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 220, damping: 16 }}
        className="absolute -bottom-4 left-1/2 z-[45] flex -translate-x-1/2 items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-orange-600/40"
      >
        <Star className="h-4 w-4 fill-white" />
        Qualidade de venda
      </motion.div>
    </motion.div>
  )
}
