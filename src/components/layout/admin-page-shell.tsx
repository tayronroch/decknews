import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

type AdminPageShellProps = {
  /** Editorial eyebrow, written in the `// Seção` form used across the site. */
  eyebrow: string
  title: string
  description: string
  /** Primary action for the page, aligned with the title on wider screens. */
  action?: ReactNode
  backHref?: string
  backLabel?: string
  children: ReactNode
}

/**
 * Shared chrome for the administrative pages: one container width, one
 * horizontal rhythm and one header treatment, so every admin screen lines up
 * with the authenticated header above it.
 */
export function AdminPageShell({
  eyebrow,
  title,
  description,
  action,
  backHref,
  backLabel,
  children,
}: AdminPageShellProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 md:px-8 lg:px-12">
      <header className="border-border/70 mb-10 border-b pb-6">
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mb-5 inline-flex items-center gap-1.5 font-mono text-xs transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            <ArrowLeftIcon className="size-3.5" />
            {backLabel}
          </Link>
        ) : null}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-muted-foreground flex items-center gap-2 font-mono text-xs font-medium tracking-wider uppercase">
              {eyebrow}
              <span
                aria-hidden="true"
                className="bg-accent-editorial size-1.5 rounded-full"
              />
            </span>
            <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-prose text-sm sm:text-base">
              {description}
            </p>
          </div>
          {action}
        </div>
      </header>
      {children}
    </main>
  )
}
