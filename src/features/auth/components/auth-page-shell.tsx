import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { ThemeToggle } from '@/components/theme'
import { Button } from '@/components/ui/button'

type AuthPageShellProps = {
  children: ReactNode
  description: string
  footer?: ReactNode
  title: string
}

export function AuthPageShell({
  children,
  description,
  footer,
  title,
}: AuthPageShellProps) {
  return (
    <div className="bg-muted/20 relative flex min-h-screen flex-col">
      {/* Barra superior de navegação editorial */}
      <header className="border-border/60 bg-background/80 sticky top-0 z-20 w-full border-b backdrop-blur-xs">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Marca Decknews */}
          <Link
            href="/"
            className="group focus-visible:ring-ring flex items-center gap-2.5 font-sans focus-visible:ring-1 focus-visible:outline-none"
            aria-label="Decknews início"
          >
            <span
              aria-hidden="true"
              className="bg-foreground text-background flex size-6 items-center justify-center rounded-xs font-mono text-xs font-bold transition-transform duration-200 group-hover:scale-105"
            >
              D
            </span>
            <span className="text-foreground flex items-baseline gap-2 text-sm font-medium tracking-tight">
              <span>Decknews</span>
              <span
                aria-hidden="true"
                className="text-muted-foreground/60 hidden font-light sm:inline"
              >
                /
              </span>
              <span className="text-muted-foreground hidden font-mono text-xs font-normal sm:inline">
                notas sobre tecnologia
              </span>
            </span>
          </Link>

          {/* Ferramentas e ação de retorno */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-border/80 bg-background hover:bg-muted/80 hover:border-foreground/40 text-foreground h-8 cursor-pointer gap-1.5 rounded-xs px-3 font-mono text-xs shadow-none transition-colors"
            >
              <Link href="/" className="flex items-center gap-1.5">
                <ArrowLeft className="text-muted-foreground size-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Voltar ao início</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Área central com gradiente e card */}
      <main className="relative flex flex-1 items-center justify-center p-4 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <div className="bg-primary/5 dark:bg-primary/10 h-80 w-80 rounded-full blur-3xl" />
        </div>

        <section className="bg-card text-card-foreground border-border/80 animate-center-scale relative w-full max-w-md rounded-xl border p-6 shadow-lg shadow-black/5 sm:p-8 dark:shadow-black/25">
          <header className="mb-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-mono text-xs font-medium tracking-wider uppercase">
                {'// Autenticação'}
              </span>
              <span
                aria-hidden="true"
                className="bg-accent-editorial size-1.5 rounded-full"
              />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </header>

          {children}

          {footer ? (
            <footer className="text-muted-foreground border-border/40 mt-6 border-t pt-4 text-center text-sm">
              {footer}
            </footer>
          ) : null}
        </section>
      </main>

      {/* Micro rodapé editorial */}
      <footer className="text-muted-foreground/60 relative z-10 py-4 text-center font-mono text-[11px]">
        Decknews · redes, telecom e engenharia de software
      </footer>
    </div>
  )
}
