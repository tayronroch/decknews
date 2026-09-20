import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'

export type AdminNavItem = {
  href: string
  title: string
  description: string
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  if (items.length === 0) {
    return (
      <section className="border-border/70 rounded-xs border border-dashed p-10 text-center">
        <p className="text-muted-foreground text-sm">
          Nenhuma área administrativa disponível para o seu acesso.
        </p>
      </section>
    )
  }

  return (
    <nav className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group border-border/70 hover:border-foreground/30 hover:bg-muted/30 focus-visible:ring-ring bg-card flex h-full flex-col gap-2 rounded-xs border p-6 transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-base font-medium tracking-tight">
              {item.title}
            </span>
            <ArrowUpRightIcon className="text-accent-editorial size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </span>
          <span className="text-muted-foreground text-sm">
            {item.description}
          </span>
        </Link>
      ))}
    </nav>
  )
}
