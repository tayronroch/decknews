'use client'

import * as React from 'react'

import { HeroVisual } from './hero-visual'
import { ScrollIndicator } from './scroll-indicator'
import { SocialLinks } from './social-links'

export function Hero() {
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById('posts')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section
      aria-label="Capa editorial do Decknews"
      className="hero-section relative flex min-h-[calc(100svh-4.5rem)] w-full flex-col justify-between overflow-hidden px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12"
    >
      {/* Linhas verticais de guia editorial (sutis) */}
      <div
        aria-hidden="true"
        className="bg-border/40 pointer-events-none absolute inset-y-0 left-6 w-px sm:left-12 md:left-20"
      />
      <div
        aria-hidden="true"
        className="bg-border/40 pointer-events-none absolute inset-y-0 right-6 w-px sm:right-12 md:right-20"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center">
        {/* Anotação vertical lateral esquerda (marginalia técnica) */}
        <aside
          aria-label="Anotação editorial lateral"
          className="hero-marginalia border-border/60 hidden flex-col justify-between self-stretch border-r py-4 pr-8 lg:flex"
        >
          <div className="text-muted-foreground rotate-180 font-mono text-[10px] tracking-[0.22em] uppercase opacity-60 select-none [writing-mode:vertical-lr]">
            {'// BUILD LEARN SHARE REPEAT'}
          </div>
          <SocialLinks orientation="vertical" />
        </aside>

        {/* Composição assimétrica do Hero */}
        <div className="flex flex-1 flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:pl-12">
          {/* Coluna de Conteúdo Principal */}
          <div className="flex max-w-2xl flex-col items-start">
            {/* Eyebrow */}
            <p className="hero-eyebrow text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase sm:mb-6">
              TECNOLOGIA / REDES / DESENVOLVIMENTO
            </p>

            {/* Título com cursor piscante */}
            <h1 className="hero-title text-foreground mb-6 text-5xl leading-[0.95] font-medium tracking-tight sm:mb-8 sm:text-6xl md:text-7xl lg:text-8xl">
              Decknews
              <span
                aria-hidden="true"
                className="hero-cursor animate-cursor text-accent-editorial ml-0.5 inline-block font-light select-none"
              >
                |
              </span>
            </h1>

            {/* Descrição em parágrafo enxuto */}
            <p className="hero-description text-muted-foreground mb-8 max-w-xl text-base leading-relaxed font-normal sm:mb-10 sm:text-lg md:text-xl">
              Notas, ideias e experiências sobre tecnologia, redes,
              infraestrutura e desenvolvimento.
            </p>

            {/* CTA interativo em estilo terminal */}
            <a
              href="#posts"
              onClick={handleCtaClick}
              className="hero-cta group hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 font-mono text-sm transition-colors focus-visible:ring-1 focus-visible:outline-none sm:text-base"
            >
              <span className="text-accent-editorial font-semibold transition-transform duration-200 group-hover:translate-x-1">
                &gt;
              </span>
              <span className="decoration-border/80 group-hover:decoration-accent-editorial group-hover:text-foreground underline underline-offset-8 transition-all duration-200">
                explorar();
              </span>
            </a>

            {/* Mobile social links (aparece apenas quando a marginalia estiver oculta) */}
            <div className="border-border/40 mt-8 flex w-full items-center justify-between border-t pt-6 lg:hidden">
              <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
                {'// CONNECT'}
              </span>
              <SocialLinks orientation="horizontal" />
            </div>
          </div>

          {/* Coluna visual editorial (direita) */}
          <HeroVisual className="self-center lg:self-auto" />
        </div>
      </div>

      {/* Scroll indicator no rodapé da primeira dobra */}
      <div className="relative z-10 flex w-full justify-center pt-8 pb-2">
        <ScrollIndicator targetId="posts" />
      </div>
    </section>
  )
}
