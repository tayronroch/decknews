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
    <section className="border-destructive/40 bg-destructive/5 mb-5 rounded-xs border p-6">
      <span className="text-destructive flex items-center gap-2 font-mono text-xs font-medium tracking-wider uppercase">
        {'// Falha'}
        <span
          aria-hidden="true"
          className="bg-destructive size-1.5 rounded-full"
        />
      </span>
      <h2 className="mt-2 text-base font-medium tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1 max-w-prose text-sm">
        {message}
      </p>
      {hint && (
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">{hint}</p>
      )}
      <Button
        className="mt-4 rounded-xs font-mono text-xs"
        variant="outline"
        onClick={onRetry}
      >
        <RefreshCwIcon /> Tentar novamente
      </Button>
    </section>
  )
}
