'use client'

import { ArrowUpRight, Menu } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { SearchDialog } from '@/components/home/search-dialog'
import { GithubIcon, LinkedinIcon } from '@/components/home/social-links'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header
      className={cn(
        'editorial-header border-border/70 bg-background/95 sticky top-0 z-40 w-full border-b backdrop-blur-xs transition-colors',
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Lado Esquerdo: Marca editorial */}
        <Link
          href="/"
          className="group focus-visible:ring-ring flex items-center gap-2.5 font-sans focus-visible:ring-1 focus-visible:outline-none"
        >
          {/* Símbolo [D] */}
          <span
            aria-hidden="true"
            className="bg-foreground text-background flex size-6 items-center justify-center rounded-xs font-mono text-xs font-bold transition-transform duration-200 group-hover:scale-105"
          >
            D
          </span>

          <span className="text-foreground flex items-baseline gap-2 text-sm font-medium tracking-tight sm:text-base">
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

        {/* Centro e Direita no Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {/* Navegação editorial */}
          <nav
            aria-label="Navegação principal"
            className="text-muted-foreground flex items-center gap-5 font-mono text-xs"
          >
            <Link
              href="/"
              className="hover:text-foreground transition-colors focus-visible:outline-none"
            >
              [ home ]
            </Link>
            <Link
              href="/posts"
              className="hover:text-foreground transition-colors focus-visible:outline-none"
            >
              [ posts ]
            </Link>
            <Link
              href="/about"
              className="hover:text-foreground transition-colors focus-visible:outline-none"
            >
              [ sobre ]
            </Link>
          </nav>

          {/* Ferramentas: Social (GitHub, LinkedIn) + Busca + Divisor + Entrar */}
          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/tayronroch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-xs p-1.5 transition-colors focus-visible:ring-1 focus-visible:outline-none"
              aria-label="GitHub de Tayron Rocha"
            >
              <GithubIcon className="size-4" />
            </a>

            <a
              href="https://www.linkedin.com/in/tayronroch/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-xs p-1.5 transition-colors focus-visible:ring-1 focus-visible:outline-none"
              aria-label="LinkedIn de Tayron Rocha"
            >
              <LinkedinIcon className="size-4" />
            </a>

            <SearchDialog />

            <Separator orientation="vertical" className="bg-border mx-1 h-4" />

            <Button
              asChild
              size="sm"
              variant="default"
              className="h-8 gap-1.5 rounded-xs px-3 font-mono text-xs"
            >
              <Link href="/login">
                <span>Entrar</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 sm:gap-2 md:hidden">
          <a
            href="https://github.com/tayronroch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground p-1.5 transition-colors focus-visible:outline-none"
            aria-label="GitHub"
          >
            <GithubIcon className="size-4" />
          </a>

          <a
            href="https://www.linkedin.com/in/tayronroch/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground p-1.5 transition-colors focus-visible:outline-none"
            aria-label="LinkedIn"
          >
            <LinkedinIcon className="size-4" />
          </a>

          <SearchDialog />

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Abrir menu de navegação"
                className="text-muted-foreground hover:text-foreground"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-background border-border flex w-[280px] flex-col justify-between border-l p-6 sm:w-[320px]"
            >
              <div className="flex flex-col gap-8">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-muted-foreground flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
                    <span className="bg-foreground text-background flex size-5 items-center justify-center rounded-xs text-[10px] font-bold">
                      D
                    </span>
                    {'// DECKNEWS NAVEGAÇÃO'}
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-4 font-mono text-sm">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-foreground hover:text-accent-editorial py-1 transition-colors"
                  >
                    [ 01. home ]
                  </Link>
                  <Link
                    href="/posts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground py-1 transition-colors"
                  >
                    [ 02. posts ]
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-muted-foreground hover:text-foreground py-1 transition-colors"
                  >
                    [ 03. sobre ]
                  </Link>
                </nav>
              </div>

              <div className="border-border flex flex-col gap-3 border-t pt-6">
                <Button
                  asChild
                  variant="default"
                  className="w-full justify-center gap-2 rounded-xs font-mono text-xs"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <span>Entrar no sistema</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
                <p className="text-muted-foreground text-center font-mono text-[10px]">
                  Redes, telecom e engenharia de software
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
