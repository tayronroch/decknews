import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Separator } from '@/components/ui/separator'

interface Post {
  id: string
  number: string
  title: string
  date: string
  category: string
  slug: string
  readTime: string
}

const FEATURED_POSTS: Post[] = [
  {
    id: 'post-1',
    number: '01',
    title: 'Boas práticas para monitoramento de redes com Zabbix',
    date: '12 SET 2026',
    category: 'REDES',
    slug: 'boas-praticas-monitoramento-redes-zabbix',
    readTime: '6 min',
  },
  {
    id: 'post-2',
    number: '02',
    title: 'Estruturando um projeto Next.js para longo prazo',
    date: '10 SET 2026',
    category: 'DESENVOLVIMENTO',
    slug: 'estruturando-projeto-nextjs-longo-prazo',
    readTime: '8 min',
  },
  {
    id: 'post-3',
    number: '03',
    title: 'BGP e Engenharia de Tráfego: Princípios de Roteamento na Prática',
    date: '28 AGO 2026',
    category: 'INFRAESTRUTURA',
    slug: 'bgp-engenharia-trafego-principios-roteamento',
    readTime: '11 min',
  },
  {
    id: 'post-4',
    number: '04',
    title: 'Observabilidade de Microsserviços com OpenTelemetry e Grafana',
    date: '14 AGO 2026',
    category: 'DEVOPS',
    slug: 'observabilidade-microsservicos-opentelemetry-grafana',
    readTime: '7 min',
  },
]

export function PostsPreview() {
  return (
    <section
      id="posts"
      aria-label="Últimos posts"
      className="posts-section relative mx-auto w-full max-w-5xl scroll-mt-12 px-4 py-24 sm:px-6 sm:py-32 md:px-8"
    >
      {/* Cabeçalho da seção editorial */}
      <div className="border-border/70 mb-12 flex flex-col items-start gap-2 border-b pb-6 sm:mb-16">
        <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
          {'// ÍNDICE EDITORIAL'}
        </span>
        <h2 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
          Últimos posts
        </h2>
      </div>

      {/* Lista editorial de artigos */}
      <div className="flex flex-col">
        {FEATURED_POSTS.map((post, index) => (
          <React.Fragment key={post.id}>
            <article className="post-item group hover:bg-muted/30 relative -mx-4 rounded-xs px-4 py-6 transition-colors sm:py-8">
              <Link
                href={`/posts/${post.slug}`}
                className="flex flex-col justify-between gap-4 sm:flex-row sm:items-baseline sm:gap-8"
              >
                {/* Lado Esquerdo: Número e Título */}
                <div className="flex min-w-0 flex-1 items-baseline gap-4 sm:gap-6">
                  <span
                    aria-hidden="true"
                    className="post-number text-muted-foreground/60 group-hover:text-accent-editorial shrink-0 font-mono text-xs tabular-nums transition-colors select-none sm:text-sm"
                  >
                    {post.number}
                  </span>
                  <h3 className="post-title text-foreground group-hover:text-foreground/90 text-lg leading-snug font-medium tracking-tight transition-colors sm:text-xl">
                    {post.title}
                  </h3>
                </div>

                {/* Lado Direito: Metadados (Data, Categoria e Ícone) */}
                <div className="post-meta text-muted-foreground flex shrink-0 items-center justify-between gap-4 pl-8 font-mono text-xs sm:justify-end sm:pl-0">
                  <div className="flex items-center gap-3">
                    <time dateTime={post.date}>{post.date}</time>
                    <span aria-hidden="true" className="opacity-40">
                      /
                    </span>
                    <span className="text-muted-foreground/90 font-medium tracking-wider uppercase">
                      {post.category}
                    </span>
                  </div>
                  <ArrowUpRight className="text-accent-editorial size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </Link>
            </article>

            {index < FEATURED_POSTS.length - 1 && (
              <Separator className="bg-border/60" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Rodapé da lista com link de arquivo */}
      <div className="border-border/70 text-muted-foreground mt-12 flex items-center justify-between border-t pt-8 font-mono text-xs sm:mt-16">
        <span>[ {FEATURED_POSTS.length} ARTIGOS EM DESTAQUE ]</span>
        <Link
          href="/posts"
          className="group text-foreground hover:text-accent-editorial inline-flex items-center gap-1.5 font-mono transition-colors"
        >
          <span>Arquivo técnico completo</span>
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </section>
  )
}
