'use client'

import { cn } from '@/lib/utils'

type MarqueeProps = {
  items: string[]
  reverse?: boolean
  duration?: number
  className?: string
  itemClassName?: string
  separator?: string
}

/**
 * Seamless infinite marquee. Two identical halves are rendered; animating
 * from -50% to 0 (or 0 to -50%) loops perfectly.
 */
export function Marquee({
  items,
  reverse = false,
  duration = 40,
  className,
  itemClassName,
  separator = '✦',
}: MarqueeProps) {
  const half = (
    <div className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <span key={i} className={cn('flex items-center whitespace-nowrap', itemClassName)}>
          <span>{item}</span>
          <span className="mx-6 opacity-50" aria-hidden>
            {separator}
          </span>
        </span>
      ))}
    </div>
  )

  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className={cn('flex w-max', reverse ? 'animate-marquee-left' : 'animate-marquee-right')}
        style={{ ['--marquee-duration' as string]: `${duration}s` }}
      >
        {half}
        {half}
      </div>
    </div>
  )
}
