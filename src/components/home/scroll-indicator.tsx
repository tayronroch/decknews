'use client'

import { ArrowDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface ScrollIndicatorProps {
  className?: string
  targetId?: string
}

export function ScrollIndicator({
  className,
  targetId = 'posts',
}: ScrollIndicatorProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      aria-label="Rolar para os últimos artigos"
      className={cn(
        'scroll-indicator group text-muted-foreground hover:text-foreground flex flex-col items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors focus-visible:outline-none',
        className
      )}
    >
      <span className="opacity-70 transition-opacity group-hover:opacity-100">
        SCROLL
      </span>
      <div className="flex flex-col items-center">
        <span className="bg-border group-hover:bg-accent-editorial h-4 w-px transition-colors" />
        <ArrowDown className="text-muted-foreground group-hover:text-accent-editorial size-3 transform transition-colors duration-300 group-hover:translate-y-0.5" />
      </div>
    </a>
  )
}
