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
    <main className="bg-muted/30 flex min-h-screen items-center justify-center p-6">
      <section className="bg-background w-full max-w-md rounded-2xl border p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Decknews
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {children}
        {footer ? (
          <footer className="text-muted-foreground mt-6 text-center text-sm">
            {footer}
          </footer>
        ) : null}
      </section>
    </main>
  )
}
