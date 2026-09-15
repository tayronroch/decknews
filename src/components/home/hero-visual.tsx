import Image from 'next/image'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface HeroVisualProps {
  className?: string
}

export function HeroVisual({ className }: HeroVisualProps) {
  return (
    <div
      className={cn(
        'hero-visual flex flex-col items-start justify-self-end sm:items-end',
        className
      )}
    >
      <div className="border-border/80 bg-muted/40 relative overflow-hidden rounded-xs border shadow-xs">
        <div className="relative aspect-[350/430] w-[280px] sm:w-[320px] md:w-[350px]">
          <Image
            src="/images/telecom-tower.jpg"
            alt="Torre de telecomunicações e infraestrutura de rede"
            fill
            sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 350px"
            priority
            className="hero-image object-cover brightness-[0.98] contrast-[1.08] grayscale transition-all duration-700 hover:scale-[1.02]"
          />
        </div>
      </div>

      <div className="hero-caption hero-meta text-muted-foreground mt-3 text-left font-mono text-[11px] leading-relaxed tracking-widest uppercase sm:text-right">
        <p>CONEXÕES</p>
        <p>QUE IMPULSIONAM</p>
        <p>IDEIAS.</p>
        <span className="text-accent-editorial animate-cursor inline-block font-mono">
          _
        </span>
      </div>
    </div>
  )
}
