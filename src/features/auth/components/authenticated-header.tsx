'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { authClient } from '../client'
import type { AuthenticatedUser } from '../services'

type AuthenticatedHeaderProps = {
  user: AuthenticatedUser
}

export function AuthenticatedHeader({ user }: AuthenticatedHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await authClient.logout()
      router.replace('/login')
      router.refresh()
    } catch {
      setLogoutError('Não foi possível sair. Tente novamente.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="border-border/70 bg-background/95 sticky top-0 z-30 w-full border-b backdrop-blur-xs">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-8 lg:px-12">
        <Link
          href="/"
          className="group focus-visible:ring-ring flex items-center gap-2.5 focus-visible:ring-1 focus-visible:outline-none"
          aria-label="Decknews início"
        >
          <span
            aria-hidden="true"
            className="bg-foreground text-background flex size-6 items-center justify-center rounded-xs font-mono text-xs font-bold transition-transform duration-200 group-hover:scale-105"
          >
            D
          </span>
          <span className="text-foreground flex items-baseline gap-2 text-sm font-medium tracking-tight">
            <span>Decknews</span>
            <span
              aria-hidden="true"
              className="text-muted-foreground/60 hidden font-light sm:inline"
            >
              /
            </span>
            <span className="text-muted-foreground hidden font-mono text-xs font-normal sm:inline">
              administração
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground max-w-[14ch] truncate font-mono text-xs sm:max-w-none">
            {user.name}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="border-border/80 bg-background hover:bg-muted/80 hover:border-foreground/40 text-foreground h-8 cursor-pointer gap-1.5 rounded-xs px-3 font-mono text-xs shadow-none transition-colors"
          >
            Sair
          </Button>
        </div>
      </div>
      {logoutError ? (
        <p
          className="text-destructive mx-auto max-w-7xl px-4 pb-2 text-sm sm:px-6 md:px-8 lg:px-12"
          role="alert"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  )
}
