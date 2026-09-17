import type { ReactNode } from 'react'

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
    <main className="bg-muted/20 relative flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="bg-primary/5 dark:bg-primary/10 h-80 w-80 rounded-full blur-3xl" />
      </div>

      <section className="bg-card text-card-foreground border-border/80 animate-center-scale relative w-full max-w-md rounded-xl border p-6 shadow-lg shadow-black/5 sm:p-8 dark:shadow-black/25">
        <div className="mb-6 space-y-1.5">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
            Decknews
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {children}
        {footer ? (
          <footer className="text-muted-foreground border-border/40 mt-6 border-t pt-4 text-center text-sm">
            {footer}
          </footer>
        ) : null}
      </section>
    </main>
  )
}
