'use client'

import { RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function LoadingError({
  title,
  message,
  hint,
  onRetry,
}: {
  title: string
  message: string
  hint?: string
  onRetry: () => void
}) {
  return (
    <section className="border-destructive/50 mb-5 rounded-xl border p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      {hint && <p className="text-muted-foreground mt-2 text-sm">{hint}</p>}
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        <RefreshCwIcon /> Tentar novamente
      </Button>
    </section>
  )
}
