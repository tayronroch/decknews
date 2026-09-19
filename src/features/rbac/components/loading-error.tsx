'use client'

import { RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function LoadingError({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <section className="border-destructive/50 mb-5 rounded-xl border p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        <RefreshCwIcon /> Tentar novamente
      </Button>
    </section>
  )
}
