import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'editorial-footer border-border/70 w-full border-t px-4 py-10 transition-colors sm:px-6 md:px-8 lg:px-12',
        className
      )}
    >
      <div className="text-muted-foreground mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 font-mono text-xs sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">Decknews</span>
          <span>© 2026</span>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <span className="hidden md:inline">
            engenharia de software & infraestrutura de redes
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/status"
            className="hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <span
              aria-hidden="true"
              className="bg-accent-editorial size-1.5 animate-pulse rounded-full"
            />
            <span>status da aplicação</span>
          </Link>

          <a
            href="#"
            className="hover:text-foreground transition-colors"
            aria-label="Voltar ao topo da página"
          >
            [ ↑ topo ]
          </a>
        </div>
      </div>
    </footer>
  )
}
