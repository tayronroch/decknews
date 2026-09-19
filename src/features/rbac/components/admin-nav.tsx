import Link from 'next/link'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type AdminNavItem = {
  href: string
  title: string
  description: string
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nenhuma área administrativa disponível para o seu acesso.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="hover:bg-accent/50 h-full transition-colors">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
